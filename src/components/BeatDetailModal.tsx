import React, { useState } from 'react';
import { 
  X, 
  Play, 
  Pause, 
  Check, 
  Heart, 
  ShieldCheck, 
  Share2,
  Copy,
  Link2,
  ExternalLink
} from 'lucide-react';
import { Beat, LicenseTierKey } from '../types';
import { DEFAULT_LICENSE_TIERS } from '../data/defaultBeats';
import { PaypalLogo } from './PaypalLogo';
import { 
  getBeatDirectUrl, 
  copyToClipboard 
} from '../utils/beatLinks';
import { BeatCoverImage } from './BeatCoverImage';

interface BeatDetailModalProps {
  beat: Beat | null;
  isOpen: boolean;
  onClose: () => void;
  isPlaying: boolean;
  isCurrentTrack: boolean;
  onTogglePlay: (beat: Beat) => void;
  onSelectTierAndCheckout: (beat: Beat, tierKey: LicenseTierKey) => void;
  onToggleLike: (beatId: string) => void;
  isLiked: boolean;
  currencySymbol: string;
  isAdmin?: boolean;
}

export const BeatDetailModal: React.FC<BeatDetailModalProps> = ({
  beat,
  isOpen,
  onClose,
  isPlaying,
  isCurrentTrack,
  onTogglePlay,
  onSelectTierAndCheckout,
  onToggleLike,
  isLiked,
  currencySymbol,
  isAdmin = false,
}) => {
  const [selectedTier, setSelectedTier] = useState<LicenseTierKey>('basic');
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen || !beat) return null;

  const isPlayingCurrent = isPlaying && isCurrentTrack;
  const directUrl = getBeatDirectUrl(beat);

  const handleCopyLink = async () => {
    const success = await copyToClipboard(directUrl);
    if (success) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    }
  };

  const getTierPrice = (tierKey: LicenseTierKey): number => {
    if (tierKey === 'basic') return beat.tierPrices?.basic ?? 20.00;
    if (tierKey === 'media') return beat.tierPrices?.media ?? 45.00;
    if (tierKey === 'exclusive') return beat.tierPrices?.exclusive ?? 150.00;
    if (tierKey === 'premium') return beat.tierPrices?.premium ?? 250.00;
    return 20.00;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6">
      <div 
        className="relative w-full max-w-5xl bg-[#030A14] border border-[#00F0FF]/30 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,240,255,0.15)] text-[#E0F2FE] animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          id="btn-close-beat-detail"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-[#051525] border border-[#00F0FF]/30 text-sky-300 hover:text-white hover:border-[#00F0FF] transition"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-0 overflow-y-auto">
          
          {/* Left Column: Artwork, Specs & YouTube Direct Link Tools */}
          <div className="md:col-span-5 bg-[#000000] p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-[#00F0FF]/20">
            <div className="space-y-4">
              {/* Artwork with play overlay */}
              <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-[#030A14] border border-[#00F0FF]/25 shadow-xl group">
                <BeatCoverImage
                  coverUrl={beat.coverUrl}
                  title={beat.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />

                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <button
                    id="btn-play-modal-cover"
                    onClick={() => onTogglePlay(beat)}
                    className="w-16 h-16 rounded-full bg-[#00F0FF] hover:bg-[#38BDF8] text-black flex items-center justify-center shadow-[0_0_25px_#00F0FF] hover:scale-110 active:scale-95 transition"
                  >
                    {isPlayingCurrent ? (
                      <Pause className="w-8 h-8 fill-current" />
                    ) : (
                      <Play className="w-8 h-8 fill-current ml-1" />
                    )}
                  </button>
                </div>

                <div className="absolute bottom-3 left-3 bg-black/85 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-mono text-[#00F0FF] font-bold border border-[#00F0FF]/30">
                  {isPlayingCurrent ? 'ESCUCHANDO PREVIEW' : 'PREVIEW DISPONIBLE'}
                </div>
              </div>

              {/* Title & Producer */}
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight font-display">
                  {beat.title}
                </h2>
                <p className="text-sm font-medium text-[#00F0FF] mt-0.5 font-mono">
                  {beat.producer || 'Samu Helman en el mix'}
                </p>
              </div>

              {/* Technical Specifications Grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#051525] border border-[#00F0FF]/20 rounded-xl p-2.5">
                  <span className="text-[9px] uppercase font-mono font-bold text-sky-300/60 block">Tempo</span>
                  <span className="text-sm font-bold text-white font-mono">{beat.bpm} BPM</span>
                </div>
                <div className="bg-[#051525] border border-[#00F0FF]/20 rounded-xl p-2.5">
                  <span className="text-[9px] uppercase font-mono font-bold text-sky-300/60 block">Escala</span>
                  <span className="text-sm font-bold text-white font-mono">{beat.keyScale}</span>
                </div>
                <div className="bg-[#051525] border border-[#00F0FF]/20 rounded-xl p-2.5">
                  <span className="text-[9px] uppercase font-mono font-bold text-sky-300/60 block">Género</span>
                  <span className="text-sm font-bold text-[#00F0FF]">{beat.genre}</span>
                </div>
                <div className="bg-[#051525] border border-[#00F0FF]/20 rounded-xl p-2.5">
                  <span className="text-[9px] uppercase font-mono font-bold text-sky-300/60 block">Duración</span>
                  <span className="text-sm font-bold text-white font-mono">{beat.duration || '2:50'}</span>
                </div>
              </div>

              {/* SINGLE DIRECT BEAT LINK BOX (Synchronized with GitHub / Netlify) */}
              <div className="p-3.5 bg-[#051525] border border-[#00F0FF]/35 rounded-2xl space-y-2 shadow-[0_0_15px_rgba(0,240,255,0.08)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white font-mono">
                    <Link2 className="w-4 h-4 text-[#00F0FF]" />
                    <span>Enlace Directo del Beat</span>
                  </div>
                  <span className="text-[9px] font-mono text-[#00F0FF] bg-[#00F0FF]/10 px-1.5 py-0.5 rounded border border-[#00F0FF]/25">
                    Sincronizado
                  </span>
                </div>

                {/* Direct Link Input with Action Buttons */}
                <div className="flex gap-1.5">
                  <input
                    readOnly
                    id="input-detail-direct-link"
                    value={directUrl}
                    className="flex-1 px-3 py-2 bg-[#000000] border border-[#00F0FF]/25 rounded-xl text-xs font-mono text-[#00F0FF] select-all focus:outline-none"
                  />
                  <button
                    id="btn-copy-beat-link-detail"
                    onClick={handleCopyLink}
                    className={`px-3.5 py-2 rounded-xl font-mono font-bold text-xs flex items-center gap-1.5 transition ${
                      copiedLink
                        ? 'bg-emerald-500 text-black shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                        : 'bg-[#00F0FF] hover:bg-[#38BDF8] text-black shadow-[0_0_10px_rgba(0,240,255,0.25)]'
                    }`}
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                  <a
                    href={directUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-[#000000] hover:bg-[#0A223D] border border-[#00F0FF]/30 rounded-xl text-sky-200 flex items-center justify-center transition"
                    title="Abrir enlace en nueva pestaña"
                  >
                    <ExternalLink className="w-4 h-4 text-[#00F0FF]" />
                  </a>
                </div>
              </div>

            </div>

            {/* Actions: Favorite */}
            <div className="flex items-center gap-2 mt-5 pt-3 border-t border-[#00F0FF]/20">
              <button
                id="btn-like-detail"
                onClick={() => onToggleLike(beat.id)}
                className={`w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold border transition ${
                  isLiked 
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' 
                    : 'bg-[#051525] border-[#00F0FF]/20 text-sky-300 hover:text-white'
                }`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                <span>{isLiked ? 'En favoritos' : 'Añadir a favoritos'}</span>
              </button>
            </div>
          </div>

          {/* Right Column: License Selector & Automated Checkout CTA */}
          <div className="md:col-span-7 p-5 sm:p-7 flex flex-col justify-between bg-[#030A14]">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white font-display">
                    Selecciona tu Licencia
                  </h3>
                  <p className="text-xs text-sky-300/70">
                    Entrega digital inmediata con contrato comercial firmado en HTML/PDF.
                  </p>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Sin Content ID</span>
                </div>
              </div>

              {/* Licensing Tier Options (4 from PDF) */}
              <div className="space-y-2.5">
                {DEFAULT_LICENSE_TIERS.map((tier) => {
                  const isSelected = selectedTier === tier.id;
                  const price = getTierPrice(tier.id);

                  return (
                    <div
                      key={tier.id}
                      id={`tier-card-${tier.id}`}
                      onClick={() => setSelectedTier(tier.id)}
                      className={`relative p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#00F0FF] bg-[#051525] shadow-[0_0_20px_rgba(0,240,255,0.2)]'
                          : 'border-[#00F0FF]/20 bg-[#000000]/60 hover:border-[#00F0FF]/40'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition ${
                            isSelected ? 'border-[#00F0FF] bg-[#00F0FF]' : 'border-sky-400/40'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 text-black stroke-[3]" />}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm text-white">
                                {tier.name}
                              </h4>
                              {tier.id === 'basic' && (
                                <span className="px-2 py-0.2 text-[9px] uppercase font-mono font-bold bg-[#00F0FF] text-black rounded-full">
                                  $20.00
                                </span>
                              )}
                              {tier.id === 'media' && (
                                <span className="px-2 py-0.2 text-[9px] uppercase font-mono font-bold bg-emerald-500 text-black rounded-full">
                                  $45.00
                                </span>
                              )}
                              {tier.id === 'exclusive' && (
                                <span className="px-2 py-0.2 text-[9px] uppercase font-mono font-bold bg-amber-400 text-black rounded-full">
                                  $150.00
                                </span>
                              )}
                              {tier.id === 'premium' && (
                                <span className="px-2 py-0.2 text-[9px] uppercase font-mono font-bold bg-purple-500 text-white rounded-full">
                                  Ofertar Monto
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-sky-300/70 font-mono">
                              {tier.format}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          {tier.id === 'premium' ? (
                            <span className="text-sm font-bold text-[#00F0FF] font-mono">
                              Oferta Negociable
                            </span>
                          ) : (
                            <span className="text-lg font-black text-[#00F0FF] font-mono">
                              {currencySymbol}{price.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Expanded Tier Details */}
                      {isSelected && (
                        <div className="mt-2.5 pt-2.5 border-t border-[#00F0FF]/15 text-xs text-sky-200 space-y-1.5 animate-in fade-in duration-150">
                          <p className="text-sky-300/70 text-[11px] leading-relaxed">
                            {tier.description}
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] font-mono">
                            <div className="flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5 text-[#00F0FF] shrink-0" />
                              <span>Streams: {tier.streamsLimit}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5 text-[#00F0FF] shrink-0" />
                              <span>Ventas: {tier.salesCopiesLimit}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5 text-[#00F0FF] shrink-0" />
                              <span>YouTube: {tier.youtubeViewsLimit}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5 text-[#00F0FF] shrink-0" />
                              <span>Radio/Sincro: {tier.radioSyncLimit}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Final Checkout Button */}
            <div className="mt-5 pt-4 border-t border-[#00F0FF]/20">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs text-sky-300/70 font-mono">
                  {selectedTier === 'premium' ? 'MODALIDAD:' : 'TOTAL A PAGAR:'}
                </span>
                <span className="text-xl sm:text-2xl font-black text-[#00F0FF] font-mono drop-shadow-[0_0_10px_#00F0FF]">
                  {selectedTier === 'premium' ? 'OFERTAR MONTO' : `${currencySymbol}${getTierPrice(selectedTier).toFixed(2)} USD`}
                </span>
              </div>

              <button
                id="btn-proceed-checkout"
                onClick={() => onSelectTierAndCheckout(beat, selectedTier)}
                className="w-full py-3.5 px-5 rounded-xl font-bold uppercase tracking-wider text-sm text-black bg-[#00F0FF] hover:bg-[#38BDF8] shadow-[0_0_20px_rgba(0,240,255,0.4)] flex items-center justify-center gap-2 transition active:scale-98"
              >
                <PaypalLogo className="w-4 h-4" />
                <span>
                  {selectedTier === 'premium' 
                    ? 'Proponer Oferta & Continuar con Licencia Premium' 
                    : 'Continuar al Pago & Descargar Licencia'}
                </span>
              </button>

              <div className="flex items-center justify-center gap-3 mt-2.5 text-[11px] text-sky-300/60 font-mono">
                <span className="flex items-center gap-1">
                  <PaypalLogo className="w-3 h-3" />
                  <span>PayPal Instantáneo</span>
                </span>
                <span>•</span>
                <span>⚡ Descarga Inmediata</span>
                <span>•</span>
                <span>📜 Contrato Legal en HTML</span>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
