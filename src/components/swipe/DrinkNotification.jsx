import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export default function DrinkNotification({ show, sender, onAccept, onDecline, onClose }) {
  const [photoIndex, setPhotoIndex] = useState(0);
  
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 25000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  useEffect(() => {
    if (show && sender) {
      setPhotoIndex(0);
    }
  }, [show, sender]);

  const handleClose = (e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    onClose();
  };

  if (!show || !sender) return null;

  const photos = sender.photo_urls?.length > 0 ? sender.photo_urls : [sender.photo_url];
  
  const nextPhoto = () => {
    if (photoIndex < photos.length - 1) setPhotoIndex(photoIndex + 1);
  };

  const prevPhoto = () => {
    if (photoIndex > 0) setPhotoIndex(photoIndex - 1);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={handleClose} />

        {/* Notification card with profile */}
        <motion.div
          initial={{ scale: 0.85, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.85, y: 50 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="relative bg-[#1A1A1A] rounded-3xl overflow-hidden shadow-2xl border-2 border-[#D4AF37]/40 max-w-sm w-full"
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-3 left-3 z-50 w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition-all"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Drink emoji badge */}
          <motion.div
            className="absolute top-3 right-3 z-50 bg-[#D4AF37] rounded-full w-12 h-12 flex items-center justify-center text-2xl shadow-lg"
            animate={{ scale: [1, 1.15, 1], rotate: [0, 10, -10, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 1.5 }}
          >
            🍸
          </motion.div>

          {/* Photo viewer */}
          <div className="relative w-full aspect-[4/5] bg-[#0F0F0F]">
            {photos.map((url, i) => (
              <img
                key={i}
                src={url}
                alt={sender.first_name}
                className="absolute inset-0 w-full h-full object-cover"
                style={{
                  opacity: i === photoIndex ? 1 : 0,
                  transition: "opacity 0.3s ease",
                }}
              />
            ))}

            {/* Navigation arrows */}
            {photos.length > 1 && (
              <>
                {photoIndex > 0 && (
                  <button
                    onClick={prevPhoto}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-all z-10"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}
                {photoIndex < photos.length - 1 && (
                  <button
                    onClick={nextPhoto}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-all z-10"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}

                {/* Photo dots */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                  {photos.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 rounded-full transition-all ${
                        i === photoIndex ? "w-4 bg-[#D4AF37]" : "w-1 bg-white/40"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Gradient overlay */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/80 to-transparent" />

            {/* Name on photo */}
            <div className="absolute bottom-4 right-4 z-10">
              <h3 className="text-2xl font-black text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                {sender.first_name}, {sender.age}
              </h3>
            </div>
          </div>

          {/* Details section */}
          <div className="p-5 space-y-3">
            <div className="text-center mb-3">
              <p className="text-[#D4AF37] text-sm font-bold mb-1">✦ שלח/ה לך משקה! ✦</p>
              <p className="text-white/60 text-xs">מחכה לתשובה שלך 🥂</p>
            </div>

            {/* Quick info */}
            <div className="flex gap-3 text-xs text-white/60 justify-center">
              {sender.location && (
                <span className="flex items-center gap-1">
                  📍 {sender.location === "tel_aviv" ? "תל אביב" : sender.location === "south" ? "דרום" : "צפון"}
                </span>
              )}
              {sender.favorite_drink && (
                <span className="flex items-center gap-1">
                  🍸 {sender.favorite_drink}
                </span>
              )}
            </div>

            {/* Funny fact */}
            {sender.funny_fact && (
              <div className="bg-[#252525] rounded-xl p-3 border border-[#333]">
                <p className="text-white/80 text-sm leading-relaxed">
                  {sender.funny_fact.length > 100 
                    ? sender.funny_fact.substring(0, 100) + "..." 
                    : sender.funny_fact}
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={onDecline}
                variant="outline"
                className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20 py-5 text-base font-bold rounded-xl"
              >
                לא תודה
              </Button>
              <Button
                onClick={onAccept}
                className="flex-1 bg-gradient-to-r from-[#D4AF37] via-[#F5E6A3] to-[#D4AF37] text-[#0F0F0F] hover:opacity-90 py-5 text-base font-black rounded-xl shadow-lg"
              >
                אשמח! 🥂
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}