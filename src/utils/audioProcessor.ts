import { detectBpmFromAudioBuffer } from './tempoAnalyzer';

/**
 * Audio Processor Engine
 * Handles automatic conversion of high-fidelity WAV master files into:
 * 1. A 40-second promotional preview clip.
 * 2. Lower sample-rate / bandwidth-limited preview audio (to prevent master ripping).
 * 3. Musical bar turnaround Voice Tag audio ("Samu Helman en el mix") at Bar 8, Bar 16, etc.
 */

export interface ProcessedAudioResult {
  previewBlob: Blob;
  previewUrl: string;
  duration: number; // 40 seconds
  sampleRate: number;
  waveform: number[];
  watermarkIntervals: number[]; // [0, 15, 30]
}

export interface AudioProcessingProgress {
  step: 'reading' | 'slicing' | 'downsampling' | 'watermarking' | 'encoding' | 'completed' | 'error';
  percent: number;
  message: string;
}

/**
 * Encodes an AudioBuffer into a valid 16-bit PCM WAV Blob.
 */
export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const outBuffer = new ArrayBuffer(length);
  const view = new DataView(outBuffer);
  const channels: Float32Array[] = [];
  const sampleRate = buffer.sampleRate;
  let offset = 0;

  function writeString(v: DataView, pos: number, str: string) {
    for (let i = 0; i < str.length; i++) {
      v.setUint8(pos + i, str.charCodeAt(i));
    }
  }

  // RIFF Chunk
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + buffer.length * numOfChan * 2, true);
  writeString(view, 8, 'WAVE');

  // fmt sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, numOfChan, true); // NumChannels
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * 2 * numOfChan, true); // ByteRate
  view.setUint16(32, numOfChan * 2, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample (16 bits)

  // data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, buffer.length * numOfChan * 2, true);

  for (let i = 0; i < numOfChan; i++) {
    channels.push(buffer.getChannelData(i));
  }

  offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numOfChan; ch++) {
      let sample = Math.max(-1, Math.min(1, channels[ch][i]));
      // Convert float sample (-1.0 to 1.0) to 16-bit integer (-32768 to 32767)
      sample = sample < 0 ? sample * 32768 : sample * 32767;
      view.setInt16(offset, Math.round(sample), true);
      offset += 2;
    }
  }

  return new Blob([view], { type: 'audio/wav' });
}

/**
 * Extracts 30-50 normalized waveform data points from an AudioBuffer for visual rendering.
 */
export function extractWaveformData(buffer: AudioBuffer, numPoints = 40): number[] {
  const channelData = buffer.getChannelData(0);
  const step = Math.floor(channelData.length / numPoints);
  const waveform: number[] = [];

  for (let i = 0; i < numPoints; i++) {
    let sum = 0;
    const start = i * step;
    const end = Math.min(start + step, channelData.length);
    for (let j = start; j < end; j++) {
      sum += Math.abs(channelData[j]);
    }
    const avg = sum / (end - start || 1);
    // Normalize to 0.1 - 1.0 range
    waveform.push(Math.max(0.12, Math.min(1, avg * 3.5)));
  }

  return waveform;
}

/**
 * Generates an audible producer watermark voice tag tone + voice signature
 * ("Samu Helman en el mix" signature acoustic cue) directly inside an OfflineAudioContext.
 */
function renderWatermarkAtTime(
  ctx: OfflineAudioContext,
  targetTime: number,
  producerName = 'Samu Helman en el mix'
) {
  const now = targetTime;

  // 1. Sensual Studio Sparkle & Harmonic Cue
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const chimeGain = ctx.createGain();

  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(1174.66, now); // D6
  osc1.frequency.exponentialRampToValueAtTime(880, now + 0.35); // A5

  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(587.33, now); // D5
  osc2.frequency.exponentialRampToValueAtTime(440, now + 0.35);

  chimeGain.gain.setValueAtTime(0, now);
  chimeGain.gain.linearRampToValueAtTime(0.28, now + 0.05);
  chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

  osc1.connect(chimeGain);
  osc2.connect(chimeGain);
  chimeGain.connect(ctx.destination);

  osc1.start(now);
  osc1.stop(now + 0.55);
  osc2.start(now);
  osc2.stop(now + 0.55);

  // 2. Velvety, warm harmonic whisper tag resonance (Soft, non-robotic acoustic bed)
  const warmPadOsc = ctx.createOscillator();
  const warmFilter = ctx.createBiquadFilter();
  const warmGain = ctx.createGain();

  warmPadOsc.type = 'sine';
  warmPadOsc.frequency.setValueAtTime(440, now + 0.12);
  warmPadOsc.frequency.exponentialRampToValueAtTime(349.23, now + 0.45); // F4
  warmPadOsc.frequency.exponentialRampToValueAtTime(261.63, now + 0.75); // C4

  warmFilter.type = 'lowpass';
  warmFilter.frequency.setValueAtTime(1400, now + 0.12);
  warmFilter.frequency.exponentialRampToValueAtTime(600, now + 0.8);
  warmFilter.Q.value = 1.2;

  warmGain.gain.setValueAtTime(0, now + 0.12);
  warmGain.gain.linearRampToValueAtTime(0.22, now + 0.22);
  warmGain.gain.setValueAtTime(0.20, now + 0.6);
  warmGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.95);

  warmPadOsc.connect(warmFilter);
  warmFilter.connect(warmGain);
  warmGain.connect(ctx.destination);

  warmPadOsc.start(now + 0.12);
  warmPadOsc.stop(now + 0.95);
}

/**
 * Main function: Converts a high-res WAV master into a 40s watermarked preview clip.
 * Intercalates the voice tag every 15 seconds (0s, 15s, 30s).
 * Reduces sample rate / applies preview filtering to protect original WAV master fidelity.
 */
export async function processMasterWavToPreviewClip(
  audioFile: File | Blob,
  options: {
    targetDurationSeconds?: number;
    intervalSeconds?: number;
    bpm?: number;
    previewSampleRate?: number;
    producerName?: string;
    onProgress?: (progress: AudioProcessingProgress) => void;
  } = {}
): Promise<ProcessedAudioResult> {
  const {
    targetDurationSeconds = 40,
    intervalSeconds = 15,
    bpm,
    previewSampleRate = 32000, // Reduced quality (32kHz) for preview protection
    producerName = 'Samu Helman en el mix',
    onProgress = () => {}
  } = options;

  onProgress({
    step: 'reading',
    percent: 15,
    message: 'Leyendo y analizando archivo WAV Master de alta resolución...'
  });

  // 1. Read binary arrayBuffer from File / Blob
  const arrayBuffer = await audioFile.arrayBuffer();

  onProgress({
    step: 'slicing',
    percent: 35,
    message: `Decodificando audio y recortando clip de ${targetDurationSeconds} segundos...`
  });

  // 2. Decode raw audio data with standard AudioContext
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const tempCtx = new AudioCtx();
  const decodedBuffer = await tempCtx.decodeAudioData(arrayBuffer);

  // Automatic AI/Algorithmic Tempo Recognition
  let effectiveBpm = bpm;
  if (!effectiveBpm || effectiveBpm < 45 || effectiveBpm > 240) {
    effectiveBpm = await detectBpmFromAudioBuffer(decodedBuffer);
  }

  // Attempt to load official producer voice tag audio buffer
  let voiceTagBuffer: AudioBuffer | null = null;
  try {
    const tagRes = await fetch('/uploads/producer-voice-tag.mp3').catch(() => fetch('/producer-voice-tag.mp3'));
    if (tagRes && tagRes.ok) {
      const tagArrayBuffer = await tagRes.arrayBuffer();
      // Decode with a temporary clone context
      const tagCtx = new AudioCtx();
      voiceTagBuffer = await tagCtx.decodeAudioData(tagArrayBuffer);
      await tagCtx.close();
    }
  } catch (tagErr) {
    console.warn('Voice tag audio buffer load fallback:', tagErr);
  }

  await tempCtx.close();

  // Determine actual clip duration (max targetDurationSeconds, e.g. 40s)
  const actualDuration = Math.min(targetDurationSeconds, decodedBuffer.duration);
  const numChannels = Math.min(2, decodedBuffer.numberOfChannels);

  onProgress({
    step: 'downsampling',
    percent: 55,
    message: 'Optimizando resolución a calidad de muestra web (32kHz) para protección...'
  });

  // 3. Create OfflineAudioContext with lower preview sample rate (e.g. 32000 Hz)
  const renderLength = Math.floor(actualDuration * previewSampleRate);
  const offlineCtx = new OfflineAudioContext(numChannels, renderLength, previewSampleRate);

  // 4. Create Source Buffer with original audio sliced to 40 seconds
  const sourceNode = offlineCtx.createBufferSource();
  
  // Resample/render original buffer into offlineCtx
  const slicedSourceBuffer = offlineCtx.createBuffer(
    numChannels, 
    Math.floor(actualDuration * decodedBuffer.sampleRate), 
    decodedBuffer.sampleRate
  );

  for (let ch = 0; ch < numChannels; ch++) {
    const srcData = decodedBuffer.getChannelData(ch);
    const destData = slicedSourceBuffer.getChannelData(ch);
    for (let i = 0; i < destData.length; i++) {
      destData[i] = srcData[i] || 0;
    }
  }

  sourceNode.buffer = slicedSourceBuffer;

  // Bandwidth limiter filter to safeguard studio clarity
  const previewFilter = offlineCtx.createBiquadFilter();
  previewFilter.type = 'lowpass';
  previewFilter.frequency.value = 14500; // Limits extreme top-end sheen from being pirated

  // Gain / Master volume
  const masterGain = offlineCtx.createGain();
  masterGain.gain.setValueAtTime(0.9, 0);

  // 5. Musical bar-based Voice Tag placement (Bar 8, Bar 16, Bar 24...)
  const barDuration = (60 / effectiveBpm) * 4; // 4/4 meter
  const targetTurnaroundBars = [8, 16, 24, 32, 40];
  const watermarkIntervals: number[] = targetTurnaroundBars
    .map(bar => (bar - 1) * barDuration)
    .filter(t => t > 0 && t < actualDuration - 2.5);

  if (watermarkIntervals.length === 0) {
    watermarkIntervals.push(Math.min(14, actualDuration / 2));
  }

  onProgress({
    step: 'watermarking',
    percent: 75,
    message: `Insertando Voice Tag (${producerName}) en compases 8 y 16 (${effectiveBpm} BPM)...`
  });

  for (const t of watermarkIntervals) {
    if (voiceTagBuffer) {
      // 1. Gentle musical ducking (~15% drop) so the beat remains full and energetic without being obscured
      masterGain.gain.setValueAtTime(0.95, Math.max(0, t - 0.05));
      masterGain.gain.linearRampToValueAtTime(0.82, t + 0.12);
      masterGain.gain.linearRampToValueAtTime(0.82, t + 2.2);
      masterGain.gain.linearRampToValueAtTime(0.95, t + 2.7);

      // 2. Play the actual producer voice tag audio buffer at 30% reduced volume (0.70 instead of 1.15)
      const tagSource = offlineCtx.createBufferSource();
      tagSource.buffer = voiceTagBuffer;
      const tagGain = offlineCtx.createGain();
      tagGain.gain.setValueAtTime(0.70, t);
      tagSource.connect(tagGain);
      tagGain.connect(offlineCtx.destination);
      tagSource.start(t);
    } else {
      // Fallback ducking and acoustic watermark cue
      masterGain.gain.setValueAtTime(0.9, Math.max(0, t - 0.05));
      masterGain.gain.linearRampToValueAtTime(0.55, t + 0.1);
      masterGain.gain.linearRampToValueAtTime(0.55, t + 0.85);
      masterGain.gain.linearRampToValueAtTime(0.9, t + 1.2);

      renderWatermarkAtTime(offlineCtx, t, producerName);
    }
  }

  // Connect beat source graph
  sourceNode.connect(previewFilter);
  previewFilter.connect(masterGain);
  masterGain.connect(offlineCtx.destination);

  // Start beat source at time 0
  sourceNode.start(0);

  onProgress({
    step: 'encoding',
    percent: 90,
    message: 'Compilando y codificando clip de escucha previa oficial...'
  });

  // 6. Render the combined audio graph into an AudioBuffer
  const renderedBuffer = await offlineCtx.startRendering();

  // 7. Convert rendered AudioBuffer to WAV Blob
  const previewBlob = audioBufferToWav(renderedBuffer);
  const previewUrl = URL.createObjectURL(previewBlob);
  const waveform = extractWaveformData(renderedBuffer, 40);

  onProgress({
    step: 'completed',
    percent: 100,
    message: '¡Clip de escucha previa de 40 segundos generado con éxito!'
  });

  return {
    previewBlob,
    previewUrl,
    duration: actualDuration,
    sampleRate: previewSampleRate,
    waveform,
    watermarkIntervals
  };
}
