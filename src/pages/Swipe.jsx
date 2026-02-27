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

import ProfileModal from "@/components/swipe/ProfileModal";
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
  const [matches, setMatches] = useState([]);
  const [drinkNotif, setDrinkNotif] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const getDeviceId = () => {
    return sessionStorage.getItem("wedding_device_id") || 
           localStorage.getItem("wedding_device_id") ||
           document.cookie.match(/wedding_device_id=([^;]+)/)?.[1];
  };

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
          toast({
            title: `💬 הודעה חדשה מ${sender.first_name}`,
            description: event.data.content.substring(0, 50) + (event.data.content.length > 50 ? "..." : ""),
            duration: 2000,
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
      setDrinkNotif({ drink, sender });
    }
  }, [allProfilesCache]);

  const loadData = async () => {
    const deviceId = getDeviceId();
    if (!deviceId) {
      navigate(createPageUrl("Home"));
      return;
    }

    // Fetch my profile + all profiles + matches all in parallel
    const [myProfiles, allProfiles, allMatches] = await Promise.all([
      base44.entities.Profile.filter({ device_id: deviceId }),
      base44.entities.Profile.filter({ is_blocked: false }),
      base44.entities.Match.filter({}),
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
    sessionStorage.setItem("nightmatch_profile_id", me.id);

    // Get my matches
    const myMatches = allMatches.filter(m => m.user1_id === me.id || m.user2_id === me.id);
    setMatches(myMatches);

    setAllProfilesCache(allProfiles);
    const available = allProfiles.filter(p => p.id !== me.id);

    // Fisher-Yates shuffle
    const shuffled = [...available];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Pre-load ALL images aggressively
    shuffled.forEach(p => {
      if (p.photo_url) {
        const img = new Image();
        img.fetchPriority = "high";
        img.src = p.photo_url;
      }
      // Also preload extra photos
      if (p.photo_urls?.length > 0) {
        p.photo_urls.forEach(url => {
          if (url && url !== p.photo_url) {
            const img = new Image();
            img.src = url;
          }
        });
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

  const isMatch = useCallback((profileId) => {
    if (!myProfile) return false;
    return matches.some(m => 
      (m.user1_id === myProfile.id && m.user2_id === profileId) ||
      (m.user2_id === myProfile.id && m.user1_id === profileId)
    );
  }, [matches, myProfile]);

  const calculateCompatibility = useCallback((profile) => {
    if (!myProfile) return 75;
    
    let score = 70;
    
    // Location match (up to 10%)
    if (profile.location === myProfile.location) {
      score += 10;
    } else if (profile.location && myProfile.location) {
      score += 3;
    }
    
    // Favorite drink similarity (up to 10%)
    if (profile.favorite_drink && myProfile.favorite_drink) {
      if (profile.favorite_drink.toLowerCase() === myProfile.favorite_drink.toLowerCase()) {
        score += 10;
      } else {
        score += 4;
      }
    }
    
    // Funny fact length similarity (up to 8%)
    if (profile.funny_fact && myProfile.funny_fact) {
      const diff = Math.abs(profile.funny_fact.length - myProfile.funny_fact.length);
      if (diff < 20) score += 8;
      else if (diff < 50) score += 5;
      else score += 2;
    }
    
    return Math.min(98, Math.max(70, score));
  }, [myProfile]);

  const handleSendDrink = useCallback(async (targetProfile) => {
    if (!myProfile) return;
    
    // Check if drink already sent
    const existingDrinks = await base44.entities.Drink.filter({
      sender_id: myProfile.id,
      receiver_id: targetProfile.id,
    });

    if (existingDrinks.length > 0) {
      toast({
        title: "כבר שלחת משקה!",
        description: `המתן לתשובה מ${targetProfile.first_name}`,
        duration: 2000,
      });
      return;
    }

    setShowMatch(false);
    toast({
      title: "🍸 המשקה נשלח!",
      description: `שלחת משקה ל${targetProfile.first_name}`,
      duration: 2000,
    });
    
    const drink = await base44.entities.Drink.create({
      sender_id: myProfile.id,
      receiver_id: targetProfile.id,
      status: "pending",
    });

    // Check if match when drink accepted
    if (drink.status === "accepted") {
      const existingMatch = await base44.entities.Match.filter({
        user1_id: myProfile.id,
        user2_id: targetProfile.id,
      });
      if (existingMatch.length === 0) {
        await base44.entities.Match.create({
          user1_id: myProfile.id,
          user2_id: targetProfile.id,
        });
        setMatches(prev => [...prev, { user1_id: myProfile.id, user2_id: targetProfile.id }]);
      }
    }
  }, [myProfile, toast]);

  const handleDrinkResponse = useCallback(async (accepted) => {
    if (!drinkNotif || !myProfile) return;
    
    setDrinkNotif(null);
    toast({
      title: accepted ? "🎉 המשקה בדרך!" : "אולי בפעם הבאה",
      duration: 2000,
    });
    
    await base44.entities.Drink.update(drinkNotif.drink.id, {
      status: accepted ? "accepted" : "declined",
    });

    // Create match if accepted
    if (accepted) {
      const senderId = drinkNotif.drink.sender_id;
      const existingMatch = await base44.entities.Match.filter({});
      const hasMatch = existingMatch.some(m => 
        (m.user1_id === myProfile.id && m.user2_id === senderId) ||
        (m.user2_id === myProfile.id && m.user1_id === senderId)
      );
      
      if (!hasMatch) {
        await base44.entities.Match.create({
          user1_id: myProfile.id,
          user2_id: senderId,
        });
        setMatches(prev => [...prev, { user1_id: myProfile.id, user2_id: senderId }]);
      }
    }
  }, [drinkNotif, myProfile, toast]);

  const handleAgeRangeChange = useCallback((min, max) => {
    setAgeRange({ min, max });
  }, []);

  const handleLocationChange = useCallback((location) => {
    setLocationFilter(location);
  }, []);

  const handleRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
    toast({ title: "🔄 הרשימה עודכנה", duration: 2000 });
  }, [refreshing, loadData, toast]);

  const handleDeleteProfile = useCallback(async () => {
    if (!myProfile) return;
    await base44.entities.Profile.delete(myProfile.id);
    localStorage.removeItem("wedding_device_id");
    document.cookie = "wedding_device_id=; max-age=0; path=/";
    toast({ title: "הפרופיל נמחק בהצלחה", duration: 2000 });
    navigate(createPageUrl("Home"));
  }, [myProfile, navigate, toast]);

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
        if (currentY - startY > 80) {
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
    <div className="min-h-[100dvh] bg-[#0F0F0F] flex flex-col max-w-md mx-auto pb-20 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-[#FE3C72]/6 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-24 left-0 w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />
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
              Buckaroo
            </span>
          </h1>
          <p className="text-[11px] text-[#D4AF37]/50 font-bold tracking-[0.25em] uppercase">✦ Bar & Club Dating ✦</p>
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
                <SheetTitle className="text-white text-right tracking-widest uppercase text-sm">✦ הגדרות</SheetTitle>
                <SheetDescription className="text-white/40 text-right text-xs">
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
            <AlertDialogTitle className="text-white font-black">מחיקת פרופיל</AlertDialogTitle>
            <AlertDialogDescription className="text-white/50">
              בטוח שאתה רוצה לצאת מהמשחק? הפרופיל יימחק לצמיתות.
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

      {/* Floating Bubbles - Free floating in space */}
      <div className="flex-1 relative overflow-hidden">
        {filteredProfiles.length > 0 ? (
          <FloatingBubbles
            profiles={filteredProfiles}
            calculateCompatibility={calculateCompatibility}
            isMatch={isMatch}
            onSelect={setSelectedProfile}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-[60vh]">
            <motion.div
              className="text-6xl mb-4"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              🥂
            </motion.div>
            <h2 className="text-xl font-bold text-white/80 mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>אין תוצאות ✦</h2>
            <p className="text-white/40 text-sm text-center">
              נסה/י לשנות את הפילטרים 🔍
            </p>
          </div>
        )}
      </div>

      {/* Profile Modal */}
      {selectedProfile && (
        <ProfileModal
          profile={selectedProfile}
          myProfile={myProfile}
          onClose={() => setSelectedProfile(null)}
          onSendDrink={handleSendDrink}
          canChat={isMatch(selectedProfile.id)}
          onGoToChat={(profileId) => navigate(createPageUrl(`Chat?partnerId=${profileId}`))}
        />
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
        sender={drinkNotif?.sender}
        onAccept={() => handleDrinkResponse(true)}
        onDecline={() => handleDrinkResponse(false)}
        onClose={() => setDrinkNotif(null)}
      />

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}