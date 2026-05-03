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
    window.addEventListener("focus", loadUnreadCount);
    return () => window.removeEventListener("focus", loadUnreadCount);
  }, []);

  const loadUnreadCount = async () => {
    const deviceId = localStorage.getItem("wedding_device_id");
    if (!deviceId) return;

    // Get my profile
    const myProfiles = await base44.entities.Profile.filter({ device_id: deviceId });
    if (myProfiles.length === 0) return;
    const me = myProfiles[0];

    // Fetch matches and unread messages in parallel
    const [m1, m2, unreadMessages] = await Promise.all([
      base44.entities.Match.filter({ user1_id: me.id }),
      base44.entities.Match.filter({ user2_id: me.id }),
      base44.entities.Message.filter({ receiver_id: me.id, is_read: false }),
    ]);

    const activeMatches = [...m1, ...m2];
    const matchPartnerIds = new Set(activeMatches.map(m => m.user1_id === me.id ? m.user2_id : m.user1_id));
    
    // Only count unread messages from people I am currently matched with
    const validUnread = unreadMessages.filter(msg => matchPartnerIds.has(msg.sender_id));
    
    // Count distinct senders
    const unreadSenders = new Set(validUnread.map(m => m.sender_id));
    setUnreadCount(unreadSenders.size);

    // Subscribe to new messages
    const unsub = base44.entities.Message.subscribe((event) => {
      if (event.type === "create" && event.data.receiver_id === me.id) {
        // Just reload for simplicity and accuracy
        loadUnreadCount();
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
      <div className="relative">
        {/* Golden top border with glow */}
        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent shadow-[0_-2px_10px_rgba(212,175,55,0.15)]" />
        
        <div className="glass backdrop-blur-3xl bg-[#0A0A0A]/60 border-t border-white/5 shadow-[0_-15px_50px_rgba(0,0,0,0.8)]">
          <div className="max-w-md mx-auto flex justify-around items-center px-4" style={{ height: '70px' }}>
            <Link
              to={createPageUrl("Swipe")}
              className="flex flex-col items-center justify-center flex-1 h-full relative"
              style={{ touchAction: 'manipulation' }}
            >
              <motion.div
                whileTap={{ scale: 0.85 }}
                className={`flex flex-col items-center transition-all duration-300 ${isActive("Swipe") ? "text-[#D4AF37]" : "text-white/20"}`}
              >
                <div className="relative mb-1">
                  {isActive("Swipe") && (
                    <motion.div 
                      layoutId="nav-glow"
                      className="absolute -inset-4 bg-[#D4AF37]/10 rounded-full blur-xl"
                    />
                  )}
                  <Compass className={`w-[22px] h-[22px] transition-transform ${isActive("Swipe") ? "scale-110" : ""}`} />
                </div>
                <span className={`text-[9px] font-black tracking-[0.25em] uppercase transition-opacity ${isActive("Swipe") ? "opacity-100" : "opacity-40"}`}>Discover</span>
                {isActive("Swipe") && (
                  <motion.div layoutId="nav-dot" className="absolute -bottom-1 w-1 h-1 bg-[#D4AF37] rounded-full shadow-[0_0_8px_#D4AF37]" />
                )}
              </motion.div>
            </Link>

            <Link
              to={createPageUrl("MyMatches")}
              className="flex flex-col items-center justify-center flex-1 h-full relative"
              style={{ touchAction: 'manipulation' }}
            >
              <motion.div
                whileTap={{ scale: 0.85 }}
                className={`flex flex-col items-center transition-all duration-300 ${isActive("MyMatches") ? "text-[#FE3C72]" : "text-white/20"}`}
              >
                <div className="relative mb-1">
                  {isActive("MyMatches") && (
                    <motion.div 
                      layoutId="nav-glow"
                      className="absolute -inset-4 bg-[#FE3C72]/10 rounded-full blur-xl"
                    />
                  )}
                  <div className="relative">
                    <Heart className={`w-[22px] h-[22px] transition-all ${isActive("MyMatches") ? "scale-110" : ""}`} fill={isActive("MyMatches") ? "currentColor" : "none"} />
                    {unreadCount > 0 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-2 -right-2 bg-[#FE3C72] text-white text-[8px] font-black rounded-full w-[17px] h-[17px] flex items-center justify-center border-2 border-[#0A0A0A] shadow-[0_0_12px_rgba(254,60,114,0.6)]"
                      >
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </motion.div>
                    )}
                  </div>
                </div>
                <span className={`text-[9px] font-black tracking-[0.25em] uppercase transition-opacity ${isActive("MyMatches") ? "opacity-100" : "opacity-40"}`}>Matches</span>
                {isActive("MyMatches") && (
                  <motion.div layoutId="nav-dot" className="absolute -bottom-1 w-1 h-1 bg-[#FE3C72] rounded-full shadow-[0_0_8px_#FE3C72]" />
                )}
              </motion.div>
            </Link>

            <Link
              to={createPageUrl("MyProfile")}
              className="flex flex-col items-center justify-center flex-1 h-full relative"
              style={{ touchAction: 'manipulation' }}
            >
              <motion.div
                whileTap={{ scale: 0.85 }}
                className={`flex flex-col items-center transition-all duration-300 ${isActive("MyProfile") ? "text-[#D4AF37]" : "text-white/20"}`}
              >
                <div className="relative mb-1">
                  {isActive("MyProfile") && (
                    <motion.div 
                      layoutId="nav-glow"
                      className="absolute -inset-4 bg-[#D4AF37]/10 rounded-full blur-xl"
                    />
                  )}
                  <UserCircle className={`w-[22px] h-[22px] transition-transform ${isActive("MyProfile") ? "scale-110" : ""}`} />
                </div>
                <span className={`text-[9px] font-black tracking-[0.25em] uppercase transition-opacity ${isActive("MyProfile") ? "opacity-100" : "opacity-40"}`}>Profile</span>
                {isActive("MyProfile") && (
                  <motion.div layoutId="nav-dot" className="absolute -bottom-1 w-1 h-1 bg-[#D4AF37] rounded-full shadow-[0_0_8px_#D4AF37]" />
                )}
              </motion.div>
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}