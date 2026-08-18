// Real Audio Playback Engine (Pure HTML5 Audio & Native Stream Manager)
// Zero synthetic tones / Full HTTPS MP3 & WAV standard stream support

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
  private isPlaying = false;
  private volume = 0.8;
  private currentBeatId: string | null = null;
  private currentAudioUrl: string | null = null;
  private onTimeUpdateCallback: ((time: number, duration: number) => void) | null = null;
  private onEndedCallback: (() => void) | null = null;
  private onErrorCallback: ((errorMsg: string) => void) | null = null;
  private currentTime = 0;
  private totalDuration = 180;
  private hasVoiceTag = false;

  constructor() {
    // Client-side initialization
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
    if (this.audioElement && Number.isFinite(seconds)) {
      try {
        this.audioElement.currentTime = seconds;
        this.currentTime = seconds;
        if (this.onTimeUpdateCallback) {
          this.onTimeUpdateCallback(this.currentTime, this.totalDuration);
        }
      } catch (err) {
        console.warn('Seek error:', err);
      }
    } else {
      this.currentTime = seconds || 0;
      if (this.onTimeUpdateCallback) {
        this.onTimeUpdateCallback(this.currentTime, this.totalDuration);
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
        this.onErrorCallback('Error al cargar la pista de audio. Verifica el enlace MP3');
      }
      return { success: false, hasAudio: false, error: 'No audio URL provided' };
    }

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
    this.currentTime = 0;
    this.currentAudioUrl = normalizedUrl;

    // Immediately trigger time update callback so UI never stays at 00:00 / 00:00
    if (this.onTimeUpdateCallback) {
      this.onTimeUpdateCallback(0, this.totalDuration);
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
        }
        if (this.onTimeUpdateCallback) {
          this.onTimeUpdateCallback(this.currentTime, this.totalDuration);
        }
      };

      audio.ondurationchange = () => {
        if (Number.isFinite(audio.duration) && audio.duration > 0) {
          this.totalDuration = audio.duration;
        }
        if (this.onTimeUpdateCallback) {
          this.onTimeUpdateCallback(this.currentTime, this.totalDuration);
        }
      };

      audio.oncanplay = () => {
        if (Number.isFinite(audio.duration) && audio.duration > 0) {
          this.totalDuration = audio.duration;
        }
        if (this.onTimeUpdateCallback) {
          this.onTimeUpdateCallback(audio.currentTime || this.currentTime, this.totalDuration);
        }
      };

      audio.ontimeupdate = () => {
        this.currentTime = audio.currentTime;
        if (Number.isFinite(audio.duration) && audio.duration > 0) {
          this.totalDuration = audio.duration;
        }
        if (this.onTimeUpdateCallback) {
          this.onTimeUpdateCallback(this.currentTime, this.totalDuration);
        }
      };

      audio.onplaying = () => {
        this.isPlaying = true;
      };

      audio.onpause = () => {
        // If pause wasn't initiated by user stopping, keep state updated
      };

      audio.onended = () => {
        this.isPlaying = false;
        this.currentTime = 0;
        if (this.onEndedCallback) {
          this.onEndedCallback();
        }
      };

      audio.onerror = (e) => {
        console.warn('Error al cargar la pista de audio MP3/WAV:', normalizedUrl, e);
        this.stop();
        if (this.onErrorCallback) {
          this.onErrorCallback('Error al cargar la pista de audio. Verifica el enlace MP3');
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
            // Don't kill audio element if just browser user gesture policy
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

