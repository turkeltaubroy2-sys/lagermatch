import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { ArrowRight, Send, Heart } from "lucide-react";
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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadChat = async () => {
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

    if (!matchId) {
      navigate(createPageUrl("MyMatches"));
      return;
    }

    const match = await base44.entities.Match.filter({ id: matchId });
    if (match.length === 0) {
      navigate(createPageUrl("MyMatches"));
      return;
    }

    const otherId = match[0].user1_id === me.id ? match[0].user2_id : match[0].user1_id;
    const otherProfiles = await base44.entities.Profile.filter({ id: otherId });
    
    if (otherProfiles.length === 0) {
      navigate(createPageUrl("MyMatches"));
      return;
    }

    setOtherProfile(otherProfiles[0]);

    const allMessages = await base44.entities.Message.filter({});
    const chatMessages = allMessages.filter(
      m =>
        (m.sender_id === me.id && m.receiver_id === otherId) ||
        (m.sender_id === otherId && m.receiver_id === me.id)
    );
    
    chatMessages.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    setMessages(chatMessages);
    setLoading(false);
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !myProfile || !otherProfile) return;

    const content = newMessage.trim();
    setNewMessage("");

    try {
      const newMsg = await base44.entities.Message.create({
        sender_id: myProfile.id,
        receiver_id: otherProfile.id,
        content,
      });
      
      // Update local state to ensure message is displayed immediately
      setMessages(prev => [...prev, newMsg]);
    } catch (error) {
      console.error("Failed to send message:", error);
      toast({ title: "שליחת ההודעה נכשלה", variant: "destructive", duration: 2000 });
    }
  };

  useEffect(() => {
    if (!myProfile || !otherProfile) return;
    
    const markAsRead = async () => {
      const allMessages = await base44.entities.Message.filter({
        sender_id: otherProfile.id,
        receiver_id: myProfile.id,
      });
      
      // Mark as read without deleting - just for unread count
      for (const msg of allMessages) {
        await base44.entities.Message.delete(msg.id);
      }
    };

    // Only run once when chat loads
    markAsRead();
  }, [myProfile, otherProfile]);

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
    <div className="min-h-screen bg-[#0F0F0F] flex flex-col max-w-md mx-auto">
      {/* Header */}
      <div className="bg-[#1A1A1A] border-b border-[#333] px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate(createPageUrl("MyMatches"))}
          className="p-2 hover:bg-white/5 rounded-full transition-all"
        >
          <ArrowRight className="w-5 h-5 text-white" />
        </button>
        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#D4AF37]">
          <img
            src={otherProfile?.photo_url}
            alt={otherProfile?.first_name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1">
          <h2 className="text-white font-bold text-lg">{otherProfile?.first_name}</h2>
          <p className="text-white/40 text-xs">
            {otherProfile?.age} • {
              otherProfile?.location === "tel_aviv" ? "תל אביב" :
              otherProfile?.location === "south" ? "דרום" : "צפון"
            }
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
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
              return (
                <motion.div
                  key={msg.id || i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
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

      {/* Input */}
      <div className="bg-[#1A1A1A] border-t border-[#333] px-4 py-3 flex items-center gap-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSend()}
          placeholder="כתוב הודעה..."
          className="flex-1 bg-[#252525] border-[#444] text-white rounded-full px-4 h-11"
        />
        <Button
          onClick={handleSend}
          disabled={!newMessage.trim()}
          className="h-11 w-11 rounded-full bg-gradient-to-r from-[#B8941F] to-[#D4AF37] hover:opacity-90 p-0 flex items-center justify-center disabled:opacity-50"
        >
          <Send className="w-5 h-5 text-[#0F0F0F]" />
        </Button>
      </div>
    </div>
  );
}