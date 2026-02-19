import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BottomNav from "@/components/BottomNav";

const categories = [
  {
    id: "beers",
    label: "🍺 בירות",
    items: [
      { name: "גינס", name_en: "Guinness", price: "₪19 / ₪23", note: "שליש / חצי | Stout אירי קלאסי" },
      { name: "הוגארדן", name_en: "Hoegaarden", price: "₪19 / ₪23", note: "שליש / חצי | White Ale בלגית" },
      { name: "מלכה", name_en: "Malka", price: "₪15 / ₪19", note: "שליש / חצי | ישראלית מתחלפת" },
      { name: "טובורג", name_en: "Tuborg", price: "₪15 / ₪19", note: "שליש / חצי | לאגר ענברי" },
      { name: "קרלסברג", name_en: "Carlsberg", price: "₪15 / ₪19", note: "שליש / חצי | לאגר קלאסי" },
      { name: "פאולנר", name_en: "Paulaner", price: "₪19 / ₪23", note: "שליש / חצי | Weiss בווארית" },
      { name: "פרוטי אייל", name_en: "Fruity Ale", price: "₪19 / ₪23", note: "שליש / חצי | אייל פירותי" },
      { name: "טריפל אייל", name_en: "Tripel Ale", price: "₪19 / ₪23", note: "שליש / חצי" },
      { name: "סטרונג פרוטי אייל", name_en: "Strong Fruity Ale", price: "₪19 / ₪23", note: "שליש / חצי" },
      { name: "בירה מתחלפת", name_en: "Rotating Tap", price: "מ-₪15", note: "שאלו את הברמן 🍻" },
    ]
  },
  {
    id: "deals",
    label: "🥃 מבצעים וצ'ייסרים",
    items: [
      { name: "צ'ייסר קלאסי", name_en: "Classic Chaser", price: "₪15", note: "ג'ק / וויסקי + שוט בירה" },
      { name: "צ'ייסר פרימיום", name_en: "Premium Chaser", price: "₪25", note: "ספיריט פרימיום + שוט בירה" },
      { name: "קוקטייל הבר", name_en: "Bar Cocktail", price: "₪29", note: "שאלו את הברמן 🍹" },
      { name: "עסקית א׳-ה׳ 12:00-16:00", name_en: "Daily Deal", price: "מיוחד", note: "DEAL WITH IT 🔥 כולל אוכל ושתייה" },
    ]
  },
  {
    id: "whiskey",
    label: "🥃 וויסקי",
    items: [
      { name: "ג'ק דניאלס", name_en: "Jack Daniel's", price: "₪29", note: "American Whiskey" },
      { name: "בולייט ריי", name_en: "Bulleit Rye", price: "₪39", note: "American Rye" },
      { name: "ווילד טרקי 81", name_en: "Wild Turkey 81", price: "₪29", note: "American Bourbon" },
      { name: "ג'ים בים אפל / הוני", name_en: "Jim Beam Apple / Honey", price: "₪29", note: "Flavored Bourbon" },
      { name: "ג'יימסון אוריג'ינל", name_en: "Jameson Original", price: "₪29", note: "Irish Whiskey" },
      { name: "טולמור דיו", name_en: "Tullamore D.E.W.", price: "₪29", note: "Irish Whiskey" },
      { name: "קונמרה", name_en: "Connemara", price: "₪39", note: "Irish Peated" },
      { name: "גלנפידיך 12", name_en: "Glenfiddich 12", price: "₪29", note: "Single Malt Scotch" },
      { name: "גלנפידיך 15", name_en: "Glenfiddich 15", price: "₪39", note: "Single Malt Scotch" },
      { name: "מקאלן 12", name_en: "The Macallan 12", price: "₪39", note: "Single Malt Scotch" },
      { name: "גלנמוראנג'י X", name_en: "Glenmorangie X", price: "₪29", note: "Single Malt Scotch" },
      { name: "גלנמוראנג'י 10", name_en: "Glenmorangie 10", price: "₪29", note: "Single Malt Scotch" },
      { name: "גלנמוראנג'י לסאנטה", name_en: "Glenmorangie Lasanta", price: "₪39", note: "Sherry Cask Finish" },
      { name: "גלנמוראנג'י קווינטה רובן", name_en: "Glenmorangie Quinta Ruban", price: "₪39", note: "Port Cask Finish" },
      { name: "גלנמוראנג'י נקטר דאור", name_en: "Glenmorangie Nectar D'Or", price: "₪39", note: "Sauternes Cask Finish" },
      { name: "טאליסקר 10", name_en: "Talisker 10", price: "₪39", note: "Island Single Malt" },
      { name: "ארדבג 10", name_en: "Ardbeg 10", price: "₪39", note: "Islay Single Malt" },
      { name: "לאפרוייג 10", name_en: "Laphroaig 10", price: "₪39", note: "Islay Single Malt" },
      { name: "לגווולין 16", name_en: "Lagavulin 16", price: "₪49", note: "Islay Single Malt" },
      { name: "ג'וני ווקר בלונד", name_en: "Johnnie Walker Blonde", price: "₪29", note: "Blended Scotch" },
      { name: "ג'וני ווקר בלאק", name_en: "Johnnie Walker Black Label", price: "₪29", note: "Blended Scotch" },
      { name: "ג'וני ווקר בלו", name_en: "Johnnie Walker Blue Label", price: "₪89", note: "Blended Scotch Premium" },
      { name: "מאנקי שולדר", name_en: "Monkey Shoulder", price: "₪29", note: "Blended Malt" },
      { name: "גראנטס", name_en: "Grant's", price: "₪29", note: "Blended Scotch" },
      { name: "גראנטס 12", name_en: "Grant's 12", price: "₪39", note: "Blended Scotch 12yr" },
      { name: "ברודוג לאון וולף", name_en: "BrewDog Lone Wolf", price: "₪39", note: "Craft Whisky" },
      { name: "ברודוג 500 קאטס", name_en: "BrewDog Five Hundred Cuts", price: "₪39", note: "Craft Whisky" },
      { name: "ביקי", name_en: "Biki", price: "₪49", note: "Japanese Whisky" },
      { name: "רויאל לוכנגאר", name_en: "Royal Lochnagar", price: "₪39", note: "Highland Single Malt" },
    ]
  },
  {
    id: "spirits",
    label: "🍸 ספיריטס",
    items: [
      { name: "מילאגרו סילבר", name_en: "Milagro Silver", price: "₪29", note: "Tequila" },
      { name: "אספולון רפוסאדו", name_en: "Espolon Reposado", price: "₪29", note: "Tequila" },
      { name: "קאסה אמיגוס בלאנקו", name_en: "Casa Amigos Blanco", price: "₪39", note: "Tequila" },
      { name: "פטרון רפוסאדו", name_en: "Patron Reposado", price: "₪39", note: "Tequila" },
      { name: "קטל ואן", name_en: "Ketel One", price: "₪29", note: "Vodka" },
      { name: "סטוליצ'נאיה", name_en: "Stolichnaya", price: "₪29", note: "Vodka" },
      { name: "בלבדר", name_en: "Belvedere", price: "₪39", note: "Vodka Premium" },
      { name: "גריי גוס", name_en: "Grey Goose", price: "₪39", note: "Vodka Premium" },
      { name: "טאנקריי", name_en: "Tanqueray", price: "₪29", note: "Gin" },
      { name: "גורדון'ס פינק", name_en: "Gordon's Pink", price: "₪29", note: "Gin Pink" },
      { name: "לינד & ליים", name_en: "Lind & Lime", price: "₪39", note: "Gin Craft" },
      { name: "הנדריקס", name_en: "Hendrick's", price: "₪39", note: "Gin Premium" },
      { name: "קפטן מורגן דארק", name_en: "Captain Morgan Dark", price: "₪29", note: "Rum" },
      { name: "קפטן מורגן ספייסד", name_en: "Captain Morgan Spiced", price: "₪29", note: "Rum Spiced" },
      { name: "הנסי VS", name_en: "Hennessy VS", price: "₪29", note: "Cognac" },
      { name: "קמפרי", name_en: "Campari", price: "₪29", note: "Liqueur" },
      { name: "פיג", name_en: "Fig", price: "₪29", note: "Liqueur" },
      { name: "יגרמייסטר", name_en: "Jagermeister", price: "₪29", note: "Herbal Liqueur" },
      { name: "שרטרז", name_en: "Chartreuse", price: "₪39", note: "Herbal Liqueur" },
      { name: "ארק", name_en: "Arak", price: "₪29", note: "אניז ישראלי" },
      { name: "אוזו 12", name_en: "Ouzo 12", price: "₪29", note: "Anise" },
    ]
  },
  {
    id: "wine",
    label: "🍷 יין",
    items: [
      { name: "אדום", name_en: "Red Wine", price: "₪20 / ₪79", note: "כוס / בקבוק" },
      { name: "לבן", name_en: "White Wine", price: "₪20 / ₪79", note: "כוס / בקבוק" },
      { name: "רוזה", name_en: "Rosé", price: "₪19 / ₪79", note: "כוס / בקבוק" },
      { name: "למברוסקו", name_en: "Lambrusco", price: "₪20 / ₪89", note: "כוס / בקבוק | יין מבעבע אדום" },
    ]
  },
  {
    id: "food_main",
    label: "🍔 אוכל קדימה",
    items: [
      { name: "ברגר", name_en: "Burger", price: "₪49", note: "קציצת בקר, חסה, עגבנייה, חמוצים, רטב הבר" },
      { name: "ברגר כפול", name_en: "Double Burger", price: "₪59", note: "שתי קציצות" },
      { name: "נאגטס", name_en: "Nuggets", price: "₪32", note: "עוף פריך, 8 יח׳, עם רטבים" },
      { name: "פינגרס", name_en: "Chicken Fingers", price: "₪35", note: "פסי עוף פריכים, עם רטבים" },
      { name: "נקניקיות ברביקיו", name_en: "BBQ Sausages", price: "₪38", note: "עם חרדל ורוטב ביתי" },
      { name: "צ'יפס", name_en: "Fries", price: "₪22", note: "פריכות, עם רטבים לבחירה" },
      { name: "צ'יפס עם גבינה", name_en: "Cheese Fries", price: "₪28", note: "ציפס + גבינה מומסת" },
    ]
  },
  {
    id: "food_side",
    label: "🥙 אוכל ליד הבירה",
    items: [
      { name: "ערעיס", name_en: "Ara'is", price: "₪35", note: "⭐ הכי מומלץ! כריך בשר מוגרבי על הגריל" },
      { name: "נאצ'וס", name_en: "Nachos", price: "₪32", note: "צ'יפס תירס, גבינה, גוואקמולה, סלסה" },
      { name: "ביצי שלו", name_en: "Deviled Eggs", price: "₪25", note: "ביצים קשות עם מיונז, פפריקה" },
      { name: "זיתים", name_en: "Olives", price: "₪18", note: "זיתים מתובלים" },
      { name: "ברקס", name_en: "Borekas", price: "₪22", note: "מוגשים חמים עם רטבים" },
    ]
  },
];

export default function Menu() {
  const [activeCategory, setActiveCategory] = useState("beers");

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

      {/* Category Tabs - scrollable */}
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
          {current.items.map((item, i) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-gradient-to-br from-[#1A1A1A] to-[#161616] border border-white/[0.07] rounded-2xl px-5 py-4 flex items-center justify-between"
            >
              <div className="flex-1">
                <p className="font-bold text-white text-base leading-tight">{item.name}</p>
                <p className="text-[11px] text-white/35 mt-0.5 font-medium leading-snug">{item.name_en} · {item.note}</p>
              </div>
              <div className="mr-4 text-right flex-shrink-0">
                <span className="font-black text-[#D4AF37] text-base">{item.price}</span>
              </div>
            </motion.div>
          ))}

          <div className="text-center pt-3 pb-2">
            <p className="text-[10px] text-white/15 tracking-widest uppercase">עוד אפשרויות? שאלו את הברמן 🍺</p>
          </div>
        </motion.div>
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}