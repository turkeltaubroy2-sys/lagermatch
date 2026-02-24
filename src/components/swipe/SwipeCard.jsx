import React, { memo, useState, useRef, useEffect } from "react";
import { motion, useMotionValue, useTransform, useSpring, animate } from "framer-motion";

const SwipeCard = memo(({ profile, onSwipe, isTop }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const [photoIndex, setPhotoIndex] = useState(0);
  const isDragging = useRef(false);
  const hasSwiped = useRef(false);

  const photos = profile.photo_urls?.length > 0 ? profile.photo_urls : [profile.photo_url];

  // Preload all photos of this profile
  useEffect(() => {
    photos.forEach(url => {
      if (url) {
        const img = new Image();
        img.src = url;
      }
    });
  }, [profile.id]);

  // Smooth spring for rotation
  const rotateRaw = useTransform(x, [-280, 280], [-22, 22]);
  const rotate = useSpring(rotateRaw, { stiffness: 180, damping: 28 });

  // Scale down slightly while dragging
  const scale = useTransform(x, [-150, 0, 150], [0.97, 1, 0.97]);

  // Like/Nope opacity with smooth spring
  const likeOpacityRaw = useTransform(x, [20, 120], [0, 1]);
  const nopeOpacityRaw = useTransform(x, [-120, -20], [1, 0]);
  const likeOpacity = useSpring(likeOpacityRaw, { stiffness: 200, damping: 25 });
  const nopeOpacity = useSpring(nopeOpacityRaw, { stiffness: 200, damping: 25 });

  // Dynamic gradient overlay based on swipe direction
  const likeGradient = useTransform(x, [0, 150], ["rgba(16,185,129,0)", "rgba(16,185,129,0.15)"]);
  const nopeGradient = useTransform(x, [-150, 0], ["rgba(239,68,68,0.15)", "rgba(239,68,68,0)"]);

  const handleDragStart = () => {
    isDragging.current = true;
  };

  const handleDragEnd = (_, info) => {
    isDragging.current = false;

    const velocity = info.velocity.x;
    const offset = info.offset.x;

    // Trigger swipe on threshold (velocity OR distance)
    if (offset > 100 || velocity > 500) {
      if (hasSwiped.current) return;
      hasSwiped.current = true;
      // Flick out to the right
      animate(x, 700, { type: "spring", stiffness: 300, damping: 30 });
      setTimeout(() => onSwipe(true), 150);
    } else if (offset < -100 || velocity < -500) {
      if (hasSwiped.current) return;
      hasSwiped.current = true;
      // Flick out to the left
      animate(x, -700, { type: "spring", stiffness: 300, damping: 30 });
      setTimeout(() => onSwipe(false), 150);
    } else {
      // Snap back with spring
      animate(x, 0, { type: "spring", stiffness: 400, damping: 35 });
      animate(y, 0, { type: "spring", stiffness: 400, damping: 35 });
    }
  };

  const handleTap = (e) => {
    if (isDragging.current) return;
    if (photos.length <= 1) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const tapX = e.clientX - rect.left;
    if (tapX > rect.width / 2) {
      setPhotoIndex(i => Math.min(i + 1, photos.length - 1));
    } else {
      setPhotoIndex(i => Math.max(i - 1, 0));
    }
  };

  // Background card (not top)
  if (!isTop) {
    return (
      <motion.div
        className="absolute inset-0 rounded-3xl overflow-hidden bg-[#1A1A1A]"
        style={{ zIndex: 0 }}
        initial={{ scale: 0.93, y: 20, opacity: 0.7 }}
        animate={{ scale: 0.94, y: 14, opacity: 0.75 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
      >
        <img
          src={photos[0]}
          alt={profile.first_name}
          className="w-full h-full object-cover"
          style={{ opacity: 0.55 }}
          loading="eager"
          decoding="async"
          draggable={false}
        />
        <div className="absolute inset-0 bg-black/50" />
      </motion.div>
    );
  }

  return (
    <motion.div
      className="absolute inset-0 rounded-3xl overflow-hidden cursor-grab active:cursor-grabbing"
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.08}
      dragMomentum={true}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleTap}
      style={{
        x,
        y,
        rotate,
        scale,
        zIndex: 1,
        touchAction: "none",
        willChange: "transform",
      }}
      initial={{ scale: 0.9, opacity: 0, y: 30 }}
      animate={{
        scale: 1,
        opacity: 1,
        y: 0,
        transition: { type: "spring", stiffness: 300, damping: 26, mass: 0.8 },
      }}
    >
      {/* Photo */}
      {photos.map((url, i) => (
        <img
          key={i}
          src={url}
          alt={profile.first_name}
          className="w-full h-full object-cover select-none absolute inset-0"
          draggable={false}
          loading="eager"
          decoding="async"
          style={{ opacity: i === photoIndex ? 1 : 0, transition: "opacity 0.15s ease" }}
        />
      ))}

      {/* Dynamic color overlay based on swipe direction */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ background: likeGradient }}
      />
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ background: nopeGradient }}
      />

      {/* Photo progress bars */}
      {photos.length > 1 && (
        <div className="absolute top-3 left-0 right-0 flex gap-1.5 px-4">
          {photos.map((_, i) => (
            <div
              key={i}
              className="flex-1 h-[3px] rounded-full overflow-hidden"
              style={{ background: "rgba(255,255,255,0.25)" }}
            >
              <motion.div
                className="h-full rounded-full"
                initial={{ scaleX: i < photoIndex ? 1 : i === photoIndex ? 1 : 0 }}
                animate={{ scaleX: i === photoIndex ? 1 : i < photoIndex ? 1 : 0 }}
                transition={{ duration: 0.25 }}
                style={{ background: "rgba(255,255,255,0.95)", transformOrigin: "left" }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/10 to-transparent pointer-events-none" />

      {/* LIKE badge */}
      <motion.div
        className="absolute top-16 right-5 rounded-2xl px-5 py-2.5 rotate-[-20deg]"
        style={{
          opacity: likeOpacity,
          background: "rgba(16,185,129,0.18)",
          border: "3px solid #10B981",
          backdropFilter: "blur(12px)",
          boxShadow: "0 0 30px rgba(16,185,129,0.3)",
        }}
      >
        <span
          className="text-green-400 text-3xl font-black tracking-widest uppercase"
          style={{ textShadow: "0 0 25px rgba(16,185,129,0.9)" }}
        >
          LIKE ❤️
        </span>
      </motion.div>

      {/* NOPE badge */}
      <motion.div
        className="absolute top-16 left-5 rounded-2xl px-5 py-2.5 rotate-[20deg]"
        style={{
          opacity: nopeOpacity,
          background: "rgba(239,68,68,0.18)",
          border: "3px solid #EF4444",
          backdropFilter: "blur(12px)",
          boxShadow: "0 0 30px rgba(239,68,68,0.3)",
        }}
      >
        <span
          className="text-red-400 text-3xl font-black tracking-widest uppercase"
          style={{ textShadow: "0 0 25px rgba(239,68,68,0.9)" }}
        >
          ✕ NOPE
        </span>
      </motion.div>

      {/* Profile info */}
      <div className="absolute bottom-0 left-0 right-0 p-6 pb-7">
        <div className="mb-3">
          <h2 className="text-[2.2rem] font-black text-white leading-none drop-shadow-2xl flex items-baseline gap-2">
            {profile.first_name}
            <span className="text-2xl font-light text-white/70">{profile.age}</span>
          </h2>
          {(profile.location || profile.favorite_drink) && (
            <p className="text-white/65 text-sm mt-1 flex items-center gap-2 flex-wrap">
              {profile.location && (
                <span className="flex items-center gap-1">
                  📍{" "}
                  {profile.location === "tel_aviv"
                    ? "תל אביב"
                    : profile.location === "south"
                    ? "דרום"
                    : profile.location === "north"
                    ? "צפון"
                    : profile.location}
                </span>
              )}
              {profile.favorite_drink && (
                <span className="text-[#D4AF37]">• 🍸 {profile.favorite_drink}</span>
              )}
            </p>
          )}
        </div>

        {/* Funny fact card */}
        <div
          className="rounded-2xl px-5 py-4 border border-white/10"
          style={{
            background: "rgba(255,255,255,0.08)",
            backdropFilter: "blur(20px)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
          }}
        >
          <p className="text-white/90 text-sm leading-relaxed">😂 {profile.funny_fact}</p>
        </div>
      </div>
    </motion.div>
  );
});

SwipeCard.displayName = "SwipeCard";
export default SwipeCard;