import React from "react";
import { Toaster } from "@/components/ui/toaster";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white" dir="rtl">
      {children}
      <Toaster />
    </div>
  );
}