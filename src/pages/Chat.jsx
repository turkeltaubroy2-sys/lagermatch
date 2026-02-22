import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Send, Heart, Wine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

export default function Chat() {
  const [searchParams] = useSearchParams();
  const matchId = searchParams.get("matchId");
  const navigate = useNavigate();
  const { toast } = useToast();

  const [myProfile, setMyProfile] = useState(null);
  const [otherProfile, setOtherProfile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [showImageModal, setShowImageModal] = useState(false);
  const [drinkSent, setDrinkSent] = useState(false);
  const [pendingDrink, setPendingDrink] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadChat();
  }, []);

  useEffect(() => {
    if (!myProfile || !otherProfile) return;
    
    const unsub = base44.entities.Message.subscribe((event) => {
      if (event.type === "create") {
        const msg = event.data;
        if (
          (msg.sender_id === myProfile.id && msg.receiver_id === otherProfile.id) ||
          (msg.sender_id === otherProfile.id && msg.receiver_id === myProfile.id)
        ) {
          setMessages(prev => {
            // Prevent duplicates
            if (prev.find(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          scrollToBottom();
        }
      }
    });
    
    return unsub;
  }, [myProfile, otherProfile]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
  };

  const loadChat = async () => {
    const deviceId = localStorage.getItem("wedding_device_id");
    if (!deviceId || !matchId) {
      navigate(createPageUrl("Home"));
      return;
    }

    const [myProfiles, matchResult] = await Promise.all([
      base44.entities.Profile.filter({ device_id: deviceId }),
      base44.entities.Match.filter({ id: matchId }),
    ]);

    if (myProfiles.length === 0 || matchResult.length === 0) {
      navigate(createPageUrl("Home"));
      return;
    }

    const me = myProfiles[0];
    const match = matchResult[0];
    setMyProfile(me);

    const otherId = match.user1_id === me.id ? match.user2_id : match.user1_id;

    // Fetch only the messages between these two users
    const [otherProfiles, sentMessages, receivedMessages] = await Promise.all([
      base44.entities.Profile.filter({ id: otherId }),
      base44.entities.Message.filter({ sender_id: me.id, receiver_id: otherId }),
      base44.entities.Message.filter({ sender_id: otherId, receiver_id: me.id }),
    ]);

    if (otherProfiles.length === 0) {
      navigate(createPageUrl("MyMatches"));
      return;
    }

    setOtherProfile(otherProfiles[0]);

    const chatMessages = [...sentMessages, ...receivedMessages]
      .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));

    setMessages(chatMessages);
    setLoading(false);
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !myProfile || !otherProfile) return;

    const content = newMessage.trim();
    setNewMessage("");

    // Optimistic update - show message immediately
    const tempMsg = {
      id: `temp_${Date.now()}`,
      sender_id: myProfile.id,
      receiver_id: otherProfile.id,
      content,
      created_date: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);

    const saved = await base44.entities.Message.create({
      sender_id: myProfile.id,
      receiver_id: otherProfile.id,
      content,
    });

    // Replace temp with real message
    setMessages(prev => prev.map(m => m.id === tempMsg.id ? saved : m));
  };

  useEffect(() => {
    if (!myProfile || !otherProfile) return;
    // Subscribe to incoming drink requests
    const unsub = base44.entities.Drink.subscribe((event) => {
      if (event.type === "create") {
        const drink = event.data;
        if (drink.sender_id === otherProfile.id && drink.receiver_id === myProfile.id) {
          setPendingDrink(drink);
        }
      }
    });
    // Check for existing pending drink
    base44.entities.Drink.filter({ sender_id: otherProfile.id, receiver_id: myProfile.id, status: "pending" })
      .then(drinks => { if (drinks.length > 0) setPendingDrink(drinks[0]); });
    return unsub;
  }, [myProfile, otherProfile]);

  const handleSendDrink = async () => {
    if (!myProfile || !otherProfile || drinkSent) return;
    setDrinkSent(true);
    await base44.entities.Drink.create({
      sender_id: myProfile.id,
      receiver_id: otherProfile.id,
      status: "pending",
    });
    toast({ title: "🍹 דרינק נשלח!", description: `שלחת דרינק ל${otherProfile.first_name}` });
  };

  const handleDrinkResponse = async (accepted) => {
    if (!pendingDrink) return;
    await base44.entities.Drink.update(pendingDrink.id, { status: accepted ? "accepted" : "declined" });
    setPendingDrink(null);
    if (accepted) {
      toast({ title: "🍹 יאללה לבר!", description: "אישרת את הדרינק!" });
    }
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
    <div className="h-[100dvh] bg-[#0F0F0F] flex flex-col max-w-md mx-auto">
      {/* Header */}
      <div className="bg-[#1A1A1A] border-b border-[#333] px-4 py-3 flex items-center gap-3 flex-shrink-0" style={{ paddingTop: "max(12px, env(safe-area-inset-top))" }}>
        <button
          onClick={() => navigate(createPageUrl("MyMatches"))}
          className="p-2 hover:bg-white/5 rounded-full transition-all"
        >
          <ArrowRight className="w-5 h-5 text-white" />
        </button>
        <button
          onClick={() => setShowImageModal(true)}
          className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#D4AF37] hover:opacity-80 transition-opacity"
        >
          <img
            src={otherProfile?.photo_url}
            alt={otherProfile?.first_name}
            className="w-full h-full object-cover cursor-pointer"
          />
        </button>
        <div className="flex-1">
          <h2 className="text-white font-bold text-lg">{otherProfile?.first_name}</h2>
          <p className="text-white/35 text-[10px] tracking-widest uppercase">
              {otherProfile?.age} ✦ {
                otherProfile?.location === "tel_aviv" ? "Tel Aviv" :
                otherProfile?.location === "south" ? "South" : "North"
              }
            </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 overscroll-contain">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <motion.div
              className="text-5xl mb-3"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              💬
            </motion.div>
            <p className="text-white/40 text-sm text-center">
              התחילו שיחה עם {otherProfile?.first_name}!
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => {
              const isMe = msg.sender_id === myProfile?.id;
              const isTemp = msg.id?.startsWith("temp_");
              return (
                <motion.div
                  key={msg.id || i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: isTemp ? 0.6 : 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                      isMe
                        ? "bg-gradient-to-r from-[#B8941F] to-[#D4AF37] text-[#0F0F0F]"
                        : "bg-[#1A1A1A] text-white border border-[#333]"
                    }`}
                  >
                    <p className="text-sm leading-relaxed break-words">{msg.content}</p>
                  </div>
                </motion.div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Pending drink notification */}
      <AnimatePresence>
        {pendingDrink && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mx-4 mb-2 bg-gradient-to-r from-[#1A1A1A] to-[#252525] border border-[#D4AF37]/40 rounded-2xl px-4 py-3 flex items-center gap-3"
          >
            <span className="text-2xl">🍹</span>
            <p className="flex-1 text-white text-sm font-medium">
              {otherProfile?.first_name} שלח/ה לך דרינק!
            </p>
            <button
              onClick={() => handleDrinkResponse(true)}
              className="bg-gradient-to-r from-[#B8941F] to-[#D4AF37] text-[#0F0F0F] font-bold text-xs px-3 py-2 rounded-xl whitespace-nowrap"
            >
              יאאלה לבר 🍻
            </button>
            <button
              onClick={() => handleDrinkResponse(false)}
              className="text-white/40 font-medium text-xs px-2 py-2 whitespace-nowrap"
            >
              לא כרגע
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="bg-[#1A1A1A] border-t border-[#333] px-4 py-3 flex items-center gap-2 flex-shrink-0" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
        <button
          onClick={handleSendDrink}
          disabled={drinkSent}
          className={`h-11 w-11 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${drinkSent ? "bg-[#252525] text-white/30" : "bg-[#252525] text-[#D4AF37] hover:bg-[#333] active:scale-95"}`}
          title="שלח דרינק"
        >
          <Wine className="w-5 h-5" />
        </button>
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder="כתוב הודעה..."
          className="flex-1 bg-[#252525] border-[#444] text-white rounded-full px-4 h-11 text-base"
          autoComplete="off"
          autoCorrect="off"
          inputMode="text"
        />
        <Button
          onClick={handleSend}
          disabled={!newMessage.trim()}
          className="h-11 w-11 rounded-full bg-gradient-to-r from-[#B8941F] to-[#D4AF37] hover:opacity-90 p-0 flex items-center justify-center disabled:opacity-50"
        >
          <Send className="w-5 h-5 text-[#0F0F0F]" />
        </Button>
      </div>

      {/* Image Modal */}
      {showImageModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setShowImageModal(false)}
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
        >
          <motion.img
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            src={otherProfile?.photo_url}
            alt={otherProfile?.first_name}
            className="max-w-sm max-h-[80vh] rounded-2xl object-cover cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          />
        </motion.div>
      )}
    </div>
  );
}