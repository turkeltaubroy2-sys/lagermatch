import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera, Check, AlertCircle, ChevronDown,
  Trash2, Plus, Save, Loader2, ImagePlus, ArrowLeft, ArrowRight, X
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import BottomNav from "@/components/BottomNav";

const BAD_WORDS = ["מילהגסה1", "מילהגסה2"];
const LOCATIONS = [
  { value: "tel_aviv", label: "תל אביב", flag: "🌊" },
  { value: "south", label: "דרום", flag: "☀️" },
  { value: "north", label: "צפון", flag: "🌿" },
];

export default function MyProfile() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ first_name: "", age: "", location: "", funny_fact: "", favorite_drink: "" });
  const [photos, setPhotos] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showLocationSheet, setShowLocationSheet] = useState(false);
  const [photoSheetSlot, setPhotoSheetSlot] = useState(null); // false = closed, null = new, number = replace
  const [photoSheetOpen, setPhotoSheetOpen] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState(null);
  const [saved, setSaved] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(null);
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

  const openPhotoSheet = (slot) => {
    setPhotoSheetSlot(slot);
    setPhotoSheetOpen(true);
  };

  const handlePhotoFile = async (file, slot) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "התמונה גדולה מדי (מקסימום 10MB)", duration: 2500 });
      return;
    }
    setPhotoSheetOpen(false);
    const uploadKey = slot ?? "new";
    setUploadingSlot(uploadKey);
    const preview = URL.createObjectURL(file);
    setPhotos(prev => {
      const updated = [...prev];
      if (slot !== null && slot !== undefined && slot < updated.length) {
        updated[slot] = { ...updated[slot], preview, uploading: true };
      } else {
        updated.push({ url: "", preview, uploading: true });
      }
      return updated;
    });
    const result = await base44.integrations.Core.UploadFile({ file });
    const url = result.file_url;
    setPhotos(prev => {
      const updated = [...prev];
      const targetIdx = (slot !== null && slot !== undefined && slot < updated.length) ? slot : updated.length - 1;
      updated[targetIdx] = { url, preview };
      return updated;
    });
    setUploadingSlot(null);
  };

  const removePhoto = (index) => setPhotos(prev => prev.filter((_, i) => i !== index));

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

  const locationLabel = (val) => {
    const loc = LOCATIONS.find(l => l.value === val);
    return loc ? `${loc.flag} ${loc.label}` : null;
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[#080808]">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}>
          <Loader2 className="w-8 h-8 text-[#D4AF37]" />
        </motion.div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[#080808] flex-col gap-4 px-8 text-center">
        <span className="text-6xl">😶</span>
        <p className="text-white/40">לא נמצא פרופיל. צור פרופיל קודם!</p>
      </div>
    );
  }

  const isBusy = saving || uploadingSlot !== null;

  return (
    <div className="min-h-[100dvh] bg-[#080808] pb-32 max-w-md mx-auto relative">
      {/* Background glows */}
      <div className="fixed top-0 right-0 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed bottom-40 left-0 w-64 h-64 bg-[#FE3C72]/5 rounded-full blur-[80px] pointer-events-none" />

      {/* ── HEADER ── */}
      <div
        className="sticky top-0 z-30 bg-[#080808]/95 backdrop-blur-2xl border-b border-white/[0.05]"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="px-5 py-4 flex items-center justify-between gap-3">
          {/* Avatar + title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl overflow-hidden bg-[#1C1C1C] border border-white/[0.08] shrink-0 shadow-[0_0_20px_rgba(212,175,55,0.15)]">
              {photos[0] ? (
                <img src={photos[0].preview || photos[0].url} className="w-full h-full object-cover" alt="" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl">🙂</div>
              )}
            </div>
            <div className="min-w-0">
              <h1
                className="text-[18px] font-black text-white truncate leading-tight"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {form.first_name || "My Profile"}
              </h1>
              <p className="text-[10px] text-[#D4AF37]/50 tracking-[0.3em] uppercase mt-0.5">
                ✦ NightMatch
              </p>
            </div>
          </div>


        </div>
      </div>

      <div className="px-4 pt-6 space-y-8">

        {/* ── PHOTOS ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-black text-white/40 tracking-[0.25em] uppercase">✦ תמונות</p>
            <p className="text-[11px] text-white/20 font-semibold">{photos.length}/6</p>
          </div>

          {/* Hero photo */}
          <div
            className="relative w-full rounded-[28px] overflow-hidden bg-[#141414] border border-white/[0.06] shadow-[0_20px_60px_rgba(0,0,0,0.8)]"
            style={{ aspectRatio: "3/4" }}
          >
            {photos[0] ? (
              <>
                <img
                  src={photos[0].preview || photos[0].url}
                  className="w-full h-full object-cover cursor-pointer"
                  alt=""
                  onClick={() => setPreviewIndex(0)}
                />
                {photos[0].uploading && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                    <Loader2 className="w-10 h-10 text-[#D4AF37] animate-spin" />
                  </div>
                )}
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none" />

                {/* Badge */}
                <div className="absolute top-4 right-4">
                  <div className="bg-[#D4AF37] text-[#080808] text-[9px] font-black px-3 py-1 rounded-full tracking-[0.2em] uppercase shadow-[0_2px_12px_rgba(212,175,55,0.5)]">
                    ✦ ראשית
                  </div>
                </div>

                {/* Bottom action bar */}
                <div className="absolute bottom-4 inset-x-4 flex items-center justify-between">
                  <motion.button
                    whileTap={{ scale: 0.88 }}
                    onClick={() => removePhoto(0)}
                    className="w-11 h-11 rounded-2xl bg-[#FE3C72]/90 backdrop-blur-sm flex items-center justify-center shadow-[0_4px_16px_rgba(254,60,114,0.4)]"
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </motion.button>

                  <div className="flex items-center gap-2">
                    {photos.length > 1 && (
                      <motion.button
                        whileTap={{ scale: 0.88 }}
                        onClick={() => movePhoto(0, 1)}
                        className="w-9 h-9 rounded-xl bg-black/60 backdrop-blur-sm border border-white/15 flex items-center justify-center"
                      >
                        <ArrowLeft className="w-4 h-4 text-white/80" />
                      </motion.button>
                    )}
                    <motion.button
                      whileTap={{ scale: 0.88 }}
                      onClick={() => openPhotoSheet(0)}
                      className="w-11 h-11 rounded-2xl bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center"
                    >
                      <Camera className="w-5 h-5 text-white" />
                    </motion.button>
                  </div>
                </div>
              </>
            ) : (
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => openPhotoSheet(null)}
                className="w-full h-full flex flex-col items-center justify-center gap-4"
              >
                <div className="w-20 h-20 rounded-3xl border-2 border-dashed border-[#D4AF37]/25 flex items-center justify-center">
                  <ImagePlus className="w-8 h-8 text-[#D4AF37]/40" />
                </div>
                <div className="text-center">
                  <p className="text-white/40 font-bold text-[14px]">הוסף תמונה ראשית</p>
                  <p className="text-white/15 text-[12px] mt-1">התמונה הראשונה שיראו</p>
                </div>
              </motion.button>
            )}
          </div>

          {/* Secondary grid */}
          {(photos.length > 1 || photos.length < 6) && (
            <div className="grid grid-cols-3 gap-2 mt-2.5">
              {photos.slice(1).map((p, i) => {
                const idx = i + 1;
                return (
                  <motion.div
                    key={`${p.url}-${idx}`}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative bg-[#141414] border border-white/[0.06] rounded-2xl overflow-hidden"
                    style={{ aspectRatio: "1" }}
                  >
                    <img
                      src={p.preview || p.url}
                      className="w-full h-full object-cover cursor-pointer"
                      alt=""
                      onClick={() => setPreviewIndex(idx)}
                    />
                    {p.uploading && (
                      <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-[#D4AF37] animate-spin" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />

                    {/* Bottom controls */}
                    <div className="absolute bottom-1.5 inset-x-1.5 flex items-center justify-between gap-1">
                      <motion.button whileTap={{ scale: 0.82 }} onClick={() => removePhoto(idx)}
                        className="w-7 h-7 rounded-xl bg-[#FE3C72]/80 flex items-center justify-center shrink-0">
                        <Trash2 className="w-3 h-3 text-white" />
                      </motion.button>
                      <div className="flex gap-1">
                        {idx > 1 && (
                          <motion.button whileTap={{ scale: 0.82 }} onClick={() => movePhoto(idx, -1)}
                            className="w-7 h-7 rounded-xl bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center">
                            <ArrowRight className="w-3 h-3 text-white/80" />
                          </motion.button>
                        )}
                        {idx < photos.length - 1 && (
                          <motion.button whileTap={{ scale: 0.82 }} onClick={() => movePhoto(idx, 1)}
                            className="w-7 h-7 rounded-xl bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center">
                            <ArrowLeft className="w-3 h-3 text-white/80" />
                          </motion.button>
                        )}
                      </div>
                    </div>

                    {/* Replace */}
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      onClick={() => openPhotoSheet(idx)}
                      className="absolute top-1.5 left-1.5 w-7 h-7 rounded-xl bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center"
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
                  onClick={() => openPhotoSheet(null)}
                  style={{ aspectRatio: "1" }}
                  className={`rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 transition-all ${
                    errors.photo
                      ? "border-red-500/50 bg-red-500/5"
                      : "border-[#D4AF37]/20 bg-[#141414] active:border-[#D4AF37]/50"
                  }`}
                >
                  {uploadingSlot === "new"
                    ? <Loader2 className="w-5 h-5 text-[#D4AF37] animate-spin" />
                    : <>
                      <Plus className="w-5 h-5 text-[#D4AF37]/40" />
                      <span className="text-[9px] text-white/20 tracking-widest uppercase">הוסף</span>
                    </>}
                </motion.button>
              )}
            </div>
          )}

          <AnimatePresence>
            {errors.photo && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="text-red-400 text-xs mt-2 flex items-center gap-1.5">
                <AlertCircle className="w-3 h-3 shrink-0" /> {errors.photo}
              </motion.p>
            )}
          </AnimatePresence>
        </section>

        {/* ── DIVIDER ── */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />

        {/* ── FORM FIELDS ── */}
        <section className="space-y-4 pb-2">
          <p className="text-[11px] font-black text-white/40 tracking-[0.25em] uppercase">✦ פרטים אישיים</p>

          {/* Name */}
          <FormField label="שם פרטי" error={errors.first_name}>
            <Input
              value={form.first_name}
              onChange={(e) => setForm(f => ({ ...f, first_name: e.target.value }))}
              placeholder="איך קוראים לך?"
              className="bg-[#141414] border-[#252525] focus:border-[#D4AF37]/40 text-white placeholder:text-white/20 rounded-2xl text-right text-[15px] h-[52px] transition-colors"
              autoCapitalize="words"
            />
          </FormField>

          {/* Age */}
          <FormField label="גיל" error={errors.age}>
            <Input
              type="number" min={18} max={60}
              value={form.age}
              onChange={(e) => setForm(f => ({ ...f, age: e.target.value }))}
              placeholder="בין 18 ל-60"
              className="bg-[#141414] border-[#252525] focus:border-[#D4AF37]/40 text-white placeholder:text-white/20 rounded-2xl text-right text-[15px] h-[52px] transition-colors"
              inputMode="numeric"
            />
          </FormField>

          {/* Location */}
          <FormField label="איזור" error={errors.location}>
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => setShowLocationSheet(true)}
              className={`w-full h-[52px] px-4 rounded-2xl bg-[#141414] border text-right flex items-center justify-between transition-colors ${
                errors.location ? "border-red-500/50" : "border-[#252525]"
              }`}
            >
              <ChevronDown className="w-4 h-4 text-white/25 shrink-0" />
              <span className={`text-[15px] ${form.location ? "text-white font-semibold" : "text-white/25"}`}>
                {locationLabel(form.location) ?? "בחר איזור"}
              </span>
            </motion.button>
          </FormField>

          {/* Drink */}
          <FormField label="משקה אהוב 🍸  (אופציונלי)">
            <Input
              value={form.favorite_drink}
              onChange={(e) => setForm(f => ({ ...f, favorite_drink: e.target.value }))}
              placeholder="מה אתה שותה הלילה?"
              className="bg-[#141414] border-[#252525] focus:border-[#D4AF37]/40 text-white placeholder:text-white/20 rounded-2xl text-right text-[15px] h-[52px] transition-colors"
            />
          </FormField>

          {/* Funny fact */}
          <FormField label="משהו מצחיק עליך 😂" error={errors.funny_fact}>
            <Textarea
              value={form.funny_fact}
              onChange={(e) => setForm(f => ({ ...f, funny_fact: e.target.value }))}
              placeholder="משהו מצחיק, מפתיע, שמייחד אותך..."
              maxLength={200}
              className="bg-[#141414] border-[#252525] focus:border-[#D4AF37]/40 text-white placeholder:text-white/20 rounded-2xl text-right text-[15px] resize-none h-[110px] py-3.5 transition-colors"
            />
            <div className="flex justify-end mt-1.5">
              <span className={`text-[11px] font-semibold ${form.funny_fact.length > 180 ? "text-[#D4AF37]" : "text-white/20"}`}>
                {form.funny_fact.length}/200
              </span>
            </div>
          </FormField>
        </section>

        {/* ── BIG SAVE BUTTON ── */}
        <motion.button
          onClick={handleSave}
          disabled={isBusy}
          whileTap={{ scale: 0.97 }}
          className={`w-full h-[58px] rounded-3xl font-black text-[15px] tracking-[0.15em] uppercase transition-all duration-300 mb-4 ${
            saved
              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
              : isBusy
              ? "bg-[#1A1A1A] text-white/25 border border-white/[0.06]"
              : "bg-gradient-to-r from-[#D4AF37] via-[#F0D060] to-[#D4AF37] text-[#080808] shadow-[0_8px_40px_rgba(212,175,55,0.35)]"
          }`}
        >
          {saving
            ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> שומר שינויים...</span>
            : saved
            ? <span className="flex items-center justify-center gap-2"><Check className="w-5 h-5" /> נשמר בהצלחה! 🎉</span>
            : uploadingSlot !== null
            ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> ממתין לסיום העלאה...</span>
            : "✦ Save Changes"}
        </motion.button>
      </div>

      {/* ── LOCATION SHEET ── */}
      <BottomSheet open={showLocationSheet} onClose={() => setShowLocationSheet(false)} title="✦ בחר איזור">
        <div className="space-y-2 px-5">
          {LOCATIONS.map(opt => (
            <motion.button
              key={opt.value}
              whileTap={{ scale: 0.97 }}
              onClick={() => { setForm(f => ({ ...f, location: opt.value })); setShowLocationSheet(false); }}
              className={`w-full py-4 px-5 rounded-2xl text-right font-bold text-[15px] flex items-center justify-between transition-all ${
                form.location === opt.value
                  ? "bg-gradient-to-r from-[#D4AF37] to-[#C09B2A] text-[#080808] shadow-[0_4px_20px_rgba(212,175,55,0.3)]"
                  : "bg-[#1C1C1C] text-white/80 border border-white/[0.05]"
              }`}
            >
              <span className="text-xl">{opt.flag}</span>
              <span>{opt.label}</span>
            </motion.button>
          ))}
        </div>
        <button onClick={() => setShowLocationSheet(false)} className="w-full mt-3 py-3 text-white/25 text-sm">ביטול</button>
      </BottomSheet>

      {/* ── PHOTO OPTIONS SHEET ── */}
      <BottomSheet open={photoSheetOpen} onClose={() => setPhotoSheetOpen(false)} title="✦ הוסף תמונה">
        <div className="space-y-3 px-5">
          <label className="block cursor-pointer">
            <input type="file" accept="image/*" capture="environment" className="hidden"
              onChange={(e) => { handlePhotoFile(e.target.files[0], photoSheetSlot); e.target.value = ""; }} />
            <motion.div
              whileTap={{ scale: 0.97 }}
              className="w-full py-5 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#C09B2A] text-[#080808] font-black text-[15px] flex items-center justify-center gap-2.5 shadow-[0_4px_24px_rgba(212,175,55,0.3)] cursor-pointer"
              onClick={(e) => e.currentTarget.previousElementSibling.click()}
            >
              <Camera className="w-5 h-5" /> 📸 צלם תמונה
            </motion.div>
          </label>
          <label className="block cursor-pointer">
            <input type="file" accept="image/*" className="hidden"
              onChange={(e) => { handlePhotoFile(e.target.files[0], photoSheetSlot); e.target.value = ""; }} />
            <motion.div
              whileTap={{ scale: 0.97 }}
              className="w-full py-5 rounded-2xl bg-[#1C1C1C] text-white font-bold text-[15px] flex items-center justify-center gap-2.5 border border-white/[0.07] cursor-pointer"
              onClick={(e) => e.currentTarget.previousElementSibling.click()}
            >
              📁 בחר מהגלריה
            </motion.div>
          </label>
          <button onClick={() => setPhotoSheetOpen(false)} className="w-full py-3 text-white/25 text-sm">ביטול</button>
        </div>
      </BottomSheet>

      {/* ── FULLSCREEN PHOTO PREVIEW ── */}
      <AnimatePresence>
        {previewIndex !== null && photos[previewIndex] && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center"
            onClick={() => setPreviewIndex(null)}
          >
            <motion.img
              initial={{ scale: 0.92 }} animate={{ scale: 1 }}
              src={photos[previewIndex].preview || photos[previewIndex].url}
              className="max-w-full max-h-[85dvh] object-contain rounded-2xl shadow-2xl"
              alt=""
            />
            {/* Nav */}
            {previewIndex > 0 && (
              <button onClick={(e) => { e.stopPropagation(); setPreviewIndex(i => i - 1); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 border border-white/15 flex items-center justify-center">
                <ArrowRight className="w-5 h-5 text-white" />
              </button>
            )}
            {previewIndex < photos.length - 1 && (
              <button onClick={(e) => { e.stopPropagation(); setPreviewIndex(i => i + 1); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 border border-white/15 flex items-center justify-center">
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
            )}
            <button onClick={() => setPreviewIndex(null)}
              className="absolute top-5 left-5 w-10 h-10 rounded-full bg-black/60 border border-white/15 flex items-center justify-center"
              style={{ top: `calc(1.25rem + env(safe-area-inset-top))` }}>
              <X className="w-4 h-4 text-white" />
            </button>
            {/* Dots */}
            <div className="absolute bottom-8 inset-x-0 flex justify-center gap-1.5">
              {photos.map((_, i) => (
                <div key={i} className={`rounded-full transition-all duration-200 ${i === previewIndex ? "w-5 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/25"}`} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}

// ── Reusable Bottom Sheet ──
function BottomSheet({ open, onClose, title, children }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
            className="fixed bottom-0 inset-x-0 bg-[#111111] border-t border-white/[0.07] rounded-t-[2rem] z-50 max-w-md mx-auto overflow-hidden"
            style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
          >
            <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mt-3.5 mb-4" />
            {title && <p className="text-white text-center font-black text-[13px] tracking-[0.2em] uppercase mb-4 px-5">{title}</p>}
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Form Field ──
function FormField({ label, error, children }) {
  return (
    <div>
      <p className="text-[10px] font-black text-white/30 tracking-[0.2em] uppercase mb-2">{label}</p>
      {children}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="text-red-400 text-xs mt-1.5 flex items-center gap-1.5"
          >
            <AlertCircle className="w-3 h-3 shrink-0" /> {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}