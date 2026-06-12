"use client";

import { useState } from "react";
import Image from "next/image";
import { X, HelpCircle, Headphones, Sparkles, AlertTriangle } from "lucide-react";

export default function FloatingAIConcierge() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Painel */}
      {open && (
        <div className="fixed bottom-28 right-4 z-[9998] w-[320px] max-w-[calc(100vw-32px)] rounded-3xl border border-neutral-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-yellow-500" />
                <h3 className="text-sm font-bold text-neutral-900">
                  PP8X AI Concierge
                </h3>
              </div>
              <p className="mt-1 text-xs text-neutral-500">
                Ajuda inteligente para esta tela
              </p>
            </div>

            <button
              onClick={() => setOpen(false)}
              className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100"
              aria-label="Fechar AI Concierge"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3 p-4">
            <p className="text-sm leading-relaxed text-neutral-700">
              Olá! Eu sou o PP8X AI Concierge. Posso te ajudar com cotação,
              pacotes, guarnições, adicionais, preços, endereço e inventário.
            </p>

            <div className="grid gap-2">
              <button className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-3 py-3 text-left text-sm font-semibold text-neutral-800 hover:bg-neutral-50">
                <HelpCircle className="h-5 w-5 text-neutral-700" />
                Tirar dúvida desta tela
              </button>

              <button className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-3 py-3 text-left text-sm font-semibold text-neutral-800 hover:bg-neutral-50">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Verificar pendências
              </button>

              <button className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-3 py-3 text-left text-sm font-semibold text-neutral-800 hover:bg-neutral-50">
                <Headphones className="h-5 w-5 text-neutral-700" />
                Falar com o concierge
              </button>
            </div>

            <div className="rounded-2xl bg-yellow-50 px-3 py-2 text-xs text-yellow-900">
              Em breve: respostas com IA usando o contexto da cotação.
            </div>
          </div>
        </div>
      )}

      {/* Botão flutuante */}
      <button
        onClick={() => setOpen((value) => !value)}
        className="fixed bottom-5 right-4 z-[9999] flex items-center gap-2 rounded-full border border-yellow-300 bg-white px-3 py-2 shadow-2xl transition hover:scale-105 active:scale-95"
        aria-label="Abrir PP8X AI Concierge"
      >
        <div className="relative h-14 w-14 overflow-hidden rounded-full border-2 border-yellow-400 bg-white shadow-md">
          <Image
            src="/images/pp8x-ai-concierge.png"
            alt="PP8X AI Concierge"
            fill
            className="object-cover"
            priority
          />
        </div>

        <span className="hidden rounded-full bg-neutral-900 px-3 py-2 text-xs font-bold text-white shadow md:inline">
          PP8X AI Concierge
        </span>
      </button>
    </>
  );
}