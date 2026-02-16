import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SlidersHorizontal, X } from "lucide-react";

const PRESETS = [
  { label: "18–25", min: 18, max: 25 },
  { label: "25–30", min: 25, max: 30 },
  { label: "30–35", min: 30, max: 35 },
  { label: "35–45", min: 35, max: 45 },
];

export default function AgeFilter({ ageRange, onChangeRange }) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState({ min: ageRange.min, max: ageRange.max });

  const applyPreset = (preset) => {
    setCustom({ min: preset.min, max: preset.max });
    onChangeRange(preset.min, preset.max);
  };

  const applyCustom = () => {
    const min = Math.max(18, Math.min(parseInt(custom.min) || 18, 60));
    const max = Math.max(min, Math.min(parseInt(custom.max) || 60, 60));
    setCustom({ min, max });
    onChangeRange(min, max);
  };

  const clearFilter = () => {
    setCustom({ min: 18, max: 60 });
    onChangeRange(18, 60);
  };

  const isFiltered = ageRange.min !== 18 || ageRange.max !== 60;

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
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-12 left-0 right-0 min-w-[280px] bg-[#1A1A1A] border border-[#333] rounded-2xl p-5 z-50 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-semibold">סינון לפי גיל</h3>
              <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Presets */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {PRESETS.map(p => (
                <button
                  key={p.label}
                  onClick={() => applyPreset(p)}
                  className={`px-3 py-2 rounded-xl text-sm transition-all ${
                    ageRange.min === p.min && ageRange.max === p.max
                      ? "bg-[#D4AF37] text-[#0F0F0F] font-semibold"
                      : "bg-[#252525] text-white/60 hover:bg-[#333]"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

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
        )}
      </AnimatePresence>
    </div>
  );
}