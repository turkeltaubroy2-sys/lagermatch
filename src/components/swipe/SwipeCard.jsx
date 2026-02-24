import React, { memo, useState } from "react";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";

const SwipeCard = memo(({ profile, onSwipe, isTop }) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-18, 18]);
  const likeOpacity = useTransform(x, [0, 80], [0, 1]);
  const nopeOpacity = useTransform(x, [-80, 0], [1, 0]);
  const [photoIndex, setPhotoIndex] = useState(0);
  const isDragging = React.useRef(false);

  const photos = profile.photo_urls?.length > 0 ? profile.photo_urls : [profile.photo_url];

  const handleDragStart = () => {
    isDragging.current = true;
  };

  const handleDragEnd = (_, info) => {
    isDragging.current = false;
    if (info.offset.x > 80) {
      onSwipe(true);
    } else if (info.offset.x < -80) {
      onSwipe(false);
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

  if (!isTop) {
    return (
      <div
        className="absolute inset-0 rounded-3xl overflow-hidden bg-[#1A1A1A]"
        style={{ transform: "scale(0.94) translateY(16px)", zIndex: 0 }}
      >
        <img
          src={photos[0]}
          alt={profile.first_name}
          className="w-full h-full object-cover opacity-60"
          loading="eager"
          decoding="async"
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>
    );
  }

  return (
    <motion.div
      className="absolute inset-0 rounded-3xl overflow-hidden cursor-grab active:cursor-grabbing card-swipe"
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.15}
      dragMomentum={false}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleTap}
      style={{ x, rotate, willChange: "transform", zIndex: 1, touchAction: "none" }}
      initial={{ scale: 0.92, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0, transition: { type: "spring", stiffness: 280, damping: 22 } }}
      exit={{ 
        x: x.get() > 0 ? 600 : -600,
        opacity: 0,
        rotate: x.get() > 0 ? 20 : -20,
        transition: { duration: 0.22, ease: "easeIn" }
      }}
    >
      {/* Photo */}
      <img
        src={photos[photoIndex]}
        alt={profile.first_name}
        className="w-full h-full object-cover"
        draggable={false}
        loading="eager"
        decoding="async"
      />

      {/* Photo dots */}
      {photos.length > 1 && (
        <div className="absolute top-3 left-0 right-0 flex justify-center gap-1.5 px-4">
          {photos.map((_, i) => (
            <div
              key={i}
              className="flex-1 h-[3px] rounded-full transition-all duration-200"
              style={{ background: i === photoIndex ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.3)" }}
            />
          ))}
        </div>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

      {/* Like indicator */}
      <motion.div
        className="absolute top-14 right-6 rounded-2xl px-5 py-3 rotate-[-22deg] shadow-2xl"
        style={{ 
          opacity: likeOpacity,
          background: "rgba(16,185,129,0.15)",
          border: "3px solid #10B981",
          backdropFilter: "blur(8px)"
        }}
      >
        <span className="text-green-400 text-3xl font-black tracking-widest uppercase" style={{ fontFamily: "'Space Grotesk', sans-serif", textShadow: "0 0 20px rgba(16,185,129,0.8)" }}>
          ❤️ LIKE
        </span>
      </motion.div>

      {/* Nope indicator */}
      <motion.div
        className="absolute top-14 left-6 rounded-2xl px-5 py-3 rotate-[22deg] shadow-2xl"
        style={{ 
          opacity: nopeOpacity,
          background: "rgba(239,68,68,0.15)",
          border: "3px solid #EF4444",
          backdropFilter: "blur(8px)"
        }}
      >
        <span className="text-red-400 text-3xl font-black tracking-widest uppercase" style={{ fontFamily: "'Space Grotesk', sans-serif", textShadow: "0 0 20px rgba(239,68,68,0.8)" }}>
          ✕ NOPE
        </span>
      </motion.div>

      {/* Profile info */}
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <h2 className="text-4xl font-black text-white mb-1 drop-shadow-lg">
          {profile.first_name}
          <span className="text-3xl font-normal text-white/80 mr-2">{profile.age}</span>
        </h2>
        <p className="text-white/70 text-sm mb-3 drop-shadow flex items-center gap-2">
          📍 {profile.location === "tel_aviv" ? "תל אביב" : profile.location === "south" ? "דרום" : profile.location === "north" ? "צפון" : profile.location || ""}
          {profile.favorite_drink && <span className="text-[#D4AF37]">• 🍸 {profile.favorite_drink}</span>}
        </p>
        <div className="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl rounded-2xl px-5 py-4 border border-white/10 shadow-xl">
          <p className="text-white text-sm leading-relaxed">
            😂 {profile.funny_fact}
          </p>
        </div>
      </div>
    </motion.div>
  );
});

SwipeCard.displayName = "SwipeCard";

export default SwipeCard;