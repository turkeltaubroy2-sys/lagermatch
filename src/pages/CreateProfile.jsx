import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, ArrowLeft, AlertCircle, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

const BAD_WORDS = ["מילהגסה1", "מילהגסה2"]; // Basic filter
const LOCATIONS = [
  { value: "tel_aviv", label: "תל אביב", flag: "🌊" },
  { value: "south", label: "דרום", flag: "☀️" },
  { value: "north", label: "צפון", flag: "🌿" },
];

export default function CreateProfile() {
  const [form, setForm] = useState({ first_name: "", age: "", location: "", funny_fact: "", favorite_drink: "", gender: "", interested_in: "" });
  const [photos, setPhotos] = useState([]); // [{file, preview}]
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [activePhotoSlot, setActivePhotoSlot] = useState(null);
  const [showLocationSheet, setShowLocationSheet] = useState(false);
  const [redirectChecked, setRedirectChecked] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const check = async () => {
      try {
        const id = getDeviceId();
        const profiles = await base44.entities.Profile.filter({ device_id: id });
        if (profiles.length > 0) {
          navigate(createPageUrl("Swipe"));
        } else {
          setRedirectChecked(true);
        }
      } catch (err) {
        console.error('Redirect check error:', err);
        setRedirectChecked(true);
      }
    };
    check();
  }, [navigate]);

  const getDeviceId = () => {
    let id = sessionStorage.getItem("wedding_device_id");
    if (!id) {
      id = localStorage.getItem("wedding_device_id");
      if (id) sessionStorage.setItem("wedding_device_id", id);
    }
    if (!id) {
      const match = document.cookie.match(/wedding_device_id=([^;]+)/);
      if (match) {
        id = match[1];
        localStorage.setItem("wedding_device_id", id);
        sessionStorage.setItem("wedding_device_id", id);
      }
    }
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("wedding_device_id", id);
      sessionStorage.setItem("wedding_device_id", id);
    }
    const isSecure = window.location.protocol === 'https:';
    const secureFlag = isSecure ? '; Secure' : '';
    document.cookie = `wedding_device_id=${id}; max-age=94608000; path=/; SameSite=Lax${secureFlag}`;
    return id;
  };

  const handlePhotoFile = (file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "התמונה גדולה מדי (מקסימום 10MB)", duration: 2500 });
      return;
    }
    const preview = URL.createObjectURL(file);
    setPhotos(prev => {
      const updated = [...prev];
      if (activePhotoSlot !== null && activePhotoSlot < updated.length) {
        updated[activePhotoSlot] = { file, preview };
      } else {
        updated.push({ file, preview });
      }
      return updated;
    });
    setErrors(prev => ({ ...prev, photo: null }));
    setShowPhotoOptions(false);
    setActivePhotoSlot(null);
  };

  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const openPhotoOptions = (slot = null) => {
    setActivePhotoSlot(slot);
    document.getElementById("camera-input").click();
  };

  const validate = () => {
    const newErrors = {};
    if (!form.first_name.trim()) newErrors.first_name = "שם הוא שדה חובה";
    else if (form.first_name.trim().includes(" ")) newErrors.first_name = "שם פרטי בלבד, בלי רווחים";
    const age = parseInt(form.age);
    if (!form.age) newErrors.age = "גיל הוא שדה חובה";
    else if (isNaN(age) || age < 18 || age > 60) newErrors.age = "גיל חייב להיות בין 18 ל-60";
    if (!form.location) newErrors.location = "איזור מגורים הוא שדה חובה";
    if (photos.length === 0) newErrors.photo = "חובה להוסיף לפחות תמונה אחת";
    if (!form.gender) newErrors.gender = "מגדר הוא שדה חובה";
    if (!form.interested_in) newErrors.interested_in = "העדפה היא שדה חובה";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const deviceId = getDeviceId();
      const uploadedUrls = [];
      for (const p of photos) {
        const res = await base44.integrations.Core.UploadFile({ file: p.file });
        uploadedUrls.push(res.file_url);
      }
      await base44.entities.Profile.create({
        first_name: form.first_name.trim(),
        age: parseInt(form.age),
        location: form.location,
        favorite_drink: form.favorite_drink.trim() || null,
        gender: form.gender,
        interested_in: form.interested_in,
        photo_url: uploadedUrls[0] || null,
        photo_urls: uploadedUrls,
        funny_fact: form.funny_fact.trim(),
        device_id: deviceId,
        is_blocked: false,
      });
      navigate(createPageUrl("Swipe"));
    } catch (err) {
      console.error('Profile creation error:', err);
      toast({ title: "שגיאה ביצירת הפרופיל", description: err?.message || "נסה שוב", variant: "destructive" });
      setSaving(false);
    }
  };

  if (!redirectChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
          <span className="text-4xl">🔥</span>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#050505] px-5 py-8 max-w-md mx-auto pb-16"
      style={{ paddingTop: "max(2rem, env(safe-area-inset-top))", paddingBottom: "max(4rem, env(safe-area-inset-bottom))" }}
    >
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => window.history.back()} className="text-white/50 hover:text-white">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-[1.7rem] font-display shimmer-gold tracking-widest uppercase">Roy & Yael ✦</h1>
          <div className="w-6" />
        </div>

        <p className="text-center text-white/30 text-[10px] mb-8 tracking-[0.3em] uppercase shimmer-gold">✦ גלו חיבורים חדשים · חגגו יחד · צרו זיכרונות ✦</p>

        {/* Photo upload */}
        <div className="mb-10">
          <p className="text-white/40 text-[10px] text-center mb-4 tracking-[0.2em] uppercase">✦ תמונות — חובה לפחות אחת ✦</p>
          <div className="grid grid-cols-3 gap-3">
            {photos.map((p, i) => (
              <div key={i} className="relative aspect-square">
                <img src={p.preview} alt="" className="w-full h-full object-cover rounded-[1.5rem]" />
                {i === 0 && <div className="absolute top-1.5 right-1.5 bg-[#D4AF37] text-black text-[8px] font-black px-2 py-0.5 rounded-full uppercase">ראשית</div>}
                <button onClick={() => removePhoto(i)} className="absolute top-1.5 left-1.5 w-6 h-6 glass-dark rounded-full flex items-center justify-center text-white/80 text-lg">×</button>
              </div>
            ))}
            {photos.length < 6 && (
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => openPhotoOptions(null)}
                className={`aspect-square rounded-[1.5rem] border-2 border-dashed ${errors.photo ? "border-red-500/50" : "border-[#D4AF37]/20"} glass flex flex-col items-center justify-center hover:border-[#D4AF37]/50 transition-all`}>
                <Camera className="w-6 h-6 text-[#D4AF37]/60 mb-1" />
                <span className="text-[9px] text-[#D4AF37]/40 uppercase tracking-widest font-bold">צלם</span>
              </motion.button>
            )}
          </div>
          <input id="camera-input" type="file" accept="image/*" capture="user" className="hidden" onChange={(e) => handlePhotoFile(e.target.files[0])} />
          {errors.photo && <p className="text-red-400 text-[10px] text-center mt-3">{errors.photo}</p>}
        </div>

        {/* Form groups with glass effect */}
        <div className="space-y-6">
          <div className="glass rounded-[2rem] p-6 space-y-6">
            <p className="text-[10px] font-black text-[#D4AF37] tracking-[0.4em] uppercase text-center">✦ פרטים אישיים ✦</p>
            <div className="space-y-4">
              <Input
                placeholder="שם פרטי"
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                className={`h-14 glass border-transparent focus:border-[#D4AF37]/40 rounded-[1.2rem] text-center placeholder:text-white/10 transition-all ${errors.first_name ? "border-red-500/30" : ""}`}
              />
              <Input
                type="number"
                placeholder="גיל"
                value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })}
                className={`h-14 glass border-transparent focus:border-[#D4AF37]/40 rounded-[1.2rem] text-center placeholder:text-white/10 transition-all ${errors.age ? "border-red-500/30" : ""}`}
                inputMode="numeric"
              />
              <button
                type="button"
                onClick={() => setShowLocationSheet(true)}
                className={`w-full h-14 glass border-transparent rounded-[1.2rem] text-center transition-all ${errors.location ? "border-red-500/30" : ""}`}
              >
                <span className={`text-sm ${form.location ? "text-white" : "text-white/10"}`}>
                  {form.location ? LOCATIONS.find(l => l.value === form.location)?.label : "בחר איזור מגורים"}
                </span>
                <ChevronDown className="inline-block w-3 h-3 opacity-30 ml-2" />
              </button>
            </div>
          </div>

          <div className="glass rounded-[2rem] p-6 space-y-5">
            <p className="text-[10px] font-black text-[#D4AF37] tracking-[0.4em] uppercase text-center">✦ העדפות ✦</p>
            <div className="grid grid-cols-2 gap-3">
              {[{ v: 'male', l: 'גבר' }, { v: 'female', l: 'אישה' }].map(opt => (
                <button
                  key={opt.v}
                  type="button"
                  onClick={() => setForm({ ...form, gender: opt.v })}
                  className={`h-12 rounded-xl text-xs font-bold transition-all ${form.gender === opt.v ? "bg-gradient-to-r from-[#FE3C72] to-[#D4AF37] text-white" : "glass border-transparent text-white/20"}`}
                >
                  {opt.l}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[{ v: 'women', l: 'נשים' }, { v: 'men', l: 'גברים' }, { v: 'all', l: 'כולם' }].map(opt => (
                <button
                  key={opt.v}
                  type="button"
                  onClick={() => setForm({ ...form, interested_in: opt.v })}
                  className={`h-10 rounded-xl text-[10px] font-bold transition-all ${form.interested_in === opt.v ? "bg-white/10 text-white" : "glass border-transparent text-white/10"}`}
                >
                  {opt.l}
                </button>
              ))}
            </div>
          </div>

          <div className="glass rounded-[2rem] p-6 space-y-4">
            <Input
              placeholder="משקה אהוב (אופציונלי)"
              value={form.favorite_drink}
              onChange={(e) => setForm({ ...form, favorite_drink: e.target.value })}
              className="h-14 glass border-transparent focus:border-[#D4AF37]/40 rounded-[1.2rem] text-center placeholder:text-white/10 transition-all"
            />
            <Textarea
              placeholder="משהו מצחיק עליך..."
              value={form.funny_fact}
              onChange={(e) => setForm({ ...form, funny_fact: e.target.value })}
              className="glass border-transparent focus:border-[#D4AF37]/40 rounded-[1.2rem] text-right p-4 text-sm min-h-[100px] placeholder:text-white/10 resize-none"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full py-7 text-sm font-black rounded-[1.5rem] bg-gradient-to-r from-[#FE3C72] via-[#FF6B9D] to-[#FF8A5B] text-white tracking-[0.2em] shadow-2xl shadow-[#FE3C72]/20 uppercase"
          >
            {saving ? "✦ Creating Profile..." : "✦ Enter the Wedding ✦"}
          </Button>
        </div>
      </motion.div>

      {/* Location sheet */}
      <AnimatePresence>
        {showLocationSheet && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowLocationSheet(false)} className="fixed inset-0 bg-black/80 backdrop-blur-md z-40" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="fixed bottom-0 inset-x-0 glass border-t border-white/5 rounded-t-[2.5rem] p-8 z-50 max-w-md mx-auto">
              <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-6" />
              <h3 className="text-white text-center font-bold tracking-[0.3em] uppercase text-xs mb-6">✦ בחר איזור ✦</h3>
              <div className="space-y-2">
                {LOCATIONS.map(opt => (
                  <button key={opt.value} onClick={() => { setForm({ ...form, location: opt.value }); setShowLocationSheet(false); }}
                    className={`w-full py-4 rounded-2xl text-right px-6 transition-all ${form.location === opt.value ? "bg-[#D4AF37] text-black font-bold" : "glass border-transparent text-white/60"}`}>
                    {opt.flag} {opt.label}
                  </button>
                ))}
              </div>
              <button onClick={() => setShowLocationSheet(false)} className="w-full mt-4 py-2 text-white/20 text-xs uppercase tracking-widest">ביטול</button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}