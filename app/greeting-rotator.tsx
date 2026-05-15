"use client";

import { useEffect, useState } from "react";

const GREETINGS = [
  { text: "Welcome", meta: "English" },
  { text: "स्वागत है", meta: "Hindi · IIT Delhi, Kanpur, Roorkee, Mandi, Patna, Jodhpur, BHU, ISM Dhanbad, Bhilai, Jammu" },
  { text: "ಸ್ವಾಗತ", meta: "Kannada · IIT Dharwad" },
  { text: "स्वागत आहे", meta: "Marathi · IIT Bombay" },
  { text: "வரவேற்கிறோம்", meta: "Tamil · IIT Madras" },
  { text: "স্বাগতম", meta: "Bengali · IIT Kharagpur" },
  { text: "স্বাগতম", meta: "Assamese · IIT Guwahati" },
  { text: "స్వాగతం", meta: "Telugu · IIT Hyderabad, Tirupati" },
  { text: "સ્વાગત છે", meta: "Gujarati · IIT Gandhinagar" },
  { text: "ਸੁਆਗਤ ਹੈ", meta: "Punjabi · IIT Ropar" },
  { text: "ସ୍ୱାଗତ", meta: "Odia · IIT Bhubaneswar" },
  { text: "സ്വാഗതം", meta: "Malayalam · IIT Palakkad" },
  { text: "स्वागत आसा", meta: "Konkani · IIT Goa" },
];

export function GreetingRotator() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % GREETINGS.length);
    }, 2100);
    return () => window.clearInterval(timer);
  }, []);

  const greeting = GREETINGS[index];

  return (
    <div className="min-h-[86px] text-center" aria-live="polite">
      <div
        key={greeting.text + greeting.meta}
        className="animate-login-greeting"
      >
        <h2 className="text-[38px] font-semibold leading-none tracking-tight text-brand-900 sm:text-[44px]">
          {greeting.text}
        </h2>
        <p className="mx-auto mt-2 max-w-[19rem] truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-800/65">
          {greeting.meta}
        </p>
      </div>
    </div>
  );
}
