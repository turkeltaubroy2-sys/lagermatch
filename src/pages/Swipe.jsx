import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, X, Users, Wine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

import SwipeCard from "@/components/swipe/SwipeCard";
import MatchPopup from "@/components/swipe/MatchPopup";
import AgeFilter from "@/components/swipe/AgeFilter";
import DrinkNotification from "@/components/swipe/DrinkNotification";

export default function Swipe() {
  const [myProfile, setMyProfile] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showMatch, setShowMatch] = useState(false);
  const [matchProfile, setMatchProfile] = useState(null);
  const [ageRange, setAgeRange] = useState({ min: 18, max: 60 });
  const [swipedIds, setSwipedIds] = useState(new Set());
  const [drinkNotif, setDrinkNotif] = useState(null);
  const { toast } = useToast();

  const getDeviceId = () => localStorage.getItem("wedding_device_id");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!myProfile) return;
    const unsub = base44.entities.Drink.subscribe((event) => {
      if (event.type === "create" && event.data.receiver_id === myProfile.id && event.data.status === "pending") {
        loadSenderForDrink(event.data);
      }
    });
    return unsub;
  }, [myProfile]);

  const loadSenderForDrink = async (drink) => {
    const allProfiles = await base44.entities.Profile.filter({});
    const sender = allProfiles.find(p => p.id === drink.sender_id);
    if (sender) {
      setDrinkNotif({ drink, senderName: sender.first_name });
    }
  };

  const loadData = async () => {
    const deviceId = getDeviceId();
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
    if (me.is_blocked) {
      toast({ title: "הפרופיל שלך נחסם", variant: "destructive" });
      window.location.href = createPageUrl("Home");
      return;
    }

    setMyProfile(me);

    const mySwipes = await base44.entities.Swipe.filter({ swiper_id: me.id });
    const swipedSet = new Set(mySwipes.map(s => s.target_id));
    setSwipedIds(swipedSet);

    const allProfiles = await base44.entities.Profile.filter({ is_blocked: false });
    const available = allProfiles.filter(p => p.id !== me.id && !swipedSet.has(p.id));
    
    // Shuffle
    const shuffled = available.sort(() => Math.random() - 0.5);
    setProfiles(shuffled);
    setLoading(false);
  };

  const filteredProfiles = profiles.filter(
    p => p.age >= ageRange.min && p.age <= ageRange.max
  );

  const handleSwipe = async (liked) => {
    const target = filteredProfiles[currentIndex];
    if (!target || !myProfile) return;

    // Save swipe
    await base44.entities.Swipe.create({
      swiper_id: myProfile.id,
      target_id: target.id,
      liked,
    });

    setSwipedIds(prev => new Set([...prev, target.id]));

    // Check for match
    if (liked) {
      const reverseSwipes = await base44.entities.Swipe.filter({
        swiper_id: target.id,
        target_id: myProfile.id,
        liked: true,
      });

      if (reverseSwipes.length > 0) {
        // Check if match already exists
        const existingMatches = await base44.entities.Match.filter({});
        const alreadyMatched = existingMatches.some(
          m => (m.user1_id === myProfile.id && m.user2_id === target.id) ||
               (m.user1_id === target.id && m.user2_id === myProfile.id)
        );

        if (!alreadyMatched) {
          await base44.entities.Match.create({
            user1_id: myProfile.id,
            user2_id: target.id,
          });
          setMatchProfile(target);
          setShowMatch(true);
        }
      }
    }

    // Remove from profiles
    setProfiles(prev => prev.filter(p => p.id !== target.id));
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
    setShowMatch(false);
  };

  const handleDrinkResponse = async (accepted) => {
    if (drinkNotif) {
      await base44.entities.Drink.update(drinkNotif.drink.id, {
        status: accepted ? "accepted" : "declined",
      });
      toast({
        title: accepted ? "🎉 המשקה בדרך!" : "אולי בפעם הבאה",
      });
      setDrinkNotif(null);
    }
  };

  const handleAgeRangeChange = (min, max) => {
    setAgeRange({ min, max });
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

  const currentProfile = filteredProfiles[0];

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex flex-col max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <h1 className="text-xl font-bold shimmer-gold">💍 Match</h1>
        <div className="flex items-center gap-3">
          <AgeFilter ageRange={ageRange} onChangeRange={handleAgeRangeChange} />
          <Link
            to={createPageUrl("MyMatches")}
            className="relative flex items-center gap-1 px-4 py-2 rounded-full bg-[#1A1A1A] border border-[#333] text-white/60 hover:text-white text-sm transition-all"
          >
            <Users className="w-4 h-4" />
            התאמות
          </Link>
        </div>
      </div>

      {/* Card area */}
      <div className="flex-1 px-5 pb-4 relative">
        {currentProfile ? (
          <div className="relative w-full" style={{ height: "calc(100vh - 200px)" }}>
            <AnimatePresence mode="popLayout">
              {filteredProfiles.slice(0, 2).reverse().map((profile, i) => (
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
        <div className="flex justify-center gap-6 pb-8 px-5">
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => handleSwipe(false)}
            className="w-16 h-16 rounded-full bg-[#1A1A1A] border-2 border-red-500/30 flex items-center justify-center shadow-lg shadow-red-500/10 hover:bg-red-500/10 transition-all"
          >
            <X className="w-7 h-7 text-red-400" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => handleSwipe(true)}
            className="w-16 h-16 rounded-full bg-[#1A1A1A] border-2 border-green-500/30 flex items-center justify-center shadow-lg shadow-green-500/10 hover:bg-green-500/10 transition-all"
          >
            <Heart className="w-7 h-7 text-green-400" fill="currentColor" />
          </motion.button>
        </div>
      )}

      {/* Match popup */}
      <MatchPopup
        show={showMatch}
        matchProfile={matchProfile}
        onClose={() => setShowMatch(false)}
        onSendDrink={handleSendDrink}
      />

      {/* Drink notification */}
      <DrinkNotification
        show={!!drinkNotif}
        senderName={drinkNotif?.senderName}
        onAccept={() => handleDrinkResponse(true)}
        onDecline={() => handleDrinkResponse(false)}
      />
    </div>
  );
}