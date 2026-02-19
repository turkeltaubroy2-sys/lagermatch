import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BottomNav from "@/components/BottomNav";

const categories = [
  {
    id: "food_main",
    label: "🍔 אוכל קדימה",
    items: [
      { name: "שניצלונים בטמפורה & צ'יפס", price: "₪55", note: "" },
      { name: "FISH & CHIPS", price: "₪55", note: "" },
      { name: "L&A סמאש בורגר+צ'יפס", price: "₪59", note: "סמאש בורגר 160 גרם בלחמניית בריוש רכה עם פרוסות עגבניה, בצל סגל וחסה קאוצ'ה בצד. מוגש בתוספת צ'יפס..." },
      { name: "המבורגר טבעוני", price: "₪56", note: "קטשופ פלפלים, חסה, עגבניה, בצל. תוספת צ'יפס ₪13+" },
      { name: "ערעיס", price: "₪48", note: "פיתה בשר מוגשת לצד עגבניות שרי, זיתים וטחינה" },
      { name: "פיצה מרגריטה", price: "₪35", note: "" },
      { name: "צ'יפס מיקס", price: "₪34", note: "צ'יפס בטטה ותפו\"א" },
      { name: "טבעות בצל", price: "₪32", note: "מוגש עם רוטב ציפולה" },
      { name: "CORNEDBEEF SANDWICH", price: "₪48", note: "160 גרם קורנבדיף עם חרדל דיזיון, בלחם קסטון כפרי וכרוב תוצרת בית" },
      { name: "CUBANO SANDWICH", price: "₪38", note: "פרוסות נקניק חזיר וכתפי בקר מעושן, מוגש בג'בטה בתנור אבן, איולי שום, ריבת בצל, חרדל דבש, ופרוסות מלפיפון חמוץ" },
    ]
  },
  {
    id: "food_side",
    label: "🥙 אוכל ליד הבירה",
    items: [
      { name: "TOAST CHEESE AND CHUTNEY", price: "₪39", note: "גבינת גאודה, צ'טני וחרדל דבש" },
      { name: "DOUBLE MINI HOTDOG - עוף", price: "₪32", note: "נקניקיית עוף איכותית לבחירה בלחמניה עם חרדל וכרוב כבוש" },
      { name: "DOUBLE MINI HOTDOG - עגל/ צ'וריסו", price: "₪38", note: "נקניקיה איכותית לבחירה בלחמניה עם חרדל וכרוב כבוש. מגוון נקניקיות לבחירה: עגל/ צ'וריסו" },
      { name: "נישנושי נקניקיות - עוף", price: "₪14", note: "" },
      { name: "נישנושי נקניקיות - לבחירה: עגל או צ'וריסו", price: "₪22", note: "" },
      { name: "CREAMY NACHOS", price: "₪38", note: "נאצ'וס מוקרם עם גבינה כחולה, צ'דר, גואקמולי, סלסת עגבניות וחלפיניו" },
      { name: "CAPRESE", price: "₪28", note: "שרי צבעוניות, פסטו, בלסמי ובייבי מוצרלה" },
      { name: "HOME FRIES", price: "₪32", note: "קוביות תפו\"א ברוטב צ'ילי מתוק" },
      { name: "אדממה", price: "₪34", note: "" },
      { name: "OLIVE MIX", price: "₪18", note: "זיתי קלמטה, זית ירוק ענק, בצלצלי שאלוט" },
      { name: "סניידרס בטעמים", price: "₪25", note: "שקית גדולה של שברי ביגלה בטעמים משתנים" },
    ]
  },
  {
    id: "beers",
    label: "🍺 בירות",
    subcategories: [
      {
        label: "לאגר",
        items: [
          { name: "וויינשטפן WINTERFEST", price: "₪23/39", note: "לאגר גרמני עונתי 5.8% | מוגשת: 500/1,000 מ\"ל | בירת חורף עונתית עם ארומה פירותית וטעם עשיר ומאוזן" },
          { name: "באדוויזר", price: "₪19/22", note: "לאגר אמריקאי 5%" },
          { name: "קרלסברג לומה", price: "₪18/21", note: "לאגר לא מסוננת 5.2%" },
          { name: "סטלה ארטואה", price: "₪18/22/39", note: "לאגר 5%" },
          { name: "טובורג", price: "₪16/19", note: "לאגר ענברי 5.2%" },
          { name: "אסטרייה דאם", price: "₪18/22", note: "לאגר 4.6%" },
        ]
      },
      {
        label: "אייל",
        items: [
          { name: "נגב אוואזים", price: "₪19/24", note: "אייל לא מסוננת 4.7%" },
          { name: "קסטיל רוזי", price: "₪24", note: "אייל דובדבנים חזק 8% | 330ml" },
          { name: "קסטיל רובוס", price: "₪24", note: "אייל פטל (רובוס) חזק 6.8% | 330ml" },
          { name: "מרדסו", price: "₪24", note: "טריפל אייל חזקה 10% | 330ml" },
          { name: "ליפמנס און דה רוקס", price: "₪23", note: "אייל פירותי 3.8% | 280ml" },
          { name: "מלכה אדמונית", price: "₪19/24", note: "פייל אייל אנגלי 5.5%" },
          { name: "לף בלונד", price: "₪22", note: "אייל בהירה 6.6% | 330ml" },
        ]
      },
      {
        label: "IPA",
        items: [
          { name: "הרצל HAZY שמייזי", price: "₪19/23", note: "הייזי IPA לא מסוננת 5.5%" },
          { name: "אלכסנדר גרין", price: "₪19/23", note: "IPA 6%" },
          { name: "שקמה IPA", price: "₪19/24", note: "IPA 5.2%" },
        ]
      },
      {
        label: "חיטה",
        items: [
          { name: "פראנציסקנר", price: "₪18/23/39", note: "חיטה בהירה 5%" },
          { name: "וויינשטפן דונקל", price: "₪18/23/39", note: "חיטה כהה 5.3% | מוגשת 330/500/1,000 מ\"ל" },
          { name: "וויינשטפן ויטוס", price: "₪19/23/39", note: "וויצבוק 7.7%" },
          { name: "הוגרדן", price: "₪21", note: "חיטה בלגית לא מסוננת 4.9% | 330ml" },
          { name: "בלאנק 1664", price: "₪19/24", note: "חיטה צרפתית 5%" },
          { name: "בלומון", price: "₪19/23", note: "חיטה אמריקאית 5.4%" },
        ]
      },
      {
        label: "סטאוט",
        items: [
          { name: "גינס", price: "₪18/23", note: "סטאוט 4.2%" },
        ]
      }
    ]
  },
  {
    id: "deals",
    label: "🥃 מבצעים וצ'ייסרים",
    items: [
      { name: "4 צ'ייסרים לבחירה", price: "₪34", note: "גלנמורנג'י איקס | ג'וני ווקר בלונד | גרנטס | טלמור דיו | קמפרי | גים בים תפוח | גים בים דבש" },
      { name: "4 צ'ייסרים לבחירה", price: "₪44", note: "גלנמורנג'י 10 | גלנפידיך 12 | ג'וני ווקר בלאק לייבל | מילאגרו סילבר | קאסה אמיגוס בלאנקו | גין ברודוג רון וולף | יגרמייסטר" },
    ]
  },
  {
    id: "wine",
    label: "🍷 יין",
    items: [
      { name: "עמק האלה אדום", price: "₪25/99", note: "כוס / בקבוק" },
      { name: "עמק האלה לבן", price: "₪25/99", note: "כוס / בקבוק" },
      { name: "עמק האלה רוזה", price: "₪99", note: "בקבוק בלבד" },
      { name: "אדום", price: "₪20/79", note: "כוס / בקבוק" },
      { name: "לבן", price: "₪20/79", note: "כוס / בקבוק" },
      { name: "רוזה", price: "₪89", note: "בקבוק בלבד" },
    ]
  },
];

export default function Menu() {
  const [activeCategory, setActiveCategory] = useState("food_main");
  const [openSub, setOpenSub] = useState({ לאגר: true, אייל: false, IPA: false, חיטה: false, סטאוט: false });

  const current = categories.find(c => c.id === activeCategory);

  return (
    <div className="min-h-[100dvh] bg-[#0F0F0F] pb-28 max-w-md mx-auto">
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
      <div className="px-4 mb-5 overflow-x-auto">
        <div className="flex gap-2 pb-1" style={{ width: "max-content" }}>
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
          transition={{ duration: 0.2 }}
          className="px-4 space-y-2"
        >
          {/* Beer subcategories */}
          {current.subcategories ? (
            <div className="space-y-2">
              {current.subcategories.map(sub => (
                <div key={sub.label}>
                  <button
                    onClick={() => setOpenSub(s => ({ ...s, [sub.label]: !s[sub.label] }))}
                    className="w-full flex justify-between items-center px-4 py-3 bg-[#1A1A1A] border border-white/10 rounded-2xl text-white font-bold text-base mb-1"
                  >
                    <span className="text-[#D4AF37]">{sub.label}</span>
                    <span className="text-white/40 text-lg">{openSub[sub.label] ? "▲" : "▼"}</span>
                  </button>
                  <AnimatePresence>
                    {openSub[sub.label] && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2 overflow-hidden"
                      >
                        {sub.items.map((item, i) => (
                          <motion.div
                            key={item.name}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.04 }}
                            className="bg-gradient-to-br from-[#1A1A1A] to-[#161616] border border-white/[0.07] rounded-2xl px-5 py-4 flex items-start justify-between"
                          >
                            <div className="flex-1">
                              <p className="font-bold text-white text-base leading-tight">{item.name}</p>
                              {item.note && <p className="text-[11px] text-white/35 mt-0.5 font-medium leading-snug">{item.note}</p>}
                            </div>
                            <div className="mr-4 text-right flex-shrink-0">
                              <span className="font-black text-[#D4AF37] text-base">{item.price}</span>
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          ) : (
            current.items.map((item, i) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-gradient-to-br from-[#1A1A1A] to-[#161616] border border-white/[0.07] rounded-2xl px-5 py-4 flex items-start justify-between"
              >
                <div className="flex-1">
                  <p className="font-bold text-white text-base leading-tight">{item.name}</p>
                  {item.note && <p className="text-[11px] text-white/35 mt-1 font-medium leading-snug">{item.note}</p>}
                </div>
                <div className="mr-4 text-right flex-shrink-0">
                  <span className="font-black text-[#D4AF37] text-base">{item.price}</span>
                </div>
              </motion.div>
            ))
          )}

          <div className="text-center pt-3 pb-2">
            <p className="text-[10px] text-white/15 tracking-widest uppercase">שירות עצמי · Self Service 🍺</p>
          </div>
        </motion.div>
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}