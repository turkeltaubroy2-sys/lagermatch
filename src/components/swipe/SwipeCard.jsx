import React, { memo } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { Heart, X } from "lucide-react";

const SwipeCard = memo(({ profile, onSwipe, isTop }) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);

  const handleDragEnd = (_, info) => {
    if (info.offset.x > 100) {
      onSwipe(true);
    } else if (info.offset.x < -100) {
      onSwipe(false);
    }
  };

  if (!isTop) {
    return (
      <div className="absolute inset-0 rounded-3xl overflow-hidden bg-[#1A1A1A]">
        <img
          src={profile.photo_url}
          alt={profile.first_name}
          className="w-full h-full object-cover opacity-50"
        />
      </div>
    );
  }

  return (
    <motion.div
      className="absolute inset-0 rounded-3xl overflow-hidden cursor-grab active:cursor-grabbing card-swipe"
      style={{ x, rotate }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ 
        x: x.get() > 0 ? 300 : -300,
        opacity: 0,
        transition: { duration: 0.3 }
      }}
    >
      {/* Photo */}
      <img
        src={profile.photo_url}
        alt={profile.first_name}
        className="w-full h-full object-cover"
        draggable={false}
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

      {/* Like indicator */}
      <motion.div
        className="absolute top-8 right-8 border-4 border-green-400 rounded-xl px-4 py-2 rotate-[-20deg]"
        style={{ opacity: likeOpacity }}
      >
        <span className="text-green-400 text-3xl font-black">LIKE</span>
      </motion.div>

      {/* Nope indicator */}
      <motion.div
        className="absolute top-8 left-8 border-4 border-red-400 rounded-xl px-4 py-2 rotate-[20deg]"
        style={{ opacity: nopeOpacity }}
      >
        <span className="text-red-400 text-3xl font-black">NOPE</span>
      </motion.div>

      {/* Profile info */}
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <h2 className="text-3xl font-black text-white mb-1">
          {profile.first_name}
          <span className="text-2xl font-normal text-white/70 mr-2">{profile.age}</span>
        </h2>
        <div className="bg-white/10 backdrop-blur-md rounded-xl px-4 py-3 mt-3">
          <p className="text-white/90 text-sm leading-relaxed">
            😂 {profile.funny_fact}
          </p>
        </div>
      </div>
    </motion.div>
  );
});

SwipeCard.displayName = "SwipeCard";

export default SwipeCard;