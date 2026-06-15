"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";

const WHATSAPP_PHONE = "14079152242";

function getWhatsappMessage(pathname: string) {
  if (pathname.includes("/quotes/new")) {
    return "Olá! Estou montando uma cotação da CDL BBQ e preciso de ajuda.";
  }

  if (pathname.includes("/quotes")) {
    return "Olá! Preciso de ajuda com minhas cotações da CDL BBQ.";
  }

  if (pathname.includes("/packages")) {
    return "Olá! Preciso de ajuda com os pacotes da CDL BBQ.";
  }

  if (pathname.includes("/additional-items")) {
    return "Olá! Preciso de ajuda com o cadastro de itens da CDL BBQ.";
  }

  if (pathname.includes("/customers")) {
    return "Olá! Preciso de ajuda com cliente ou endereço da CDL BBQ.";
  }

  if (pathname.includes("/customer-quote")) {
    return "Olá! Tenho uma dúvida sobre minha proposta da CDL BBQ.";
  }

  return "Olá! Preciso de ajuda com a CDL BBQ.";
}

export default function FloatingWhatsAppButton() {
  const pathname = usePathname();
  const isQuoteWizard = pathname.includes("/quotes/new");
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const key = `whatsapp_hint_seen_${pathname || "home"}`;
    const alreadySeen = sessionStorage.getItem(key);

    if (alreadySeen) return;

    const showTimer = window.setTimeout(() => {
      setShowHint(true);
      sessionStorage.setItem(key, "true");
    }, 1000);

    const hideTimer = window.setTimeout(() => {
      setShowHint(false);
    }, 5000);

    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
    };
  }, [pathname]);

  const whatsappUrl = useMemo(() => {
    const message = getWhatsappMessage(pathname || "");
    return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
  }, [pathname]);

  return (
    <div
      className={`no-print fixed ${isQuoteWizard ? "z-40" : "z-[9999]"} md:bottom-6 md:right-5`}
      style={{
        right: "12px",
        bottom: isQuoteWizard
          ? "calc(env(safe-area-inset-bottom) + 12px)"
          : "calc(env(safe-area-inset-bottom) + 82px)",
      }}
    >
      {showHint && (
        <div className="pointer-events-none absolute bottom-16 right-0 mb-2 w-[210px] rounded-2xl bg-neutral-950 px-4 py-3 text-sm font-medium leading-snug text-white shadow-xl">
          Precisa de ajuda? Chame no WhatsApp
        </div>
      )}

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Falar no WhatsApp"
        title="Falar no WhatsApp"
        className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl shadow-green-500/30 transition hover:scale-105 active:scale-95 md:h-[58px] md:w-[58px]"
      >
        <MessageCircle className="h-8 w-8" strokeWidth={2.7} />
      </a>
    </div>
  );
}
