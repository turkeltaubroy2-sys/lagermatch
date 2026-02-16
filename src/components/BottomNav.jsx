import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Compass, Heart } from "lucide-react";

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

    const myProfiles = await base44.entities.Profile.filter({ device_id: deviceId });
    if (myProfiles.length === 0) return;

    const myProfile = myProfiles[0];
    const allMessages = await base44.entities.Message.filter({});
    const myMessages = allMessages.filter(m => m.receiver_id === myProfile.id);

    const conversationsWithUnread = new Set();
    myMessages.forEach(msg => {
      conversationsWithUnread.add(msg.sender_id);
    });

    setUnreadCount(conversationsWithUnread.size);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#1A1A1A] border-t border-[#333] z-40 pb-[env(safe-area-inset-bottom)]">
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
      </div>
    </div>
  );
}