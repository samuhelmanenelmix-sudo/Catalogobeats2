import React from 'react';
import { Sparkles, ShieldCheck, Zap, ArrowRight, Music, Instagram } from 'lucide-react';
import { PaypalLogo } from './PaypalLogo';

interface PromoBannerProps {
  onExploreClick?: () => void;
  onUploadClick?: () => void;
  isAdminMode?: boolean;
}

export const PromoBanner: React.FC<PromoBannerProps> = ({
  onExploreClick,
  onUploadClick,
  isAdminMode
}) => {
  return (
    <div className="relative rounded-2xl bg-[#030A14] border border-[#00F0FF]/35 p-5 sm:p-7 mb-6 overflow-hidden shadow-[0_0_35px_rgba(0,240,255,0.15)]">
      {/* Tri-Neon ambient background glows: Celeste, Naranja Oscuro, Verde Oscuro */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-[#00F0FF]/12 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-0 w-72 h-72 bg-[#FF5500]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/3 w-64 h-64 bg-[#00C853]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        
        {/* Left Column: Advertising badge + Title + Subtitle */}
        <div className="max-w-2xl space-y-2.5">
          
          {/* Promo Banner & Badges in Tri-Neon colors */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Naranja Oscuro Neón Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF5500] text-black text-xs font-mono font-black uppercase tracking-wider shadow-[0_0_18px_rgba(255,85,0,0.7)] animate-pulse">
              <Zap className="w-3.5 h-3.5 fill-black" />
              <span>BEATS DESDE 20 USD</span>
            </div>

            {/* Celeste Neón Badge */}
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#051525] border border-[#00F0FF]/40 text-[#00F0FF] text-xs font-mono shadow-[0_0_10px_rgba(0,240,255,0.2)]">
              <PaypalLogo className="w-3.5 h-3.5" />
              <span className="text-white font-bold">Pago Seguro PayPal</span>
            </div>

            {/* Verde Oscuro Neón Badge */}
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#032010] border border-[#00C853]/50 text-[#00E676] text-xs font-mono shadow-[0_0_12px_rgba(0,200,83,0.25)]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#00E676]" />
              <span className="font-bold">100% Royalty-Free</span>
            </div>

            {/* Instagram Link Badge */}
            <a
              id="btn-banner-instagram"
              href="https://www.instagram.com/samuelhelmann?igsi=MXYyOTRyeGRxa2dldg=="
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-[#833ab4]/25 via-[#fd1d1d]/25 to-[#fcb045]/25 border border-pink-500/50 text-pink-200 hover:text-white hover:border-pink-300 text-xs font-mono font-bold transition shadow-[0_0_10px_rgba(236,72,153,0.2)]"
            >
              <Instagram className="w-3.5 h-3.5 text-pink-400" />
              <span>Sígueme en Instagram</span>
            </a>
          </div>

          {/* Main Title - Samu Helman en el mix with Tri-Neon Energy */}
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white font-display">
              SAMU HELMAN <span className="text-[#00F0FF] drop-shadow-[0_0_15px_rgba(0,240,255,0.7)]">EN EL MIX</span>
            </h1>
            <p className="text-xs sm:text-sm text-sky-200/80 mt-1 leading-normal max-w-xl">
              Instrumentales de alta fidelidad listas para grabar. Adquiere tu licencia comercial con entrega instantánea de archivos MP3, WAV Master y Stems.
            </p>
          </div>
        </div>

        {/* Right Column: Pricing spotlight card with Tri-Neon accents */}
        <div className="shrink-0 bg-[#051525]/95 border border-[#FF5500]/40 rounded-xl p-4 sm:p-5 flex flex-row lg:flex-col items-center justify-between gap-4 shadow-[0_0_25px_rgba(255,85,0,0.18)]">
          <div className="text-left lg:text-center">
            <span className="text-[10px] uppercase font-mono font-bold text-[#FF5500] tracking-wider block drop-shadow-[0_0_8px_rgba(255,85,0,0.5)]">
              ★ Oferta Especial
            </span>
            <div className="text-2xl sm:text-3xl font-black text-[#00F0FF] font-mono leading-none mt-1 drop-shadow-[0_0_12px_#00F0FF]">
              $20 <span className="text-xs text-sky-200 font-sans font-bold">USD</span>
            </div>
            <span className="text-[10px] text-sky-300/70 font-mono block mt-1">
              Licencia Básica + Contrato
            </span>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-2 w-full">
            <div className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#022814] border border-[#00C853]/50 text-[#00E676] text-xs font-mono font-bold shadow-[0_0_10px_rgba(0,200,83,0.2)]">
              <PaypalLogo className="w-4 h-4" />
              <span>PayPal Verificado</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
