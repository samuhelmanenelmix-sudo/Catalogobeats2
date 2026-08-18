import React, { useState } from 'react';
import { Play, Pause, Heart, Edit, Link2, Check, Share2 } from 'lucide-react';
import { Beat } from '../types';
import { PaypalLogo } from './PaypalLogo';
import { getBeatDirectUrl, copyToClipboard } from '../utils/beatLinks';
import { BeatCoverImage } from './BeatCoverImage';

interface BeatCardProps {
  beat: Beat;
  isPlaying: boolean;
  isCurrentTrack: boolean;
  onTogglePlay: (beat: Beat) => void;
  onOpenDetails: (beat: Beat) => void;
  onOpenCheckout: (beat: Beat) => void;
  onEditBeat?: (beat: Beat) => void;
  onToggleLike: (beatId: string) => void;
  isLiked: boolean;
  isAdminMode: boolean;
  currencySymbol: string;
}

export const BeatCard: React.FC<BeatCardProps> = ({
  beat,
  isPlaying,
  isCurrentTrack,
  onTogglePlay,
  onOpenDetails,
  onOpenCheckout,
  onEditBeat,
  onToggleLike,
  isLiked,
  isAdminMode,
  currencySymbol,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const lowestPrice = beat.tierPrices?.basic || 20.00;
  const isPlayingCurrent = isPlaying && isCurrentTrack;

  const handleCopyDirectLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const directUrl = getBeatDirectUrl(beat);
    const success = await copyToClipboard(directUrl);
    if (success) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    }
  };

  return (
    <div 
      id={`beat-card-${beat.id}`}
      className={`group relative bg-[#030A14] border rounded-2xl p-3.5 transition-all duration-200 hover:shadow-2xl flex flex-col justify-between h-full min-h-[395px] ${
        isPlayingCurrent
          ? 'border-[#00F0FF] bg-[#051525] shadow-[0_0_25px_rgba(0,240,255,0.25)]'
          : 'border-[#00F0FF]/25 hover:border-[#00F0FF]/60 hover:shadow-[0_0_20px_rgba(0,240,255,0.12)]'
      }`}
    >
      {/* Top Media & Cover Container */}
      <div>
        <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-3 bg-[#000000] border border-[#00F0FF]/25 shadow-inner">
          <BeatCoverImage
            coverUrl={beat.coverUrl}
            title={beat.title}
            className={`w-full h-full object-cover transition-transform duration-500 ${
              isPlayingCurrent ? 'scale-105' : 'group-hover:scale-105'
            }`}
          />

          {/* Dark Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent pointer-events-none" />

          {/* Top Badges: Featured or Sold */}
          <div className="absolute top-2 left-2 flex items-center gap-1.5 z-10">
            {beat.isFeatured && !beat.isSoldExclusive && (
              <span className="bg-[#00F0FF] text-black text-[9px] uppercase font-mono font-extrabold tracking-wider px-2 py-0.5 rounded-md shadow-[0_0_8px_#00F0FF]">
                Destacado
              </span>
            )}
            {beat.isSoldExclusive && (
              <span className="bg-red-600/90 text-white text-[9px] uppercase font-mono font-bold px-2 py-0.5 rounded-md">
                Exclusivo Vendido
              </span>
            )}
          </div>

          {/* Direct Link / Copy for Beat (Admin only) */}
          {isAdminMode && (
            <button
              id={`btn-copy-link-${beat.id}`}
              onClick={handleCopyDirectLink}
              className={`absolute top-2 right-2 z-10 flex items-center gap-1 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-mono font-bold transition ${
                copiedLink 
                  ? 'bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.5)] scale-105' 
                  : 'bg-[#000000]/80 text-[#00F0FF] hover:bg-[#051525] border border-[#00F0FF]/30'
              }`}
              title="Copiar enlace directo sincronizado del beat"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3 h-3 stroke-[3]" />
                  <span>¡Link Copiado!</span>
                </>
              ) : (
                <>
                  <Link2 className="w-3 h-3" />
                  <span>Link Directo</span>
                </>
              )}
            </button>
          )}

          {/* Play/Pause Button in Center */}
          <button
            id={`btn-play-${beat.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onTogglePlay(beat);
            }}
            className={`absolute inset-0 m-auto w-13 h-13 rounded-full flex items-center justify-center transition-all duration-200 shadow-2xl ${
              isPlayingCurrent
                ? 'bg-[#00F0FF] text-black scale-100 ring-4 ring-[#00F0FF]/40 shadow-[0_0_20px_#00F0FF]'
                : 'bg-black/75 text-white backdrop-blur-md group-hover:scale-110 hover:bg-[#00F0FF] hover:text-black hover:shadow-[0_0_20px_#00F0FF]'
            }`}
            aria-label={isPlayingCurrent ? 'Pausar' : 'Reproducir'}
          >
            {isPlayingCurrent ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          {/* Audio Equalizer bars when playing */}
          {isPlayingCurrent && (
            <div className="absolute bottom-2.5 left-2.5 flex items-end gap-1 bg-black/85 backdrop-blur-sm px-2 py-0.5 rounded-md border border-[#00F0FF]/30">
              <span className="w-1 bg-[#00F0FF] h-3.5 animate-pulse rounded-full" />
              <span className="w-1 bg-[#00F0FF] h-2 animate-pulse [animation-delay:150ms] rounded-full" />
              <span className="w-1 bg-[#00F0FF] h-4 animate-pulse [animation-delay:300ms] rounded-full" />
              <span className="text-[9px] text-[#00F0FF] font-mono font-bold ml-1">PLAYING</span>
            </div>
          )}

          {/* BPM & Scale inside cover */}
          <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 text-[10px] font-mono font-semibold text-[#E0F2FE] bg-black/85 backdrop-blur-sm px-2 py-0.5 rounded-md border border-[#00F0FF]/25">
            <span>{beat.bpm} BPM</span>
            <span className="text-sky-400/50">•</span>
            <span>{beat.keyScale}</span>
          </div>
        </div>

        {/* Title & Like */}
        <div className="mb-2">
          <div className="flex items-center justify-between gap-1.5">
            <h3 
              onClick={() => onOpenDetails(beat)}
              className="font-bold text-sm sm:text-base text-white hover:text-[#00F0FF] transition cursor-pointer truncate"
              title={beat.title}
            >
              {beat.title}
            </h3>
            <button
              id={`like-btn-${beat.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleLike(beat.id);
              }}
              className={`shrink-0 p-1 transition ${
                isLiked ? 'text-rose-500 drop-shadow-[0_0_6px_#f43f5e]' : 'text-sky-300/40 hover:text-rose-400'
              }`}
              title={isLiked ? 'Quitar de favoritos' : 'Guardar en favoritos'}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            </button>
          </div>
          
          <div className="flex items-center justify-between text-xs mt-1">
            <span className="text-sky-300/70 text-xs truncate">{beat.producer || 'Samu Helman en el mix'}</span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#051525] text-[#00F0FF] border border-[#00F0FF]/30 shrink-0">
              {beat.genre}
            </span>
          </div>
        </div>

        {/* Tags Row */}
        <div className="flex items-center gap-1 mb-2.5 overflow-hidden whitespace-nowrap">
          {beat.tags?.slice(0, 3).map((tag, idx) => (
            <span 
              key={idx}
              className="text-[10px] font-mono text-sky-300/60 bg-[#000000] px-1.5 py-0.5 rounded border border-[#00F0FF]/20 truncate"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Pricing & Call To Action */}
      <div className="pt-2.5 border-t border-[#00F0FF]/20 flex flex-col gap-2 mt-auto">
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase font-mono font-bold text-sky-300/60">
              Desde
            </span>
            <span className="text-base font-black text-[#00F0FF] font-mono drop-shadow-[0_0_6px_rgba(0,240,255,0.4)]">
              {currencySymbol}{lowestPrice.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* View Details modal */}
            <button
              id={`btn-details-${beat.id}`}
              onClick={() => onOpenDetails(beat)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-sky-300/70 hover:text-white hover:bg-[#051525] transition border border-[#00F0FF]/20 hover:border-[#00F0FF]/40"
              title="Ver licencias y enlace para YouTube"
            >
              Licencias
            </button>

            {/* Buy / Licenses CTA with PayPal icon */}
            <button
              id={`btn-buy-${beat.id}`}
              onClick={() => onOpenCheckout(beat)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider text-black bg-[#00F0FF] hover:bg-[#38BDF8] shadow-[0_0_12px_rgba(0,240,255,0.35)] transition active:scale-95 whitespace-nowrap"
            >
              <PaypalLogo className="w-3.5 h-3.5" />
              <span>Comprar</span>
            </button>
          </div>
        </div>

        {/* Producer Edit Action (When in Producer Admin Mode) */}
        {isAdminMode && onEditBeat && (
          <button
            id={`btn-edit-beat-${beat.id}`}
            onClick={() => onEditBeat(beat)}
            className="w-full flex items-center justify-center gap-1 py-1.5 px-2 bg-[#00F0FF]/15 hover:bg-[#00F0FF]/25 text-[#00F0FF] border border-[#00F0FF]/35 rounded-lg text-xs font-semibold transition mt-0.5"
          >
            <Edit className="w-3 h-3" />
            <span>Editar Beat & PayPal</span>
          </button>
        )}
      </div>
    </div>
  );
};
