import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SlidersHorizontal, X, ChevronRight } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const LOCATIONS = [
  { value: "all", label: "כל האיזורים" },
  { value: "tel_aviv", label: "תל אביב" },
  { value: "south", label: "דרום" },
  { value: "north", label: "צפון" },
];

export default function AgeFilter({ ageRange, locationFilter, compatibilityFilter, onChangeRange, onChangeLocation, onChangeCompatibility }) {
  const [showLocationSheet, setShowLocationSheet] = useState(false);
  const [custom, setCustom] = useState({ min: ageRange.min, max: ageRange.max });

  const applyCustom = () => {
    const min = Math.max(18, Math.min(parseInt(custom.min) || 18, 60));
    const max = Math.max(min, Math.min(parseInt(custom.max) || 60, 60));
    setCustom({ min, max });
    onChangeRange(min, max);
  };

  const clearFilter = () => {
    setCustom({ min: 18, max: 60 });
    onChangeRange(18, 60);
    onChangeLocation("all");
    onChangeCompatibility(70);
  };

  const isFiltered = ageRange.min !== 18 || ageRange.max !== 60 || locationFilter !== "all" || compatibilityFilter !== 70;

  return (
    <div className="relative">
      <Sheet>
        <SheetTrigger asChild>
          <button
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs tracking-widest uppercase transition-all duration-300 ${
              isFiltered
                ? "bg-gradient-to-r from-[#FE3C72] to-[#D4AF37] text-white font-black shadow-[0_0_15px_rgba(254,60,114,0.3)]"
                : "bg-white/5 text-white/50 hover:text-white border border-white/10 hover:border-white/20"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            {isFiltered ? "מסונן" : "סינון"}
          </button>
        </SheetTrigger>
        <SheetContent side="bottom" className="bg-[#0A0A0A] border-white/10 rounded-t-[2.5rem] p-8 pb-12" dir="rtl">
          <SheetHeader className="mb-10 text-right">
            <SheetTitle className="text-white tracking-[0.3em] uppercase text-[10px] font-black opacity-30">✦ סינון מתקדם</SheetTitle>
          </SheetHeader>

          {/* Compatibility filter */}
          <div className="mb-10">
            <div className="flex justify-between items-center mb-4">
              <label className="text-[11px] text-white/50 font-bold uppercase tracking-widest">אחוז התאמה מינימלי</label>
              <span className="text-[#D4AF37] font-black text-lg">{compatibilityFilter}%</span>
            </div>
            <input
              type="range"
              min="70"
              max="99"
              value={compatibilityFilter}
              onChange={(e) => onChangeCompatibility(parseInt(e.target.value))}
              className="w-full h-2 bg-white/5 rounded-full appearance-none cursor-pointer accent-[#D4AF37]"
              style={{ direction: 'ltr' }}
            />
            <div className="flex justify-between mt-2 opacity-20 text-[10px] font-bold">
              <span>70%</span>
              <span>99%</span>
            </div>
          </div>

          {/* Location filter */}
          <div className="mb-10">
            <label className="text-[11px] text-white/50 font-bold uppercase tracking-widest mb-4 block">איזור מגורים</label>
            <button
              onClick={() => setShowLocationSheet(true)}
              className="w-full h-14 px-5 rounded-2xl bg-white/5 border border-white/10 text-white text-right flex items-center justify-between hover:bg-white/10 transition-all"
            >
              <span className="text-sm font-semibold">{LOCATIONS.find(l => l.value === locationFilter)?.label}</span>
              <ChevronRight className="w-4 h-4 opacity-30" />
            </button>
          </div>

          {/* Age range */}
          <div className="mb-10">
            <label className="text-[11px] text-white/50 font-bold uppercase tracking-widest mb-4 block">טווח גילאים</label>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Input
                  type="number"
                  value={custom.min}
                  onChange={e => setCustom({ ...custom, min: e.target.value })}
                  onBlur={applyCustom}
                  className="bg-white/5 border-white/10 text-white h-12 rounded-2xl text-center text-sm focus:ring-1 focus:ring-[#D4AF37]/50"
                  min={18}
                  max={60}
                />
              </div>
              <div className="w-4 h-[1px] bg-white/10" />
              <div className="flex-1">
                <Input
                  type="number"
                  value={custom.max}
                  onChange={e => setCustom({ ...custom, max: e.target.value })}
                  onBlur={applyCustom}
                  className="bg-white/5 border-white/10 text-white h-12 rounded-2xl text-center text-sm focus:ring-1 focus:ring-[#D4AF37]/50"
                  min={18}
                  max={60}
                />
              </div>
            </div>
          </div>

          {isFiltered && (
            <button
              onClick={clearFilter}
              className="w-full py-5 rounded-2xl bg-[#FE3C72]/10 text-[#FE3C72] text-[10px] font-black uppercase tracking-[0.3em] border border-[#FE3C72]/20 active:scale-[0.98] transition-all"
            >
              נקה את כל המסננים
            </button>
          )}
        </SheetContent>
      </Sheet>

      {/* Location sub-sheet */}
      <AnimatePresence>
        {showLocationSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200]"
              onClick={() => setShowLocationSheet(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="fixed bottom-0 left-0 right-0 bg-[#0A0A0A] border-t border-white/10 rounded-t-[3rem] p-8 pb-12 z-[201]"
              dir="rtl"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-white text-sm font-black tracking-widest uppercase opacity-40">בחר איזור</h3>
                <button 
                  onClick={() => setShowLocationSheet(false)} 
                  className="text-white/20 hover:text-white w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3">
                {LOCATIONS.map(location => (
                  <button
                    key={location.value}
                    onClick={() => {
                      onChangeLocation(location.value);
                      setShowLocationSheet(false);
                    }}
                    className={`w-full py-5 px-8 rounded-2xl text-right transition-all duration-300 ${
                      locationFilter === location.value
                        ? "bg-gradient-to-r from-[#D4AF37] to-[#F5E6A3] text-[#0F0F0F] font-black shadow-xl"
                        : "bg-white/5 text-white/70 hover:bg-white/10"
                    }`}
                  >
                    {location.label}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

      {/* Location bottom sheet */}
      <AnimatePresence>
        {showLocationSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
              onClick={(e) => {
                e.stopPropagation();
                setShowLocationSheet(false);
              }}
            />
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-0 left-0 right-0 bg-[#1A1A1A] border-t border-[#333] rounded-t-3xl p-6 z-[70]"
              dir="rtl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white text-lg font-bold">בחר איזור</h3>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowLocationSheet(false);
                  }} 
                  className="text-white/40 hover:text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2">
                {LOCATIONS.map(location => (
                  <button
                    key={location.value}
                    onClick={(e) => {
                      e.stopPropagation();
                      onChangeLocation(location.value);
                      setShowLocationSheet(false);
                    }}
                    className={`w-full py-4 px-6 rounded-xl text-right transition-all ${
                      locationFilter === location.value
                        ? "bg-[#D4AF37] text-[#0F0F0F] font-bold"
                        : "bg-[#252525] text-white hover:bg-[#333]"
                    }`}
                  >
                    {location.label}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}