import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Compass, Heart } from "lucide-react";

export default function BottomNav() {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (page) => currentPath.includes(page);

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
          <Heart className="w-6 h-6 mb-1" />
          <span className="text-xs font-medium">התאמות</span>
        </Link>
      </div>
    </div>
  );
}