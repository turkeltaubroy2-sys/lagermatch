import React, { useEffect, useRef } from "react";
import QRCodeStyling from "qr-code-styling";

export default function QRCode({ value, size = 200 }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const qrCode = new QRCodeStyling({
      width: size,
      height: size,
      data: value,
      image: "",
      dotsOptions: {
        color: "#D4AF37",
        type: "rounded"
      },
      backgroundOptions: {
        color: "#ffffff"
      },
      cornersSquareOptions: {
        color: "#D4AF37",
        type: "rounded"
      },
      cornersDotOptions: {
        color: "#D4AF37",
        type: "dot"
      },
      margin: 10
    });

    containerRef.current.innerHTML = "";
    qrCode.append(containerRef.current);
  }, [value, size]);

  return <div ref={containerRef} className="flex justify-center" />;
}