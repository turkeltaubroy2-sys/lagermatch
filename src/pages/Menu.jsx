import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BottomNav from "@/components/BottomNav";

const categories = [
  {
    id: "draft",
    label: "🍺 בירות שפ",
    emoji: "🍺",
    items: [
      { name: "גינס", name_en: "Guinness", price: "₪19 / ₪23", note: "סטאוט אירי קלאסי" },
      { name: "הוגארדן", name_en: "Hoegaarden", price: "₪19 / ₪23", note: "וויט בלג'ית" },
      { name: "מלכה", name_en: "Malka", price: "₪15 / ₪19", note: "ישראלי מתחלף" },
      { name: "טובורג", name_en: "Tuborg", price: "₪15 / ₪19", note: "לאגר ענברי" },
      { name: "קרלסברג", name_en: "Carlsberg", price: "₪15 / ₪19", note: "לאגר קלאסי" },
      { name: "פולסטאר", name_en: "Paulaner", price: "₪19 / ₪23", note: "וויס בייר גרמנית" },
      { name: "בירה מתחלפת", name_en: "Rotating Craft", price: "₪19 / ₪23", note: "שאלו את הברמן 🍻" },
    ]
  },
  {
    id: "spirits",
    label: "🥃 ספיריטס",
    emoji: "🥃",
    items: [
      { name: "ג'ק דניאלס", name_en: "Jack Daniel's", price: "₪29", note: "American Whiskey" },
      { name: "ג'יימסון", name_en: "Jameson", price: "₪29", note: "Irish Whiskey" },
      { name: "גלנפידיך 12", name_en: "Glenfiddich 12", price: "₪29", note: "Single Malt" },
      { name: "הנסי VS", name_en: "Hennessy VS", price: "₪29", note: "Cognac" },
      { name: "טאנקריי", name_en: "Tanqueray", price: "₪29", note: "Gin" },
      { name: "קטל ואן", name_en: "Ketel One", price: "₪29", note: "Vodka" },
      { name: "קפטן מורגן", name_en: "Captain Morgan", price: "₪29", note: "Rum" },
      { name: "מילאגרו סילבר", name_en: "Milagro Silver", price: "₪29", note: "Tequila" },
      { name: "ג'ני ווקר בלאק", name_en: "JW Black Label", price: "₪29", note: "Blended Scotch" },
    ]
  },
  {
    id: "wine",
    label: "🍷 יין",
    emoji: "🍷",
    items: [
      { name: "אדום", name_en: "Red Wine", price: "₪20 / ₪79", note: "כוס / בקבוק" },
      { name: "לבן", name_en: "White Wine", price: "₪20 / ₪79", note: "כוס / בקבוק" },
      { name: "רוזה", name_en: "Rosé", price: "₪19 / ₪79", note: "כוס / בקבוק" },
      { name: "למברוסקו", name_en: "Lambrusco", price: "₪20 / ₪89", note: "כוס / בקבוק" },
    ]
  },
  {
    id: "food",
    label: "🍟 אוכל",
    emoji: "🍟",
    items: [
      { name: "ערעיס", name_en: "Ara'is", price: "₪35", note: "כריך בשר מוגרבי בגריל 🔥" },
      { name: "פריז", name_en: "Fries", price: "₪22", note: "פריכות, עם רטבים" },
      { name: "נאגטס", name_en: "Nuggets", price: "₪32", note: "עוף פריך" },
      { name: "פינגרס", name_en: "Chicken Fingers", price: "₪35", note: "פס פרימיום" },
      { name: "ברגר", name_en: "Burger", price: "₪48", note: "עם צ'יפס" },
    ]
  }
];

export default function Menu() {
  const [activeCategory, setActiveCategory] = useState("draft");

  const current = categories.find(c => c.id === activeCategory);

  return (
    <div className="min-h-screen bg-[#0F0F0F] pb-24 max-w-md mx-auto">
      {/* Header */}
      <div className="relative overflow-hidden pt-10 pb-6 px-5">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#D4AF37]/8 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-[#FE3C72]/6 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 text-center">
          <p className="text-[10px] font-semibold tracking-[0.35em] uppercase text-[#D4AF37]/60 mb-2">Lager & Ale</p>
          <h1 className="font-display text-4xl font-black bg-gradient-to-r from-[#D4AF37] via-[#F5E6A3] to-[#D4AF37] bg-clip-text text-transparent tracking-tight mb-1">
            התפריט שלנו
          </h1>
          <p className="text-[11px] text-white/25 tracking-[0.2em] uppercase font-medium">Self Service · Bar Menu</p>
          <div className="mt-3 w-12 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent mx-auto" />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="px-4 mb-5">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-2xl text-sm font-bold transition-all duration-300 ${
                activeCategory === cat.id
                  ? "bg-gradient-to-r from-[#D4AF37] to-[#F5E6A3] text-[#0F0F0F] shadow-lg shadow-[#D4AF37]/30"
                  : "bg-[#1A1A1A] text-white/40 border border-white/10 hover:text-white/60"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Items */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="px-4 space-y-3"
        >
          {current.items.map((item, i) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-gradient-to-br from-[#1A1A1A] to-[#161616] border border-white/[0.07] rounded-2xl px-5 py-4 flex items-center justify-between"
            >
              <div className="flex-1">
                <p className="font-bold text-white text-base leading-tight">{item.name}</p>
                <p className="text-[11px] text-white/35 mt-0.5 font-medium tracking-wide">{item.name_en} · {item.note}</p>
              </div>
              <div className="mr-4 text-right flex-shrink-0">
                <span className="font-black text-[#D4AF37] text-lg">{item.price}</span>
              </div>
            </motion.div>
          ))}

          {/* Bottom note */}
          <div className="text-center pt-3 pb-2">
            <p className="text-[10px] text-white/15 tracking-widest uppercase">עוד אפשרויות? שאלו את הברמן 🍺</p>
          </div>
        </motion.div>
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}