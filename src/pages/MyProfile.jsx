import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { Camera, Check, AlertCircle, ChevronDown, User, Sparkles, GripVertical, Trash2, Plus, Save, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import BottomNav from "@/components/BottomNav";

const BAD_WORDS = ["מילהגסה1", "מילהגסה2"];
const LOCATIONS = [
  { value: "tel_aviv", label: "תל אביב 🌊" },
  { value: "south", label: "דרום ☀️" },
  { value: "north", label: "צפון 🌿" },
];

export default function MyProfile() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ first_name: "", age: "", location: "", funny_fact: "", favorite_drink: "" });
  const [photos, setPhotos] = useState([]); // [{url, file?, preview?, isNew?}]
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showLocationSheet, setShowLocationSheet] = useState(false);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [activePhotoSlot, setActivePhotoSlot] = useState(null);
  const [saved, setSaved] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const deviceId = localStorage.getItem("wedding_device_id");
    if (!deviceId) { setLoading(false); return; }
    const profiles = await base44.entities.Profile.filter({ device_id: deviceId });
    if (profiles.length > 0) {
      const p = profiles[0];
      setProfile(p);
      setForm({
        first_name: p.first_name || "",
        age: p.age?.toString() || "",
        location: p.location || "",
        funny_fact: p.funny_fact || "",
        favorite_drink: p.favorite_drink || "",
      });
      const urls = p.photo_urls?.length ? p.photo_urls : (p.photo_url ? [p.photo_url] : []);
      setPhotos(urls.map(url => ({ url, isNew: false })));
    }
    setLoading(false);
  };

  const handlePhotoFile = async (file) => {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, photo: "התמונה גדולה מדי (מקסימום 8MB)" }));
      return;
    }
    setUploadingPhoto(true);
    const preview = URL.createObjectURL(file);
    const result = await base44.integrations.Core.UploadFile({ file });
    const url = result.file_url;
    setPhotos(prev => {
      const updated = [...prev];
      if (activePhotoSlot !== null && activePhotoSlot < updated.length) {
        updated[activePhotoSlot] = { url, preview, isNew: true };
      } else {
        updated.push({ url, preview, isNew: true });
      }
      return updated;
    });
    setErrors(prev => ({ ...prev, photo: null }));
    setShowPhotoOptions(false);
    setActivePhotoSlot(null);
    setUploadingPhoto(false);
  };

  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const openPhotoOptions = (slot = null) => {
    setActivePhotoSlot(slot);
    setShowPhotoOptions(true);
  };

  const movePhoto = (from, direction) => {
    const to = direction === "up" ? from - 1 : from + 1;
    if (to < 0 || to >= photos.length) return;
    setPhotos(prev => {
      const updated = [...prev];
      [updated[from], updated[to]] = [updated[to], updated[from]];
      return updated;
    });
  };

  const validate = () => {
    const newErrors = {};
    if (!form.first_name.trim()) newErrors.first_name = "שם הוא שדה חובה";
    if (form.first_name.includes(" ")) newErrors.first_name = "שם פרטי בלבד, בלי רווחים";
    const age = parseInt(form.age);
    if (!form.age) newErrors.age = "גיל הוא שדה חובה";
    else if (isNaN(age) || age < 18 || age > 60) newErrors.age = "גיל חייב להיות בין 18 ל-60";
    if (!form.location) newErrors.location = "איזור מגורים הוא שדה חובה";
    if (photos.length === 0) newErrors.photo = "חובה לפחות תמונה אחת";
    if (!form.funny_fact.trim()) newErrors.funny_fact = "הפרט המצחיק הוא שדה חובה";
    else if (form.funny_fact.length > 200) newErrors.funny_fact = "מקסימום 200 תווים";
    const hasBadWords = BAD_WORDS.some(w => form.funny_fact.toLowerCase().includes(w));
    if (hasBadWords) newErrors.funny_fact = "בבקשה השתמש בשפה הולמת 😊";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate() || !profile) return;
    setSaving(true);
    const urls = photos.map(p => p.url);
    await base44.entities.Profile.update(profile.id, {
      first_name: form.first_name.trim(),
      age: parseInt(form.age),
      location: form.location,
      favorite_drink: form.favorite_drink.trim() || "",
      photo_url: urls[0],
      photo_urls: urls,
      funny_fact: form.funny_fact.trim(),
    });
    setSaving(false);
    setSaved(true);
    toast({ title: "✦ הפרופיל עודכן בהצלחה! 🎉", duration: 2000 });
    setTimeout(() => setSaved(false), 3000);
  };

  const locationLabel = (val) => LOCATIONS.find(l => l.value === val)?.label || "בחר איזור";

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[#0F0F0F]">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
          <span className="text-4xl">🔥</span>
        </motion.div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[#0F0F0F] flex-col gap-4 px-6">
        <span className="text-5xl">😶</span>
        <p className="text-white/50 text-center">לא נמצא פרופיל.<br />צור פרופיל קודם!</p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#0F0F0F] pb-28 max-w-md mx-auto relative">
      {/* Ambient glows */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-0 w-64 h-64 bg-[#FE3C72]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#0F0F0F]/90 backdrop-blur-xl border-b border-white/5 px-5 pt-4 pb-4">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#B8941F] flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.3)]">
              <User className="w-5 h-5 text-[#0F0F0F]" />
            </div>
            <div>
              <h1 className="text-lg font-black text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                My Profile
              </h1>
              <p className="text-[10px] text-white/30 tracking-widest uppercase">✦ {form.first_name || "..."} ✦</p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.button
              key={saved ? "saved" : "save"}
              onClick={handleSave}
              disabled={saving || uploadingPhoto}
              whileTap={{ scale: 0.92 }}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl font-black text-sm transition-all ${
                saved
                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                  : "bg-gradient-to-r from-[#D4AF37] to-[#B8941F] text-[#0F0F0F] shadow-[0_4px_20px_rgba(212,175,55,0.35)]"
              }`}
            >
              {saving ? (
                <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 0.8, repeat: Infinity }}>
                  ✦ שומר...
                </motion.span>
              ) : saved ? (
                <><Check className="w-4 h-4" /> נשמר!</>
              ) : (
                <><Save className="w-4 h-4" /> שמור</>
              )}
            </motion.button>
          </AnimatePresence>
        </motion.div>
      </div>

      <div className="px-5 pt-6 space-y-8">
        {/* Photos Section */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-[11px] text-white/40 tracking-widest uppercase font-bold">Photos</span>
            <span className="text-[10px] text-white/20 mr-auto">{photos.length}/6</span>
          </div>

          {/* Main photo */}
          {photos.length > 0 && (
            <motion.div className="relative w-full aspect-[4/5] rounded-3xl overflow-hidden mb-3 shadow-[0_8px_40px_rgba(0,0,0,0.6)]">
              <img
                src={photos[0].preview || photos[0].url}
                alt="main"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute top-3 right-3 bg-[#D4AF37] text-[#0F0F0F] text-[9px] font-black px-2.5 py-1 rounded-full tracking-widest uppercase shadow-lg">
                ✦ ראשית
              </div>
              <button
                onClick={() => openPhotoOptions(0)}
                className="absolute bottom-3 right-3 w-10 h-10 bg-black/50 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 hover:bg-black/70 transition-all"
              >
                <Camera className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={() => removePhoto(0)}
                className="absolute bottom-3 left-3 w-10 h-10 bg-[#FE3C72]/80 backdrop-blur-md rounded-2xl flex items-center justify-center hover:bg-[#FE3C72] transition-all"
              >
                <Trash2 className="w-4 h-4 text-white" />
              </button>
            </motion.div>
          )}

          {/* Additional photos grid */}
          <div className="grid grid-cols-3 gap-2">
            {photos.slice(1).map((p, i) => {
              const realIndex = i + 1;
              return (
                <motion.div
                  key={p.url + realIndex}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative aspect-square rounded-2xl overflow-hidden group"
                >
                  <img
                    src={p.preview || p.url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200" />
                  {/* Actions overlay */}
                  <div className="absolute inset-0 flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
                    <button
                      onClick={() => openPhotoOptions(realIndex)}
                      className="w-8 h-8 bg-black/70 backdrop-blur-md rounded-xl flex items-center justify-center"
                    >
                      <Camera className="w-3.5 h-3.5 text-white" />
                    </button>
                    <button
                      onClick={() => removePhoto(realIndex)}
                      className="w-8 h-8 bg-[#FE3C72]/80 rounded-xl flex items-center justify-center"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                  {/* Reorder buttons */}
                  <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    {realIndex > 1 && (
                      <button
                        onClick={() => movePhoto(realIndex, "up")}
                        className="w-6 h-6 bg-black/60 rounded-lg flex items-center justify-center"
                      >
                        <span className="text-white text-xs">←</span>
                      </button>
                    )}
                    {realIndex < photos.length - 1 && (
                      <button
                        onClick={() => movePhoto(realIndex, "down")}
                        className="w-6 h-6 bg-black/60 rounded-lg flex items-center justify-center"
                      >
                        <span className="text-white text-xs">→</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}

            {/* Add photo slot */}
            {photos.length < 6 && (
              <motion.button
                whileTap={{ scale: 0.93 }}
                onClick={() => openPhotoOptions(null)}
                className={`aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all ${
                  errors.photo ? "border-red-500 bg-red-500/5" : "border-[#D4AF37]/30 bg-[#1A1A1A] hover:border-[#D4AF37]/60 hover:bg-[#D4AF37]/5"
                }`}
              >
                {uploadingPhoto ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                    <Plus className="w-5 h-5 text-[#D4AF37]" />
                  </motion.div>
                ) : (
                  <>
                    <Plus className="w-5 h-5 text-[#D4AF37]/60 mb-1" />
                    <span className="text-[9px] text-white/30 tracking-widest uppercase">Add</span>
                  </>
                )}
              </motion.button>
            )}
          </div>

          {errors.photo && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs mt-2 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {errors.photo}
            </motion.p>
          )}
          <p className="text-[10px] text-white/20 mt-2 text-center">✦ לחץ על תמונה לשינוי · גרור לסידור מחדש</p>
        </motion.div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* Form Fields */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-5"
        >
          <div className="flex items-center gap-2 mb-1">
            <User className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-[11px] text-white/40 tracking-widest uppercase font-bold">פרטים אישיים</span>
          </div>

          {/* First name */}
          <div>
            <Label className="text-white/40 text-[10px] mb-2 block tracking-widest uppercase">✦ שם פרטי</Label>
            <Input
              value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              placeholder="איך קוראים לך?"
              className="bg-[#1A1A1A] border-[#2A2A2A] focus:border-[#D4AF37]/50 text-white placeholder:text-white/20 h-13 rounded-2xl text-right text-base transition-all"
              style={{ height: "52px" }}
            />
            {errors.first_name && (
              <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.first_name}
              </p>
            )}
          </div>

          {/* Age */}
          <div>
            <Label className="text-white/40 text-[10px] mb-2 block tracking-widest uppercase">✦ גיל</Label>
            <Input
              type="number"
              min={18}
              max={60}
              value={form.age}
              onChange={(e) => setForm({ ...form, age: e.target.value })}
              placeholder="מה הגיל שלך?"
              className="bg-[#1A1A1A] border-[#2A2A2A] focus:border-[#D4AF37]/50 text-white placeholder:text-white/20 h-13 rounded-2xl text-right text-base transition-all"
              style={{ height: "52px" }}
              inputMode="numeric"
            />
            {errors.age && (
              <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.age}
              </p>
            )}
          </div>

          {/* Location */}
          <div>
            <Label className="text-white/40 text-[10px] mb-2 block tracking-widest uppercase">✦ איזור</Label>
            <button
              type="button"
              onClick={() => setShowLocationSheet(true)}
              className={`w-full px-4 rounded-2xl bg-[#1A1A1A] border ${
                errors.location ? "border-red-500" : "border-[#2A2A2A]"
              } text-right flex items-center justify-between transition-all hover:border-[#D4AF37]/40`}
              style={{ height: "52px" }}
            >
              <ChevronDown className="w-4 h-4 text-white/30" />
              <span className={form.location ? "text-white font-semibold" : "text-white/30"}>
                {locationLabel(form.location)}
              </span>
            </button>
            {errors.location && (
              <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.location}
              </p>
            )}
          </div>

          {/* Favorite drink */}
          <div>
            <Label className="text-white/40 text-[10px] mb-2 block tracking-widest uppercase">✦ משקה אהוב 🍸 (אופציונלי)</Label>
            <Input
              value={form.favorite_drink}
              onChange={(e) => setForm({ ...form, favorite_drink: e.target.value })}
              placeholder="מה אתה שותה הלילה?"
              className="bg-[#1A1A1A] border-[#2A2A2A] focus:border-[#D4AF37]/50 text-white placeholder:text-white/20 h-13 rounded-2xl text-right text-base transition-all"
              style={{ height: "52px" }}
            />
          </div>

          {/* Funny fact */}
          <div>
            <Label className="text-white/40 text-[10px] mb-2 block tracking-widest uppercase">✦ משהו מצחיק עליך 😂</Label>
            <Textarea
              value={form.funny_fact}
              onChange={(e) => setForm({ ...form, funny_fact: e.target.value })}
              placeholder="משהו מצחיק, מפתיע, שמייחד אותך..."
              maxLength={200}
              className="bg-[#1A1A1A] border-[#2A2A2A] focus:border-[#D4AF37]/50 text-white placeholder:text-white/20 rounded-2xl resize-none h-28 text-right text-base transition-all"
            />
            <div className="flex justify-between items-center mt-1.5">
              {errors.funny_fact ? (
                <p className="text-red-400 text-xs flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.funny_fact}
                </p>
              ) : <div />}
              <span className={`text-xs ${form.funny_fact.length > 180 ? "text-[#D4AF37]" : "text-white/25"}`}>
                {form.funny_fact.length}/200
              </span>
            </div>
          </div>
        </motion.div>

        {/* Save Button (bottom) */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Button
            onClick={handleSave}
            disabled={saving || uploadingPhoto}
            className="w-full font-black text-base rounded-3xl bg-gradient-to-r from-[#D4AF37] via-[#F5E6A3] to-[#D4AF37] text-[#0F0F0F] shadow-[0_8px_40px_rgba(212,175,55,0.35)] hover:opacity-90 active:scale-[0.97] transition-all border-0"
            style={{ height: "56px" }}
          >
            {saving ? (
              <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 0.8, repeat: Infinity }}>
                ✦ שומר שינויים...
              </motion.span>
            ) : saved ? (
              <span className="flex items-center gap-2"><Check className="w-5 h-5" /> נשמר בהצלחה! 🎉</span>
            ) : (
              <span className="tracking-widest uppercase">✦ Save Changes</span>
            )}
          </Button>
        </motion.div>
      </div>

      {/* Location Sheet */}
      <AnimatePresence>
        {showLocationSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
              onClick={() => setShowLocationSheet(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 bg-[#161616] border-t border-white/10 rounded-t-[2rem] p-6 z-50"
              style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
            >
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />
              <h3 className="text-white text-center font-black mb-5 tracking-widest uppercase text-sm">✦ בחר איזור</h3>
              <div className="space-y-2">
                {LOCATIONS.map(opt => (
                  <motion.button
                    key={opt.value}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { setForm({ ...form, location: opt.value }); setShowLocationSheet(false); }}
                    className={`w-full py-4 px-5 rounded-2xl text-right font-semibold text-base transition-all ${
                      form.location === opt.value
                        ? "bg-gradient-to-r from-[#D4AF37] to-[#B8941F] text-[#0F0F0F] shadow-[0_4px_20px_rgba(212,175,55,0.3)]"
                        : "bg-[#1E1E1E] text-white/80 hover:bg-[#252525] border border-white/5"
                    }`}
                  >
                    {opt.label}
                  </motion.button>
                ))}
              </div>
              <button
                onClick={() => setShowLocationSheet(false)}
                className="w-full mt-3 py-3 text-white/40 text-sm hover:text-white/60 transition-colors"
              >
                ביטול
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Photo Options Sheet */}
      <AnimatePresence>
        {showPhotoOptions && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
              onClick={() => setShowPhotoOptions(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 bg-[#161616] border-t border-white/10 rounded-t-[2rem] p-6 z-50"
              style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
            >
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />
              <h3 className="text-white text-center font-black mb-5 tracking-widest uppercase text-sm">✦ הוסף תמונה</h3>
              <div className="space-y-3">
                <label className="block">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => handlePhotoFile(e.target.files[0])}
                  />
                  <motion.div
                    whileTap={{ scale: 0.97 }}
                    className="w-full py-5 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#B8941F] text-[#0F0F0F] font-black text-base flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_20px_rgba(212,175,55,0.3)]"
                    onClick={(e) => e.currentTarget.previousElementSibling.click()}
                  >
                    <Camera className="w-5 h-5" />
                    צלם תמונה
                  </motion.div>
                </label>
                <label className="block">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handlePhotoFile(e.target.files[0])}
                  />
                  <motion.div
                    whileTap={{ scale: 0.97 }}
                    className="w-full py-5 rounded-2xl bg-[#1E1E1E] text-white font-bold text-base flex items-center justify-center gap-2 cursor-pointer border border-white/10 hover:bg-[#252525] transition-all"
                    onClick={(e) => e.currentTarget.previousElementSibling.click()}
                  >
                    📁 בחר מהגלריה
                  </motion.div>
                </label>
                <button
                  onClick={() => setShowPhotoOptions(false)}
                  className="w-full py-3 text-white/40 text-sm hover:text-white/60 transition-colors"
                >
                  ביטול
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}