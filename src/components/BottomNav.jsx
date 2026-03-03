import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Compass, Heart, UserCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function BottomNav() {
  const location = useLocation();
  const currentPath = location.pathname;
  const [unreadCount, setUnreadCount] = useState(0);

  const isActive = (page) => currentPath.includes(page);

  useEffect(() => {
    loadUnreadCount();
  }, []);

  const loadUnreadCount = async () => {
    const deviceId = localStorage.getItem("wedding_device_id");
    if (!deviceId) return;

    const profileId = sessionStorage.getItem("nightmatch_profile_id");
    let myProfileId = profileId;

    if (!myProfileId) {
      const myProfiles = await base44.entities.Profile.filter({ device_id: deviceId });
      if (myProfiles.length === 0) return;
      myProfileId = myProfiles[0].id;
      sessionStorage.setItem("nightmatch_profile_id", myProfileId);
    }

    const myMessages = await base44.entities.Message.filter({ receiver_id: myProfileId });
    const senders = new Set(myMessages.map(m => m.sender_id));
    setUnreadCount(senders.size);

    // Real-time subscription for new messages
    const unsub = base44.entities.Message.subscribe((event) => {
      if (event.type === "create" && event.data.receiver_id === myProfileId) {
        setUnreadCount(prev => prev + 1);
      }
    });
    return unsub;
  };

  return (
    <motion.div
      className="fixed bottom-0 left-0 right-0 z-40"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 24, delay: 0.3 }}
    >
      <div className="bg-[#111]/90 backdrop-blur-xl border-t border-white/8 shadow-[0_-4px_30px_rgba(0,0,0,0.4)]">
        <div className="max-w-md mx-auto flex justify-around items-center px-4" style={{ height: '56px' }}>
          <Link
            to={createPageUrl("Swipe")}
            className="flex flex-col items-center justify-center flex-1 h-full"
            style={{ touchAction: 'manipulation' }}
          >
            <motion.div
              whileTap={{ scale: 0.85 }}
              className={`flex flex-col items-center transition-colors duration-200 ${isActive("Swipe") ? "text-[#D4AF37]" : "text-white/35"}`}
            >
              {isActive("Swipe") ? (
                <motion.div layoutId="nav-indicator" className="relative">
                  <motion.div className="absolute -inset-2 bg-[#D4AF37]/15 rounded-full blur-sm" />
                  <Compass className="w-6 h-6 mb-0.5 relative z-10" />
                </motion.div>
              ) : (
                <Compass className="w-6 h-6 mb-0.5" />
              )}
              <span className="text-[10px] font-semibold tracking-widest uppercase">Discover</span>
            </motion.div>
          </Link>

          <Link
            to={createPageUrl("MyMatches")}
            className="flex flex-col items-center justify-center flex-1 h-full"
            style={{ touchAction: 'manipulation' }}
          >
            <motion.div
              whileTap={{ scale: 0.85 }}
              className={`flex flex-col items-center transition-colors duration-200 ${isActive("MyMatches") ? "text-[#FE3C72]" : "text-white/35"}`}
            >
              <div className="relative">
                {isActive("MyMatches") ? (
                  <motion.div
                    animate={{ scale: [1, 1.18, 1] }}
                    transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <motion.div className="absolute -inset-2 bg-[#FE3C72]/15 rounded-full blur-sm" />
                    <Heart className="w-6 h-6 mb-0.5 relative z-10" fill="currentColor" />
                  </motion.div>
                ) : (
                  <Heart className="w-6 h-6 mb-0.5" />
                )}
                {unreadCount > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1.5 -right-1.5 bg-[#FE3C72] text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center shadow-[0_0_8px_rgba(254,60,114,0.7)]"
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </motion.div>
                )}
              </div>
              <span className="text-[10px] font-semibold tracking-widest uppercase mt-0.5">Matches</span>
            </motion.div>
          </Link>

          <Link
            to={createPageUrl("MyProfile")}
            className="flex flex-col items-center justify-center flex-1 h-full"
            style={{ touchAction: 'manipulation' }}
          >
            <motion.div
              whileTap={{ scale: 0.85 }}
              className={`flex flex-col items-center transition-colors duration-200 ${isActive("MyProfile") ? "text-[#D4AF37]" : "text-white/35"}`}
            >
              {isActive("MyProfile") ? (
                <motion.div className="relative">
                  <motion.div className="absolute -inset-2 bg-[#D4AF37]/15 rounded-full blur-sm" />
                  <UserCircle className="w-6 h-6 mb-0.5 relative z-10" />
                </motion.div>
              ) : (
                <UserCircle className="w-6 h-6 mb-0.5" />
              )}
              <span className="text-[10px] font-semibold tracking-widest uppercase">Profile</span>
            </motion.div>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}