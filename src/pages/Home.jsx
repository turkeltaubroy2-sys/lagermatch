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
      const match = document.cookie.match(/wedding_device_id=([^;]+)/);
      if (match) {
        id = match[1];
        localStorage.setItem("wedding_device_id", id);
      }
    }

    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("wedding_device_id", id);
    }

    // Always keep cookie in sync (1 year expiry)
    document.cookie = `wedding_device_id=${id}; max-age=31536000; path=/; SameSite=Lax`;
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

        {/* Lager & Ale logo-style title */}
        <div className="mb-1">
          <h1 className="font-display text-5xl font-black tracking-tight leading-none"
            style={{ fontFamily: "'Playfair Display', serif", letterSpacing: "0.05em" }}
          >
            <span className="bg-gradient-to-r from-[#D4AF37] via-[#F5E6A3] to-[#D4AF37] bg-clip-text text-transparent">LAGER</span>
            <span className="text-white/80 mx-1 text-4xl">&amp;</span>
            <span className="bg-gradient-to-r from-[#D4AF37] via-[#F5E6A3] to-[#D4AF37] bg-clip-text text-transparent">ALE</span>
          </h1>
          <p className="text-[10px] font-bold tracking-[0.5em] uppercase text-white/30 mt-1">EDITION</p>
        </div>

        <p className="text-[10px] font-semibold tracking-[0.35em] uppercase text-white/30 mb-5 mt-2">
          Bar · Vibe · Connect
        </p>

        <motion.div
          className="w-16 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mx-auto mb-6"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        />

        <div className="mb-9" />

        <Link to={createPageUrl("CreateProfile")}>
          <Button
            className="w-full py-7 text-lg font-black rounded-3xl bg-gradient-to-r from-[#FE3C72] via-[#FF4D6D] to-[#FF8A5B] text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-[0_8px_40px_rgba(254,60,114,0.45)] tracking-wide border-0"
          >
            🚀 אני פנוי/ה הערב
          </Button>
        </Link>

        {showQR && (
          <motion.div
            className="mt-8 pt-6 border-t border-white/10 flex flex-col items-center gap-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-white/30">
              שתף עם חברים
            </p>
            <div className="relative">
              <div className="absolute -inset-3 bg-gradient-to-r from-[#FE3C72] via-[#D4AF37] to-[#FF6B9D] rounded-3xl blur-xl opacity-40 animate-pulse" />
              <div className="relative bg-white p-4 rounded-2xl shadow-2xl">
                <QRCode value={window.location.origin} size={160} />
              </div>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#FE3C72] to-[#D4AF37] text-white text-[10px] font-black px-4 py-1 rounded-full shadow-lg whitespace-nowrap tracking-widest uppercase">
                NightMatch 🍸
              </div>
            </div>
          </motion.div>
        )}

        <button
          onClick={() => setShowQR(!showQR)}
          className="mt-6 text-[11px] font-semibold tracking-[0.2em] uppercase text-white/25 hover:text-white/50 transition-colors"
        >
          {showQR ? "הסתר QR" : "📱 שתף עם חברים"}
        </button>
        </motion.div>
        </div>
        );
        }