"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

const PREFIX = "paniit2026:";

export function MyQr({ token }: { token: string }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    QRCode.toCanvas(
      ref.current,
      `${PREFIX}${token}`,
      { errorCorrectionLevel: "M", margin: 2, width: 320, color: { dark: "#1B1464", light: "#ffffff" } },
      (e) => {
        if (e) setErr(e.message);
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
