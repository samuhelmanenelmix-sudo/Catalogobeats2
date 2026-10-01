/**
 * AI & Algorithmic Tempo & Musical Bar (Compases) Analyzer
 * 
 * Analyzes beats in 4/4 meter (standard in urban, trap, reggaeton, hip hop, boombap):
 * - 4 beats (pulsos) per compás (bar)
 * - 1 beat duration = 60 / BPM seconds
 * - 1 compás (bar) duration = (60 / BPM) * 4 seconds = 240 / BPM seconds
 * 
 * Musical Turnarounds & Drop Points:
 * - Phrase length: 8 bars (compases 1 to 8) and 16 bars (compases 1 to 16)
 * - Bar 8: Turnaround of the 1st phrase (starts at (8 - 1) * barDuration)
 * - Bar 16: Turnaround of the 2nd phrase (starts at (16 - 1) * barDuration)
 * - Bar 24: Turnaround of the 3rd phrase
 * - Bar 32: Turnaround of the 4th phrase
 * - Outro: Final bars before song completion
 * 
 * Preserves bars 1-7 (intro & first verse drop) 100% clean without invasion.
 */

export interface MusicalBarInfo {
  bpm: number;
  barDuration: number;
  beatDuration: number;
  currentBar: number;
  totalBars: number;
  beatInBar: number;
  isTurnaroundBar: boolean;
  nextTagBar: number;
  secondsToNextTag: number;
  timeInCurrentBar: number;
  turnaroundBars: number[];
}

/**
 * Calculates real-time musical bar and tempo metrics for a given playback timestamp.
 */
export function getMusicalBarMetrics(
  currentTimeSeconds: number,
  totalDurationSeconds: number,
  bpmInput = 120
): MusicalBarInfo {
  // Clamp BPM to musically valid ranges (40 - 240 BPM)
  const bpm = Math.max(45, Math.min(240, Number.isFinite(bpmInput) && bpmInput > 0 ? bpmInput : 120));
  const beatDuration = 60 / bpm;
  const barDuration = beatDuration * 4; // 4/4 meter
  
  const duration = Math.max(barDuration * 8, Number.isFinite(totalDurationSeconds) && totalDurationSeconds > 0 ? totalDurationSeconds : 165);
  const totalBars = Math.max(8, Math.floor(duration / barDuration));
  
  const safeTime = Math.max(0, currentTimeSeconds);
  const currentBar = Math.min(totalBars, Math.floor(safeTime / barDuration) + 1);
  const timeInCurrentBar = safeTime % barDuration;
  const beatInBar = Math.min(4, Math.floor(timeInCurrentBar / beatDuration) + 1);

  // Generate target turnaround bars: every 8 bars (Bar 8, 16, 24, 32, 40, 48...) + final outro bar
  const turnaroundBars: number[] = [];
  for (let b = 8; b <= totalBars; b += 8) {
    turnaroundBars.push(b);
  }
  // Add final outro bar if track is long and doesn't land on an 8-multiple
  if (totalBars > 12 && !turnaroundBars.includes(totalBars - 1) && !turnaroundBars.includes(totalBars)) {
    turnaroundBars.push(totalBars - 1);
  }

  // Is current bar a designated turnaround bar (bar 8, 16, 24, 32...)?
  const isTurnaroundBar = turnaroundBars.includes(currentBar);

  // Find next upcoming tag turnaround bar
  const upcomingBars = turnaroundBars.filter(b => b >= currentBar);
  const nextTagBar = upcomingBars.length > 0 ? upcomingBars[0] : turnaroundBars[turnaroundBars.length - 1] || 8;
  
  const nextTagStartTime = (nextTagBar - 1) * barDuration;
  const secondsToNextTag = Math.max(0, nextTagStartTime - safeTime);

  return {
    bpm,
    barDuration,
    beatDuration,
    currentBar,
    totalBars,
    beatInBar,
    isTurnaroundBar,
    nextTagBar,
    secondsToNextTag,
    timeInCurrentBar,
    turnaroundBars
  };
}

/**
 * Intelligent Audio Buffer Tempo (BPM) detection using low-end transient peaks and autocorrelation.
 * Used when a newly uploaded track has unknown or unconfirmed BPM.
 */
export async function detectBpmFromAudioBuffer(audioBuffer: AudioBuffer): Promise<number> {
  try {
    const sampleRate = audioBuffer.sampleRate;
    const channelData = audioBuffer.getChannelData(0);
    
    // Analyze a focused 30-second window with active rhythm
    const maxSamples = Math.min(channelData.length, sampleRate * 30);
    const startOffset = Math.min(channelData.length - maxSamples, sampleRate * 5); // Skip quiet intro
    
    // Downsample factor to speed up calculation (~2205 Hz analysis rate)
    const downsample = Math.floor(sampleRate / 2205);
    const downsampledLength = Math.floor(maxSamples / downsample);
    const downsampled = new Float32Array(downsampledLength);

    for (let i = 0; i < downsampledLength; i++) {
      const srcIdx = startOffset + i * downsample;
      downsampled[i] = Math.abs(channelData[srcIdx]);
    }

    // Simple peak intervals / autocorrelation between 60 BPM and 180 BPM
    const minInterval = Math.floor((60 / 180) * 2205); // ~180 BPM
    const maxInterval = Math.floor((60 / 60) * 2205);  // ~60 BPM

    let bestInterval = minInterval;
    let maxCorrelation = 0;

    for (let interval = minInterval; interval <= maxInterval; interval += 2) {
      let correlation = 0;
      const step = 4;
      const compareLimit = Math.min(downsampledLength - interval, 4000);
      for (let i = 0; i < compareLimit; i += step) {
        correlation += downsampled[i] * downsampled[i + interval];
      }
      if (correlation > maxCorrelation) {
        maxCorrelation = correlation;
        bestInterval = interval;
      }
    }

    const detectedBpm = Math.round((60 * 2205) / bestInterval);
    if (detectedBpm >= 65 && detectedBpm <= 175) {
      return detectedBpm;
    }
    return 120; // Safe musical default
  } catch (err) {
    console.warn('Tempo detection fallback:', err);
    return 120;
  }
}
