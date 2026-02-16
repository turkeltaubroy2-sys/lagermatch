import React, { useState, useEffect } from "react";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, ArrowLeft, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

const BAD_WORDS = ["מילהגסה1", "מילהגסה2"]; // Basic filter

export default function CreateProfile() {
  const [form, setForm] = useState({ first_name: "", age: "", funny_fact: "" });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [showBrideGroom, setShowBrideGroom] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const deviceId = getDeviceId();
    base44.entities.Profile.filter({ device_id: deviceId }).then(profiles => {
      if (profiles.length > 0) {
        window.location.href = createPageUrl("Swipe");
      }
    });
  }, []);

  const getDeviceId = () => {
    let id = localStorage.getItem("wedding_device_id");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("wedding_device_id", id);
    }
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
    }
  };

  const checkFunnyFact = (text) => {
    const lowerText = text.toLowerCase();
    // Check for bride/groom name mentions (bonus feature)
    const brideGroomNames = ["חתן", "כלה"];
    const hasMention = brideGroomNames.some(name => lowerText.includes(name));
    setShowBrideGroom(hasMention);
  };

  const validate = () => {
    const newErrors = {};
    if (!form.first_name.trim()) newErrors.first_name = "שם הוא שדה חובה";
    if (form.first_name.includes(" ")) newErrors.first_name = "שם פרטי בלבד, בלי רווחים";

    const age = parseInt(form.age);
    if (!form.age) newErrors.age = "גיל הוא שדה חובה";
    else if (isNaN(age) || age < 18 || age > 60) newErrors.age = "גיל חייב להיות בין 18 ל-60";

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

    const { file_url } = await base44.integrations.Core.UploadFile({ file: photo });

    const deviceId = getDeviceId();
    const existing = await base44.entities.Profile.filter({ device_id: deviceId });
    if (existing.length > 0) {
      toast({ title: "כבר יש לך פרופיל!", variant: "destructive" });
      window.location.href = createPageUrl("Swipe");
      return;
    }

    await base44.entities.Profile.create({
      first_name: form.first_name.trim(),
      age: parseInt(form.age),
      photo_url: file_url,
      funny_fact: form.funny_fact.trim(),
      device_id: deviceId,
      is_blocked: false,
    });

    window.location.href = createPageUrl("Swipe");
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] px-5 py-8 max-w-md mx-auto">
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
          <h1 className="text-2xl font-bold shimmer-gold">צור פרופיל</h1>
          <div className="w-6" />
        </div>

        {/* Photo upload */}
        <div className="flex justify-center mb-8">
          <label className="cursor-pointer relative group">
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            <motion.div
              whileTap={{ scale: 0.95 }}
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
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#D4AF37] rounded-full flex items-center justify-center">
                <Camera className="w-4 h-4 text-[#0F0F0F]" />
              </div>
            )}
          </label>
        </div>
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
              className="bg-[#1A1A1A] border-[#333] text-white placeholder:text-white/30 h-12 rounded-xl text-right"
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
              placeholder="כמה את/ה?"
              className="bg-[#1A1A1A] border-[#333] text-white placeholder:text-white/30 h-12 rounded-xl text-right"
            />
            {errors.age && (
              <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.age}
              </p>
            )}
          </div>

          <div>
            <Label className="text-white/70 text-sm mb-2 block">פרט מצחיק על החתן / הכלה 😂</Label>
            <Textarea
              value={form.funny_fact}
              onChange={(e) => {
                setForm({ ...form, funny_fact: e.target.value });
                checkFunnyFact(e.target.value);
              }}
              placeholder="ספר/י לנו משהו מצחיק..."
              maxLength={200}
              className="bg-[#1A1A1A] border-[#333] text-white placeholder:text-white/30 rounded-xl resize-none h-24 text-right"
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

          <AnimatePresence>
            {showBrideGroom && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl p-4 text-center"
              >
                <p className="text-[#D4AF37] text-sm">
                  <Sparkles className="w-4 h-4 inline mr-1" />
                  אתה כנראה מכיר אותנו טוב מדי 😉
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full py-6 text-lg font-bold rounded-2xl bg-gradient-to-r from-[#B8941F] via-[#D4AF37] to-[#F5E6A3] text-[#0F0F0F] hover:opacity-90 transition-all duration-300 shadow-lg shadow-[#D4AF37]/20 mt-4"
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