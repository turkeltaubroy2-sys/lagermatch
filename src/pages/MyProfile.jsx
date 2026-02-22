import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera, Check, AlertCircle, ChevronDown, User,
  Sparkles, Trash2, Plus, Save, Loader2, ImagePlus, ArrowLeft, ArrowRight
} from "lucide-react";
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

// Reusable field wrapper
function Field({ label, error, children }) {
  return (
    <div>
      <Label className="text-white/40 text-[10px] mb-2 block tracking-widest uppercase">{label}</Label>
      {children}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-red-400 text-xs mt-1.5 flex items-center gap-1"
          >
            <AlertCircle className="w-3 h-3 shrink-0" /> {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function MyProfile() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ first_name: "", age: "", location: "", funny_fact: "", favorite_drink: "" });
  const [photos, setPhotos] = useState([]); // [{url, preview?}]
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showLocationSheet, setShowLocationSheet] = useState(false);
  const [showPhotoSheet, setShowPhotoSheet] = useState(false); // { slot: null | index }
  const [uploadingSlot, setUploadingSlot] = useState(null); // which slot is uploading
  const [saved, setSaved] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(null); // full-screen photo preview
  const { toast } = useToast();

  useEffect(() => { loadProfile(); }, []);

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
      setPhotos(urls.map(url => ({ url })));
    }
    setLoading(false);
  };

  const handlePhotoFile = async (file, slot) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "התמונה גדולה מדי (מקסימום 10MB)", duration: 2500 });
      return;
    }
    setShowPhotoSheet(false);
    setUploadingSlot(slot ?? "new");
    const preview = URL.createObjectURL(file);
    // Optimistic preview
    setPhotos(prev => {
      const updated = [...prev];
      if (slot !== null && slot !== undefined && slot < updated.length) {
        updated[slot] = { url: updated[slot].url, preview, uploading: true };
      } else {
        updated.push({ url: "", preview, uploading: true });
      }
      return updated;
    });
    const result = await base44.integrations.Core.UploadFile({ file });
    const url = result.file_url;
    setPhotos(prev => {
      const updated = [...prev];
      const targetSlot = (slot !== null && slot !== undefined && slot < updated.length) ? slot : updated.length - 1;
      updated[targetSlot] = { url, preview };
      return updated;
    });
    setUploadingSlot(null);
  };

  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const movePhoto = (index, dir) => {
    const newIndex = index + dir;
    if (newIndex < 0 || newIndex >= photos.length) return;
    setPhotos(prev => {
      const updated = [...prev];
      [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
      return updated;
    });
  };

  const validate = () => {
    const newErrors = {};
    if (!form.first_name.trim()) newErrors.first_name = "שם הוא שדה חובה";
    else if (form.first_name.trim().includes(" ")) newErrors.first_name = "שם פרטי בלבד, בלי רווחים";
    const age = parseInt(form.age);
    if (!form.age) newErrors.age = "גיל הוא שדה חובה";
    else if (isNaN(age) || age < 18 || age > 60) newErrors.age = "גיל חייב להיות בין 18 ל-60";
    if (!form.location) newErrors.location = "איזור מגורים הוא שדה חובה";
    if (photos.filter(p => !p.uploading).length === 0) newErrors.photo = "חובה לפחות תמונה אחת";
    if (!form.funny_fact.trim()) newErrors.funny_fact = "הפרט המצחיק הוא שדה חובה";
    else if (form.funny_fact.length > 200) newErrors.funny_fact = "מקסימום 200 תווים";
    if (BAD_WORDS.some(w => form.funny_fact.toLowerCase().includes(w))) newErrors.funny_fact = "בבקשה השתמש בשפה הולמת 😊";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate() || !profile || uploadingSlot !== null) return;
    setSaving(true);
    const urls = photos.map(p => p.url).filter(Boolean);
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
  const inputCls = "bg-[#181818] border-[#2A2A2A] focus:border-[#D4AF37]/60 text-white placeholder:text-white/20 rounded-2xl text-right text-[15px] transition-colors";

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[#0F0F0F]">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}>
          <Loader2 className="w-8 h-8 text-[#D4AF37]" />
        </motion.div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[#0F0F0F] flex-col gap-4 px-8 text-center">
        <span className="text-6xl">😶</span>
        <p className="text-white/50 leading-relaxed">לא נמצא פרופיל.<br /><span className="text-white/30 text-sm">צור פרופיל ראשית!</span></p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#0A0A0A] pb-32 max-w-md mx-auto relative overflow-x-hidden">
      {/* Ambient glows */}
      <div className="fixed top-0 right-0 w-72 h-72 bg-[#D4AF37]/6 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/3 left-0 w-56 h-56 bg-[#FE3C72]/5 rounded-full blur-3xl pointer-events-none" />

      {/* ─── Header ─── */}
      <div className="sticky top-0 z-30 bg-[#0A0A0A]/95 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="px-5 pt-safe-top pt-4 pb-4 flex items-center justify-between" style={{ paddingTop: `calc(1rem + env(safe-area-inset-top))` }}>
          <div className="flex items-center gap-3">
            {/* Avatar preview */}
            <div className="relative w-11 h-11 rounded-2xl overflow-hidden bg-[#1A1A1A] border border-white/10 shrink-0">
              {photos[0] ? (
                <img src={photos[0].preview || photos[0].url} className="w-full h-full object-cover" alt="" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white/30" />
                </div>
              )}
            </div>
            <div>
              <h1 className="text-[17px] font-black text-white leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                My Profile
              </h1>
              <p className="text-[10px] text-[#D4AF37]/60 tracking-[0.25em] uppercase font-semibold mt-0.5">
                {form.first_name ? `✦ ${form.first_name}` : "✦ NightMatch"}
              </p>
            </div>
          </div>

          {/* Save CTA */}
          <motion.button
            onClick={handleSave}
            disabled={saving || uploadingSlot !== null}
            whileTap={{ scale: 0.93 }}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl font-black text-[13px] transition-all duration-300 ${
              saved
                ? "bg-green-500/15 text-green-400 border border-green-500/25"
                : uploadingSlot !== null
                ? "bg-white/5 text-white/30 border border-white/10"
                : "bg-gradient-to-r from-[#D4AF37] to-[#B8941F] text-[#0A0A0A] shadow-[0_4px_20px_rgba(212,175,55,0.4)]"
            }`}
          >
            {saving ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> שומר...</>
            ) : saved ? (
              <><Check className="w-3.5 h-3.5" /> נשמר!</>
            ) : uploadingSlot !== null ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> מעלה...</>
            ) : (
              <><Save className="w-3.5 h-3.5" /> שמור</>
            )}
          </motion.button>
        </div>
      </div>

      <div className="px-5 pt-7 space-y-9">

        {/* ─── Photos Section ─── */}
        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
              <span className="text-[11px] text-white/50 tracking-widest uppercase font-black">תמונות</span>
            </div>
            <span className="text-[10px] text-white/25 font-semibold">{photos.length} / 6</span>
          </div>

          {/* Main photo large card */}
          <div
            className="relative w-full rounded-3xl overflow-hidden mb-3 bg-[#1A1A1A] border border-white/[0.07] shadow-[0_12px_50px_rgba(0,0,0,0.7)]"
            style={{ aspectRatio: "3/4" }}
          >
            {photos[0] ? (
              <>
                <img
                  src={photos[0].preview || photos[0].url}
                  className="w-full h-full object-cover"
                  alt="תמונה ראשית"
                  onClick={() => setPreviewIndex(0)}
                />
                {photos[0].uploading && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
                {/* Badge */}
                <div className="absolute top-3 right-3 bg-[#D4AF37] text-[#0A0A0A] text-[8px] font-black px-2.5 py-1 rounded-full tracking-[0.2em] uppercase shadow-md">
                  ✦ ראשית
                </div>
                {/* Bottom actions */}
                <div className="absolute bottom-3 inset-x-3 flex justify-between">
                  <motion.button
                    whileTap={{ scale: 0.88 }}
                    onClick={() => removePhoto(0)}
                    className="w-10 h-10 rounded-2xl bg-[#FE3C72]/85 backdrop-blur-sm flex items-center justify-center shadow-lg"
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.88 }}
                    onClick={() => setShowPhotoSheet({ slot: 0 })}
                    className="w-10 h-10 rounded-2xl bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-lg"
                  >
                    <Camera className="w-4 h-4 text-white" />
                  </motion.button>
                </div>
              </>
            ) : (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowPhotoSheet({ slot: null })}
                className="w-full h-full flex flex-col items-center justify-center gap-3 text-white/25 hover:text-white/40 transition-colors"
              >
                <div className="w-16 h-16 rounded-3xl border-2 border-dashed border-[#D4AF37]/30 flex items-center justify-center mb-1">
                  <ImagePlus className="w-7 h-7 text-[#D4AF37]/50" />
                </div>
                <p className="text-[12px] font-semibold tracking-widest uppercase text-white/30">הוסף תמונה ראשית</p>
                <p className="text-[10px] text-white/15">התמונה הראשית שנראית בכרטיס</p>
              </motion.button>
            )}
          </div>

          {/* Secondary photos grid */}
          <div className="grid grid-cols-3 gap-2">
            {photos.slice(1).map((p, i) => {
              const idx = i + 1;
              return (
                <motion.div
                  key={`${p.url}-${idx}`}
                  layout
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative aspect-square rounded-2xl overflow-hidden bg-[#1A1A1A] border border-white/[0.07]"
                >
                  <img
                    src={p.preview || p.url}
                    className="w-full h-full object-cover"
                    alt=""
                    onClick={() => setPreviewIndex(idx)}
                  />
                  {p.uploading && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-[#D4AF37] animate-spin" />
                    </div>
                  )}
                  {/* Always-visible action bar at bottom */}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent pb-1.5 pt-5 flex items-center justify-center gap-1.5">
                    {idx > 1 && (
                      <motion.button whileTap={{ scale: 0.82 }} onClick={() => movePhoto(idx, -1)}
                        className="w-6 h-6 rounded-lg bg-black/50 backdrop-blur-sm flex items-center justify-center">
                        <ArrowRight className="w-3 h-3 text-white/80" />
                      </motion.button>
                    )}
                    <motion.button whileTap={{ scale: 0.82 }} onClick={() => removePhoto(idx)}
                      className="w-6 h-6 rounded-lg bg-[#FE3C72]/80 flex items-center justify-center">
                      <Trash2 className="w-3 h-3 text-white" />
                    </motion.button>
                    {idx < photos.length - 1 && (
                      <motion.button whileTap={{ scale: 0.82 }} onClick={() => movePhoto(idx, 1)}
                        className="w-6 h-6 rounded-lg bg-black/50 backdrop-blur-sm flex items-center justify-center">
                        <ArrowLeft className="w-3 h-3 text-white/80" />
                      </motion.button>
                    )}
                  </div>
                  {/* Replace button */}
                  <motion.button
                    whileTap={{ scale: 0.88 }}
                    onClick={() => setShowPhotoSheet({ slot: idx })}
                    className="absolute top-1.5 left-1.5 w-6 h-6 rounded-lg bg-black/60 backdrop-blur-sm flex items-center justify-center border border-white/10"
                  >
                    <Camera className="w-3 h-3 text-white/80" />
                  </motion.button>
                </motion.div>
              );
            })}

            {/* Add slot */}
            {photos.length < 6 && (
              <motion.button
                whileTap={{ scale: 0.93 }}
                onClick={() => setShowPhotoSheet({ slot: null })}
                className={`aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-all ${
                  errors.photo
                    ? "border-red-500/60 bg-red-500/5"
                    : "border-[#D4AF37]/25 bg-[#181818] active:border-[#D4AF37]/60"
                }`}
              >
                {uploadingSlot === "new" ? (
                  <Loader2 className="w-5 h-5 text-[#D4AF37] animate-spin" />
                ) : (
                  <>
                    <Plus className="w-5 h-5 text-[#D4AF37]/50" />
                    <span className="text-[8px] text-white/25 tracking-widest uppercase">הוסף</span>
                  </>
                )}
              </motion.button>
            )}
          </div>

          <AnimatePresence>
            {errors.photo && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="text-red-400 text-xs mt-2.5 flex items-center gap-1.5">
                <AlertCircle className="w-3 h-3" /> {errors.photo}
              </motion.p>
            )}
          </AnimatePresence>

          <p className="text-[9px] text-white/15 mt-2.5 text-center tracking-wider">
            ✦ לחץ על מצלמה להחלפה · חצים לשינוי סדר · אשפה להסרה ✦
          </p>
        </motion.section>

        {/* ─── Divider ─── */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />

        {/* ─── Personal Info ─── */}
        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <User className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span className="text-[11px] text-white/40 tracking-widest uppercase font-black">פרטים אישיים</span>
          </div>

          <Field label="✦ שם פרטי" error={errors.first_name}>
            <Input
              value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              placeholder="איך קוראים לך?"
              className={`${inputCls} h-[52px]`}
              autoCapitalize="words"
            />
          </Field>

          <Field label="✦ גיל" error={errors.age}>
            <Input
              type="number"
              min={18} max={60}
              value={form.age}
              onChange={(e) => setForm({ ...form, age: e.target.value })}
              placeholder="מה הגיל שלך?"
              className={`${inputCls} h-[52px]`}
              inputMode="numeric"
            />
          </Field>

          <Field label="✦ איזור" error={errors.location}>
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => setShowLocationSheet(true)}
              className={`w-full h-[52px] px-4 rounded-2xl bg-[#181818] border text-right flex items-center justify-between transition-colors ${
                errors.location ? "border-red-500/60" : "border-[#2A2A2A] active:border-[#D4AF37]/40"
              }`}
            >
              <ChevronDown className="w-4 h-4 text-white/25" />
              <span className={`text-[15px] ${form.location ? "text-white font-semibold" : "text-white/25"}`}>
                {locationLabel(form.location)}
              </span>
            </motion.button>
          </Field>

          <Field label="✦ משקה אהוב 🍸 (אופציונלי)">
            <Input
              value={form.favorite_drink}
              onChange={(e) => setForm({ ...form, favorite_drink: e.target.value })}
              placeholder="מה אתה שותה הלילה?"
              className={`${inputCls} h-[52px]`}
            />
          </Field>

          <Field label="✦ משהו מצחיק עליך 😂" error={errors.funny_fact}>
            <Textarea
              value={form.funny_fact}
              onChange={(e) => setForm({ ...form, funny_fact: e.target.value })}
              placeholder="משהו מצחיק, מפתיע, שמייחד אותך..."
              maxLength={200}
              className={`${inputCls} resize-none h-[112px] py-3`}
            />
            <div className="flex justify-end mt-1">
              <span className={`text-xs font-semibold ${form.funny_fact.length > 180 ? "text-[#D4AF37]" : "text-white/20"}`}>
                {form.funny_fact.length}/200
              </span>
            </div>
          </Field>
        </motion.section>

        {/* ─── Save Button ─── */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
          <motion.button
            onClick={handleSave}
            disabled={saving || uploadingSlot !== null}
            whileTap={{ scale: 0.97 }}
            className={`w-full h-[56px] rounded-3xl font-black text-[15px] tracking-widest uppercase transition-all duration-300 shadow-[0_8px_40px_rgba(212,175,55,0.3)] ${
              saved
                ? "bg-green-500/20 text-green-400 border border-green-500/30 shadow-none"
                : saving || uploadingSlot !== null
                ? "bg-[#1A1A1A] text-white/30 border border-white/10 shadow-none"
                : "bg-gradient-to-r from-[#D4AF37] via-[#F5E6A3] to-[#D4AF37] text-[#0A0A0A]"
            }`}
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> שומר שינויים...
              </span>
            ) : saved ? (
              <span className="flex items-center justify-center gap-2">
                <Check className="w-5 h-5" /> נשמר בהצלחה! 🎉
              </span>
            ) : uploadingSlot !== null ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> ממתין לסיום העלאה...
              </span>
            ) : (
              "✦ Save Changes"
            )}
          </motion.button>
        </motion.div>
      </div>

      {/* ─── Location Sheet ─── */}
      <AnimatePresence>
        {showLocationSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40"
              onClick={() => setShowLocationSheet(false)}
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed bottom-0 inset-x-0 bg-[#141414] border-t border-white/10 rounded-t-[2rem] z-50 max-w-md mx-auto"
              style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
            >
              <div className="w-10 h-1 bg-white/15 rounded-full mx-auto mt-4 mb-5" />
              <h3 className="text-white text-center font-black mb-4 tracking-widest uppercase text-[13px]">✦ בחר איזור</h3>
              <div className="space-y-2 px-5">
                {LOCATIONS.map(opt => (
                  <motion.button
                    key={opt.value}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { setForm(f => ({ ...f, location: opt.value })); setShowLocationSheet(false); }}
                    className={`w-full py-4 px-5 rounded-2xl text-right font-bold text-[15px] transition-all ${
                      form.location === opt.value
                        ? "bg-gradient-to-r from-[#D4AF37] to-[#B8941F] text-[#0A0A0A] shadow-[0_4px_20px_rgba(212,175,55,0.3)]"
                        : "bg-[#1E1E1E] text-white/80 border border-white/[0.06]"
                    }`}
                  >
                    {opt.label}
                  </motion.button>
                ))}
              </div>
              <button onClick={() => setShowLocationSheet(false)} className="w-full mt-3 py-3 text-white/30 text-sm">ביטול</button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── Photo Options Sheet ─── */}
      <AnimatePresence>
        {showPhotoSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40"
              onClick={() => setShowPhotoSheet(false)}
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed bottom-0 inset-x-0 bg-[#141414] border-t border-white/10 rounded-t-[2rem] z-50 max-w-md mx-auto"
              style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
            >
              <div className="w-10 h-1 bg-white/15 rounded-full mx-auto mt-4 mb-5" />
              <h3 className="text-white text-center font-black mb-5 tracking-widest uppercase text-[13px]">✦ הוסף תמונה</h3>
              <div className="space-y-3 px-5">
                <label className="block cursor-pointer">
                  <input
                    type="file" accept="image/*" capture="environment" className="hidden"
                    onChange={(e) => { handlePhotoFile(e.target.files[0], showPhotoSheet.slot); e.target.value = ""; }}
                  />
                  <motion.div
                    whileTap={{ scale: 0.97 }}
                    className="w-full py-5 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#B8941F] text-[#0A0A0A] font-black text-[15px] flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(212,175,55,0.3)]"
                    onClick={(e) => e.currentTarget.previousElementSibling.click()}
                  >
                    <Camera className="w-5 h-5" /> צלם תמונה
                  </motion.div>
                </label>
                <label className="block cursor-pointer">
                  <input
                    type="file" accept="image/*" className="hidden"
                    onChange={(e) => { handlePhotoFile(e.target.files[0], showPhotoSheet.slot); e.target.value = ""; }}
                  />
                  <motion.div
                    whileTap={{ scale: 0.97 }}
                    className="w-full py-5 rounded-2xl bg-[#1E1E1E] text-white font-bold text-[15px] flex items-center justify-center gap-2 border border-white/[0.07]"
                    onClick={(e) => e.currentTarget.previousElementSibling.click()}
                  >
                    📁 בחר מהגלריה
                  </motion.div>
                </label>
                <button onClick={() => setShowPhotoSheet(false)} className="w-full py-3 text-white/30 text-sm">ביטול</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── Full-screen Photo Preview ─── */}
      <AnimatePresence>
        {previewIndex !== null && photos[previewIndex] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black flex items-center justify-center"
            onClick={() => setPreviewIndex(null)}
          >
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              src={photos[previewIndex].preview || photos[previewIndex].url}
              className="max-w-full max-h-full object-contain"
              alt=""
            />
            {/* Nav arrows */}
            {previewIndex > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); setPreviewIndex(previewIndex - 1); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/60 rounded-full flex items-center justify-center"
              >
                <ArrowRight className="w-5 h-5 text-white" />
              </button>
            )}
            {previewIndex < photos.length - 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); setPreviewIndex(previewIndex + 1); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/60 rounded-full flex items-center justify-center"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
            )}
            {/* Close */}
            <button
              onClick={() => setPreviewIndex(null)}
              className="absolute top-4 left-4 w-9 h-9 bg-black/60 rounded-full flex items-center justify-center text-white/70 text-xl font-bold"
              style={{ top: `calc(1rem + env(safe-area-inset-top))` }}
            >
              ×
            </button>
            <div className="absolute bottom-6 inset-x-0 flex justify-center gap-1.5">
              {photos.map((_, i) => (
                <div key={i} className={`rounded-full transition-all ${i === previewIndex ? "w-5 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/30"}`} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}