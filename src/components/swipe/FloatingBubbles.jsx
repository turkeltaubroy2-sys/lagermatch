import React, { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wine, MessageCircle, X, Heart } from "lucide-react";

// ─── Physics Engine ──────────────────────────────────────────────────────────
function useBubblePhysics(count, containerW, containerH, bubbleSize) {
  const stateRef = useRef([]);
  const rafRef = useRef(null);
  const [positions, setPositions] = useState([]);

  useEffect(() => {
    if (containerW === 0 || containerH === 0 || count === 0) return;

    const radius = bubbleSize / 2;
    const margin = radius + 4;

    // Initialize bubbles with random position + velocity
    stateRef.current = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: margin + Math.random() * (containerW - bubbleSize - margin * 2),
      y: margin + Math.random() * (containerH - bubbleSize - margin * 2),
      vx: (Math.random() - 0.5) * 0.7, // slow leisurely drift
      vy: (Math.random() - 0.5) * 0.7,
    }));

    const tick = () => {
      const state = stateRef.current;
      let changed = false;

      for (let i = 0; i < state.length; i++) {
        const b = state[i];
        b.x += b.vx;
        b.y += b.vy;

        // Bounce off walls
        if (b.x <= 0) { b.x = 0; b.vx = Math.abs(b.vx); }
        if (b.x >= containerW - bubbleSize) { b.x = containerW - bubbleSize; b.vx = -Math.abs(b.vx); }
        if (b.y <= 0) { b.y = 0; b.vy = Math.abs(b.vy); }
        if (b.y >= containerH - bubbleSize) { b.y = containerH - bubbleSize; b.vy = -Math.abs(b.vy); }

        // Very gentle separation to avoid permanent overlap
        for (let j = i + 1; j < state.length; j++) {
          const b2 = state[j];
          const dx = b2.x - b.x;
          const dy = b2.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = bubbleSize * 0.95;
          if (dist < minDist && dist > 0) {
            const push = (minDist - dist) / minDist * 0.02;
            const nx = dx / dist;
            const ny = dy / dist;
            b.vx -= nx * push;
            b.vy -= ny * push;
            b2.vx += nx * push;
            b2.vy += ny * push;
          }
        }

        // Small random drift to keep things lively
        b.vx += (Math.random() - 0.5) * 0.01;
        b.vy += (Math.random() - 0.5) * 0.01;

        // Speed clamp
        const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
        if (speed > 1.2) { b.vx *= 0.92; b.vy *= 0.92; }
        if (speed < 0.15) { b.vx += (Math.random() - 0.5) * 0.08; b.vy += (Math.random() - 0.5) * 0.08; }

        changed = true;
      }

      if (changed) {
        setPositions(state.map(b => ({ id: b.id, x: b.x, y: b.y })));
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [count, containerW, containerH, bubbleSize]);

  return positions;
}

// ─── Profile Preview Sheet ───────────────────────────────────────────────────
function ProfileSheet({ profile, compatibility, isMatch, onClose, onSendDrink, onGoToChat }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      />

      {/* Sheet */}
      <motion.div
        className="relative w-full max-w-md z-10 px-3 pb-3"
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 30, stiffness: 380 }}
      >
        <div
          className="rounded-[2rem] overflow-hidden"
          style={{
            background: "linear-gradient(165deg, rgba(26,15,20,0.99) 0%, rgba(12,8,16,0.99) 100%)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 -20px 60px rgba(254,60,114,0.12), 0 0 0 1px rgba(255,255,255,0.04)",
          }}
        >
          {/* Top gradient line */}
          <div className="h-[2px]" style={{ background: "linear-gradient(90deg, #FE3C72, #D4AF37, #FF8A5B)" }} />

          {/* Photo */}
          <div className="relative h-52 overflow-hidden">
            <img
              src={profile.photo_url}
              alt={profile.first_name}
              className="w-full h-full object-cover"
            />
            {/* Photo gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent" />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}
            >
              <X className="w-4 h-4 text-white/80" />
            </button>

            {/* Compatibility badge */}
            <div
              className="absolute top-3 left-3 flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold"
              style={{
                background: "linear-gradient(135deg, #D4AF37, #F5E6A3)",
                color: "#0A0A0A",
              }}
            >
              ✨ {compatibility}% match
            </div>

            {/* Name over photo */}
            <div className="absolute bottom-4 left-5 right-5">
              <h2
                className="text-white text-2xl font-bold leading-none mb-1"
                style={{ textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}
              >
                {profile.first_name}
                {isMatch && (
                  <span className="ml-2 text-lg">❤️</span>
                )}
              </h2>
              <p className="text-white/60 text-sm">
                {profile.age} •{" "}
                {profile.location === "tel_aviv" ? "תל אביב" :
                  profile.location === "south" ? "דרום" :
                    profile.location === "north" ? "צפון" :
                      profile.location || ""}
              </p>
            </div>
          </div>

          {/* Info */}
          <div className="px-5 py-4 space-y-3">
            {profile.favorite_drink && (
              <div className="flex items-center gap-2">
                <span className="text-lg">🍸</span>
                <span className="text-white/70 text-sm">{profile.favorite_drink}</span>
              </div>
            )}
            {profile.funny_fact && (
              <p className="text-white/50 text-sm leading-relaxed border-t border-white/6 pt-3">
                {profile.funny_fact}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="px-5 pb-5 flex gap-2">
            {isMatch ? (
              <button
                onClick={onGoToChat}
                className="flex-1 py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 text-white"
                style={{
                  background: "linear-gradient(135deg, #FE3C72, #D4AF37)",
                  boxShadow: "0 6px 24px rgba(254,60,114,0.35)",
                  fontFamily: "var(--font-body)",
                }}
              >
                <MessageCircle className="w-4 h-4" />
                פתח צ׳אט
              </button>
            ) : (
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={onSendDrink}
                className="flex-1 py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 text-[#0A0A0A]"
                style={{
                  background: "linear-gradient(135deg, #D4AF37, #F5E6A3, #D4AF37)",
                  boxShadow: "0 6px 24px rgba(212,175,55,0.4)",
                  fontFamily: "var(--font-body)",
                }}
              >
                <Wine className="w-4 h-4" />
                שלח משקה 🥂
              </motion.button>
            )}
            <button
              onClick={onClose}
              className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <X className="w-4 h-4 text-white/40" />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Per-bubble Photo Cycler ─────────────────────────────────────────────────
function usePhotoCycler(profiles) {
  const [photoIndexes, setPhotoIndexes] = useState({});

  useEffect(() => {
    if (!profiles.length) return;
    // Initialize all to 0
    const init = {};
    profiles.forEach(p => { init[p.id] = 0; });
    setPhotoIndexes(init);

    const interval = setInterval(() => {
      setPhotoIndexes(prev => {
        const next = { ...prev };
        profiles.forEach(p => {
          const photos = p.photo_urls?.length > 1 ? p.photo_urls : null;
          if (photos) {
            next[p.id] = (prev[p.id] + 1) % photos.length;
          }
        });
        return next;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [profiles]);

  const getPhoto = (profile) => {
    const photos = profile.photo_urls?.length ? profile.photo_urls : (profile.photo_url ? [profile.photo_url] : []);
    const idx = photoIndexes[profile.id] ?? 0;
    return { current: photos[idx] || profile.photo_url, all: photos };
  };

  return getPhoto;
}

export default function FloatingBubbles({ profiles, calculateCompatibility, isMatch, onSelect, onSendDrink, onGoToChat }) {
  const containerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  const [selected, setSelected] = useState(null);  // { profile, compatibility }
  const [poppingId, setPoppingId] = useState(null); // bubble currently popping

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setContainerSize({ w: el.offsetWidth, h: el.offsetHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const BUBBLE_SIZE = containerSize.w > 0 ? Math.min(Math.floor(containerSize.w / 3.8), 110) : 90;
  const positions = useBubblePhysics(profiles.length, containerSize.w, containerSize.h, BUBBLE_SIZE);
  const getPhoto = usePhotoCycler(profiles);

  const handleBubbleClick = useCallback((profile) => {
    // Trigger pop animation, then open sheet
    setPoppingId(profile.id);
    setTimeout(() => {
      setPoppingId(null);
      const compatibility = calculateCompatibility(profile);
      setSelected({ profile, compatibility });
    }, 320);
  }, [calculateCompatibility]);

  const handleSendDrink = useCallback(() => {
    if (!selected) return;
    onSendDrink?.(selected.profile);
    setSelected(null);
  }, [selected, onSendDrink]);

  const handleGoToChat = useCallback(() => {
    if (!selected) return;
    onGoToChat?.(selected.profile.id);
    setSelected(null);
  }, [selected, onGoToChat]);

  return (
    <>
      <div ref={containerRef} className="absolute inset-0 overflow-hidden">
        {containerSize.w > 0 && positions.length === profiles.length && profiles.map((profile, index) => {
          const pos = positions[index] || { x: 0, y: 0 };
          const compatibility = calculateCompatibility(profile);
          const isPopping = poppingId === profile.id;
          const { current: photoSrc, all: allPhotos } = getPhoto(profile);

          return (
            <motion.div
              key={profile.id}
              className="absolute"
              style={{
                left: pos.x,
                top: pos.y,
                width: BUBBLE_SIZE,
                height: BUBBLE_SIZE,
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: 1,
                scale: isPopping ? [1, 1.35, 0.9, 1.15, 0] : 1,
              }}
              transition={
                isPopping
                  ? { duration: 0.32, ease: [0.36, 0.07, 0.19, 0.97] }
                  : { opacity: { duration: 0.4, delay: index * 0.04 }, scale: { duration: 0.4, type: "spring" } }
              }
            >
              {/* Compatibility badge */}
              <div
                className="absolute -top-4 left-1/2 -translate-x-1/2 z-10 px-2 py-0.5 rounded-full text-[9px] font-black shadow-lg whitespace-nowrap"
                style={{
                  background: "linear-gradient(135deg, #D4AF37, #F5E6A3)",
                  color: "#0A0A0A",
                }}
              >
                {compatibility}% ✨
              </div>

              {/* Bubble */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => !isPopping && handleBubbleClick(profile)}
                className="relative w-full h-full rounded-full overflow-hidden"
                style={{
                  border: isMatch(profile.id)
                    ? "2.5px solid #FE3C72"
                    : "2px solid rgba(212,175,55,0.45)",
                  boxShadow: isMatch(profile.id)
                    ? "0 0 20px rgba(254,60,114,0.35), 0 4px 20px rgba(0,0,0,0.4)"
                    : "0 0 16px rgba(212,175,55,0.15), 0 4px 20px rgba(0,0,0,0.35)",
                  background: "#1A1A1A",
                }}
              >
                <motion.img
                  key={photoSrc}
                  src={photoSrc}
                  alt={profile.first_name}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading={index < 6 ? "eager" : "lazy"}
                  decoding="async"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                />

                {/* Multi-photo dots */}
                {allPhotos.length > 1 && (
                  <div className="absolute top-1 left-0 right-0 flex justify-center gap-0.5 z-10">
                    {allPhotos.map((_, i) => (
                      <div
                        key={i}
                        className="rounded-full transition-all"
                        style={{
                          width: photoSrc === allPhotos[i] ? 6 : 3,
                          height: 3,
                          background: photoSrc === allPhotos[i]
                            ? "rgba(212,175,55,0.95)"
                            : "rgba(255,255,255,0.35)",
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                {/* Sheen on hover */}
                <motion.div
                  className="absolute inset-0 opacity-0 pointer-events-none"
                  whileHover={{ opacity: 1 }}
                  style={{
                    background: "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 60%)",
                  }}
                />

                {/* Name */}
                <div className="absolute bottom-1.5 left-0 right-0 text-center px-1">
                  <p className="text-white text-[10px] font-semibold truncate leading-tight drop-shadow-lg">
                    {profile.first_name}
                  </p>
                </div>

                {/* Match indicator */}
                {isMatch(profile.id) && (
                  <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[#FE3C72] flex items-center justify-center text-[9px] shadow-lg">
                    ❤️
                  </div>
                )}

                {/* Ripple ring on pop */}
                {isPopping && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-[#D4AF37]"
                    initial={{ scale: 1, opacity: 0.8 }}
                    animate={{ scale: 2.5, opacity: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  />
                )}
              </motion.button>
            </motion.div>
          );
        })}
      </div>

      {/* Profile Preview Sheet */}
      <AnimatePresence>
        {selected && (
          <ProfileSheet
            key={selected.profile.id}
            profile={selected.profile}
            compatibility={selected.compatibility}
            isMatch={isMatch(selected.profile.id)}
            onClose={() => setSelected(null)}
            onSendDrink={handleSendDrink}
            onGoToChat={handleGoToChat}
          />
        )}
      </AnimatePresence>
    </>
  );
}