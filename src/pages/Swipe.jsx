import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, X, Settings, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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

import SwipeCard from "@/components/swipe/SwipeCard";
import MatchPopup from "@/components/swipe/MatchPopup";
import AgeFilter from "@/components/swipe/AgeFilter";
import DrinkNotification from "@/components/swipe/DrinkNotification";
import BottomNav from "@/components/BottomNav";

export default function Swipe() {
  const [myProfile, setMyProfile] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [allProfilesCache, setAllProfilesCache] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showMatch, setShowMatch] = useState(false);
  const [matchProfile, setMatchProfile] = useState(null);
  const [ageRange, setAgeRange] = useState({ min: 18, max: 60 });
  const [locationFilter, setLocationFilter] = useState("all");
  const [swipedIds, setSwipedIds] = useState(new Set());
  const [drinkNotif, setDrinkNotif] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const getDeviceId = () => localStorage.getItem("wedding_device_id");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!myProfile) return;
    const unsubDrink = base44.entities.Drink.subscribe((event) => {
      if (event.type === "create" && event.data.receiver_id === myProfile.id && event.data.status === "pending") {
        loadSenderForDrink(event.data);
      }
    });

    const unsubMessage = base44.entities.Message.subscribe((event) => {
      if (event.type === "create" && event.data.receiver_id === myProfile.id) {
        const sender = allProfilesCache.find(p => p.id === event.data.sender_id);
        if (sender) {
          // Find the match to get matchId
          base44.entities.Match.filter({}).then(allMatches => {
            const match = allMatches.find(m => 
              (m.user1_id === myProfile.id && m.user2_id === sender.id) ||
              (m.user2_id === myProfile.id && m.user1_id === sender.id)
            );
            
            toast({
              title: `💬 הודעה חדשה מ${sender.first_name}`,
              description: event.data.content.substring(0, 50) + (event.data.content.length > 50 ? "..." : ""),
              duration: 2000,
              action: match ? {
                label: "פתח",
                onClick: () => navigate(createPageUrl("Chat") + `?matchId=${match.id}`)
              } : undefined,
            });
          });
        }
      }
    });

    return () => {
      unsubDrink();
      unsubMessage();
    };
  }, [myProfile, allProfilesCache, toast]);

  const loadSenderForDrink = useCallback((drink) => {
    const sender = allProfilesCache.find(p => p.id === drink.sender_id);
    if (sender) {
      setDrinkNotif({ drink, senderName: sender.first_name });
    }
  }, [allProfilesCache]);

  const loadData = async () => {
    const deviceId = getDeviceId();
    if (!deviceId) {
      navigate(createPageUrl("Home"));
      return;
    }

    // Fetch my profile + all profiles + my swipes all in parallel
    const [myProfiles, allProfiles, allSwipes] = await Promise.all([
      base44.entities.Profile.filter({ device_id: deviceId }),
      base44.entities.Profile.filter({ is_blocked: false }),
      base44.entities.Swipe.filter({}),
    ]);

    if (myProfiles.length === 0) {
      navigate(createPageUrl("Home"));
      return;
    }

    const me = myProfiles[0];
    if (me.is_blocked) {
      toast({ title: "הפרופיל שלך נחסם", variant: "destructive", duration: 2000 });
      navigate(createPageUrl("Home"));
      return;
    }

    setMyProfile(me);

    const swipedSet = new Set(allSwipes.filter(s => s.swiper_id === me.id).map(s => s.target_id));
    setSwipedIds(swipedSet);

    setAllProfilesCache(allProfiles);
    const available = allProfiles.filter(p => p.id !== me.id && !swipedSet.has(p.id));

    // Fisher-Yates shuffle
    const shuffled = [...available];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Pre-load images for first 3 profiles
    shuffled.slice(0, 3).forEach(p => {
      if (p.photo_url) {
        const img = new Image();
        img.src = p.photo_url;
      }
    });

    setProfiles(shuffled);
    setLoading(false);
  };

  const filteredProfiles = useMemo(
    () => profiles.filter(p => 
      p.age >= ageRange.min && 
      p.age <= ageRange.max &&
      (locationFilter === "all" || p.location === locationFilter)
    ),
    [profiles, ageRange, locationFilter]
  );

  const handleSwipe = useCallback(async (liked) => {
    const target = filteredProfiles[0];
    if (!target || !myProfile) return;

    // Optimistic update
    setProfiles(prev => prev.filter(p => p.id !== target.id));
    setSwipedIds(prev => new Set([...prev, target.id]));

    // Save swipe
    const swipePromise = base44.entities.Swipe.create({
      swiper_id: myProfile.id,
      target_id: target.id,
      liked,
    });

    // Check for match in parallel
    if (liked) {
      const [, reverseSwipes] = await Promise.all([
        swipePromise,
        base44.entities.Swipe.filter({
          swiper_id: target.id,
          target_id: myProfile.id,
          liked: true,
        })
      ]);

      if (reverseSwipes.length > 0) {
        await base44.entities.Match.create({
          user1_id: myProfile.id,
          user2_id: target.id,
        });
        setMatchProfile(target);
        setShowMatch(true);
      }
    } else {
      await swipePromise;
    }
  }, [filteredProfiles, myProfile]);

  const handleSendDrink = useCallback(async (targetProfile) => {
    setShowMatch(false);
    toast({
      title: "🍸 המשקה נשלח!",
      description: `שלחת משקה ל${targetProfile.first_name}`,
      duration: 2000,
    });
    await base44.entities.Drink.create({
      sender_id: myProfile.id,
      receiver_id: targetProfile.id,
      status: "pending",
    });
  }, [myProfile, toast]);

  const handleDrinkResponse = useCallback(async (accepted) => {
    if (drinkNotif) {
      setDrinkNotif(null);
      toast({
        title: accepted ? "🎉 המשקה בדרך!" : "אולי בפעם הבאה",
        duration: 2000,
      });
      await base44.entities.Drink.update(drinkNotif.drink.id, {
        status: accepted ? "accepted" : "declined",
      });
    }
  }, [drinkNotif, toast]);

  const handleAgeRangeChange = useCallback((min, max) => {
    setAgeRange({ min, max });
  }, []);

  const handleLocationChange = useCallback((location) => {
    setLocationFilter(location);
  }, []);

  const handleRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    const deviceId = getDeviceId();
    if (!deviceId) { setRefreshing(false); return; }
    const [myProfiles, allProfiles, allSwipes] = await Promise.all([
      base44.entities.Profile.filter({ device_id: deviceId }),
      base44.entities.Profile.filter({ is_blocked: false }),
      base44.entities.Swipe.filter({}),
    ]);
    if (myProfiles.length > 0) {
      const me = myProfiles[0];
      const swipedSet = new Set(allSwipes.filter(s => s.swiper_id === me.id).map(s => s.target_id));
      const available = allProfiles.filter(p => p.id !== me.id && !swipedSet.has(p.id));
      const shuffled = [...available];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      setProfiles(shuffled);
      setSwipedIds(swipedSet);
      setAllProfilesCache(allProfiles);
    }
    setRefreshing(false);
    toast({ title: "🔄 הרשימה עודכנה", duration: 2000 });
  }, [refreshing, toast]);

  const handleDeleteProfile = useCallback(async () => {
    if (!myProfile) return;
    await base44.entities.Profile.delete(myProfile.id);
    localStorage.removeItem("wedding_device_id");
    toast({ title: "הפרופיל נמחק בהצלחה", duration: 2000 });
    navigate(createPageUrl("Home"));
  }, [myProfile, navigate, toast]);

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
  }, [refreshing, handleRefresh]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F0F0F]">
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-5xl"
        >
          🍸
        </motion.div>
      </div>
    );
  }

  const currentProfile = filteredProfiles[0];

  return (
    <div className="min-h-[100dvh] bg-[#0F0F0F] flex flex-col max-w-md mx-auto pb-20">
      {/* Pull to refresh indicator */}
      {refreshing && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#D4AF37] text-[#0F0F0F] px-4 py-2 rounded-full text-sm font-bold">
          <RefreshCw className="w-4 h-4 inline ml-1 animate-spin" />
          מעדכן...
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-1.5">
            <motion.span 
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              🔥
            </motion.span>
            <span style={{ fontFamily: "'Playfair Display', serif", letterSpacing: "0.04em" }}
              className="bg-gradient-to-r from-[#D4AF37] via-[#F5E6A3] to-[#D4AF37] bg-clip-text text-transparent font-black">
              NightMatch
            </span>
          </h1>
          <p className="text-[11px] text-[#D4AF37]/50 font-bold tracking-[0.25em] uppercase">Bar & Club Dating</p>
        </div>
        <div className="flex items-center gap-3">
          <AgeFilter 
            ageRange={ageRange} 
            locationFilter={locationFilter}
            onChangeRange={handleAgeRangeChange}
            onChangeLocation={handleLocationChange}
          />
          <Sheet open={showSettings} onOpenChange={setShowSettings}>
            <SheetTrigger asChild>
              <button className="p-2 rounded-full bg-[#1A1A1A] border border-[#333] text-white/60 hover:text-white transition-all">
                <Settings className="w-4 h-4" />
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="bg-[#1A1A1A] border-[#333]">
              <SheetHeader>
                <SheetTitle className="text-white text-right">הגדרות</SheetTitle>
                <SheetDescription className="text-white/40 text-right">
                  נהל את הפרופיל שלך
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6">
                <Button
                  onClick={() => {
                    setShowSettings(false);
                    setShowDeleteDialog(true);
                  }}
                  variant="destructive"
                  className="w-full py-6 text-lg font-bold rounded-xl bg-red-600 hover:bg-red-700"
                >
                  <Trash2 className="w-5 h-5 ml-2" />
                  מחק פרופיל
                </Button>
              </div>
            </SheetContent>
          </Sheet>

        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-[#1A1A1A] border-[#333]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">מחיקת פרופיל</AlertDialogTitle>
            <AlertDialogDescription className="text-white/50">
              האם אתה בטוח שברצונך למחוק את הפרופיל? פעולה זו לא ניתנת לביטול.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#252525] border-[#444] text-white hover:bg-[#333]">
              ביטול
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProfile}
              className="bg-red-600 hover:bg-red-700"
            >
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Card area */}
      <div className="flex-1 px-5 pb-4 relative">
        {currentProfile ? (
          <div className="relative w-full" style={{ height: "calc(100dvh - 200px)" }}>
            <AnimatePresence mode="sync">
              {filteredProfiles.slice(0, 3).reverse().map((profile) => (
                <SwipeCard
                  key={profile.id}
                  profile={profile}
                  isTop={profile.id === currentProfile.id}
                  onSwipe={handleSwipe}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center h-[60vh]">
            <motion.div
              className="text-6xl mb-4"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              🥂
            </motion.div>
            <h2 className="text-xl font-bold text-white/80 mb-2">אין עוד פרופילים</h2>
            <p className="text-white/40 text-sm text-center">
              צא/י לרחבה ותהנה מהערב!
            </p>
          </div>
        )}
      </div>

      {/* Action buttons */}
      {currentProfile && (
        <div className="flex justify-center items-center gap-6 pb-8 px-5">
          <motion.button
            whileTap={{ scale: 0.85 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => handleSwipe(false)}
            className="relative w-[70px] h-[70px] rounded-full bg-white flex items-center justify-center shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_10px_40px_rgba(239,68,68,0.3)] transition-all duration-300 group"
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white to-gray-100" />
            <X className="w-7 h-7 text-[#EF4444] relative z-10 group-hover:scale-110 transition-transform" strokeWidth={3} />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.85 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => handleSwipe(true)}
            className="relative w-[70px] h-[70px] rounded-full bg-gradient-to-br from-[#FF6B9D] to-[#FE3C72] flex items-center justify-center shadow-[0_8px_30px_rgba(254,60,114,0.4)] hover:shadow-[0_10px_40px_rgba(254,60,114,0.6)] transition-all duration-300 group"
          >
            <Heart className="w-7 h-7 text-white relative z-10 group-hover:scale-110 transition-transform" fill="white" strokeWidth={0} />
          </motion.button>
        </div>
      )}

      {/* Match popup */}
      <MatchPopup
        show={showMatch}
        matchProfile={matchProfile}
        myProfile={myProfile}
        onClose={() => setShowMatch(false)}
        onSendDrink={handleSendDrink}
      />

      {/* Drink notification */}
      <DrinkNotification
        show={!!drinkNotif}
        senderName={drinkNotif?.senderName}
        onAccept={() => handleDrinkResponse(true)}
        onDecline={() => handleDrinkResponse(false)}
        onClose={() => setDrinkNotif(null)}
      />

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}