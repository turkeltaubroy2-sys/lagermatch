import React, { useEffect, useRef, useState } from "react";
import QRCodeStyling from "qr-code-styling";
import { Button } from "@/components/ui/button";
import { ArrowRight, Download, Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

export default function QRGenerator() {
  const qrRef = useRef(null);
  const [qrCode] = useState(
    new QRCodeStyling({
      width: 300,
      height: 300,
      type: "svg",
      data: window.location.origin,
      image: "https://raw.githubusercontent.com/lucide-react/lucide/main/icons/wine.svg",
      dotsOptions: {
        color: "#D4AF37",
        type: "extra-rounded",
      },
      backgroundOptions: {
        color: "transparent",
      },
      imageOptions: {
        crossOrigin: "anonymous",
        margin: 5,
      },
      cornersSquareOptions: {
        color: "#D4AF37",
        type: "extra-rounded",
      },
      cornersDotOptions: {
        color: "#F5E6A3",
        type: "dot",
      },
    })
  );

  const navigate = useNavigate();

  useEffect(() => {
    if (qrRef.current) {
      qrCode.append(qrRef.current);
    }
  }, [qrCode, qrRef]);

  const onDownload = () => {
    qrCode.download({
      name: "NightMatch_Golden_QR",
      extension: "png",
    });
  };

  const onShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "NightMatch 🥂",
          text: "הצטרפו לאפליקציית ההיכרויות של החתונה של רועי ויעלי!",
          url: window.location.origin,
        });
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-center"
         style={{ background: "radial-gradient(circle at 50% 50%, #150a12 0%, #050505 100%)" }}>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-sm w-full space-y-8"
      >
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic"
              style={{ fontFamily: "'Playfair Display', serif" }}>
            The QR Code
          </h1>
          <p className="text-[#D4AF37] text-xs tracking-[0.4em] uppercase font-bold opacity-60">
            Scan & Connect
          </p>
        </div>

        <div className="relative group">
          {/* Animated Glow behind QR */}
          <div className="absolute inset-0 bg-[#D4AF37]/20 blur-[60px] rounded-full animate-pulse pointer-events-none" />
          
          <div className="relative bg-white/5 border border-white/10 p-8 rounded-[3rem] backdrop-blur-xl shadow-2xl inline-block mx-auto">
            <div ref={qrRef} className="rounded-2xl overflow-hidden" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <Button
            onClick={onDownload}
            className="w-full py-7 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#F5E6A3] text-[#0F0F0F] font-black text-lg shadow-xl shadow-[#D4AF37]/20 active:scale-[0.98] transition-all"
          >
            <Download className="w-6 h-6 ml-2" />
            הורד להדפסה (PNG)
          </Button>

          <Button
            onClick={onShare}
            variant="outline"
            className="w-full py-7 rounded-2xl border-white/10 bg-white/5 text-white font-bold text-lg hover:bg-white/10"
          >
            <Share2 className="w-5 h-5 ml-2 opacity-50" />
            שתף קישור
          </Button>

          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 text-white/40 hover:text-white transition-all pt-4 font-bold text-sm uppercase tracking-widest"
          >
            חזרה
            <ArrowRight className="w-4 h-4 rotate-180" />
          </button>
        </div>

        <p className="text-[10px] text-white/30 tracking-widest uppercase pt-8">
          Roy & Yael • The Wedding • 2026
        </p>
      </motion.div>
    </div>
  );
}
