import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Send, Wine, Check, CheckCheck } from "lucide-react";
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
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const myProfileRef = useRef(null);
  const otherProfileRef = useRef(null);

  // Smooth scroll to bottom
  const scrollToBottom = useCallback((behavior = "smooth") => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior, block: "end" });
    }, 50);
  }, []);

  useEffect(() => {
    loadChat();
  }, []);

  // Real-time message subscription
  useEffect(() => {
    if (!myProfile || !otherProfile) return;

    const unsub = base44.entities.Message.subscribe((event) => {
      if (event.type === "create") {
        const msg = event.data;
        const myId = myProfileRef.current?.id;
        const otherId = otherProfileRef.current?.id;
        if (
          (msg.sender_id === myId && msg.receiver_id === otherId) ||
          (msg.sender_id === otherId && msg.receiver_id === myId)
        ) {
          setMessages(prev => {
            // Replace temp message if it exists, or add new
            const tempIdx = prev.findIndex(
              m => m.id?.startsWith("temp_") && m.content === msg.content && m.sender_id === msg.sender_id
            );
            if (tempIdx !== -1) {
              const updated = [...prev];
              updated[tempIdx] = msg;
              return updated;
            }
            if (prev.find(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          scrollToBottom();
        }
      }
    });

    return unsub;
  }, [myProfile, otherProfile, scrollToBottom]);

  // Scroll when messages change
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom(messages.length === 1 ? "instant" : "smooth");
    }
  }, [messages.length]);

  // Handle keyboard on iOS - scroll to bottom when keyboard opens
  useEffect(() => {
    const handleResize = () => {
      scrollToBottom("instant");
    };
    window.visualViewport?.addEventListener("resize", handleResize);
    return () => window.visualViewport?.removeEventListener("resize", handleResize);
  }, [scrollToBottom]);

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
    myProfileRef.current = me;
    setMyProfile(me);

    const otherId = match.user1_id === me.id ? match.user2_id : match.user1_id;

    const [otherProfiles, sentMessages, receivedMessages, existingDrinks] = await Promise.all([
      base44.entities.Profile.filter({ id: otherId }),
      base44.entities.Message.filter({ sender_id: me.id, receiver_id: otherId }),
      base44.entities.Message.filter({ sender_id: otherId, receiver_id: me.id }),
      base44.entities.Drink.filter({ sender_id: otherId, receiver_id: me.id, status: "pending" }),
    ]);

    if (otherProfiles.length === 0) {
      navigate(createPageUrl("MyMatches"));
      return;
    }

    const other = otherProfiles[0];
    otherProfileRef.current = other;
    setOtherProfile(other);

    if (existingDrinks.length > 0) setPendingDrink(existingDrinks[0]);

    const chatMessages = [...sentMessages, ...receivedMessages].sort(
      (a, b) => new Date(a.created_date) - new Date(b.created_date)
    );

    setMessages(chatMessages);
    setLoading(false);

    // Scroll to bottom after load
    setTimeout(() => scrollToBottom("instant"), 100);
  };

  const handleSend = useCallback(async () => {
    const content = newMessage.trim();
    if (!content || !myProfile || !otherProfile || sending) return;

    setNewMessage("");
    setSending(false); // allow rapid sending

    // Optimistic update instantly
    const tempId = `temp_${Date.now()}_${Math.random()}`;
    const tempMsg = {
      id: tempId,
      sender_id: myProfile.id,
      receiver_id: otherProfile.id,
      content,
      created_date: new Date().toISOString(),
      _temp: true,
    };
    setMessages(prev => [...prev, tempMsg]);

    // Save in background (don't await - subscription will update)
    base44.entities.Message.create({
      sender_id: myProfile.id,
      receiver_id: otherProfile.id,
      content,
    }).catch(() => {
      // On error, remove temp and restore input
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setNewMessage(content);
    });

    // Keep focus on input
    inputRef.current?.focus();
  }, [newMessage, myProfile, otherProfile, sending]);

  // Subscribe to drink requests
  useEffect(() => {
    if (!myProfile || !otherProfile) return;
    const unsub = base44.entities.Drink.subscribe((event) => {
      if (event.type === "create") {
        const drink = event.data;
        if (drink.sender_id === otherProfile.id && drink.receiver_id === myProfile.id) {
          setPendingDrink(drink);
        }
      }
    });
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
    toast({ title: "🍹 דרינק נשלח!", description: `שלחת דרינק ל${otherProfile.first_name}`, duration: 2000 });
  };

  const handleDrinkResponse = async (accepted) => {
    if (!pendingDrink) return;
    await base44.entities.Drink.update(pendingDrink.id, { status: accepted ? "accepted" : "declined" });
    setPendingDrink(null);
    if (accepted) {
      toast({ title: "🍹 יאללה לבר!", description: "אישרת את הדרינק!", duration: 2000 });
    }
  };

  // Group messages by time proximity
  const groupedMessages = messages.reduce((groups, msg, i) => {
    const prev = messages[i - 1];
    const showAvatar = !prev || prev.sender_id !== msg.sender_id;
    groups.push({ ...msg, showAvatar });
    return groups;
  }, []);

  if (loading) {
    return (
      <div className="h-[100dvh] bg-[#0F0F0F] flex flex-col max-w-md mx-auto">
        {/* Skeleton header */}
        <div className="bg-[#1A1A1A] border-b border-[#333] px-4 py-3 flex items-center gap-3" style={{ paddingTop: "max(12px, env(safe-area-inset-top))" }}>
          <div className="w-9 h-9 rounded-full bg-[#252525] animate-pulse" />
          <div className="w-12 h-12 rounded-full bg-[#252525] animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-28 bg-[#252525] rounded-full animate-pulse" />
            <div className="h-3 w-16 bg-[#252525] rounded-full animate-pulse" />
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            className="text-4xl"
          >
            💬
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col max-w-md mx-auto bg-[#0F0F0F]"
      style={{ height: "100dvh" }}
    >
      {/* Header */}
      <div
        className="bg-[#111]/95 backdrop-blur-xl border-b border-white/8 px-4 py-3 flex items-center gap-3 flex-shrink-0 shadow-[0_2px_20px_rgba(0,0,0,0.4)]"
        style={{ paddingTop: "max(12px, env(safe-area-inset-top))" }}
      >
        <button
          onClick={() => navigate(createPageUrl("MyMatches"))}
          className="p-2 hover:bg-white/8 rounded-full transition-all active:scale-90"
        >
          <ArrowRight className="w-5 h-5 text-white" />
        </button>
        <button
          onClick={() => setShowImageModal(true)}
          className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 active:opacity-70 transition-opacity"
          style={{ border: "2px solid #D4AF37", boxShadow: "0 0 12px rgba(212,175,55,0.3)" }}
        >
          <img src={otherProfile?.photo_url} alt="" className="w-full h-full object-cover" draggable={false} />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-white font-black text-lg leading-none">{otherProfile?.first_name}</h2>
          <p className="text-white/35 text-[10px] tracking-widest uppercase mt-0.5">
            {otherProfile?.age} ✦{" "}
            {otherProfile?.location === "tel_aviv" ? "Tel Aviv" : otherProfile?.location === "south" ? "South" : "North"}
          </p>
        </div>
        {/* Send drink button in header */}
        <button
          onClick={handleSendDrink}
          disabled={drinkSent}
          className={`h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-90 ${drinkSent ? "bg-[#252525] text-white/20" : "bg-[#D4AF37]/15 text-[#D4AF37] hover:bg-[#D4AF37]/25"
            }`}
        >
          <Wine className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overscroll-contain px-4 py-4"
        style={{ scrollbarWidth: "none" }}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full pb-10">
            <motion.div
              className="text-5xl mb-4"
              animate={{ scale: [1, 1.12, 1] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            >
              💬
            </motion.div>
            <p className="text-white/50 font-semibold text-base mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
              {otherProfile?.first_name} מחכה לך ✦
            </p>
            <p className="text-white/25 text-sm text-center">שברו את הקרח עם משהו מצחיק 🥂</p>
          </div>
        ) : (
          <>
            {groupedMessages.map((msg, i) => {
              const isMe = msg.sender_id === myProfile?.id;
              const isTemp = msg._temp;
              const showTime =
                i === 0 ||
                new Date(msg.created_date) - new Date(groupedMessages[i - 1]?.created_date) > 5 * 60 * 1000;

              return (
                <React.Fragment key={msg.id}>
                  {showTime && (
                    <div className="flex justify-center my-3">
                      <span className="text-white/20 text-[10px] font-medium tracking-wider bg-white/5 px-3 py-1 rounded-full">
                        {formatTime(msg.created_date)}
                      </span>
                    </div>
                  )}
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: isTemp ? 0.75 : 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className={`flex mb-1 ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[78%] px-4 py-2.5 ${isMe
                          ? "rounded-[20px] rounded-tr-[6px]"
                          : "rounded-[20px] rounded-tl-[6px]"
                        }`}
                      style={
                        isMe
                          ? {
                            background: "linear-gradient(135deg, #B8941F, #D4AF37)",
                            color: "#0F0F0F",
                            boxShadow: "0 2px 12px rgba(212,175,55,0.25)",
                          }
                          : {
                            background: "#1E1E1E",
                            border: "1px solid rgba(255,255,255,0.08)",
                            color: "white",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                          }
                      }
                    >
                      <p className="text-sm leading-relaxed break-words">{msg.content}</p>
                      {isMe && (
                        <div className="flex justify-end mt-0.5">
                          {isTemp ? (
                            <Check className="w-3 h-3 opacity-50" />
                          ) : (
                            <CheckCheck className="w-3 h-3 opacity-60" />
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                </React.Fragment>
              );
            })}
            <div ref={messagesEndRef} style={{ height: 1 }} />
          </>
        )}
      </div>

      {/* Pending drink notification */}
      <AnimatePresence>
        {pendingDrink && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mx-4 mb-2 rounded-2xl px-4 py-3 flex items-center gap-3 flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, rgba(212,175,55,0.12), rgba(212,175,55,0.06))",
              border: "1px solid rgba(212,175,55,0.35)",
              backdropFilter: "blur(12px)",
            }}
          >
            <span className="text-xl flex-shrink-0">🍹</span>
            <p className="flex-1 text-white text-sm font-medium leading-tight">
              {otherProfile?.first_name} שלח/ה לך דרינק!
            </p>
            <button
              onClick={() => handleDrinkResponse(true)}
              className="font-bold text-xs px-3 py-2 rounded-xl whitespace-nowrap active:scale-95 transition-transform flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #B8941F, #D4AF37)", color: "#0F0F0F" }}
            >
              יאאלה! 🍻
            </button>
            <button
              onClick={() => handleDrinkResponse(false)}
              className="text-white/35 text-xs px-2 py-2 whitespace-nowrap flex-shrink-0"
            >
              לא
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input area */}
      <div
        className="bg-[#111]/95 backdrop-blur-xl border-t border-white/8 px-4 py-3 flex items-center gap-2 flex-shrink-0"
        style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
      >
        <input
          ref={inputRef}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={`הודעה ל${otherProfile?.first_name || ""}...`}
          className="flex-1 rounded-full px-5 h-11 text-sm text-white placeholder:text-white/25 outline-none transition-all"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
          autoComplete="off"
          autoCorrect="off"
          inputMode="text"
          enterKeyHint="send"
        />
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={handleSend}
          disabled={!newMessage.trim()}
          className="h-11 w-11 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
          style={{
            background: newMessage.trim()
              ? "linear-gradient(135deg, #B8941F, #D4AF37)"
              : "rgba(255,255,255,0.06)",
            opacity: newMessage.trim() ? 1 : 0.4,
          }}
        >
          <Send className="w-4 h-4" style={{ color: newMessage.trim() ? "#0F0F0F" : "white" }} />
        </motion.button>
      </div>

      {/* Image Modal */}
      <AnimatePresence>
        {showImageModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowImageModal(false)}
            className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-6 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="text-center"
            >
              <img
                src={otherProfile?.photo_url}
                alt={otherProfile?.first_name}
                className="max-w-[85vw] max-h-[75vh] rounded-3xl object-cover shadow-2xl"
                draggable={false}
              />
              <p className="text-white/60 text-sm mt-3 font-medium">{otherProfile?.first_name}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function formatTime(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString("he-IL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}