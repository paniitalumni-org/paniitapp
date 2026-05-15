"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

const PREFIX = "paniit2026:";
const QR_LOGO_URL =
  "https://res.cloudinary.com/dkywjijpv/image/upload/v1778865016/download_5_j51muw.jpg";

function drawCenterLogo(canvas: HTMLCanvasElement, image: HTMLImageElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const size = canvas.width;
  const badgeSize = Math.round(size * 0.22);
  const badgeX = Math.round((size - badgeSize) / 2);
  const badgeY = badgeX;
  const radius = Math.round(badgeSize * 0.18);
  const padding = Math.round(badgeSize * 0.12);

  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, badgeSize, badgeSize, radius);
  ctx.fill();
  ctx.drawImage(
    image,
    badgeX + padding,
    badgeY + padding,
    badgeSize - padding * 2,
    badgeSize - padding * 2
  );
  ctx.restore();
}

export function MyQr({ token }: { token: string }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    QRCode.toCanvas(
      ref.current,
      `${PREFIX}${token}`,
      {
        errorCorrectionLevel: "H",
        margin: 2,
        width: 320,
        color: { dark: "#000000", light: "#ffffff" },
      },
      (e) => {
        if (e) {
          setErr(e.message);
          return;
        }

        setErr(null);
        const canvas = ref.current;
        if (!canvas) return;
        const logo = new Image();
        logo.crossOrigin = "anonymous";
        logo.onload = () => drawCenterLogo(canvas, logo);
        logo.src = QR_LOGO_URL;
      }
    );
  }, [token]);

  return (
    <div className="flex flex-col items-center">
      <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <canvas ref={ref} className="block" aria-label="Your badge QR" />
      </div>
      {err ? <p className="mt-3 text-xs text-iit-500">{err}</p> : null}
    </div>
  );
}
