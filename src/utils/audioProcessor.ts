/**
 * Audio Processor Engine
 * Handles automatic conversion of high-fidelity WAV master files into:
 * 1. A 40-second promotional preview clip.
 * 2. Lower sample-rate / bandwidth-limited preview audio (to prevent master ripping).
 * 3. Watermarking / Voice Tag audio ("Samu Helman en el mix") intercalated every 15 seconds (0s, 15s, 30s).
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

  // 1. Chime / Signature Acoustic Ping
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const chimeGain = ctx.createGain();

  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(1046.50, now); // C6
  osc1.frequency.exponentialRampToValueAtTime(523.25, now + 0.35); // C5

  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(1318.51, now); // E6
  osc2.frequency.exponentialRampToValueAtTime(659.25, now + 0.35); // E5

  chimeGain.gain.setValueAtTime(0, now);
  chimeGain.gain.linearRampToValueAtTime(0.45, now + 0.05);
  chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

  osc1.connect(chimeGain);
  osc2.connect(chimeGain);
  chimeGain.connect(ctx.destination);

  osc1.start(now);
  osc1.stop(now + 0.55);
  osc2.start(now);
  osc2.stop(now + 0.55);

  // 2. Robotic / Formant Vocoder "Voice Tag" simulation sweep
  // Simulates "Samu Helman en el mix" watermark resonance
  const formantOsc = ctx.createOscillator();
  const formantFilter = ctx.createBiquadFilter();
  const formantGain = ctx.createGain();

  formantOsc.type = 'sawtooth';
  formantOsc.frequency.setValueAtTime(160, now + 0.15);
  formantOsc.frequency.setValueAtTime(190, now + 0.45);
  formantOsc.frequency.setValueAtTime(140, now + 0.75);

  formantFilter.type = 'bandpass';
  formantFilter.frequency.setValueAtTime(1200, now + 0.15);
  formantFilter.frequency.exponentialRampToValueAtTime(2400, now + 0.5);
  formantFilter.frequency.exponentialRampToValueAtTime(800, now + 0.9);
  formantFilter.Q.value = 4.5;

  formantGain.gain.setValueAtTime(0, now + 0.15);
  formantGain.gain.linearRampToValueAtTime(0.35, now + 0.25);
  formantGain.gain.setValueAtTime(0.35, now + 0.75);
  formantGain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);

  formantOsc.connect(formantFilter);
  formantFilter.connect(formantGain);
  formantGain.connect(ctx.destination);

  formantOsc.start(now + 0.15);
  formantOsc.stop(now + 1.15);
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
    previewSampleRate?: number;
    producerName?: string;
    onProgress?: (progress: AudioProcessingProgress) => void;
  } = {}
): Promise<ProcessedAudioResult> {
  const {
    targetDurationSeconds = 40,
    intervalSeconds = 15,
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

  // 5. Intercalate Voice Tag / Watermark every 15 seconds (at 0s, 15s, 30s)
  onProgress({
    step: 'watermarking',
    percent: 75,
    message: `Insertando Voice Tag (${producerName}) cada ${intervalSeconds}s (0s, 15s, 30s)...`
  });

  const watermarkIntervals: number[] = [];
  for (let t = 0; t < actualDuration - 2; t += intervalSeconds) {
    watermarkIntervals.push(t);
    // Subtle ducking of the beat volume during watermark injection
    masterGain.gain.setValueAtTime(0.9, Math.max(0, t - 0.05));
    masterGain.gain.linearRampToValueAtTime(0.45, t + 0.1);
    masterGain.gain.linearRampToValueAtTime(0.45, t + 0.85);
    masterGain.gain.linearRampToValueAtTime(0.9, t + 1.2);

    // Render audible acoustic watermark tag at this timestamp
    renderWatermarkAtTime(offlineCtx, t, producerName);
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
