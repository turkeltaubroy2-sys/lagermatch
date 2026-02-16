import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SlidersHorizontal, X } from "lucide-react";

const LOCATIONS = [
  { value: "all", label: "כל האיזורים" },
  { value: "tel_aviv", label: "תל אביב" },
  { value: "south", label: "דרום" },
  { value: "north", label: "צפון" },
];

export default function AgeFilter({ ageRange, locationFilter, onChangeRange, onChangeLocation }) {
  const [open, setOpen] = useState(false);
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
  };

  const isFiltered = ageRange.min !== 18 || ageRange.max !== 60 || locationFilter !== "all";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all ${
          isFiltered
            ? "bg-[#D4AF37] text-[#0F0F0F] font-semibold"
            : "bg-[#1A1A1A] text-white/60 hover:text-white border border-[#333]"
        }`}
      >
        <SlidersHorizontal className="w-4 h-4" />
        {isFiltered ? `${ageRange.min}–${ageRange.max}` : "סינון"}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="fixed top-20 right-4 left-4 mx-auto max-w-[280px] bg-[#1A1A1A] border border-[#333] rounded-2xl p-5 z-50 shadow-2xl"
              dir="rtl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-end items-center mb-4">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpen(false);
                  }} 
                  className="text-white/40 hover:text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-95 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

            {/* Location filter */}
            <div className="mb-4">
              <label className="text-xs text-white/60 mb-2 block text-right">איזור מגורים</label>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowLocationSheet(true);
                }}
                className="w-full h-10 px-3 rounded-xl bg-[#252525] border border-[#444] text-white text-right flex items-center justify-between"
              >
                <span>{LOCATIONS.find(l => l.value === locationFilter)?.label}</span>
              </button>
            </div>

            {/* Age range title */}
            <label className="text-xs text-white/60 mb-2 block text-right">גיל</label>

            {/* Custom range */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1">
                <label className="text-xs text-white/40 mb-1 block">מינימום</label>
                <Input
                  type="number"
                  value={custom.min}
                  onChange={e => setCustom({ ...custom, min: e.target.value })}
                  onBlur={applyCustom}
                  className="bg-[#252525] border-[#444] text-white h-10 rounded-xl text-center"
                  min={18}
                  max={60}
                />
              </div>
              <span className="text-white/30 mt-5">—</span>
              <div className="flex-1">
                <label className="text-xs text-white/40 mb-1 block">מקסימום</label>
                <Input
                  type="number"
                  value={custom.max}
                  onChange={e => setCustom({ ...custom, max: e.target.value })}
                  onBlur={applyCustom}
                  className="bg-[#252525] border-[#444] text-white h-10 rounded-xl text-center"
                  min={18}
                  max={60}
                />
              </div>
            </div>

            {isFiltered && (
              <button
                onClick={clearFilter}
                className="text-[#D4AF37] text-sm hover:underline w-full text-center"
              >
                נקה סינון
              </button>
            )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

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