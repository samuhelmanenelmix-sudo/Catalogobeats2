import React, { useState } from 'react';
import { Music, Disc } from 'lucide-react';

interface BeatCoverImageProps {
  coverUrl?: string;
  title: string;
  className?: string;
  showOverlayIcon?: boolean;
}

export const BeatCoverImage: React.FC<BeatCoverImageProps> = ({
  coverUrl,
  title,
  className = 'w-full h-full object-cover',
  showOverlayIcon = false,
}) => {
  const [hasError, setHasError] = useState(false);

  const cleanUrl = coverUrl?.trim();

  if (!cleanUrl || hasError) {
    return (
      <div 
        className={`w-full h-full bg-gradient-to-br from-[#051525] via-[#030A14] to-[#01050A] border border-[#00F0FF]/25 flex flex-col items-center justify-center relative overflow-hidden select-none p-2`}
      >
        {/* Subtle background studio vinyl circles */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
          <div className="w-48 h-48 rounded-full border border-[#00F0FF]/40 animate-spin-slow" />
          <div className="w-32 h-32 rounded-full border border-[#00F0FF]/30 absolute" />
          <div className="w-16 h-16 rounded-full border border-[#00F0FF]/20 absolute" />
        </div>

        {/* Center Logo Icon */}
        <div className="relative z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#00F0FF]/10 border border-[#00F0FF]/40 flex items-center justify-center text-[#00F0FF] shadow-[0_0_20px_rgba(0,240,255,0.25)]">
          <Music className="w-5 h-5 sm:w-6 sm:h-6 drop-shadow-[0_0_8px_#00F0FF]" />
        </div>

        {/* Studio Branding & Beat Title */}
        <div className="relative z-10 text-center mt-2 max-w-full px-2">
          <p className="text-white font-black font-display text-[11px] sm:text-xs tracking-tight truncate drop-shadow">
            {title || 'Samu Helman'}
          </p>
          <span className="text-[9px] font-mono text-[#00F0FF] uppercase tracking-wider block opacity-90">
            En el mix
          </span>
        </div>
      </div>
    );
  }

  return (
    <img
      src={cleanUrl}
      alt={title}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
};
