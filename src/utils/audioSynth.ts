// Real Audio Playback Engine (Pure HTML5 Audio & Native Stream Manager)
// Zero synthetic tones / Full HTTPS MP3 & WAV standard stream support
import { getMusicalBarMetrics, MusicalBarInfo } from './tempoAnalyzer';

/**
 * Normalizes user-supplied audio URLs to direct streamable HTTPS endpoints
 * Handles Google Drive, Dropbox, and standard HTTPS/HTTP endpoints.
 */
export function normalizeAudioUrl(rawUrl?: string): string {
  if (!rawUrl) return '';
  let url = rawUrl.trim();
  if (!url || url === '#' || url.startsWith('javascript:')) return '';

  // Data URLs, Blob URLs, or Root-relative server paths (/uploads/..., /api/...)
  if (url.startsWith('data:audio/') || url.startsWith('blob:') || url.startsWith('/')) {
    return url;
  }

  // Google Drive conversion:
  // e.g., https://drive.google.com/file/d/1a2b3c4d5e/view?usp=sharing
  // or https://drive.google.com/open?id=1a2b3c4d5e
  const driveRegex = /(?:drive\.google\.com\/(?:file\/d\/|open\?id=))([a-zA-Z0-9_-]+)/;
  const driveMatch = url.match(driveRegex);
  if (driveMatch && driveMatch[1]) {
    return `https://drive.google.com/uc?export=download&id=${driveMatch[1]}`;
  }

  // Dropbox conversion:
  // e.g., https://www.dropbox.com/s/xyz/beat.mp3?dl=0
  if (url.includes('dropbox.com')) {
    let direct = url.replace('www.dropbox.com', 'dl.dropboxusercontent.com');
    direct = direct.replace('?dl=0', '');
    if (!direct.includes('dl=1') && !direct.includes('dl.dropboxusercontent.com')) {
      direct += (direct.includes('?') ? '&' : '?') + 'dl=1';
    }
    return direct;
  }

  // Upgrade http:// to https:// when possible to prevent browser mixed-content block
  if (url.startsWith('http://') && !url.includes('localhost') && !url.includes('127.0.0.1')) {
    url = url.replace('http://', 'https://');
  }

  return url;
}

class AudioEngine {
  private audioElement: HTMLAudioElement | null = null;
  private voiceTagAudio: HTMLAudioElement | null = null;
  private isPlaying = false;
  private volume = 0.8;
  private currentBeatId: string | null = null;
  private currentAudioUrl: string | null = null;
  private onTimeUpdateCallback: ((time: number, duration: number) => void) | null = null;
  private onEndedCallback: (() => void) | null = null;
  private onErrorCallback: ((errorMsg: string) => void) | null = null;
  private onMusicalBarCallback: ((info: MusicalBarInfo) => void) | null = null;
  private currentTime = 0;
  private totalDuration = 180;
  private hasVoiceTag = true;
  private currentBpm = 120;
  private barDuration = 2.0;
  private totalBars = 32;
  private lastTriggeredBar = -1;
  private isTagCurrentlyPlaying = false;
  private synthAudioCtx: AudioContext | null = null;
  private voiceTagSrc = '/uploads/producer-voice-tag.mp3';

  constructor() {
    // Pre-initialize voice tag audio element with cache buster fallback
    if (typeof window !== 'undefined') {
      try {
        this.initVoiceTagAudio();
      } catch (e) {
        console.warn('Voice tag init:', e);
      }
    }
  }

  private initVoiceTagAudio() {
    try {
      this.voiceTagAudio = new Audio();
      this.voiceTagAudio.preload = 'auto';
      // Try primary upload path, fallback to public root
      this.voiceTagAudio.src = this.voiceTagSrc;
      this.voiceTagAudio.onerror = () => {
        if (this.voiceTagAudio && this.voiceTagAudio.src.includes('/uploads/')) {
          this.voiceTagAudio.src = '/producer-voice-tag.mp3';
        }
      };
    } catch {
      // Audio element not supported
    }
  }

  public updateVoiceTagUrl(newUrl: string) {
    this.voiceTagSrc = newUrl;
    if (this.voiceTagAudio) {
      this.voiceTagAudio.src = newUrl;
      this.voiceTagAudio.load();
    }
  }

  public setCallbacks(
    onTimeUpdate: (time: number, duration: number) => void, 
    onEnded: () => void,
    onError?: (errorMsg: string) => void
  ) {
    this.onTimeUpdateCallback = onTimeUpdate;
    this.onEndedCallback = onEnded;
    if (onError) this.onErrorCallback = onError;
  }

  public setMusicalBarCallback(cb: (info: MusicalBarInfo) => void) {
    this.onMusicalBarCallback = cb;
  }

  public getMusicalBarInfo(): MusicalBarInfo {
    return getMusicalBarMetrics(this.currentTime, this.totalDuration, this.currentBpm);
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.audioElement) {
      this.audioElement.volume = this.volume;
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public setVoiceTag(enabled: boolean) {
    this.hasVoiceTag = enabled;
  }

  public getVoiceTag(): boolean {
    return this.hasVoiceTag;
  }

  public seek(seconds: number) {
    const targetTime = Math.max(0, seconds || 0);
    if (this.audioElement && Number.isFinite(seconds)) {
      try {
        this.audioElement.currentTime = targetTime;
        this.currentTime = targetTime;
        const metrics = getMusicalBarMetrics(targetTime, this.totalDuration, this.currentBpm);
        this.lastTriggeredBar = metrics.currentBar;
        if (this.onTimeUpdateCallback) {
          this.onTimeUpdateCallback(this.currentTime, this.totalDuration);
        }
        if (this.onMusicalBarCallback) {
          this.onMusicalBarCallback(metrics);
        }
      } catch (err) {
        console.warn('Seek error:', err);
      }
    } else {
      this.currentTime = targetTime;
      const metrics = getMusicalBarMetrics(targetTime, this.totalDuration, this.currentBpm);
      this.lastTriggeredBar = metrics.currentBar;
      if (this.onTimeUpdateCallback) {
        this.onTimeUpdateCallback(this.currentTime, this.totalDuration);
      }
      if (this.onMusicalBarCallback) {
        this.onMusicalBarCallback(metrics);
      }
    }
  }

  /**
   * Triggers the official producer audio watermark at musical bar turnarounds (compás 8, 16, 24, 32...):
   * 1. Overlays the recorded producer audio tag ("Samu Helman en el mix").
   * 2. Ducks the beat track volume down only slightly (~15%) so drums, 808 bass, and energy are preserved.
   * 3. Volume of the tag is reduced by 30% for a smooth, non-invasive placement.
   */
  private triggerMusicalBarWatermark(barNumber: number) {
    if (!this.hasVoiceTag || !this.isPlaying) return;

    try {
      this.isTagCurrentlyPlaying = true;
      // 1. Gentle musical ducking: beat volume drops only ~15% (stays at 85% presence)
      const originalVolume = this.volume;
      const duckedVolume = Math.max(0.18, originalVolume * 0.85);

      if (this.audioElement) {
        this.audioElement.volume = duckedVolume;
      }

      // 2. Play the official producer voice tag audio file at 30% reduced volume
      if (!this.voiceTagAudio) {
        this.initVoiceTagAudio();
      }

      if (this.voiceTagAudio) {
        this.voiceTagAudio.currentTime = 0;
        // 30% reduction from master volume level to sit smoothly in the mix
        this.voiceTagAudio.volume = Math.max(0.2, Math.min(0.70, originalVolume * 0.68));

        const restoreBeatVolume = () => {
          this.isTagCurrentlyPlaying = false;
          if (this.audioElement && this.isPlaying) {
            this.audioElement.volume = this.volume;
          }
        };

        this.voiceTagAudio.onended = restoreBeatVolume;
        this.voiceTagAudio.onerror = () => {
          if (this.voiceTagAudio && !this.voiceTagAudio.src.includes('/producer-voice-tag.mp3')) {
            this.voiceTagAudio.src = '/producer-voice-tag.mp3';
            this.voiceTagAudio.play().catch(() => {});
          }
          setTimeout(restoreBeatVolume, 2500);
        };

        const playPromise = this.voiceTagAudio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn('Voice tag audio play deferred by browser:', err);
            setTimeout(restoreBeatVolume, 1500);
          });
        }

        // Safety fallback timer to ensure beat volume is ALWAYS restored smoothly
        setTimeout(restoreBeatVolume, 3500);
      }
    } catch (e) {
      console.warn('Non-fatal producer voice tag error:', e);
      this.isTagCurrentlyPlaying = false;
      if (this.audioElement) {
        this.audioElement.volume = this.volume;
      }
    }
  }

  public playBeat(
    beatId: string, 
    bpm: number, 
    keyScale: string, 
    audioUrl?: string, 
    durationSeconds = 165
  ): { success: boolean; hasAudio: boolean; error?: string } {
    const normalizedUrl = normalizeAudioUrl(audioUrl);

    // Check if a real audio file / URL is present
    if (!normalizedUrl) {
      this.stop();
      this.isPlaying = false;
      if (this.onErrorCallback) {
        this.onErrorCallback('No se proporcionó una URL de audio válida o accesible para este beat.');
      }
      return { success: false, hasAudio: false, error: 'No audio URL provided' };
    }

    // Configure Musical Tempo & Bar Grid
    this.currentBpm = Math.max(45, Math.min(240, Number.isFinite(bpm) && bpm > 0 ? bpm : 120));
    this.barDuration = (60 / this.currentBpm) * 4; // 4/4 meter

    // If already playing the exact same track, just resume
    if (this.audioElement && this.currentBeatId === beatId && this.currentAudioUrl === normalizedUrl) {
      if (this.audioElement.paused) {
        const promise = this.audioElement.play();
        if (promise !== undefined) {
          promise.then(() => {
            this.isPlaying = true;
          }).catch((err) => {
            console.warn('Error al reanudar audio:', err);
          });
        }
      }
      this.isPlaying = true;
      return { success: true, hasAudio: true };
    }

    this.stop();
    this.currentBeatId = beatId;
    this.totalDuration = (Number.isFinite(durationSeconds) && durationSeconds > 0) ? durationSeconds : 165;
    this.totalBars = Math.max(8, Math.floor(this.totalDuration / this.barDuration));
    this.currentTime = 0;
    this.currentAudioUrl = normalizedUrl;
    this.lastTriggeredBar = -1; // Reset so Bar 8 can trigger when reached

    // Immediately trigger time & musical bar update callbacks so UI reflects tempo and bar 1
    if (this.onTimeUpdateCallback) {
      this.onTimeUpdateCallback(0, this.totalDuration);
    }
    if (this.onMusicalBarCallback) {
      this.onMusicalBarCallback(getMusicalBarMetrics(0, this.totalDuration, this.currentBpm));
    }

    try {
      const audio = new Audio();
      this.audioElement = audio;
      audio.volume = this.volume;
      audio.preload = 'auto';

      // Attach all HTML5 audio events
      audio.onloadedmetadata = () => {
        if (Number.isFinite(audio.duration) && audio.duration > 0) {
          this.totalDuration = audio.duration;
          this.totalBars = Math.max(8, Math.floor(this.totalDuration / this.barDuration));
        }
        if (this.onTimeUpdateCallback) {
          this.onTimeUpdateCallback(this.currentTime, this.totalDuration);
        }
        if (this.onMusicalBarCallback) {
          this.onMusicalBarCallback(getMusicalBarMetrics(this.currentTime, this.totalDuration, this.currentBpm));
        }
      };

      audio.ondurationchange = () => {
        if (Number.isFinite(audio.duration) && audio.duration > 0) {
          this.totalDuration = audio.duration;
          this.totalBars = Math.max(8, Math.floor(this.totalDuration / this.barDuration));
        }
        if (this.onTimeUpdateCallback) {
          this.onTimeUpdateCallback(this.currentTime, this.totalDuration);
        }
      };

      audio.oncanplay = () => {
        if (Number.isFinite(audio.duration) && audio.duration > 0) {
          this.totalDuration = audio.duration;
          this.totalBars = Math.max(8, Math.floor(this.totalDuration / this.barDuration));
        }
        if (this.onTimeUpdateCallback) {
          this.onTimeUpdateCallback(audio.currentTime || this.currentTime, this.totalDuration);
        }
      };

      audio.ontimeupdate = () => {
        this.currentTime = audio.currentTime;
        if (Number.isFinite(audio.duration) && audio.duration > 0) {
          this.totalDuration = audio.duration;
          this.totalBars = Math.max(8, Math.floor(this.totalDuration / this.barDuration));
        }
        if (this.onTimeUpdateCallback) {
          this.onTimeUpdateCallback(this.currentTime, this.totalDuration);
        }

        // Real-time Musical Bar & Turnaround Tag calculation
        const barMetrics = getMusicalBarMetrics(this.currentTime, this.totalDuration, this.currentBpm);
        if (this.onMusicalBarCallback) {
          this.onMusicalBarCallback(barMetrics);
        }

        // Trigger tag ONLY on designated musical turnaround bars (Bar 8, Bar 16, Bar 24, Bar 32...)
        // NEVER trigger at Bars 1-7 (intro remains 100% clean and uninvaded)
        if (this.hasVoiceTag && this.isPlaying && barMetrics.isTurnaroundBar) {
          if (this.lastTriggeredBar !== barMetrics.currentBar) {
            this.lastTriggeredBar = barMetrics.currentBar;
            this.triggerMusicalBarWatermark(barMetrics.currentBar);
          }
        }
      };

      audio.onplaying = () => {
        this.isPlaying = true;
        // Intentionally do NOT trigger at 0s! Intro remains 100% clean.
      };

      audio.onpause = () => {
        // If pause wasn't initiated by user stopping, keep state updated
      };

      audio.onended = () => {
        this.isPlaying = false;
        this.currentTime = 0;
        this.lastTriggeredBar = -1;
        if (this.onEndedCallback) {
          this.onEndedCallback();
        }
      };

      audio.onerror = () => {
        if (normalizedUrl !== '/subestimado.mp3') {
          audio.src = '/subestimado.mp3';
          audio.load();
          audio.play().then(() => {
            this.isPlaying = true;
          }).catch(() => {
            this.stop();
          });
          return;
        }
        this.stop();
        if (this.onErrorCallback) {
          this.onErrorCallback('No se pudo acceder al archivo de audio.');
        }
      };

      audio.src = normalizedUrl;
      audio.load();

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            this.isPlaying = true;
          })
          .catch((err) => {
            console.warn('Error de reproducción en el navegador:', err);
            this.isPlaying = false;
            if (this.onErrorCallback && err.name !== 'AbortError') {
              this.onErrorCallback('Haz clic en reproducir para iniciar la vista previa del audio.');
            }
          });
      }

      this.isPlaying = true;
      return { success: true, hasAudio: true };
    } catch (err: any) {
      console.error('Error inicializando elemento de audio:', err);
      this.stop();
      if (this.onErrorCallback) {
        this.onErrorCallback('Error al cargar la pista de audio. Verifica el enlace MP3');
      }
      return { success: false, hasAudio: true, error: err?.message };
    }
  }

  public resume() {
    if (this.audioElement && this.currentAudioUrl) {
      this.audioElement.play().then(() => {
        this.isPlaying = true;
      }).catch((err) => {
        console.warn('No se pudo reanudar el audio:', err);
        this.stop();
        if (this.onErrorCallback) {
          this.onErrorCallback('Error al cargar la pista de audio. Verifica el enlace MP3');
        }
      });
    }
  }

  public pause() {
    this.isPlaying = false;
    if (this.audioElement) {
      try {
        this.audioElement.pause();
      } catch (err) {
        console.warn('Error pausing audio:', err);
      }
    }
  }

  public stop() {
    this.isPlaying = false;
    if (this.audioElement) {
      try {
        this.audioElement.pause();
        this.audioElement.removeAttribute('src');
        this.audioElement.load();
      } catch (err) {
        // ignore cleanup errors
      }
      this.audioElement = null;
    }
    this.currentTime = 0;
    this.currentAudioUrl = null;
    if (this.onTimeUpdateCallback) {
      this.onTimeUpdateCallback(0, this.totalDuration);
    }
  }

  public getCurrentTime(): number {
    return this.currentTime;
  }

  public getDuration(): number {
    return this.totalDuration;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

export const audioEngine = new AudioEngine();

