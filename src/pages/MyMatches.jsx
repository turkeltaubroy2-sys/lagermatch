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

    // Fetch matches as both user1 and user2 in parallel, plus my messages
    const [matches1, matches2, myMessages] = await Promise.all([
      base44.entities.Match.filter({ user1_id: me.id }),
      base44.entities.Match.filter({ user2_id: me.id }),
      base44.entities.Message.filter({ receiver_id: me.id }),
    ]);

    const myMatches = [...matches1, ...matches2];
    if (myMatches.length === 0) {
      setMatches([]);
      setMatchProfiles([]);
      setUnreadCounts({});
      setLoading(false);
      return;
    }

    // Fetch only the profiles we need
    const otherIds = myMatches.map(m => m.user1_id === me.id ? m.user2_id : m.user1_id);
    const profileResults = await Promise.all(
      otherIds.map(id => base44.entities.Profile.filter({ id }))
    );

    const profileMap = {};
    profileResults.forEach(res => {
      if (res.length > 0) profileMap[res[0].id] = res[0];
    });

    const matched = myMatches.map(m => {
      const otherId = m.user1_id === me.id ? m.user2_id : m.user1_id;
      return { match: m, profile: profileMap[otherId] };
    }).filter(item => item.profile);

    // Count unread per sender from already-fetched messages
    const unreadMap = {};
    myMessages.forEach(msg => {
      unreadMap[msg.sender_id] = (unreadMap[msg.sender_id] || 0) + 1;
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
    // Optimistic update
    setMatchProfiles(prev => prev.filter(item => item.match.id !== matchId));
    setMatches(prev => prev.filter(m => m.id !== matchId));

    // Fetch only relevant messages
    const [sent, received] = await Promise.all([
      base44.entities.Message.filter({ sender_id: myProfile.id, receiver_id: targetProfile.id }),
      base44.entities.Message.filter({ sender_id: targetProfile.id, receiver_id: myProfile.id }),
    ]);

    await Promise.all([
      ...sent.map(m => base44.entities.Message.delete(m.id)),
      ...received.map(m => base44.entities.Message.delete(m.id)),
      base44.entities.Match.delete(matchId),
    ]);
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
    <div className="min-h-[100dvh] bg-[#0F0F0F] px-5 py-6 max-w-md mx-auto pb-24">
      {/* Pull to refresh indicator */}
      {refreshing && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#D4AF37] text-[#0F0F0F] px-4 py-2 rounded-full text-sm font-bold">
          <RefreshCw className="w-4 h-4 inline ml-1 animate-spin" />
          מעדכן...
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col items-center mb-8">
        <h1 className="font-display text-3xl font-black bg-gradient-to-r from-[#FE3C72] via-[#FF6B9D] to-[#D4AF37] bg-clip-text text-transparent mb-1 tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>My Matches 🔥</h1>
        <p className="text-[10px] font-semibold tracking-[0.35em] uppercase text-white/25">✦ It's a Match ✦</p>
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
          <h2 className="text-xl font-bold text-white/80 mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>עדיין אין התאמות ✦</h2>
          <p className="text-white/40 text-sm text-center mb-6">
            המשיכו להחליק — הלילה ארוך 🥂
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
                    item.profile.location === "south" ? "דרום" :
                    item.profile.location === "north" ? "צפון" :
                    item.profile.location || ""
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