import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  Sparkles, 
  ShieldCheck, 
  Volume2, 
  Flame, 
  Clock, 
  Music2, 
  Radio, 
  CheckCircle2,
  Lock
} from 'lucide-react';
import { Beat } from '../types';
import { audioEngine } from '../utils/audioSynth';

interface AudioPreviewClipCardProps {
  beat: Beat;
  isPlaying: boolean;
  isCurrentTrack: boolean;
  onTogglePlay: (beat: Beat) => void;
  onOpenCheckout?: (beat: Beat) => void;
}

export const AudioPreviewClipCard: React.FC<AudioPreviewClipCardProps> = ({
  beat,
  isPlaying,
  isCurrentTrack,
  onTogglePlay,
  onOpenCheckout
}) => {
  const isThisPlaying = isPlaying && isCurrentTrack;
  const clipDuration = beat.previewDuration || 40; // 40 seconds clip
  const intervals = [0, 15, 30]; // Watermark every 15 seconds

  return (
    <div 
      id={`preview-clip-${beat.id}`}
      className="p-4 rounded-2xl bg-gradient-to-r from-[#02070E] via-[#051525] to-[#02070E] border border-[#00F0FF]/35 shadow-[0_0_25px_rgba(0,240,255,0.12)] relative overflow-hidden"
    >
      {/* Background Cyber-glow Accent */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-[#00F0FF]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
        
        {/* Left: Artwork + Title + Producer + Badges */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-black border border-[#00F0FF]/40 shrink-0 group">
            <img 
              src={beat.coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80'} 
              alt={beat.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            />
            {/* Play trigger on artwork */}
            <button
              onClick={() => onTogglePlay(beat)}
              className="absolute inset-0 bg-black/50 flex items-center justify-center text-[#00F0FF] group-hover:bg-black/30 transition"
              aria-label="Reproducir clip"
            >
              {isThisPlaying ? (
                <Pause className="w-6 h-6 fill-current text-[#00F0FF]" />
              ) : (
                <Play className="w-6 h-6 fill-current text-[#00F0FF] ml-0.5" />
              )}
            </button>
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#00F0FF] text-black font-mono font-black text-[10px] uppercase shadow-[0_0_8px_#00F0FF]">
                <Radio className="w-3 h-3 animate-pulse" />
                <span>Clip Oficial 40s</span>
              </span>
              
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#000000] border border-[#00F0FF]/30 text-sky-200 font-mono text-[10px]">
                <Sparkles className="w-2.5 h-2.5 text-[#00F0FF]" />
                <span>Tag cada 15s</span>
              </span>

              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono text-[10px]">
                <Lock className="w-2.5 h-2.5" />
                <span>Master WAV 24-bit Protegido</span>
              </span>
            </div>

            <h4 className="text-base font-black text-white truncate font-display">
              {beat.title}
            </h4>
            <p className="text-xs font-mono text-[#00F0FF] font-semibold">
              {beat.producer || 'Samu Helman en el mix'} • {beat.bpm} BPM • {beat.keyScale}
            </p>
          </div>
        </div>

        {/* Right: Quick Action to Buy & Unlock Full High-Res Master */}
        {onOpenCheckout && (
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              onClick={() => onOpenCheckout(beat)}
              className="px-4 py-2 rounded-xl bg-[#00F0FF] hover:bg-[#38BDF8] text-black font-mono font-bold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(0,240,255,0.4)] transition active:scale-95 flex items-center gap-1.5"
            >
              <span>Desbloquear WAV Master</span>
            </button>
          </div>
        )}
      </div>

      {/* 40-Second Interactive Visual Waveform & 15s Tag Markers */}
      <div className="mt-3 pt-3 border-t border-[#00F0FF]/20 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono text-sky-300/70">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#00F0FF]" />
            <span>Escucha previa: 0:00 - 0:40</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-sky-400/60">Marcas de Tag:</span>
            {intervals.map((sec) => (
              <span key={sec} className="px-1.5 py-0.2 bg-[#000000] border border-[#00F0FF]/30 text-[#00F0FF] rounded text-[10px] font-bold">
                0:{sec < 10 ? `0${sec}` : sec}
              </span>
            ))}
          </div>
        </div>

        {/* Visual Simulated Waveform with 15s interval markers */}
        <div className="relative h-7 bg-[#000000] rounded-xl border border-[#00F0FF]/25 px-3 flex items-center justify-between overflow-hidden">
          
          {/* Waveform Bars */}
          <div className="flex items-center gap-1 w-full justify-between h-full py-1">
            {Array.from({ length: 36 }).map((_, idx) => {
              const heightPct = Math.min(100, Math.max(25, ((idx * 17 + 23) % 75) + 20));
              const isNearTag = idx === 0 || idx === 13 || idx === 27;

              return (
                <div
                  key={idx}
                  style={{ height: `${heightPct}%` }}
                  className={`w-1 rounded-full transition-all duration-200 ${
                    isNearTag 
                      ? 'bg-[#00F0FF] shadow-[0_0_8px_#00F0FF]' 
                      : isThisPlaying 
                        ? 'bg-sky-400/80' 
                        : 'bg-sky-700/40'
                  }`}
                />
              );
            })}
          </div>

          {/* Voice Tag Intercalation Markers Overlay */}
          <div className="absolute inset-0 flex items-center justify-between px-3 pointer-events-none">
            <div className="bg-[#00F0FF] text-black text-[8px] font-mono font-black px-1 rounded shadow-[0_0_6px_#00F0FF]">
              TAG 0:00
            </div>
            <div className="bg-[#00F0FF] text-black text-[8px] font-mono font-black px-1 rounded shadow-[0_0_6px_#00F0FF]">
              TAG 0:15
            </div>
            <div className="bg-[#00F0FF] text-black text-[8px] font-mono font-black px-1 rounded shadow-[0_0_6px_#00F0FF]">
              TAG 0:30
            </div>
            <div className="text-sky-400 text-[9px] font-mono font-bold">
              FIN 0:40
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono text-sky-400/60">
          <span>🛡️ Calidad de muestra optimizada para web (32kHz)</span>
          <span className="text-[#00F0FF]">Licencia oficial incluye WAV Master 24-bit 48kHz limpio</span>
        </div>
      </div>
    </div>
  );
};
