import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Send, Wine, Check, CheckCheck, Mic, Square, Smile, Play, Pause } from "lucide-react";
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

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const myProfileRef = useRef(null);
  const otherProfileRef = useRef(null);
  const timerRef = useRef(null);

  const COMMON_EMOJIS = ["❤️", "🥂", "🔥", "✨", "😍", "😂", "😉", "🍸", "💃", "🕺", "🌹", "💎", "💍", "🍫", "🍓", "🎈"];

  // Smooth scroll to bottom
  const scrollToBottom = useCallback((behavior = "smooth") => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior, block: "end" });
    }, 50);
  }, []);

  useEffect(() => {
    loadChat();
  }, []);

  // Mark messages as read when entering or receiving
  const markMessagesAsRead = useCallback(async () => {
    if (!myProfile || !otherProfile) return;
    await base44.entities.Message.markAsRead(myProfile.id, otherProfile.id);
  }, [myProfile, otherProfile]);

  useEffect(() => {
    if (messages.length > 0) {
      markMessagesAsRead();
    }
  }, [messages.length, markMessagesAsRead]);

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
              m => m.id?.startsWith("temp_") && 
                  (
                    (m.type === "text" && m.content === msg.content) || 
                    (m.type === "voice" && msg.type === "voice")
                  ) && 
                  m.sender_id === msg.sender_id
            );
            if (tempIdx !== -1) {
              const updated = [...prev];
              updated[tempIdx] = msg;
              return updated;
            }
            if (prev.find(m => m.id === msg.id)) return prev;
            // If message is from other person, mark it as read
            if (msg.sender_id === otherProfileRef.current?.id) {
              markMessagesAsRead();
            }
            return [...prev, msg];
          });
          scrollToBottom();
        }
      }
    });

    return unsub;
  }, [myProfile, otherProfile, scrollToBottom]);

  // Voice recording logic
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, {
        audioBitsPerSecond: 128000
      });
      const chunks = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        stream.getTracks().forEach(t => t.stop());
        handleSendVoice(blob);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Mic error:", err);
      toast({ title: "שגיאה בגישה למיקרופון", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }
    setIsRecording(false);
    clearInterval(timerRef.current);
  };

  const handleSendVoice = async (blob) => {
    if (!myProfile || !otherProfile) return;

    // Optimistic UI for voice
    const tempId = `temp_voice_${Date.now()}`;
    const localUrl = URL.createObjectURL(blob);
    setMessages(prev => [...prev, {
      id: tempId,
      sender_id: myProfile.id,
      receiver_id: otherProfile.id,
      type: "voice",
      audio_url: localUrl,
      created_date: new Date().toISOString(),
      _temp: true
    }]);

    try {
      const { file_url } = await base44.integrations.Core.UploadAudio({ blob });
      await base44.entities.Message.create({
        sender_id: myProfile.id,
        receiver_id: otherProfile.id,
        type: "voice",
        audio_url: file_url,
      });
    } catch (err) {
      console.error("Voice send failed:", err);
      setMessages(prev => prev.filter(m => m.id !== tempId));
      toast({ title: "שליחת הודעה קולית נכשלה", variant: "destructive" });
    }
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
    setShowEmojiPicker(false);

    // Optimistic update instantly
    const tempId = `temp_${Date.now()}_${Math.random()}`;
    const tempMsg = {
      id: tempId,
      sender_id: myProfile.id,
      receiver_id: otherProfile.id,
      content,
      type: "text",
      created_date: new Date().toISOString(),
      _temp: true,
    };
    setMessages(prev => [...prev, tempMsg]);

    // Save in background
    base44.entities.Message.create({
      sender_id: myProfile.id,
      receiver_id: otherProfile.id,
      content,
      type: "text"
    }).catch(() => {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setNewMessage(content);
    });

    inputRef.current?.focus();
  }, [newMessage, myProfile, otherProfile, sending]);

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

  if (loading) {
    return (
      <div className="h-[100dvh] bg-[#0F0F0F] flex flex-col max-w-md mx-auto">
        <div className="bg-[#111]/95 backdrop-blur-xl border-b border-white/8 px-4 py-3 flex items-center gap-3" style={{ paddingTop: "max(12px, env(safe-area-inset-top))" }}>
          <div className="w-10 h-10 rounded-full bg-[#252525] animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-28 bg-[#252525] rounded-full animate-pulse" />
            <div className="h-3 w-16 bg-[#252525] rounded-full animate-pulse" />
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} className="text-4xl">💬</motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col max-w-md mx-auto bg-[#0F0F0F]" style={{ height: "100dvh" }}>
      {/* Header */}
      <div className="bg-[#111]/95 backdrop-blur-xl border-b border-white/8 px-4 py-3 flex items-center gap-3 flex-shrink-0 z-20" style={{ paddingTop: "max(12px, env(safe-area-inset-top))" }}>
        <button onClick={() => navigate(createPageUrl("MyMatches"))} className="p-2 hover:bg-white/8 rounded-full transition-all active:scale-90">
          <ArrowRight className="w-5 h-5 text-white" />
        </button>
        <button onClick={() => setShowImageModal(true)} className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 active:opacity-70 transition-opacity" style={{ border: "2px solid #D4AF37" }}>
          <img src={otherProfile?.photo_url} alt="" className="w-full h-full object-cover" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-white font-black text-lg leading-none">{otherProfile?.first_name}</h2>
          <p className="text-white/35 text-[10px] tracking-widest uppercase mt-0.5">ONLINE</p>
        </div>
        <button onClick={handleSendDrink} disabled={drinkSent} className={`h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-90 ${drinkSent ? "bg-[#252525] text-white/20" : "bg-[#D4AF37]/15 text-[#D4AF37]"}`}>
          <Wine className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5" style={{ scrollbarWidth: "none" }}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full pb-10">
            <p className="text-white/20 text-sm">התחילו לדבר עם {otherProfile?.first_name} 🥂</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.sender_id === myProfile?.id;
            const isTemp = msg._temp;
            return (
              <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl ${isMe ? "bg-gradient-to-r from-[#B8941F] to-[#D4AF37] text-[#0F0F0F] rounded-tr-sm" : "bg-[#1E1E1E] text-white rounded-tl-sm"}`}>
                  {msg.type === "voice" ? (
                    <VoicePlayer url={msg.audio_url} isMe={isMe} />
                  ) : (
                    <p className="text-sm leading-relaxed break-words">{msg.content}</p>
                  )}
                  <div className={`flex items-center gap-1 mt-1 ${isMe ? "justify-end" : "justify-start"}`}>
                    <span className={`text-[9px] ${isMe ? "text-black/50" : "text-white/20"}`}>{formatTime(msg.created_date)}</span>
                    {isMe && (msg.is_read ? <CheckCheck className="w-3 h-3 text-black/40" /> : <Check className="w-3 h-3 text-black/30" />)}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="bg-[#111]/95 backdrop-blur-xl border-t border-white/8 px-4 py-3 space-y-2" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
        <AnimatePresence>
          {showEmojiPicker && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="grid grid-cols-8 gap-2 pb-2">
              {COMMON_EMOJIS.map(emoji => (
                <button key={emoji} onClick={() => setNewMessage(prev => prev + emoji)} className="text-2xl p-1 active:scale-90 transition-transform">{emoji}</button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="flex items-center gap-2">
          <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className={`p-2 rounded-full transition-colors ${showEmojiPicker ? "text-[#D4AF37] bg-[#D4AF37]/10" : "text-white/40 hover:text-white"}`}>
            <Smile className="w-6 h-6" />
          </button>
          
          <div className="flex-1 relative flex items-center">
            {isRecording ? (
              <div className="flex-1 h-11 bg-red-500/10 border border-red-500/20 rounded-full px-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-red-500 font-bold text-sm tracking-widest">{Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}</span>
                </div>
                <button onClick={stopRecording} className="text-red-500 font-black text-xs uppercase tracking-tighter">עצור ושלח</button>
              </div>
            ) : (
              <input ref={inputRef} value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSend()} placeholder={`הודעה...`} className="flex-1 rounded-full px-5 h-11 text-sm text-white bg-white/5 border border-white/10 outline-none" />
            )}
          </div>

          {newMessage.trim() ? (
            <button onClick={handleSend} className="h-11 w-11 rounded-full bg-gradient-to-r from-[#B8941F] to-[#D4AF37] flex items-center justify-center active:scale-90 transition-transform">
              <Send className="w-5 h-5 text-[#0F0F0F]" />
            </button>
          ) : (
            <button onClick={isRecording ? stopRecording : startRecording} className={`h-11 w-11 rounded-full flex items-center justify-center active:scale-90 transition-transform ${isRecording ? "bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]" : "bg-white/5 text-white/40"}`}>
              {isRecording ? <Square className="w-5 h-5 text-white fill-white" /> : <Mic className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>

      {/* Image Modal */}
      <AnimatePresence>
        {showImageModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowImageModal(false)} className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-6">
            <motion.img initial={{ scale: 0.9 }} animate={{ scale: 1 }} src={otherProfile?.photo_url} className="max-w-full max-h-[80vh] rounded-2xl shadow-2xl" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function VoicePlayer({ url, isMe }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(new Audio(url));

  useEffect(() => {
    const audio = audioRef.current;
    audio.onended = () => setPlaying(false);
    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []);

  const toggle = () => {
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setPlaying(!playing);
  };

  return (
    <div className="flex items-center gap-3 py-1 min-w-[120px]">
      <button onClick={toggle} className={`h-8 w-8 rounded-full flex items-center justify-center ${isMe ? "bg-black/10" : "bg-white/10"}`}>
        {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
      </button>
      <div className="flex-1 flex flex-col gap-1">
        <div className="h-1 rounded-full bg-current opacity-20" />
        <span className="text-[10px] font-bold opacity-60 uppercase">{playing ? "מנגן..." : "הודעה קולית"}</span>
      </div>
    </div>
  );
}

function formatTime(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
}