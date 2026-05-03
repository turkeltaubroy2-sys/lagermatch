import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Heart, MessageCircle, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import BottomNav from "@/components/BottomNav";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function MyMatches() {
  const [myProfile, setMyProfile] = useState(null);
  const [matches, setMatches] = useState([]);
  const [matchProfiles, setMatchProfiles] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [matchToDelete, setMatchToDelete] = useState(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadMatches();

    const unsub = base44.entities.Profile.subscribe((event) => {
      setMatchProfiles(prev => prev.map(item => 
        item.profile.id === event.data.id 
          ? { ...item, profile: { ...item.profile, ...event.data } }
          : item
      ));
    });

    return unsub;
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
    const [matches1, matches2, unreadMessages] = await Promise.all([
      base44.entities.Match.filter({ user1_id: me.id }),
      base44.entities.Match.filter({ user2_id: me.id }),
      base44.entities.Message.filter({ receiver_id: me.id, is_read: false }),
    ]);

    const activeMatches = [...matches1, ...matches2];
    const matchPartnerIds = new Set(activeMatches.map(m => m.user1_id === me.id ? m.user2_id : m.user1_id));
    
    // Filter unread messages to only include active match partners
    const validUnread = unreadMessages.filter(msg => matchPartnerIds.has(msg.sender_id));

    if (activeMatches.length === 0) {
      setMatches([]);
      setMatchProfiles([]);
      setUnreadCounts({});
      setLoading(false);
      return;
    }

    // Fetch only the profiles we need
    const otherIds = activeMatches.map(m => m.user1_id === me.id ? m.user2_id : m.user1_id);
    const profileResults = await Promise.all(
      otherIds.map(id => base44.entities.Profile.filter({ id }))
    );

    const profileMap = {};
    profileResults.forEach(res => {
      if (res.length > 0) profileMap[res[0].id] = res[0];
    });

    const matched = activeMatches.map(m => {
      const otherId = m.user1_id === me.id ? m.user2_id : m.user1_id;
      return { match: m, profile: profileMap[otherId] };
    }).filter(item => item.profile);

    // Count unread per sender from already-fetched messages
    const unreadMap = {};
    validUnread.forEach(msg => {
      unreadMap[msg.sender_id] = (unreadMap[msg.sender_id] || 0) + 1;
    });

    setMatches(activeMatches);
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
    toast({ title: "🔄 הרשימה עודכנה", duration: 200 });
  };

  useEffect(() => {
    let startY = 0;
    let triggered = false;
    const handleTouchStart = (e) => {
      startY = e.touches[0].clientY;
      triggered = false;
    };
    const handleTouchMove = (e) => {
      if (!triggered && !refreshing) {
        const currentY = e.touches[0].clientY;
        if (currentY - startY > 150) {
          triggered = true;
          handleRefresh();
        }
      }
    };
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
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
    <div className="min-h-[100dvh] bg-[#050505] px-5 max-w-md mx-auto pb-24"
      style={{ 
        paddingTop: "max(1.5rem, env(safe-area-inset-top))",
        background: "radial-gradient(circle at 50% 0%, #100812 0%, #050505 100%)"
      }}
    >
      {/* Pull to refresh indicator */}
      {refreshing && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#D4AF37] text-[#0F0F0F] px-4 py-2 rounded-full text-sm font-bold shadow-xl">
          <RefreshCw className="w-4 h-4 inline ml-1 animate-spin" />
          מעדכן...
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col items-center mb-8 pt-6">
        <h1
          className="mb-1 shimmer-gold text-center"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "2.2rem",
            fontWeight: 400,
            letterSpacing: "0.04em",
            backgroundClip: "text",
          }}
        >
          Roy & Yael
        </h1>
        <p className="text-[10px] font-semibold tracking-[0.35em] uppercase text-white/25"
          style={{ fontFamily: "var(--font-body)" }}>✦ It's a Match · 5.5.26 ✦</p>
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
          <h2 className="text-xl font-bold text-white/90 mb-2" style={{ fontFamily: "var(--font-display)", letterSpacing: "0.05em" }}>✦ עדיין אין התאמות ✦</h2>
          <p className="text-white/40 text-sm text-center mb-6" style={{ fontFamily: "var(--font-body)" }}>
            המשיכו להחליק — הלילה ארוך 🥂
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {matchProfiles.map((item, i) => (
            <motion.div
              key={item.profile.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => handleSendMessage(item.match.id)}
              className="glass border border-white/10 rounded-3xl p-3 shadow-xl relative overflow-hidden active:scale-[0.98] transition-transform cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#D4AF37]/50 shadow-md flex-shrink-0 relative">
                  <img
                    src={item.profile.photo_url}
                    alt={item.profile.first_name}
                    className="w-full h-full object-cover"
                  />
                  {item.profile.last_seen && (Date.now() - new Date(item.profile.last_seen).getTime()) < 65000 && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0A0A0A] shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-white font-black text-base tracking-tight truncate">{item.profile.first_name}</h3>
                    <span className="text-white/30 text-[10px] font-bold tracking-wider">{item.profile.age}</span>
                  </div>
                  <p className="text-white/40 text-[10px] uppercase tracking-[0.1em] mt-0.5 truncate">
                    {item.profile.location === "tel_aviv" ? "Tel Aviv" :
                     item.profile.location === "south" ? "South" :
                     item.profile.location === "north" ? "North" :
                     item.profile.location || "Guest"}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <MessageCircle className="w-5 h-5 text-[#D4AF37]/80" />
                    {unreadCounts[item.profile.id] > 0 && (
                      <div className="absolute -top-2 -right-2 bg-[#FE3C72] text-white text-[8px] font-black rounded-full w-4 h-4 flex items-center justify-center border border-[#0F0F0F]">
                        {unreadCounts[item.profile.id]}
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMatchToDelete(item);
                    }}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white/10 hover:text-red-400 hover:bg-red-400/5 rounded-full"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!matchToDelete} onOpenChange={() => setMatchToDelete(null)}>
        <AlertDialogContent className="bg-[#1A1A1A] border-[#333]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white font-black text-right">מחיקת התאמה</AlertDialogTitle>
            <AlertDialogDescription className="text-white/50 text-right">
              בטוח שאתה רוצה למחוק את המאץ' עם {matchToDelete?.profile?.first_name}? כל הצאט ביניכם יימחק לצמיתות.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-3">
            <AlertDialogAction
              onClick={() => {
                handleDeleteMatch(matchToDelete.match.id, matchToDelete.profile);
                setMatchToDelete(null);
              }}
              className="bg-red-600 hover:bg-red-700 flex-1"
            >
              מחק
            </AlertDialogAction>
            <AlertDialogCancel className="bg-[#252525] border-[#444] text-white hover:bg-[#333] flex-1 mt-0">
              ביטול
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}