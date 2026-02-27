import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageCircle, Wine } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProfileModal({ profile, myProfile, onClose, onSendDrink, canChat, onGoToChat }) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const [closing, setClosing] = useState(false);
  const dragStartX = useRef(null);
  const photos = profile?.photo_urls?.length > 0 ? profile.photo_urls : [profile?.photo_url];

  useEffect(() => {
    if (!profile) return;
    setPhotoIndex(0);
    photos.forEach(url => {
      if (url) { const img = new Image(); img.src = url; }
    });
  }, [profile]);

  if (!profile) return null;

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => { setClosing(false); onClose(); }, 350);
  };

  const handlePhotoDragStart = (e) => {
    dragStartX.current = e.touches ? e.touches[0].clientX : e.clientX;
  };

  const handlePhotoDragEnd = (e) => {
    if (dragStartX.current === null) return;
    const endX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const diff = dragStartX.current - endX;
    if (Math.abs(diff) > 40) {
      if (diff > 0 && photoIndex < photos.length - 1) setPhotoIndex(i => i + 1);
      if (diff < 0 && photoIndex > 0) setPhotoIndex(i => i - 1);
    }
    dragStartX.current = null;
  };

  const handlePhotoTap = (e) => {
    if (photos.length <= 1) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const tapX = e.clientX - rect.left;
    if (tapX > rect.width / 2) setPhotoIndex(i => Math.min(i + 1, photos.length - 1));
    else setPhotoIndex(i => Math.max(i - 1, 0));
  };

  return (
    <AnimatePresence>
      {!closing && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
          onClick={handleClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "120%", opacity: 0, scale: 0.92 }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="relative w-full max-w-lg bg-[#1A1A1A] rounded-t-[2rem] sm:rounded-[2rem] overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
          style={{ maxHeight: "min(90vh, 800px)" }}
        >
          {/* Close button */}
          <motion.button
            onClick={handleClose}
            whileTap={{ scale: 0.8, rotate: 90 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="absolute top-4 left-4 z-50 w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition-all"
          >
            <X className="w-5 h-5" />
          </motion.button>

          {/* Photo viewer */}
          <div
            className="relative w-full bg-[#0F0F0F] select-none"
            style={{ height: "45vh", maxHeight: 280 }}
            onTouchStart={handlePhotoDragStart}
            onTouchEnd={handlePhotoDragEnd}
            onMouseDown={handlePhotoDragStart}
            onMouseUp={handlePhotoDragEnd}
            onClick={handlePhotoTap}
          >
            {/* Photos */}
            {photos.map((url, i) => (
              <img
                key={i}
                src={url}
                alt={profile.first_name}
                className="absolute inset-0 w-full h-full object-cover"
                draggable={false}
                style={{
                  opacity: i === photoIndex ? 1 : 0,
                  transition: "opacity 0.25s ease",
                }}
              />
            ))}

            {/* Progress bars instead of arrows */}
            {photos.length > 1 && (
              <>
                <div className="absolute top-3 left-3 right-3 flex gap-1 z-10">
                  {photos.map((_, i) => (
                    <div key={i} className="flex-1 h-[3px] rounded-full bg-white/25 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-white/90"
                        animate={{ scaleX: i <= photoIndex ? 1 : 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ transformOrigin: "left" }}
                      />
                    </div>
                  ))}
                </div>

                {/* Photo dots */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                  {photos.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 rounded-full transition-all ${
                        i === photoIndex ? "w-6 bg-[#D4AF37]" : "w-1.5 bg-white/40"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Gradient overlay at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/80 to-transparent" />

            {/* Name & age on photo */}
            <div className="absolute bottom-6 right-6 z-10">
              <h2 className="text-3xl font-black text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                {profile.first_name}, {profile.age}
              </h2>
            </div>
          </div>

          {/* Details section */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Location */}
            {profile.location && (
              <div className="flex items-center gap-2">
                <span className="text-2xl">📍</span>
                <span className="text-white/70 text-sm">
                  {profile.location === "tel_aviv" ? "תל אביב" : 
                   profile.location === "south" ? "דרום" : 
                   profile.location === "north" ? "צפון" : profile.location}
                </span>
              </div>
            )}

            {/* Favorite drink */}
            {profile.favorite_drink && (
              <div className="flex items-center gap-2">
                <span className="text-2xl">🍸</span>
                <span className="text-white/70 text-sm">{profile.favorite_drink}</span>
              </div>
            )}

            {/* Funny fact */}
            {profile.funny_fact && (
              <div className="bg-[#252525] rounded-2xl p-4 border border-[#333]">
                <p className="text-sm text-[#D4AF37]/60 uppercase tracking-widest mb-2 font-bold">
                  ✦ About
                </p>
                <p className="text-white/90 leading-relaxed text-base">
                  {profile.funny_fact}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              {canChat ? (
                <Button
                  onClick={() => {
                    onClose();
                    if (onGoToChat) onGoToChat(profile.id);
                  }}
                  className="flex-1 py-6 text-lg font-black rounded-2xl bg-gradient-to-r from-[#D4AF37] via-[#F5E6A3] to-[#D4AF37] text-[#0F0F0F] hover:opacity-90 transition-all shadow-lg"
                >
                  <MessageCircle className="w-5 h-5 ml-2" />
                  💬 התחל צ'אט
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    onSendDrink(profile);
                    onClose();
                  }}
                  className="flex-1 py-6 text-lg font-black rounded-2xl bg-gradient-to-r from-[#FE3C72] via-[#FF6B9D] to-[#FF8A5B] text-white hover:opacity-90 transition-all shadow-lg"
                >
                  <Wine className="w-5 h-5 ml-2" />
                  🍸 שלח משקה
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  );
}