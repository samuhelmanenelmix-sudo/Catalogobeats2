import React from 'react';
import { Sparkles, ShieldCheck, Zap, ArrowRight, Music } from 'lucide-react';
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
    <div className="relative rounded-2xl bg-[#030A14] border border-[#00F0FF]/35 p-5 sm:p-7 mb-6 overflow-hidden shadow-[0_0_35px_rgba(0,240,255,0.12)]">
      {/* Ambient background glows */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-[#00F0FF]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-60 h-60 bg-[#0066FF]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        
        {/* Left Column: Advertising badge + Title + Subtitle */}
        <div className="max-w-2xl space-y-2.5">
          
          {/* Promo Banner & Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00F0FF] text-black text-xs font-mono font-black uppercase tracking-wider shadow-[0_0_15px_rgba(0,240,255,0.6)] animate-pulse">
              <Zap className="w-3.5 h-3.5 fill-black" />
              <span>BEATS DESDE 20 USD</span>
            </div>

            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#051525] border border-[#00F0FF]/30 text-sky-200 text-xs font-mono">
              <PaypalLogo className="w-3.5 h-3.5" />
              <span className="text-white font-bold">Pago Seguro PayPal</span>
            </div>

            <div className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#051525] border border-[#00F0FF]/30 text-emerald-400 text-xs font-mono">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>100% Royalty-Free</span>
            </div>
          </div>

          {/* Main Title - Samu Helman en el mix */}
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white font-display">
              SAMU HELMAN <span className="text-[#00F0FF] drop-shadow-[0_0_15px_rgba(0,240,255,0.7)]">EN EL MIX</span>
            </h1>
            <p className="text-xs sm:text-sm text-sky-200/80 mt-1 leading-normal max-w-xl">
              Instrumentales de alta calidad listas para grabar. Adquiere tu licencia comercial con entrega instantánea de archivos MP3, WAV Master y Stems.
            </p>
          </div>
        </div>

        {/* Right Column: Pricing spotlight card with PayPal button */}
        <div className="shrink-0 bg-[#051525]/90 border border-[#00F0FF]/40 rounded-xl p-4 sm:p-5 flex flex-row lg:flex-col items-center justify-between gap-4 shadow-[0_0_20px_rgba(0,240,255,0.15)]">
          <div className="text-left lg:text-center">
            <span className="text-[10px] uppercase font-mono font-bold text-sky-300/70 tracking-wider block">
              Oferta Especial
            </span>
            <div className="text-2xl sm:text-3xl font-black text-[#00F0FF] font-mono leading-none mt-0.5 drop-shadow-[0_0_10px_#00F0FF]">
              $20 <span className="text-xs text-sky-200 font-sans font-bold">USD</span>
            </div>
            <span className="text-[10px] text-sky-300/60 font-mono block mt-0.5">
              Licencia Básica + Contrato
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#002C66] border border-[#00F0FF]/40 text-[#00F0FF] text-xs font-mono font-bold">
              <PaypalLogo className="w-4 h-4" />
              <span>PayPal Direct</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
