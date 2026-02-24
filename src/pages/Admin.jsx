import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Users, Heart, Wine, Trash2, Ban, RefreshCw, Shield, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";

export default function Admin() {
  const [profiles, setProfiles] = useState([]);
  const [matches, setMatches] = useState([]);
  const [drinks, setDrinks] = useState([]);
  const [swipes, setSwipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordVerified, setPasswordVerified] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const isAuth = await base44.auth.isAuthenticated();
    if (!isAuth) {
      base44.auth.redirectToLogin();
      return;
    }
    const user = await base44.auth.me();
    if (user.role !== "admin") {
      setIsAdmin(false);
      setLoading(false);
      return;
    }
    setIsAdmin(true);
    loadData();
  };

  const loadData = async () => {
    setLoading(true);
    const [p, m, d, s] = await Promise.all([
      base44.entities.Profile.filter({}),
      base44.entities.Match.filter({}),
      base44.entities.Drink.filter({}),
      base44.entities.Swipe.filter({}),
    ]);
    setProfiles(p);
    setMatches(m);
    setDrinks(d);
    setSwipes(s);
    setLoading(false);
  };

  const deleteProfile = async (id) => {
    await base44.entities.Profile.delete(id);
    toast({ title: "הפרופיל נמחק" });
    loadData();
  };

  const toggleBlock = async (profile) => {
    await base44.entities.Profile.update(profile.id, { is_blocked: !profile.is_blocked });
    toast({ title: profile.is_blocked ? "הפרופיל שוחרר" : "הפרופיל נחסם" });
    loadData();
  };

  const resetAllMatches = async () => {
    const allMatches = await base44.entities.Match.filter({});
    await Promise.all(allMatches.map(m => base44.entities.Match.delete(m.id)));
    toast({ 
      title: "כל המאצ'ים נמחקו", 
      description: `${allMatches.length} התאמות נמחקו בהצלחה` 
    });
    loadData();
  };

  const resetApp = async () => {
    const [allProfiles, allMatches, allDrinks, allSwipes] = await Promise.all([
      base44.entities.Profile.filter({}),
      base44.entities.Match.filter({}),
      base44.entities.Drink.filter({}),
      base44.entities.Swipe.filter({}),
    ]);

    await Promise.all([
      ...allProfiles.map(p => base44.entities.Profile.delete(p.id)),
      ...allMatches.map(m => base44.entities.Match.delete(m.id)),
      ...allDrinks.map(d => base44.entities.Drink.delete(d.id)),
      ...allSwipes.map(s => base44.entities.Swipe.delete(s.id)),
    ]);

    toast({ 
      title: "האפליקציה אופסה במלואה", 
      description: "כל הנתונים נמחקו בהצלחה" 
    });
    loadData();
  };

  const resetKeepMyProfile = async () => {
    const myDeviceId = localStorage.getItem("wedding_device_id");
    const [allProfiles, allMatches, allDrinks, allSwipes] = await Promise.all([
      base44.entities.Profile.filter({}),
      base44.entities.Match.filter({}),
      base44.entities.Drink.filter({}),
      base44.entities.Swipe.filter({}),
    ]);

    const myProfile = allProfiles.find(p => p.device_id === myDeviceId);
    const othersProfiles = allProfiles.filter(p => p.device_id !== myDeviceId);

    await Promise.all([
      ...othersProfiles.map(p => base44.entities.Profile.delete(p.id)),
      ...allMatches.map(m => base44.entities.Match.delete(m.id)),
      ...allDrinks.map(d => base44.entities.Drink.delete(d.id)),
      ...allSwipes.map(s => base44.entities.Swipe.delete(s.id)),
    ]);

    toast({ 
      title: "אופס! רק הפרופיל שלך נשמר", 
      description: `${othersProfiles.length} פרופילים נמחקו, הפרופיל שלך נשמר` 
    });
    loadData();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F0F0F]">
        <RefreshCw className="w-8 h-8 text-[#D4AF37] animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0F0F0F] px-6">
        <Shield className="w-16 h-16 text-red-400 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">גישה נדחתה</h1>
        <p className="text-white/40">עמוד זה מיועד למנהלים בלבד</p>
      </div>
    );
  }

  if (!passwordVerified) {
    const handlePasswordSubmit = () => {
      if (password === "Roy998!") {
        setPasswordVerified(true);
        toast({ title: "סיסמה נכונה!", duration: 1500 });
      } else {
        toast({ title: "סיסמה שגויה", variant: "destructive", duration: 2000 });
        setPassword("");
      }
    };

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0F0F0F] px-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="text-center mb-8">
            <Shield className="w-16 h-16 text-[#D4AF37] mb-4 mx-auto" />
            <h1 className="text-2xl font-bold text-white mb-2">איזור מנהל</h1>
            <p className="text-white/40">הזן סיסמה כדי להמשיך</p>
          </div>

          <Card className="bg-[#1A1A1A] border-[#333]">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handlePasswordSubmit()}
                    placeholder="הזן סיסמה"
                    className="bg-[#252525] border-[#444] text-white pr-10"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <Button
                  onClick={handlePasswordSubmit}
                  className="w-full bg-gradient-to-r from-[#B8941F] to-[#D4AF37] text-[#0F0F0F] font-bold hover:opacity-90"
                >
                  כניסה
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  const stats = [
    { label: "נרשמו", value: profiles.length, icon: Users, color: "text-blue-400", bg: "bg-blue-400/10" },
    { label: "התאמות", value: matches.length, icon: Heart, color: "text-pink-400", bg: "bg-pink-400/10" },
    { label: "משקאות", value: drinks.length, icon: Wine, color: "text-amber-400", bg: "bg-amber-400/10" },
    { label: "החלקות", value: swipes.length, icon: RefreshCw, color: "text-green-400", bg: "bg-green-400/10" },
  ];

  return (
    <div className="min-h-screen bg-[#0F0F0F] p-5 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold shimmer-gold">🔧 ניהול</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            className="border-[#333] text-white/60 hover:text-white"
          >
            <RefreshCw className="w-4 h-4 ml-2" />
            רענן
          </Button>
        </div>
      </div>

      {/* Reset Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="bg-orange-500/10 border-orange-500/30 text-orange-400 hover:bg-orange-500/20 hover:text-orange-300 h-14"
            >
              <Trash2 className="w-5 h-5 ml-2" />
              אפס את כל המאצ׳ים
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-[#1A1A1A] border-[#333]">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">מחיקת כל המאצ׳ים</AlertDialogTitle>
              <AlertDialogDescription className="text-white/50">
                פעולה זו תמחק את כל ההתאמות ({matches.length}) מהמערכת. הפרופילים יישארו. האם להמשיך?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-[#252525] border-[#444] text-white hover:bg-[#333]">
                ביטול
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={resetAllMatches}
                className="bg-orange-600 hover:bg-orange-700"
              >
                מחק את כל המאצ׳ים
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20 hover:text-purple-300 h-14"
            >
              <Shield className="w-5 h-5 ml-2" />
              אפס — שמור רק אותי
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-[#1A1A1A] border-[#333]">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">איפוס — שמור רק הפרופיל שלי</AlertDialogTitle>
              <AlertDialogDescription className="text-white/50">
                פעולה זו תמחק את כל הפרופילים האחרים, כל המאצ׳ים, המשקאות וההחלקות. הפרופיל שלך ישמר. האם להמשיך?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-[#252525] border-[#444] text-white hover:bg-[#333]">
                ביטול
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={resetKeepMyProfile}
                className="bg-purple-600 hover:bg-purple-700"
              >
                אפס ושמור אותי
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-red-300 h-14"
            >
              <Trash2 className="w-5 h-5 ml-2" />
              אפס את כל האפליקציה
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-[#1A1A1A] border-[#333]">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">איפוס מלא של האפליקציה</AlertDialogTitle>
              <AlertDialogDescription className="text-white/50">
                ⚠️ אזהרה! פעולה זו תמחק את כל הנתונים: {profiles.length} פרופילים, {matches.length} מאצ׳ים, {drinks.length} משקאות ו-{swipes.length} החלקות. פעולה זו לא ניתנת לביטול!
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-[#252525] border-[#444] text-white hover:bg-[#333]">
                ביטול
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={resetApp}
                className="bg-red-600 hover:bg-red-700"
              >
                אפס הכל
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="bg-[#1A1A1A] border-[#333]">
              <CardContent className="p-4">
                <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mb-3`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <p className="text-3xl font-black text-white">{stat.value}</p>
                <p className="text-white/40 text-sm">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Profiles list */}
      <Card className="bg-[#1A1A1A] border-[#333]">
        <CardHeader>
          <CardTitle className="text-white text-lg">פרופילים ({profiles.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {profiles.map(profile => (
            <div
              key={profile.id}
              className="flex items-center gap-3 bg-[#252525] rounded-xl p-3"
            >
              <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                <img src={profile.photo_url} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white font-semibold">{profile.first_name}</span>
                  <span className="text-white/40 text-sm">{profile.age}</span>
                  {profile.is_blocked && (
                    <Badge variant="destructive" className="text-xs">חסום</Badge>
                  )}
                </div>
                <p className="text-white/30 text-xs truncate">{profile.funny_fact}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleBlock(profile)}
                  className={profile.is_blocked ? "text-green-400 hover:text-green-300" : "text-orange-400 hover:text-orange-300"}
                >
                  <Ban className="w-4 h-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-300">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-[#1A1A1A] border-[#333]">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-white">מחיקת פרופיל</AlertDialogTitle>
                      <AlertDialogDescription className="text-white/50">
                        האם למחוק את הפרופיל של {profile.first_name}? פעולה זו לא ניתנת לביטול.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-[#252525] border-[#444] text-white hover:bg-[#333]">
                        ביטול
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteProfile(profile.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        מחק
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
          {profiles.length === 0 && (
            <p className="text-white/30 text-center py-8">אין פרופילים עדיין</p>
          )}
        </CardContent>
      </Card>

      {/* Drinks table */}
      <Card className="bg-[#1A1A1A] border-[#333] mt-6">
        <CardHeader>
          <CardTitle className="text-white text-lg">🍸 משקאות ({drinks.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {drinks.map(drink => {
            const sender = profiles.find(p => p.id === drink.sender_id);
            const receiver = profiles.find(p => p.id === drink.receiver_id);
            return (
              <div key={drink.id} className="flex items-center justify-between bg-[#252525] rounded-xl p-3 text-sm">
                <span className="text-white">
                  {sender?.first_name || "?"} → {receiver?.first_name || "?"}
                </span>
                <Badge className={
                  drink.status === "accepted" ? "bg-green-500/20 text-green-400" :
                  drink.status === "declined" ? "bg-red-500/20 text-red-400" :
                  "bg-yellow-500/20 text-yellow-400"
                }>
                  {drink.status === "accepted" ? "התקבל" : drink.status === "declined" ? "נדחה" : "ממתין"}
                </Badge>
              </div>
            );
          })}
          {drinks.length === 0 && (
            <p className="text-white/30 text-center py-4">אין משקאות עדיין</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}