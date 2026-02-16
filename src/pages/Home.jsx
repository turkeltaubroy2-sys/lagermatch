import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Heart, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [hasProfile, setHasProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkExistingProfile();
  }, []);

  const checkExistingProfile = async () => {
    const deviceId = getDeviceId();
    const profiles = await base44.entities.Profile.filter({ device_id: deviceId });
    if (profiles.length > 0 && !profiles[0].is_blocked) {
      setHasProfile(true);
      window.location.href = createPageUrl("Swipe");
      return;
    }
    setHasProfile(false);
    setLoading(false);
  };

  const getDeviceId = () => {
    let id = localStorage.getItem("wedding_device_id");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("wedding_device_id", id);
    }
    return id;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F0F0F]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Heart className="w-12 h-12 text-[#D4AF37]" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-[#0F0F0F] relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-80 h-80 bg-[#D4AF37]/3 rounded-full blur-3xl" />
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-[#D4AF37]/20"
            style={{
              top: `${15 + i * 15}%`,
              left: `${10 + (i % 3) * 35}%`,
            }}
            animate={{
              y: [-20, 20, -20],
              rotate: [0, 10, -10, 0],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              delay: i * 0.5,
            }}
          >
            <Sparkles className="w-6 h-6" />
          </motion.div>
        ))}
      </div>

      <motion.div
        className="relative z-10 text-center max-w-md"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <motion.div
          className="text-6xl mb-6"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          💍
        </motion.div>

        <h1 className="text-5xl font-black mb-3 shimmer-gold">
          Match לחתונה
        </h1>

        <motion.div
          className="w-24 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mx-auto mb-6"
          initial={{ width: 0 }}
          animate={{ width: 96 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        />

        <p className="text-lg text-white/60 mb-2 leading-relaxed">
          רווקים בלבד.
        </p>
        <p className="text-lg text-white/60 mb-10 leading-relaxed">
          בואו נעשה את הערב הזה בלתי נשכח 😉
        </p>

        <Link to={createPageUrl("CreateProfile")}>
          <Button
            className="w-full py-7 text-xl font-bold rounded-2xl bg-gradient-to-r from-[#B8941F] via-[#D4AF37] to-[#F5E6A3] text-[#0F0F0F] hover:opacity-90 transition-all duration-300 shadow-lg shadow-[#D4AF37]/20 gold-glow"
          >
            ✨ צור פרופיל
          </Button>
        </Link>

        <p className="text-xs text-white/30 mt-6">
          ❤️ בברכה מאיתי ויעל
        </p>
      </motion.div>
    </div>
  );
}