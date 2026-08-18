import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  ShoppingCart, 
  ShieldAlert, 
  Disc3, 
  Sparkles,
  Maximize2,
  X,
  Volume1,
  AlertCircle
} from 'lucide-react';
import { Beat } from '../types';
import { audioEngine } from '../utils/audioSynth';
import { BeatCoverImage } from './BeatCoverImage';

interface AudioPlayerProps {
  currentBeat: Beat | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNextBeat: () => void;
  onPrevBeat: () => void;
  onOpenCheckout: (beat: Beat) => void;
  onOpenDetails: (beat: Beat) => void;
  currencySymbol: string;
  onAudioError?: (msg: string) => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  currentBeat,
  isPlaying,
  onTogglePlay,
  onNextBeat,
  onPrevBeat,
  onOpenCheckout,
  onOpenDetails,
  currencySymbol,
  onAudioError,
}) => {
  // Helper to parse '3:45' into seconds
  const parseDuration = (beat: Beat | null): number => {
    if (!beat) return 180;
    if (beat.durationSeconds && beat.durationSeconds > 0) return beat.durationSeconds;
    if (beat.duration && beat.duration.includes(':')) {
      const parts = beat.duration.split(':').map((p) => parseInt(p, 10));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return parts[0] * 60 + parts[1];
      }
    }
    return 180;
  };

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(() => parseDuration(currentBeat));
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [hasVoiceTag, setHasVoiceTag] = useState(true);
  const [playerError, setPlayerError] = useState<string | null>(null);

  // Clear previous error and update duration when track changes
  useEffect(() => {
    setPlayerError(null);
    setCurrentTime(audioEngine.getCurrentTime() || 0);
    const expectedDur = parseDuration(currentBeat);
    const engineDur = audioEngine.getDuration();
    setDuration(engineDur && engineDur > 0 ? engineDur : expectedDur);
  }, [currentBeat?.id]);

  useEffect(() => {
    audioEngine.setCallbacks(
      (time, dur) => {
        setCurrentTime(time);
        setDuration(dur || 180);
      },
      () => {
        onNextBeat();
      },
      (errorMsg) => {
        const msg = errorMsg || 'Error al cargar la pista de audio. Verifica el enlace MP3';
        setPlayerError(msg);
        if (onAudioError) onAudioError(msg);
      }
    );
  }, [onNextBeat, onAudioError]);

  if (!currentBeat) return null;

  const hasAudio = Boolean(
    currentBeat.audioPreviewUrl &&
    currentBeat.audioPreviewUrl.trim() !== '' &&
    currentBeat.audioPreviewUrl !== '#'
  );

  const formatTime = (secs: number) => {
    if (!Number.isFinite(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    audioEngine.seek(val);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    audioEngine.setVolume(val);
  };

  const handleToggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      audioEngine.setVolume(volume || 0.8);
    } else {
      setIsMuted(true);
      audioEngine.setVolume(0);
    }
  };

  const handleToggleVoiceTag = () => {
    const nextVal = !hasVoiceTag;
    setHasVoiceTag(nextVal);
    audioEngine.setVoiceTag(nextVal);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#000000]/95 border-t border-[#00F0FF]/30 text-[#E0F2FE] backdrop-blur-2xl shadow-[0_-10px_30px_rgba(0,240,255,0.1)]">
      
      {/* Dynamic Error Banner for Audio Failures */}
      {playerError && (
        <div className="bg-rose-950/90 border-b border-rose-500/40 px-4 py-1.5 flex items-center justify-between text-rose-200 text-xs font-mono animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="font-semibold">{playerError}</span>
          </div>
          <button 
            onClick={() => setPlayerError(null)} 
            className="p-1 hover:text-white rounded hover:bg-rose-900/40 transition"
            title="Cerrar aviso"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Interactive Progress Bar Scrubber */}
      <div className="relative w-full h-1.5 bg-[#051525] group cursor-pointer">
        <div 
          className="h-full bg-[#00F0FF] relative shadow-[0_0_10px_#00F0FF]"
          style={{ width: `${progressPercent}%` }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-[0_0_10px_#00F0FF] scale-0 group-hover:scale-100 transition-transform" />
        </div>
        <input
          id="audio-scrubber"
          type="range"
          min="0"
          max={duration}
          step="0.1"
          value={currentTime}
          onChange={handleSeek}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          aria-label="Progreso del audio"
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3">
        <div className="flex items-center justify-between gap-2 sm:gap-6">
          
          {/* Left: Beat Artwork & Metadata */}
          <div className="flex items-center gap-3 min-w-0 max-w-[30%] sm:max-w-[28%]">
            <div 
              onClick={() => onOpenDetails(currentBeat)}
              className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden shrink-0 bg-[#030A14] border border-[#00F0FF]/30 cursor-pointer group shadow-sm"
            >
              <BeatCoverImage
                coverUrl={currentBeat.coverUrl}
                title={currentBeat.title}
                className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                <Maximize2 className="w-4 h-4 text-[#00F0FF]" />
              </div>
            </div>

            <div className="min-w-0 flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <h4 
                  onClick={() => onOpenDetails(currentBeat)}
                  className="font-bold text-sm sm:text-base text-white truncate hover:text-[#00F0FF] cursor-pointer"
                  title={currentBeat.title}
                >
                  {currentBeat.title}
                </h4>
                {!hasAudio && (
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/30 shrink-0">
                    Sin audio
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-xs text-sky-300/70 truncate font-mono">
                <span>{currentBeat.producer || 'Samu Helman'}</span>
                <span>•</span>
                <span className="text-[#00F0FF] font-semibold">{currentBeat.bpm} BPM</span>
                <span className="hidden sm:inline">•</span>
                <span className="hidden sm:inline text-sky-300/50">{currentBeat.keyScale}</span>
              </div>
            </div>
          </div>

          {/* Center: Controls & Audio Waveform / Timers */}
          <div className="flex-1 flex flex-col items-center max-w-xl">
            <div className="flex items-center gap-3 sm:gap-5">
              
              {/* Prev */}
              <button
                id="btn-prev-beat"
                onClick={onPrevBeat}
                className="p-1.5 text-sky-300/60 hover:text-[#00F0FF] transition"
                title="Pista anterior"
                aria-label="Pista anterior"
              >
                <SkipBack className="w-5 h-5" />
              </button>

              {/* Play / Pause main */}
              <button
                id="btn-play-pause-dock"
                onClick={onTogglePlay}
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#00F0FF] hover:bg-[#38BDF8] text-black flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:scale-105 active:scale-95 transition"
                aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                )}
              </button>

              {/* Next */}
              <button
                id="btn-next-beat"
                onClick={onNextBeat}
                className="p-1.5 text-sky-300/60 hover:text-[#00F0FF] transition"
                title="Pista siguiente"
                aria-label="Pista siguiente"
              >
                <SkipForward className="w-5 h-5" />
              </button>
            </div>

            {/* Time Indicators */}
            <div className="w-full flex items-center justify-between text-[11px] font-mono text-sky-300/60 px-1 mt-1 hidden sm:flex">
              <span>{formatTime(currentTime)}</span>
              
              {/* Simulated Waveform Visualizer */}
              <div className="flex items-center gap-0.5 mx-4 flex-1 justify-center max-w-xs h-3">
                {Array.from({ length: 28 }).map((_, i) => {
                  const active = (i / 28) <= (currentTime / duration);
                  const randomHeight = ((i * 7 + 13) % 9) + 4;
                  return (
                    <div
                      key={i}
                      style={{ height: `${randomHeight}px` }}
                      className={`w-1 rounded-full transition-all duration-150 ${
                        active 
                          ? isPlaying 
                            ? 'bg-[#00F0FF] shadow-[0_0_4px_#00F0FF]' 
                            : 'bg-[#00F0FF]/70' 
                          : 'bg-[#051525]'
                      }`}
                    />
                  );
                })}
              </div>

              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right: Audio Tag, Volume & Buy Button */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            
            {/* Voice Tag Watermark toggle */}
            <button
              id="btn-toggle-voice-tag"
              onClick={handleToggleVoiceTag}
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-medium border transition ${
                hasVoiceTag 
                  ? 'bg-[#00F0FF]/15 border-[#00F0FF]/40 text-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.2)]' 
                  : 'bg-[#051525] border-[#00F0FF]/20 text-sky-300/40'
              }`}
              title={hasVoiceTag ? 'Etiqueta de voz / Watermark activada' : 'Etiqueta de voz desactivada'}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="text-[11px]">{hasVoiceTag ? 'Tag ON' : 'Tag OFF'}</span>
            </button>

            {/* Volume Control */}
            <div className="hidden lg:flex items-center gap-2">
              <button
                id="btn-toggle-mute"
                onClick={handleToggleMute}
                className="text-sky-300/60 hover:text-white transition"
                aria-label="Silenciar"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-red-400" />
                ) : volume < 0.5 ? (
                  <Volume1 className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                id="volume-slider"
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 h-1 bg-[#051525] rounded-lg appearance-none cursor-pointer accent-[#00F0FF]"
                aria-label="Volumen"
              />
            </div>

            {/* Direct Buy CTA for current beat */}
            <button
              id="btn-player-buy"
              onClick={() => onOpenCheckout(currentBeat)}
              className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider text-black bg-[#00F0FF] hover:bg-[#38BDF8] shadow-[0_0_15px_rgba(0,240,255,0.4)] transition active:scale-95"
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">Comprar Licencia</span>
              <span className="sm:hidden font-mono">{currencySymbol}{currentBeat.tierPrices?.basic || 24.99}</span>
            </button>

          </div>

        </div>
      </div>
    </div>
  );
};
