"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Loader2, QrCode } from "lucide-react";

export function MyQR({ token }: { token: string | null }) {
  const [data, setData] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    QRCode.toDataURL(`paniit2026:${token}`, {
      errorCorrectionLevel: "H",
      margin: 1,
      width: 480,
      color: { dark: "#1e3a5f", light: "#ffffff" },
    })
      .then(setData)
      .catch(() => setData(null));
  }, [token]);

  if (!token) {
    return (
      <div className="grid h-72 place-items-center rounded-xl border border-dashed border-navy-200 bg-white">
        <div className="text-center">
          <QrCode className="mx-auto h-5 w-5 text-navy-400" />
          <p className="mt-2 text-sm text-navy-500">QR token is not set on your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid place-items-center rounded-xl border border-navy-100 bg-white p-6">
      {data ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={data} alt="Your QR badge" className="h-72 w-72" />
      ) : (
        <div className="grid h-72 w-72 place-items-center">
          <Loader2 className="h-5 w-5 animate-spin text-navy-400" />
        </div>
      )}
      <p className="mt-3 text-xs text-navy-500">Show this to swap contact details.</p>
    </div>
  );
}
