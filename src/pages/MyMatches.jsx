import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { ArrowRight, Heart, Wine, MessageCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

export default function MyMatches() {
  const [myProfile, setMyProfile] = useState(null);
  const [matches, setMatches] = useState([]);
  const [matchProfiles, setMatchProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    const deviceId = localStorage.getItem("wedding_device_id");
    if (!deviceId) {
      window.location.href = createPageUrl("Home");
      return;
    }

    const myProfiles = await base44.entities.Profile.filter({ device_id: deviceId });
    if (myProfiles.length === 0) {
      window.location.href = createPageUrl("Home");
      return;
    }

    const me = myProfiles[0];
    setMyProfile(me);

    const allMatches = await base44.entities.Match.filter({});
    const myMatches = allMatches.filter(
      m => m.user1_id === me.id || m.user2_id === me.id
    );

    const allProfiles = await base44.entities.Profile.filter({});
    const profileMap = {};
    allProfiles.forEach(p => { profileMap[p.id] = p; });

    const matched = myMatches.map(m => {
      const otherId = m.user1_id === me.id ? m.user2_id : m.user1_id;
      return { match: m, profile: profileMap[otherId] };
    }).filter(item => item.profile);

    setMatches(myMatches);
    setMatchProfiles(matched);
    setLoading(false);
  };

  const handleSendDrink = async (targetProfile) => {
    await base44.entities.Drink.create({
      sender_id: myProfile.id,
      receiver_id: targetProfile.id,
      status: "pending",
    });
    toast({
      title: "🍸 המשקה נשלח!",
      description: `שלחת משקה ל${targetProfile.first_name}`,
    });
  };

  const handleSendMessage = (targetProfile) => {
    toast({
      title: `💬 פנה/י ל${targetProfile.first_name}`,
      description: "לכו למצוא אחד את השנייה על הרחבה!",
    });
  };

  const handleDeleteMatch = async (matchId, targetProfile) => {
    await base44.entities.Match.delete(matchId);
    toast({
      title: "ההתאמה הוסרה",
      description: `הוסרת את ההתאמה עם ${targetProfile.first_name}`,
    });
    loadMatches();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F0F0F]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Heart className="w-12 h-12 text-[#D4AF37]" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] px-5 py-6 max-w-md mx-auto">
      {/* Header */}
      <div className="flex flex-col items-center mb-8">
        <div className="flex items-center justify-between w-full mb-2">
          <Link to={createPageUrl("Swipe")} className="text-white/50 hover:text-white">
            <ArrowRight className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold shimmer-gold">💕 ההתאמות שלי</h1>
          <div className="w-6" />
        </div>
        <p className="text-xs text-white/20">רועי ויעל 💍</p>
      </div>

      {matchProfiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center mt-20">
          <motion.div
            className="text-6xl mb-4"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            💔
          </motion.div>
          <h2 className="text-xl font-bold text-white/80 mb-2">עדיין אין התאמות</h2>
          <p className="text-white/40 text-sm text-center mb-6">
            המשיכו להחליק, ההתאמה הבאה מחכה לכם!
          </p>
          <Link to={createPageUrl("Swipe")}>
            <Button className="bg-gradient-to-r from-[#B8941F] via-[#D4AF37] to-[#F5E6A3] text-[#0F0F0F] font-bold rounded-xl px-8">
              חזרה להחלקות
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {matchProfiles.map((item, i) => (
            <motion.div
              key={item.profile.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-gradient-to-br from-[#1A1A1A] to-[#1F1F1F] border border-[#333] rounded-3xl p-4 shadow-lg"
            >
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full overflow-hidden border-3 border-[#D4AF37] shadow-lg shadow-[#D4AF37]/20 flex-shrink-0">
                  <img
                    src={item.profile.photo_url}
                    alt={item.profile.first_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-black text-xl mb-1">{item.profile.first_name}</h3>
                  <p className="text-white/50 text-sm">{item.profile.age} • {
                    item.profile.location === "tel_aviv" ? "תל אביב" :
                    item.profile.location === "south" ? "דרום" : "צפון"
                  }</p>
                  {item.profile.favorite_drink && (
                    <p className="text-[#D4AF37] text-xs mt-1">🍸 {item.profile.favorite_drink}</p>
                  )}
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <Button
                    onClick={() => handleSendMessage(item.profile)}
                    size="sm"
                    className="bg-gradient-to-r from-[#B8941F] to-[#D4AF37] text-[#0F0F0F] font-bold rounded-xl h-9 px-3 hover:opacity-90 transition-all"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => handleDeleteMatch(item.match.id, item.profile)}
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-xl h-9 px-3"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}