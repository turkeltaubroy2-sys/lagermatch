import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Compass, Heart, UtensilsCrossed } from "lucide-react";

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
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#1A1A1A]/95 backdrop-blur-md border-t border-[#333] z-40" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="max-w-md mx-auto flex justify-around items-center h-16 px-4">
        <Link
          to={createPageUrl("Swipe")}
          className={`flex flex-col items-center justify-center flex-1 py-2 transition-all ${
            isActive("Swipe") ? "text-[#D4AF37]" : "text-white/40 hover:text-white/60"
          }`}
        >
          <Compass className="w-6 h-6 mb-1" />
          <span className="text-xs font-medium">גלה</span>
        </Link>

        <Link
          to={createPageUrl("MyMatches")}
          className={`flex flex-col items-center justify-center flex-1 py-2 transition-all ${
            isActive("MyMatches") ? "text-[#D4AF37]" : "text-white/40 hover:text-white/60"
          }`}
        >
          <div className="relative">
            <Heart className="w-6 h-6 mb-1" />
            {unreadCount > 0 && (
              <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </div>
            )}
          </div>
          <span className="text-xs font-medium">התאמות</span>
        </Link>

        <Link
          to={createPageUrl("Menu")}
          className={`flex flex-col items-center justify-center flex-1 py-2 transition-all ${
            isActive("Menu") ? "text-[#D4AF37]" : "text-white/40 hover:text-white/60"
          }`}
        >
          <UtensilsCrossed className="w-6 h-6 mb-1" />
          <span className="text-xs font-medium">תפריט</span>
        </Link>
      </div>
    </div>
  );
}