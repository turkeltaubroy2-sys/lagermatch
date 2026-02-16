import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export default function DrinkNotification({ show, senderName, onAccept, onDecline, onClose }) {
  if (!show) return null;

  const handleClose = (e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    onClose();
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="drink-notif"
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm px-4 pb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="w-full max-w-sm bg-[#1A1A1A] border border-[#D4AF37]/30 rounded-3xl p-6 relative"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 20 }}
          onClick={(e) => e.stopPropagation()}
          dir="rtl"
        >
          <button
            onClick={handleClose}
            className="absolute top-4 left-4 text-white/40 hover:text-white transition-colors z-20 w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-95"
            type="button"
          >
            <X className="w-6 h-6" />
          </button>
            <div className="text-5xl mb-3 text-center">🍸</div>
            <h3 className="text-xl font-bold text-white mb-1 text-center">
              מישהו רוצה לשלוח לך משקה 😉
            </h3>
            {senderName && (
              <p className="text-[#D4AF37] text-sm mb-5 text-center">{senderName}</p>
            )}

            <div className="flex gap-3" dir="rtl">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onAccept();
                }}
                className="flex-1 py-5 rounded-xl bg-gradient-to-r from-[#B8941F] via-[#D4AF37] to-[#F5E6A3] text-[#0F0F0F] font-bold"
              >
                יאללה, שיבוא! 🎉
              </Button>
              <Button
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onDecline();
                }}
                className="flex-1 py-5 rounded-xl border border-[#333] text-white/60 hover:bg-[#252525]"
              >
                אולי אחר כך
              </Button>
            </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}