import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, MessageCircle, Wine } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProfileModal({ profile, myProfile, onClose, onSendDrink, canChat, onGoToChat }) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const photos = profile?.photo_urls?.length > 0 ? profile.photo_urls : [profile?.photo_url];

  useEffect(() => {
    if (!profile) return;
    // Preload all photos
    photos.forEach(url => {
      if (url) {
        const img = new Image();
        img.src = url;
      }
    });
  }, [profile]);

  if (!profile) return null;

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
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="relative w-full max-w-lg bg-[#1A1A1A] rounded-t-[2rem] sm:rounded-[2rem] overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
          style={{ maxHeight: "min(90vh, 800px)" }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 left-4 z-50 w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Photo viewer */}
          <div className="relative w-full bg-[#0F0F0F]" style={{ height: "45vh", maxHeight: 280 }}>
            {/* Photos */}
            {photos.map((url, i) => (
              <img
                key={i}
                src={url}
                alt={profile.first_name}
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
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-all z-10"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                )}
                {photoIndex < photos.length - 1 && (
                  <button
                    onClick={nextPhoto}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-all z-10"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                )}

                {/* Photo dots */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                  {photos.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 rounded-full transition-all ${
                        i === photoIndex
                          ? "w-6 bg-[#D4AF37]"
                          : "w-1.5 bg-white/40"
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
    </AnimatePresence>
  );
}