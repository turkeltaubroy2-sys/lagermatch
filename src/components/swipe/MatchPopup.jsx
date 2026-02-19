import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, Wine } from "lucide-react";

export default function MatchPopup({ show, matchProfile, myProfile, onClose, onSendDrink }) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  return (
    <AnimatePresence>
      {show && matchProfile && myProfile && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-sm text-center"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: "spring", damping: 15 }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="fixed top-6 left-6 text-white/50 hover:text-white z-[60]"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Fire emoji */}
            <motion.div
              className="text-7xl mb-4"
              animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              🔥
            </motion.div>

            <h2 className="text-4xl font-black shimmer-gold mb-2">
              יש התאמה!
            </h2>
            <p className="text-white/50 text-sm mb-2">
              לכו למצוא אחד את השנייה על הרחבה 💃🕺
            </p>
            <p className="text-white/20 text-xs mb-6">💍 רועי ויעל</p>

            {/* Both profiles */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <motion.div
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col items-center"
              >
                <div className="w-24 h-24 rounded-full overflow-hidden border-3 border-[#D4AF37] gold-glow mb-2">
                  <img
                    src={myProfile.photo_url}
                    alt={myProfile.first_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-white font-semibold text-sm">{myProfile.first_name}</p>
                <p className="text-white/40 text-xs">{myProfile.age}</p>
              </motion.div>

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
                className="text-3xl"
              >
                ❤️
              </motion.div>

              <motion.div
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col items-center"
              >
                <div className="w-24 h-24 rounded-full overflow-hidden border-3 border-[#D4AF37] gold-glow mb-2">
                  <img
                    src={matchProfile.photo_url}
                    alt={matchProfile.first_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-white font-semibold text-sm">{matchProfile.first_name}</p>
                <p className="text-white/40 text-xs">{matchProfile.age}</p>
              </motion.div>
            </div>

            <Button
              onClick={() => onSendDrink(matchProfile)}
              className="w-full py-6 text-lg font-bold rounded-2xl bg-gradient-to-r from-[#B8941F] via-[#D4AF37] to-[#F5E6A3] text-[#0F0F0F] hover:opacity-90 transition-all duration-300 mb-3"
            >
              <Wine className="w-5 h-5 ml-2" />
              🍸 שלח משקה
            </Button>

            <Button
              variant="ghost"
              onClick={onClose}
              className="w-full py-4 text-white/50 hover:text-white hover:bg-white/5"
            >
              המשך להחליק
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}