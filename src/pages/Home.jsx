import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import QRCode from "@/components/QRCode";

export default function Home() {
  const [hasProfile, setHasProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkExistingProfile();
  }, []);

  const checkExistingProfile = async () => {
    const deviceId = getDeviceId();
    const profiles = await base44.entities.Profile.filter({ device_id: deviceId });
    if (profiles.length > 0 && !profiles[0].is_blocked) {
      setHasProfile(true);
      navigate(createPageUrl("Swipe"));
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
          <Flame className="w-12 h-12 text-[#FE3C72]" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center px-6 bg-[#0F0F0F] relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-64 h-64 bg-[#FE3C72]/8 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-72 h-72 bg-[#D4AF37]/6 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#FF6B9D]/4 rounded-full blur-3xl" />
        {["🍸", "🔥", "✨", "💫", "🎶", "❤️"].map((emoji, i) => (
          <motion.div
            key={i}
            className="absolute text-2xl"
            style={{
              top: `${10 + i * 14}%`,
              left: `${5 + (i % 3) * 40}%`,
            }}
            animate={{
              y: [-15, 15, -15],
              rotate: [0, 15, -15, 0],
              opacity: [0.15, 0.4, 0.15],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.4,
            }}
          >
            {emoji}
          </motion.div>
        ))}
      </div>

      <motion.div
        className="relative z-10 text-center max-w-md w-full"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <motion.div
          className="text-6xl mb-4"
          animate={{ scale: [1, 1.15, 1], rotate: [-5, 5, -5] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        >
          🍸
        </motion.div>

        <h1 className="text-5xl font-black mb-2 flex items-center justify-center gap-2">
          <span className="bg-gradient-to-r from-[#FE3C72] via-[#FF6B9D] to-[#FF8A5B] bg-clip-text text-transparent">Night</span>
          <span className="bg-gradient-to-r from-[#D4AF37] via-[#F5E6A3] to-[#D4AF37] bg-clip-text text-transparent">Match</span>
        </h1>

        <motion.div
          className="w-24 h-[2px] bg-gradient-to-r from-[#FE3C72] via-[#D4AF37] to-[#FE3C72] mx-auto mb-5"
          initial={{ width: 0 }}
          animate={{ width: 96 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        />

        <p className="text-xl font-bold text-white mb-1">
          🔥 הערב הזה לא נשכח
        </p>
        <p className="text-sm text-white/50 mb-8 leading-relaxed">
          מצא/י את מי שתמצא/י הלילה 😉
        </p>

        <Link to={createPageUrl("CreateProfile")}>
          <Button
            className="w-full py-7 text-xl font-black rounded-2xl bg-gradient-to-r from-[#FE3C72] via-[#FF6B9D] to-[#FF8A5B] text-white hover:opacity-90 transition-all duration-300 shadow-2xl shadow-[#FE3C72]/30"
          >
            🚀 אני פנוי/ה הערב
          </Button>
        </Link>

        {showQR && (
          <motion.div
            className="mt-8 pt-8 border-t border-white/20 flex flex-col items-center"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-sm text-white/60 mb-4">סרוק כדי להצטרף</p>
            <div className="bg-white p-3 rounded-xl">
              <QRCode value={window.location.origin} size={150} />
            </div>
          </motion.div>
        )}

        <Button
          onClick={() => setShowQR(!showQR)}
          variant="outline"
          className="mt-6 border-[#FE3C72]/40 text-[#FF6B9D] hover:bg-[#FE3C72]/10 rounded-xl text-sm"
        >
          {showQR ? "הסתר QR" : "📱 שתף עם חברים"}
        </Button>
        </motion.div>
        </div>
        );
        }