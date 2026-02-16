import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SlidersHorizontal, X } from "lucide-react";

const PRESETS = [
  { label: "18–25", min: 18, max: 25 },
  { label: "25–30", min: 25, max: 30 },
  { label: "30–35", min: 30, max: 35 },
  { label: "35–45", min: 35, max: 45 },
];

export default function AgeFilter({ ageRange, locationFilter, onChangeRange, onChangeLocation }) {
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
              <Select value={locationFilter} onValueChange={onChangeLocation} dir="rtl">
                <SelectTrigger className="bg-[#252525] border-[#444] text-white h-10 rounded-xl">
                  <SelectValue className="text-right" />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A1A] border-[#333]" align="end">
                  <SelectItem value="all" className="text-white">כל האיזורים</SelectItem>
                  <SelectItem value="tel_aviv" className="text-white">תל אביב</SelectItem>
                  <SelectItem value="south" className="text-white">דרום</SelectItem>
                  <SelectItem value="north" className="text-white">צפון</SelectItem>
                </SelectContent>
              </Select>
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
    </div>
  );
}