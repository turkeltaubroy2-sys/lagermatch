import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Heart, MessageCircle, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import BottomNav from "@/components/BottomNav";

export default function MyMatches() {
  const [myProfile, setMyProfile] = useState(null);
  const [matches, setMatches] = useState([]);
  const [matchProfiles, setMatchProfiles] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    const deviceId = localStorage.getItem("wedding_device_id");
    if (!deviceId) {
      navigate(createPageUrl("Home"));
      return;
    }

    const myProfiles = await base44.entities.Profile.filter({ device_id: deviceId });
    if (myProfiles.length === 0) {
      navigate(createPageUrl("Home"));
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

    // Calculate unread messages per conversation
    const allMessages = await base44.entities.Message.filter({});
    const unreadMap = {};
    matched.forEach(item => {
      const otherId = item.match.user1_id === me.id ? item.match.user2_id : item.match.user1_id;
      const unreadFromOther = allMessages.filter(
        msg => msg.sender_id === otherId && msg.receiver_id === me.id
      );
      if (unreadFromOther.length > 0) {
        unreadMap[otherId] = unreadFromOther.length;
      }
    });

    setMatches(myMatches);
    setMatchProfiles(matched);
    setUnreadCounts(unreadMap);
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
      duration: 2000,
    });
  };

  const handleSendMessage = (matchId) => {
    navigate(createPageUrl("Chat") + `?matchId=${matchId}`);
  };

  const handleDeleteMatch = async (matchId, targetProfile) => {
    try {
      // Delete all messages between the two users
      const allMessages = await base44.entities.Message.filter({});
      const messagesToDelete = allMessages.filter(
        msg => (msg.sender_id === myProfile.id && msg.receiver_id === targetProfile.id) ||
                (msg.sender_id === targetProfile.id && msg.receiver_id === myProfile.id)
      );

      for (const msg of messagesToDelete) {
        await base44.entities.Message.delete(msg.id);
      }

      // Delete the match
      await base44.entities.Match.delete(matchId);
      setMatchProfiles(prev => prev.filter(item => item.match.id !== matchId));
      setMatches(prev => prev.filter(m => m.id !== matchId));
    } catch (error) {
      // Match already deleted, just update UI
      setMatchProfiles(prev => prev.filter(item => item.match.id !== matchId));
      setMatches(prev => prev.filter(m => m.id !== matchId));
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMatches();
    setRefreshing(false);
    toast({ title: "🔄 הרשימה עודכנה", duration: 2000 });
  };

  useEffect(() => {
    let startY = 0;
    const handleTouchStart = (e) => {
      if (window.scrollY === 0) {
        startY = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e) => {
      if (window.scrollY === 0 && !refreshing) {
        const currentY = e.touches[0].clientY;
        if (currentY - startY > 80) {
          handleRefresh();
        }
      }
    };

    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove);
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [refreshing]);

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
    <div className="min-h-screen bg-[#0F0F0F] px-5 py-6 max-w-md mx-auto pb-20">
      {/* Pull to refresh indicator */}
      {refreshing && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#D4AF37] text-[#0F0F0F] px-4 py-2 rounded-full text-sm font-bold">
          <RefreshCw className="w-4 h-4 inline ml-1 animate-spin" />
          מעדכן...
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col items-center mb-8">
        <h1 className="font-display text-3xl font-black bg-gradient-to-r from-[#FE3C72] via-[#FF6B9D] to-[#D4AF37] bg-clip-text text-transparent mb-1 tracking-tight">🔥 ההתאמות שלי</h1>
        <p className="text-[10px] font-semibold tracking-[0.3em] uppercase text-white/25">Lets goooo 🔥</p>
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
                    onClick={() => handleSendMessage(item.match.id)}
                    size="sm"
                    className="bg-gradient-to-r from-[#B8941F] to-[#D4AF37] text-[#0F0F0F] font-bold rounded-xl h-9 px-3 hover:opacity-90 transition-all relative"
                  >
                    <MessageCircle className="w-4 h-4" />
                    {unreadCounts[item.profile.id] > 0 && (
                      <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                        {unreadCounts[item.profile.id] > 9 ? "9+" : unreadCounts[item.profile.id]}
                      </div>
                    )}
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

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}