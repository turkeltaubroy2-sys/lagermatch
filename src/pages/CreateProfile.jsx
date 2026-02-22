import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, ArrowLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

const BAD_WORDS = ["מילהגסה1", "מילהגסה2"]; // Basic filter

export default function CreateProfile() {
  const [form, setForm] = useState({ first_name: "", age: "", location: "", funny_fact: "", favorite_drink: "" });
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
    const deviceId = getDeviceId();
    base44.entities.Profile.filter({ device_id: deviceId }).then(profiles => {
      if (profiles.length > 0) {
        navigate(createPageUrl("Swipe"));
      } else {
        setRedirectChecked(true);
      }
    });
  }, [navigate]);

  const getDeviceId = () => {
    let id = localStorage.getItem("wedding_device_id");

    if (!id) {
      const match = document.cookie.match(/wedding_device_id=([^;]+)/);
      if (match) {
        id = match[1];
        localStorage.setItem("wedding_device_id", id);
      }
    }

    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("wedding_device_id", id);
    }

    document.cookie = `wedding_device_id=${id}; max-age=31536000; path=/; SameSite=Lax`;
    return id;
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, photo: "התמונה גדולה מדי (מקסימום 5MB)" }));
        return;
      }
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
      setErrors(prev => ({ ...prev, photo: null }));
      setShowPhotoOptions(false);
    }
  };

  const handleCameraCapture = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, photo: "התמונה גדולה מדי (מקסימום 5MB)" }));
        return;
      }
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
      setErrors(prev => ({ ...prev, photo: null }));
      setShowPhotoOptions(false);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.first_name.trim()) newErrors.first_name = "שם הוא שדה חובה";
    if (form.first_name.includes(" ")) newErrors.first_name = "שם פרטי בלבד, בלי רווחים";

    const age = parseInt(form.age);
    if (!form.age) newErrors.age = "גיל הוא שדה חובה";
    else if (isNaN(age) || age < 18 || age > 60) newErrors.age = "גיל חייב להיות בין 18 ל-60";

    if (!form.location) newErrors.location = "איזור מגורים הוא שדה חובה";

    if (!photo) newErrors.photo = "תמונה היא שדה חובה";

    if (!form.funny_fact.trim()) newErrors.funny_fact = "הפרט המצחיק הוא שדה חובה";
    else if (form.funny_fact.length > 200) newErrors.funny_fact = "מקסימום 200 תווים";

    const hasBadWords = BAD_WORDS.some(w => form.funny_fact.toLowerCase().includes(w));
    if (hasBadWords) newErrors.funny_fact = "בבקשה השתמש בשפה הולמת 😊";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);

    const deviceId = getDeviceId();
    const { file_url } = await base44.integrations.Core.UploadFile({ file: photo });

    await base44.entities.Profile.create({
      first_name: form.first_name.trim(),
      age: parseInt(form.age),
      location: form.location,
      favorite_drink: form.favorite_drink.trim() || undefined,
      photo_url: file_url,
      funny_fact: form.funny_fact.trim(),
      device_id: deviceId,
      is_blocked: false,
    });

    navigate(createPageUrl("Swipe"));
  };

  if (!redirectChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F0F0F]">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
          <span className="text-4xl">🔥</span>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#0F0F0F] px-5 py-8 max-w-md mx-auto pb-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => window.history.back()} className="text-white/50 hover:text-white">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-black bg-gradient-to-r from-[#FE3C72] to-[#D4AF37] bg-clip-text text-transparent">יצירת פרופיל 🔥</h1>
          <div className="w-6" />
        </div>

        <p className="text-center text-white/30 text-xs mb-6">🍸 הצג את עצמך ותמצא/י את מי שתמצא/י הלילה</p>

        {/* Photo upload */}
        <div className="flex justify-center mb-8">
          <div className="cursor-pointer relative group">
            <motion.div
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowPhotoOptions(true)}
              className={`w-36 h-36 rounded-full border-2 border-dashed ${
                errors.photo ? "border-red-500" : "border-[#D4AF37]/50"
              } flex items-center justify-center overflow-hidden bg-[#1A1A1A] transition-all group-hover:border-[#D4AF37]`}
            >
              {photoPreview ? (
                <img src={photoPreview} alt="profile" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center">
                  <Camera className="w-8 h-8 text-[#D4AF37]/60 mx-auto mb-2" />
                  <span className="text-xs text-white/40">העלה תמונה</span>
                </div>
              )}
            </motion.div>
            {photoPreview && (
              <div 
                onClick={() => setShowPhotoOptions(true)}
                className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#D4AF37] rounded-full flex items-center justify-center"
              >
                <Camera className="w-4 h-4 text-[#0F0F0F]" />
              </div>
            )}
          </div>
        </div>

        {/* Location sheet */}
        <AnimatePresence>
          {showLocationSheet && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                onClick={() => setShowLocationSheet(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="fixed bottom-0 left-0 right-0 bg-[#1A1A1A] border-t border-[#333] rounded-t-3xl p-6 z-50"
                dir="rtl"
              >
                <h3 className="text-white text-lg font-bold mb-4 text-center">בחר איזור מגורים</h3>
                <div className="space-y-2">
                  {[
                    { value: "tel_aviv", label: "תל אביב" },
                    { value: "south", label: "דרום" },
                    { value: "north", label: "צפון" },
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setForm({ ...form, location: option.value });
                        setShowLocationSheet(false);
                      }}
                      className={`w-full py-4 px-6 rounded-xl text-right transition-all ${
                        form.location === option.value
                          ? "bg-[#D4AF37] text-[#0F0F0F] font-bold"
                          : "bg-[#252525] text-white hover:bg-[#333]"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full py-6 text-lg font-semibold rounded-2xl text-white/50 hover:text-white hover:bg-white/5 mt-3"
                  onClick={() => setShowLocationSheet(false)}
                >
                  ביטול
                </Button>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Photo options modal */}
        <AnimatePresence>
          {showPhotoOptions && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                onClick={() => setShowPhotoOptions(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="fixed bottom-0 left-0 right-0 bg-[#1A1A1A] border-t border-[#333] rounded-t-3xl p-6 z-50"
                dir="rtl"
              >
                <h3 className="text-white text-lg font-bold mb-4 text-center">בחר אופציה</h3>
                <div className="space-y-3">
                  <label className="block">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handleCameraCapture}
                    />
                    <Button
                      type="button"
                      className="w-full py-6 text-lg font-semibold rounded-2xl bg-gradient-to-r from-[#B8941F] via-[#D4AF37] to-[#F5E6A3] text-[#0F0F0F] hover:opacity-90"
                      onClick={(e) => e.currentTarget.previousElementSibling.click()}
                    >
                      <Camera className="w-5 h-5 ml-2" />
                      צלם תמונה
                    </Button>
                  </label>
                  
                  <label className="block">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoChange}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full py-6 text-lg font-semibold rounded-2xl border-[#333] text-white bg-[#252525] hover:bg-[#333]"
                      onClick={(e) => e.currentTarget.previousElementSibling.click()}
                    >
                      📁 בחר מהגלריה
                    </Button>
                  </label>

                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full py-6 text-lg font-semibold rounded-2xl text-white/50 hover:text-white hover:bg-white/5"
                    onClick={() => setShowPhotoOptions(false)}
                  >
                    ביטול
                  </Button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
        {errors.photo && (
          <p className="text-red-400 text-sm text-center mb-4 flex items-center justify-center gap-1">
            <AlertCircle className="w-3 h-3" /> {errors.photo}
          </p>
        )}

        {/* Form */}
        <div className="space-y-5">
          <div>
            <Label className="text-white/70 text-sm mb-2 block">שם פרטי</Label>
            <Input
              value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              placeholder="איך קוראים לך?"
              className="bg-[#1A1A1A] border-[#333] text-white placeholder:text-white/30 h-12 rounded-xl text-right text-base"
              inputMode="text"
              autoCapitalize="words"
            />
            {errors.first_name && (
              <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.first_name}
              </p>
            )}
          </div>

          <div>
            <Label className="text-white/70 text-sm mb-2 block">גיל</Label>
            <Input
              type="number"
              min={18}
              max={60}
              value={form.age}
              onChange={(e) => setForm({ ...form, age: e.target.value })}
              placeholder="מה הגיל שלך?"
              className="bg-[#1A1A1A] border-[#333] text-white placeholder:text-white/30 h-12 rounded-xl text-right text-base"
              inputMode="numeric"
            />
            {errors.age && (
              <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.age}
              </p>
            )}
          </div>

          <div>
            <Label className="text-white/70 text-sm mb-2 block">איזור מגורים</Label>
            <button
              type="button"
              onClick={() => setShowLocationSheet(true)}
              className={`w-full h-12 px-4 rounded-xl bg-[#1A1A1A] border ${
                errors.location ? "border-red-500" : "border-[#333]"
              } text-right flex items-center justify-between ${
                form.location ? "text-white" : "text-white/30"
              }`}
            >
              <span>
                {form.location === "tel_aviv" ? "תל אביב" : 
                 form.location === "south" ? "דרום" : 
                 form.location === "north" ? "צפון" : 
                 "איפה את/ה גר/ה?"}
              </span>
            </button>
            {errors.location && (
              <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.location}
              </p>
            )}
          </div>

          <div>
            <Label className="text-white/70 text-sm mb-2 block">משקה אהוב (אופציונלי)</Label>
            <Input
              value={form.favorite_drink}
              onChange={(e) => setForm({ ...form, favorite_drink: e.target.value })}
              placeholder="מה תרצה לשתות?"
              className="bg-[#1A1A1A] border-[#333] text-white placeholder:text-white/30 h-12 rounded-xl text-right text-base"
              inputMode="text"
            />
          </div>

          <div>
            <Label className="text-white/70 text-sm mb-2 block">משהו מצחיק עליך 😂</Label>
            <Textarea
              value={form.funny_fact}
              onChange={(e) => setForm({ ...form, funny_fact: e.target.value })}
              placeholder="ספר/י לנו משהו מצחיק עליך..."
              maxLength={200}
              className="bg-[#1A1A1A] border-[#333] text-white placeholder:text-white/30 rounded-xl resize-none h-24 text-right text-base"
              inputMode="text"
            />
            <div className="flex justify-between items-center mt-1">
              {errors.funny_fact ? (
                <p className="text-red-400 text-xs flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.funny_fact}
                </p>
              ) : <div />}
              <span className="text-xs text-white/30">{form.funny_fact.length}/200</span>
            </div>
          </div>



          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full py-6 text-lg font-black rounded-2xl bg-gradient-to-r from-[#FE3C72] via-[#FF6B9D] to-[#FF8A5B] text-white hover:opacity-90 transition-all duration-300 shadow-2xl shadow-[#FE3C72]/30 mt-4"
          >
            {saving ? (
              <motion.span
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                שומר...
              </motion.span>
            ) : (
              "🚀 בואו נתחיל"
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}