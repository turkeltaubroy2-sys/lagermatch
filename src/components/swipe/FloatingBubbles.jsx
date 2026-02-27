import React, { useMemo, useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";

// Generates non-overlapping positions for bubbles
function generatePositions(count, containerW, containerH, bubbleSize) {
  const positions = [];
  const padding = bubbleSize * 0.6;
  let attempts = 0;

  while (positions.length < count && attempts < count * 50) {
    attempts++;
    const x = padding + Math.random() * (containerW - bubbleSize - padding * 2);
    const y = padding + Math.random() * (containerH - bubbleSize - padding * 2);

    // Check overlap
    const overlaps = positions.some(p => {
      const dx = p.x - x;
      const dy = p.y - y;
      return Math.sqrt(dx * dx + dy * dy) < bubbleSize * 1.05;
    });

    if (!overlaps) {
      positions.push({ x, y });
    }
  }

  // Fill remaining with any position if needed
  while (positions.length < count) {
    const x = padding + Math.random() * (containerW - bubbleSize - padding * 2);
    const y = padding + Math.random() * (containerH - bubbleSize - padding * 2);
    positions.push({ x, y });
  }

  return positions;
}

export default function FloatingBubbles({ profiles, calculateCompatibility, isMatch, onSelect }) {
  const containerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setContainerSize({ w: el.offsetWidth, h: el.offsetHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const BUBBLE_SIZE = containerSize.w > 0 ? Math.floor(containerSize.w / 3.5) : 90;

  const positions = useMemo(() => {
    if (containerSize.w === 0 || containerSize.h === 0) return [];
    return generatePositions(profiles.length, containerSize.w, containerSize.h, BUBBLE_SIZE);
  }, [profiles.length, containerSize.w, containerSize.h, BUBBLE_SIZE]);

  return (
    <div ref={containerRef} className="absolute inset-0">
      {containerSize.w > 0 && positions.length === profiles.length && profiles.map((profile, index) => {
        const compatibility = calculateCompatibility(profile);
        const pos = positions[index];
        const floatDuration = 4 + (index * 1.3) % 4;
        const floatDelay = (index * 0.7) % 3;
        const floatY = 10 + (index % 4) * 5;
        const floatX = 5 + (index % 3) * 4;
        const rotateDeg = index % 2 === 0 ? 6 : -6;

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
              scale: 1,
              y: [0, -floatY, floatY * 0.4, -floatY * 0.6, 0],
              x: [0, floatX, -floatX * 0.5, floatX * 0.3, 0],
              rotate: [0, rotateDeg, 0, -rotateDeg * 0.5, 0],
            }}
            transition={{
              opacity: { duration: 0.4, delay: index * 0.05 },
              scale: { duration: 0.4, delay: index * 0.05, type: "spring", stiffness: 200 },
              y: { duration: floatDuration, repeat: Infinity, ease: "easeInOut", delay: floatDelay },
              x: { duration: floatDuration * 1.3, repeat: Infinity, ease: "easeInOut", delay: floatDelay + 0.5 },
              rotate: { duration: floatDuration * 1.7, repeat: Infinity, ease: "easeInOut", delay: floatDelay + 1 },
            }}
          >
            {/* Compatibility badge */}
            <div
              className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 bg-gradient-to-r from-[#D4AF37] via-[#F5E6A3] to-[#D4AF37] text-[#0F0F0F] px-2 py-0.5 rounded-full text-[10px] font-black shadow-lg whitespace-nowrap"
              style={{ fontSize: "10px" }}
            >
              {compatibility}% ✨
            </div>

            {/* Circle button */}
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => onSelect(profile)}
              className="relative w-full h-full rounded-full overflow-hidden bg-[#1A1A1A] border-2 border-[#D4AF37]/40 shadow-lg"
              style={{ boxShadow: "0 4px 24px rgba(212,175,55,0.15)" }}
            >
              <img
                src={profile.photo_url}
                alt={profile.first_name}
                className="w-full h-full object-cover"
                loading={index < 6 ? "eager" : "lazy"}
                decoding="async"
              />

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />

              {/* Name */}
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-full px-1 text-center">
                <p className="text-white text-[10px] font-bold truncate leading-tight">
                  {profile.first_name}
                </p>
              </div>

              {/* Match heart */}
              {isMatch(profile.id) && (
                <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-gradient-to-br from-[#FE3C72] to-[#D4AF37] flex items-center justify-center text-[10px] shadow">
                  ❤️
                </div>
              )}
            </motion.button>
          </motion.div>
        );
      })}
    </div>
  );
}