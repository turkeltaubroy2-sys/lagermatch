import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Compass, Heart, UserCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";

export default function BottomNav({ hidden = false }) {
  const [isActive, setIsActive] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [me, setMe] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname.substring(1) || "Swipe";
    setIsActive(path);
    loadUnreadCount();
  }, [location]);

  useEffect(() => {
    loadMe();
  }, []);

  const loadMe = async () => {
    const device_id = localStorage.getItem("device_id");
    if (!device_id) return;
    try {
      const res = await base44.entities.Profile.filter({ device_id });
      if (res.length > 0) {
        setMe(res[0]);
        base44.entities.Profile.updatePresence(res[0].id);
        const interval = setInterval(() => {
          base44.entities.Profile.updatePresence(res[0].id);
        }, 15000);
        return () => clearInterval(interval);
      }
    } catch (e) { console.error(e); }
  };

  const loadUnreadCount = async () => {
    const device_id = localStorage.getItem("device_id");
    if (!device_id) return;
    try {
      const myProfiles = await base44.entities.Profile.filter({ device_id });
      if (myProfiles.length === 0) return;
      const me = myProfiles[0];

      const [m1, m2, unreadMessages] = await Promise.all([
        base44.entities.Match.filter({ user1_id: me.id }),
        base44.entities.Match.filter({ user2_id: me.id }),
        base44.entities.Message.filter({ receiver_id: me.id, is_read: false })
      ]);

      const activeMatches = [...m1, ...m2];
      const matchPartnerIds = new Set(activeMatches.map(m => m.user1_id === me.id ? m.user2_id : m.user1_id));
      const validUnread = unreadMessages.filter(msg => matchPartnerIds.has(msg.sender_id));
      const unreadSenders = new Set(validUnread.map(m => m.sender_id));
      setUnreadCount(unreadSenders.size);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (!me?.id) return;
    const unsub = base44.entities.Message.subscribe((event) => {
      if (event.type === "create" && event.data.receiver_id === me.id) {
        loadUnreadCount();
      }
    });
    return unsub;
  }, [me?.id]);

  return (
    <AnimatePresence>
      {!hidden && (
        <motion.div
          key="bottom-nav"
          className="fixed bottom-6 inset-x-0 z-40 flex justify-center px-4 pointer-events-none"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
        >
          <div className="w-full max-w-md relative glass backdrop-blur-3xl bg-[#0D0D0D]/80 rounded-[2.5rem] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] px-2 py-2 pointer-events-auto">
            <div className="flex justify-around items-center h-[60px] relative">
              <Link to={createPageUrl("Swipe")} className="flex-1 h-full relative group">
                <div className="flex flex-col items-center justify-center h-full relative z-10">
                  <motion.div whileTap={{ scale: 0.8 }} className={`transition-all duration-300 ${isActive === "Swipe" ? "text-[#D4AF37]" : "text-white/40 group-hover:text-white/60"}`}>
                    <Compass className={`w-6 h-6 ${isActive === "Swipe" ? "drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]" : ""}`} />
                  </motion.div>
                  {isActive === "Swipe" && (
                    <motion.div layoutId="active-pill" className="absolute inset-0 bg-white/5 rounded-2xl -z-10 border border-white/5" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                  )}
                </div>
              </Link>
              <div className="w-[1px] h-8 bg-white/5 mx-1" />
              <Link to={createPageUrl("MyMatches")} className="flex-1 h-full relative group">
                <div className="flex flex-col items-center justify-center h-full relative z-10">
                  <motion.div whileTap={{ scale: 0.8 }} className={`transition-all duration-300 ${isActive === "MyMatches" ? "text-[#FE3C72]" : "text-white/40 group-hover:text-white/60"}`}>
                    <div className="relative">
                      <Heart className={`w-6 h-6 ${isActive === "MyMatches" ? "drop-shadow-[0_0_8px_rgba(254,60,114,0.5)]" : ""}`} fill={isActive === "MyMatches" ? "currentColor" : "none"} />
                      {unreadCount > 0 && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-2 -right-2 bg-[#FE3C72] text-white text-[8px] font-black rounded-full w-4 h-4 flex items-center justify-center border border-[#0D0D0D] shadow-[0_0_10px_rgba(254,60,114,0.6)]">
                          {unreadCount}
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                  {isActive === "MyMatches" && (
                    <motion.div layoutId="active-pill" className="absolute inset-0 bg-white/5 rounded-2xl -z-10 border border-white/5" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                  )}
                </div>
              </Link>
              <div className="w-[1px] h-8 bg-white/5 mx-1" />
              <Link to={createPageUrl("MyProfile")} className="flex-1 h-full relative group">
                <div className="flex flex-col items-center justify-center h-full relative z-10">
                  <motion.div whileTap={{ scale: 0.8 }} className={`transition-all duration-300 ${isActive === "MyProfile" ? "text-[#D4AF37]" : "text-white/40 group-hover:text-white/60"}`}>
                    <UserCircle className={`w-6 h-6 ${isActive === "MyProfile" ? "drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]" : ""}`} />
                  </motion.div>
                  {isActive === "MyProfile" && (
                    <motion.div layoutId="active-pill" className="absolute inset-0 bg-white/5 rounded-2xl -z-10 border border-white/5" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                  )}
                </div>
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}