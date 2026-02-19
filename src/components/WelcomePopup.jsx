import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export default function WelcomePopup() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const seen = sessionStorage.getItem("welcome_seen");
    if (!seen) {
      const t = setTimeout(() => setShow(true), 600);
      return () => clearTimeout(t);
    }
  }, []);

  const handleClose = () => {
    setShow(false);
    sessionStorage.setItem("welcome_seen", "1");
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Card */}
          <motion.div
            className="relative w-full max-w-sm z-10"
            initial={{ scale: 0.75, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 18, stiffness: 260 }}
          >
            {/* Glow */}
            <div className="absolute -inset-1 bg-gradient-to-br from-[#FE3C72]/40 via-[#D4AF37]/30 to-[#FF6B9D]/40 rounded-[2rem] blur-xl opacity-70" />

            <div className="relative bg-gradient-to-br from-[#1A1A1A] to-[#111] border border-white/10 rounded-[1.75rem] p-7 shadow-2xl overflow-hidden">
              {/* Decorative top gradient bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FE3C72] via-[#D4AF37] to-[#FF6B9D] rounded-t-[1.75rem]" />

              {/* Close */}
              <button
                onClick={handleClose}
                className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Emoji */}
              <motion.div
                className="text-6xl text-center mb-5 mt-1"
                animate={{ rotate: [0, 10, -10, 10, 0], scale: [1, 1.15, 1] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1.5 }}
              >
                🎉
              </motion.div>

              {/* Title */}
              <h2
                className="text-center text-2xl font-black mb-3 bg-gradient-to-r from-[#D4AF37] via-[#F5E6A3] to-[#D4AF37] bg-clip-text text-transparent"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                היי! איזה כיף שהצטרפתם
              </h2>

              {/* Body */}
              <p className="text-center text-white/70 text-[15px] leading-relaxed mb-6 font-hebrew">
                האפליקציה תהיה פעילה לאורך הערב ואז תמחק לחלוטין —{" "}
                <span className="text-[#D4AF37] font-semibold">תנצלו כל רגע!</span>{" "}
                😊
              </p>

              {/* CTA */}
              <button
                onClick={handleClose}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#FE3C72] via-[#FF4D6D] to-[#FF8A5B] text-white font-black text-base tracking-wide shadow-[0_6px_30px_rgba(254,60,114,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                בואו נתחיל 🚀
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}