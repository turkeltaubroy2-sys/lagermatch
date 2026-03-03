import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, X, Share2 } from "lucide-react";
import QRCode from "@/components/QRCode";

const FLOATING_PARTICLES = [
  { emoji: "🔥", delay: 0, top: "8%", left: "8%" },
  { emoji: "✨", delay: 0.6, top: "18%", left: "78%" },
  { emoji: "💫", delay: 1.1, top: "35%", left: "5%" },
  { emoji: "❤️", delay: 0.3, top: "55%", left: "88%" },
  { emoji: "🍸", delay: 0.9, top: "72%", left: "12%" },
  { emoji: "⭐", delay: 1.4, top: "85%", left: "75%" },
];

export default function Home() {
  const [hasProfile, setHasProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkExistingProfile();
  }, []);

  const checkExistingProfile = async () => {
    try {
      const deviceId = getDeviceId();
      if (deviceId) {
        const profiles = await base44.entities.Profile.filter({ device_id: deviceId });
        if (profiles.length > 0 && !profiles[0].is_blocked) {
          navigate(createPageUrl("Swipe"));
          return;
        }
      }
    } catch (e) {
      console.error("Profile check error:", e);
    }
    setHasProfile(false);
    setLoading(false);
  };

  const getDeviceId = () => {
    let id = sessionStorage.getItem("wedding_device_id");
    if (!id) {
      id = localStorage.getItem("wedding_device_id");
      if (id) sessionStorage.setItem("wedding_device_id", id);
    }
    if (!id) {
      const match = document.cookie.match(/wedding_device_id=([^;]+)/);
      if (match) {
        id = match[1];
        localStorage.setItem("wedding_device_id", id);
        sessionStorage.setItem("wedding_device_id", id);
      }
    }
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("wedding_device_id", id);
      sessionStorage.setItem("wedding_device_id", id);
    }
    const isSecure = window.location.protocol === "https:";
    document.cookie = `wedding_device_id=${id}; max-age=94608000; path=/; SameSite=Lax${isSecure ? "; Secure" : ""}`;
    localStorage.setItem("wedding_device_id", id);
    sessionStorage.setItem("wedding_device_id", id);
    return id;
  };

  if (loading) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-[#0A0A0A]">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-4"
        >
          <Flame className="w-10 h-10 text-[#FE3C72]" />
          <p className="text-white/30 text-xs tracking-[0.3em] uppercase font-light"
            style={{ fontFamily: "var(--font-display)" }}>Loading…</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="h-[100dvh] flex flex-col items-center justify-center relative overflow-hidden"
      style={{
        background: "radial-gradient(ellipse at 60% 20%, #1a0810 0%, #0A0A0A 50%, #0a0d1a 100%)",
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* Aurora background layers */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(254,60,114,0.12) 0%, transparent 70%)",
            top: "-10%", right: "-15%",
          }}
          animate={{ scale: [1, 1.15, 0.95, 1], opacity: [0.6, 1, 0.5, 0.6] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute w-[400px] h-[400px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(212,175,55,0.10) 0%, transparent 70%)",
            bottom: "-5%", left: "-10%",
          }}
          animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        <motion.div
          className="absolute w-[300px] h-[300px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(130,60,200,0.08) 0%, transparent 70%)",
            top: "40%", left: "30%",
          }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {FLOATING_PARTICLES.map((p, i) => (
          <motion.span
            key={i}
            className="absolute text-xl select-none"
            style={{ top: p.top, left: p.left }}
            animate={{ y: [-10, 10, -10], rotate: [-8, 8, -8], opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 4 + i * 0.7, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
          >
            {p.emoji}
          </motion.span>
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center px-8 max-w-sm w-full">

        {/* Logo flame */}
        <motion.div
          animate={{ scale: [1, 1.12, 1], rotate: [-3, 3, -3] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="mb-6 inline-block"
          style={{ filter: "drop-shadow(0 0 20px rgba(254,60,114,0.5))" }}
        >
          <span className="text-6xl">🔥</span>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="mb-2"
        >
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(3rem, 14vw, 4.5rem)",
              fontWeight: 300,
              letterSpacing: "0.04em",
              lineHeight: 1.05,
            }}
          >
            <span
              style={{
                background: "linear-gradient(135deg, #FE3C72 0%, #FF8A5B 40%, #D4AF37 70%, #F5E6A3 100%)",
                backgroundSize: "200% 200%",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                animation: "text-shimmer 4s ease infinite",
              }}
            >
              Night
            </span>
            <span
              style={{
                background: "linear-gradient(135deg, #D4AF37 0%, #F5E6A3 50%, #D4AF37 100%)",
                backgroundSize: "200% 200%",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                animation: "text-shimmer 4s ease infinite 0.5s",
              }}
            >
              Matches
            </span>
          </h1>
        </motion.div>

        {/* Tagline */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          <p className="text-[10px] font-medium tracking-[0.45em] uppercase text-white/35 mb-2"
            style={{ fontFamily: "var(--font-body)" }}>
            ✦ Swipe · Drink · Match · Connect ✦
          </p>
        </motion.div>

        {/* Divider */}
        <motion.div
          className="mx-auto mb-10"
          style={{
            width: "60px", height: "1px",
            background: "linear-gradient(90deg, transparent, #D4AF37, transparent)",
          }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.6, duration: 1, ease: [0.16, 1, 0.3, 1] }}
        />

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.button
            onClick={() => setShowWelcome(true)}
            whileTap={{ scale: 0.97 }}
            className="w-full text-white font-bold uppercase tracking-[0.18em] rounded-2xl relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #FE3C72 0%, #E8245A 50%, #C01845 100%)",
              padding: "18px 32px",
              fontSize: "14px",
              fontFamily: "var(--font-body)",
              boxShadow: "0 8px 40px rgba(254,60,114,0.45), 0 2px 8px rgba(0,0,0,0.4)",
              animation: "pulse-glow 3s ease-in-out infinite",
            }}
          >
            {/* Shimmer overlay */}
            <span
              className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity"
              style={{
                background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.12) 50%, transparent 60%)",
                backgroundSize: "200% 100%",
              }}
            />
            <span className="relative flex items-center justify-center gap-2">
              <Flame className="w-4 h-4" />
              Join the Night
            </span>
          </motion.button>
        </motion.div>

        {/* Share button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.6 }}
          onClick={() => setShowQR(!showQR)}
          className="mt-5 flex items-center gap-2 mx-auto text-white/25 hover:text-white/50 transition-colors"
          style={{ fontSize: "11px", fontFamily: "var(--font-body)", fontWeight: 500, letterSpacing: "0.2em" }}
        >
          <Share2 className="w-3 h-3" />
          {showQR ? "Hide QR" : "Share with friends"}
        </motion.button>

        {/* QR Code */}
        <AnimatePresence>
          {showQR && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: "auto", marginTop: 24 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              className="flex flex-col items-center gap-3"
            >
              <div className="relative">
                <div className="absolute -inset-3 rounded-2xl blur-xl opacity-40"
                  style={{ background: "linear-gradient(135deg, #FE3C72, #D4AF37)" }} />
                <div className="relative bg-white p-4 rounded-2xl shadow-2xl">
                  <QRCode value={window.location.origin} size={140} />
                </div>
              </div>
              {/* Label below QR so it's never clipped */}
              <div className="text-[9px] font-bold px-3 py-1 rounded-full tracking-widest uppercase whitespace-nowrap text-[#0A0A0A] mt-1"
                style={{ background: "linear-gradient(135deg, #D4AF37, #F5E6A3)" }}>
                ✦ NightMatches ✦
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Welcome Modal */}
      <AnimatePresence>
        {showWelcome && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-end justify-center"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/75 backdrop-blur-md"
              onClick={() => setShowWelcome(false)}
            />
            <motion.div
              className="relative w-full max-w-md z-10 px-4 pb-4"
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 340 }}
            >
              {/* Glass card */}
              <div className="relative rounded-[2rem] overflow-hidden"
                style={{
                  background: "linear-gradient(160deg, rgba(30,15,25,0.98) 0%, rgba(15,10,20,0.99) 100%)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  boxShadow: "0 -20px 60px rgba(254,60,114,0.15), 0 0 0 1px rgba(255,255,255,0.05)",
                }}
              >
                {/* Top gradient bar */}
                <div className="h-[2px] w-full"
                  style={{ background: "linear-gradient(90deg, #FE3C72, #D4AF37, #FF8A5B)" }} />

                <div className="p-7">
                  {/* Close button */}
                  <button
                    onClick={() => setShowWelcome(false)}
                    className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center text-white/30 hover:text-white/70 transition-colors"
                    style={{ background: "rgba(255,255,255,0.06)" }}
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {/* Icon */}
                  <motion.div
                    className="text-5xl text-center mb-5"
                    animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.1, 1] }}
                    transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 2 }}
                  >
                    🎉
                  </motion.div>

                  {/* Title */}
                  <h2 className="text-center mb-3"
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "1.8rem",
                      fontWeight: 400,
                      letterSpacing: "0.04em",
                      background: "linear-gradient(135deg, #D4AF37, #F5E6A3, #D4AF37)",
                      backgroundSize: "200%",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                      animation: "text-shimmer 3s ease infinite",
                    }}
                  >
                    ברוכים הבאים ל-NightMatches 🔥
                  </h2>

                  <p className="text-center text-white/60 text-sm leading-relaxed mb-7"
                    style={{ fontFamily: "var(--font-body)", fontWeight: 400 }}
                  >
                    צרו פרופיל, החליקו ומצאו מישהו מיוחד הלילה.{" "}
                    <span className="text-[#D4AF37]">הלילה ארוך — תנצלו אותו.</span> 🍸
                  </p>

                  {/* Auto-delete notice */}
                  <div
                    className="mb-6 px-4 py-3 rounded-2xl text-center text-[12px] font-semibold leading-snug"
                    style={{
                      background: "linear-gradient(135deg, rgba(0,210,200,0.12), rgba(0,180,220,0.08))",
                      border: "1px solid rgba(0,210,200,0.25)",
                      color: "#00D4C8",
                      textShadow: "0 0 12px rgba(0,212,200,0.4)",
                    }}
                  >
                    ⚡ כל המשתמשים יימחקו אוטומטית בסוף האירוע
                  </div>

                  <Link to={createPageUrl("CreateProfile")} onClick={() => setShowWelcome(false)}>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      className="w-full rounded-2xl font-bold uppercase tracking-[0.2em] text-white"
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "13px",
                        padding: "16px",
                        background: "linear-gradient(135deg, #FE3C72 0%, #D4AF37 100%)",
                        boxShadow: "0 6px 30px rgba(254,60,114,0.4)",
                      }}
                    >
                      🚀 Let's Go
                    </motion.button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}