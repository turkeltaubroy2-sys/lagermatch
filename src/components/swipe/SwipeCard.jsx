import React, { memo } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { Heart, X } from "lucide-react";

const SwipeCard = memo(({ profile, onSwipe, isTop }) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);

  const handleDragEnd = (_, info) => {
    if (info.offset.x > 80) {
      onSwipe(true);
    } else if (info.offset.x < -80) {
      onSwipe(false);
    }
  };

  if (!isTop) {
    return (
      <div
        className="absolute inset-0 rounded-3xl overflow-hidden bg-[#1A1A1A]"
        style={{ transform: "scale(0.94) translateY(16px)", zIndex: 0 }}
      >
        <img
          src={profile.photo_url}
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
      style={{ x, rotate, willChange: "transform" }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.5}
      dragMomentum={false}
      onDragEnd={handleDragEnd}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ 
        x: x.get() > 0 ? 400 : -400,
        opacity: 0,
        transition: { duration: 0.2 }
      }}
    >
      {/* Photo */}
      <img
        src={profile.photo_url}
        alt={profile.first_name}
        className="w-full h-full object-cover"
        draggable={false}
        loading="eager"
        decoding="async"
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

      {/* Like indicator */}
      <motion.div
        className="absolute top-12 right-8 border-4 border-green-500 rounded-2xl px-6 py-3 rotate-[-20deg] shadow-xl"
        style={{ opacity: likeOpacity }}
      >
        <span className="text-green-500 text-4xl font-black tracking-wide">אהבתי</span>
      </motion.div>

      {/* Nope indicator */}
      <motion.div
        className="absolute top-12 left-8 border-4 border-red-500 rounded-2xl px-6 py-3 rotate-[20deg] shadow-xl"
        style={{ opacity: nopeOpacity }}
      >
        <span className="text-red-500 text-4xl font-black tracking-wide">לא</span>
      </motion.div>

      {/* Profile info */}
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <h2 className="text-4xl font-black text-white mb-1 drop-shadow-lg">
          {profile.first_name}
          <span className="text-3xl font-normal text-white/80 mr-2">{profile.age}</span>
        </h2>
        <p className="text-white/70 text-sm mb-3 drop-shadow flex items-center gap-2">
          📍 {profile.location === "tel_aviv" ? "תל אביב" : profile.location === "south" ? "דרום" : "צפון"}
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