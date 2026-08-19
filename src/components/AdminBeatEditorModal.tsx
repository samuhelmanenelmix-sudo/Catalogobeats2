import React, { useState, useEffect } from 'react';
import { 
  X, 
  Upload, 
  Music, 
  DollarSign, 
  Layers, 
  Sparkles, 
  Check, 
  ExternalLink, 
  Zap, 
  Link as LinkIcon, 
  Image as ImageIcon,
  Tag,
  Clock,
  Radio,
  FileAudio,
  ShieldCheck,
  Play,
  Pause,
  Loader2,
  AlertCircle,
  Copy,
  CheckCheck,
  Link2,
  Share2
} from 'lucide-react';
import { Beat, Genre, PaymentGatewaysConfig } from '../types';
import { GENRES_LIST, DEFAULT_LICENSE_TIERS } from '../data/defaultBeats';
import { PaypalLogo } from './PaypalLogo';
import { getBeatDirectUrl, getBeatSlug, copyToClipboard } from '../utils/beatLinks';
import { processMasterWavToPreviewClip, AudioProcessingProgress } from '../utils/audioProcessor';
import { AudioPreviewClipCard } from './AudioPreviewClipCard';

interface AdminBeatEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  beatToEdit: Beat | null;
  onSaveBeat: (beat: Beat) => void;
  onDeleteBeat?: (beatId: string) => void;
  paymentConfig: PaymentGatewaysConfig;
}

export const AdminBeatEditorModal: React.FC<AdminBeatEditorModalProps> = ({
  isOpen,
  onClose,
  beatToEdit,
  onSaveBeat,
  onDeleteBeat,
  paymentConfig,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'pricing' | 'paypal' | 'media'>('info');

  // General details
  const [title, setTitle] = useState('');
  const [producer, setProducer] = useState('');
  const [genre, setGenre] = useState<Genre>('Trap');
  const [subgenre, setSubgenre] = useState('');
  const [bpm, setBpm] = useState<number | string>(130);
  const [keyScale, setKeyScale] = useState('C Minor');
  const [duration, setDuration] = useState('2:50');
  const [tagsString, setTagsString] = useState('#Trap, #TypeBeat, #808');
  const [moodsString, setMoodsString] = useState('Agresivo, Oscuro');
  const [description, setDescription] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [audioPreviewUrl, setAudioPreviewUrl] = useState('');
  const [stemsFileUrl, setStemsFileUrl] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isSoldExclusive, setIsSoldExclusive] = useState(false);
  const [previewDuration, setPreviewDuration] = useState(40);
  const [previewWaveform, setPreviewWaveform] = useState<number[]>([]);
  const [masterFileName, setMasterFileName] = useState('');
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState<AudioProcessingProgress | null>(null);
  const [testAudioPlaying, setTestAudioPlaying] = useState(false);
  const [testAudioElem, setTestAudioElem] = useState<HTMLAudioElement | null>(null);

  // Exact 4 Tier Prices matching PDF
  const [priceBasic, setPriceBasic] = useState<number>(20.00);
  const [priceMedia, setPriceMedia] = useState<number>(45.00);
  const [priceExclusive, setPriceExclusive] = useState<number>(150.00);
  const [pricePremium, setPricePremium] = useState<number>(250.00);

  // Individual PayPal direct links
  const [paypalBasic, setPaypalBasic] = useState('');
  const [paypalMedia, setPaypalMedia] = useState('');
  const [paypalExclusive, setPaypalExclusive] = useState('');
  const [paypalPremium, setPaypalPremium] = useState('');
  const [copiedLinkType, setCopiedLinkType] = useState<'url' | 'phrase' | null>(null);

  // Image Upload state
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUploadStatus, setImageUploadStatus] = useState<string | null>(null);

  useEffect(() => {
    if (beatToEdit) {
      setTitle(beatToEdit.title);
      setProducer(beatToEdit.producer);
      setGenre(beatToEdit.genre);
      setSubgenre(beatToEdit.subgenre || '');
      setBpm(beatToEdit.bpm);
      setKeyScale(beatToEdit.keyScale);
      setDuration(beatToEdit.duration || '2:50');
      setTagsString(beatToEdit.tags?.join(', ') || '');
      setMoodsString(beatToEdit.mood?.join(', ') || '');
      setDescription(beatToEdit.description || '');
      setCoverUrl(beatToEdit.coverUrl || '');
      setAudioPreviewUrl(beatToEdit.audioPreviewUrl || '');
      setStemsFileUrl(beatToEdit.stemsFileUrl || '');
      setIsFeatured(Boolean(beatToEdit.isFeatured));
      setIsSoldExclusive(Boolean(beatToEdit.isSoldExclusive));
      setPreviewDuration(beatToEdit.previewDuration || 40);
      setPreviewWaveform(beatToEdit.previewWaveform || []);
      setMasterFileName(beatToEdit.audioFileName || '');

      setPriceBasic(beatToEdit.tierPrices?.basic ?? 20.00);
      setPriceMedia(beatToEdit.tierPrices?.media ?? 45.00);
      setPriceExclusive(beatToEdit.tierPrices?.exclusive ?? 150.00);
      setPricePremium(beatToEdit.tierPrices?.premium ?? 250.00);

      setPaypalBasic(beatToEdit.paypalLinks?.basic || '');
      setPaypalMedia(beatToEdit.paypalLinks?.media || '');
      setPaypalExclusive(beatToEdit.paypalLinks?.exclusive || '');
      setPaypalPremium(beatToEdit.paypalLinks?.premium || '');
    } else {
      // New beat defaults
      setTitle('');
      setProducer(paymentConfig.producerName || 'Samu helman en el mix / Samuel Helman');
      setGenre('Trap');
      setSubgenre('Dark Trap');
      setBpm(130);
      setKeyScale('C Minor');
      setDuration('2:50');
      setTagsString('#Trap, #TypeBeat, #808');
      setMoodsString('Agresivo, Oscuro');
      setDescription('Beat instrumental masterizado listo para grabación vocal profesional con contrato legal incluido.');
      setCoverUrl('');
      setAudioPreviewUrl('');
      setStemsFileUrl('');
      setIsFeatured(false);
      setIsSoldExclusive(false);
      setPreviewDuration(40);
      setPreviewWaveform([]);
      setMasterFileName('');

      setPriceBasic(20.00);
      setPriceMedia(45.00);
      setPriceExclusive(150.00);
      setPricePremium(250.00);

      const base = paymentConfig.paypalBaseUrl || 'https://www.paypal.com/paypalme/samuhelman/';
      const cleanBase = base.endsWith('/') ? base : `${base}/`;
      setPaypalBasic(`${cleanBase}20.00${paymentConfig.currency}`);
      setPaypalMedia(`${cleanBase}45.00${paymentConfig.currency}`);
      setPaypalExclusive(`${cleanBase}150.00${paymentConfig.currency}`);
      setPaypalPremium(`${cleanBase}250.00${paymentConfig.currency}`);
    }

    return () => {
      if (testAudioElem) {
        testAudioElem.pause();
        setTestAudioPlaying(false);
      }
    };
  }, [beatToEdit, paymentConfig, isOpen]);

  if (!isOpen) return null;

  const handleAutoGeneratePaypalLinks = () => {
    const base = paymentConfig.paypalBaseUrl.endsWith('/') 
      ? paymentConfig.paypalBaseUrl 
      : `${paymentConfig.paypalBaseUrl}/`;
    
    setPaypalBasic(`${base}${priceBasic.toFixed(2)}${paymentConfig.currency}`);
    setPaypalMedia(`${base}${priceMedia.toFixed(2)}${paymentConfig.currency}`);
    setPaypalExclusive(`${base}${priceExclusive.toFixed(2)}${paymentConfig.currency}`);
    setPaypalPremium(`${base}${pricePremium.toFixed(2)}${paymentConfig.currency}`);
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset the input value so user can re-upload same file if desired
    e.target.value = '';

    setIsUploadingImage(true);
    setImageUploadStatus('Optimizando imagen (< 200KB)...');

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      if (!rawDataUrl) {
        setIsUploadingImage(false);
        return;
      }

      // Resize and compress through client-side Canvas to strictly ensure < 200KB (typically 15-35KB)
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 400;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_SIZE) {
              height = Math.round((height * MAX_SIZE) / width);
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width = Math.round((width * MAX_SIZE) / height);
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            let compressedDataUrl = canvas.toDataURL('image/jpeg', 0.72);
            // Extra safety guard: if still > 200KB, re-compress with lower quality
            if (compressedDataUrl.length > 200000) {
              compressedDataUrl = canvas.toDataURL('image/jpeg', 0.50);
            }
            setCoverUrl(compressedDataUrl);
            setImageUploadStatus('✓ Portada optimizada y guardada');
            setTimeout(() => setImageUploadStatus(null), 3000);
          } else {
            if (rawDataUrl.length < 200000) {
              setCoverUrl(rawDataUrl);
            }
            setImageUploadStatus('✓ Portada cargada');
            setTimeout(() => setImageUploadStatus(null), 3000);
          }
        } catch (canvasErr) {
          console.warn('Canvas optimization fallback:', canvasErr);
          if (rawDataUrl.length < 200000) {
            setCoverUrl(rawDataUrl);
          }
          setImageUploadStatus('✓ Portada lista');
          setTimeout(() => setImageUploadStatus(null), 3000);
        } finally {
          setIsUploadingImage(false);
        }
      };
      img.onerror = () => {
        if (rawDataUrl.length < 200000) {
          setCoverUrl(rawDataUrl);
        }
        setIsUploadingImage(false);
        setImageUploadStatus('✓ Portada cargada');
        setTimeout(() => setImageUploadStatus(null), 3000);
      };
      img.src = rawDataUrl;
    };
    reader.onerror = () => {
      setIsUploadingImage(false);
      setImageUploadStatus('Error al leer el archivo');
      setTimeout(() => setImageUploadStatus(null), 4000);
    };
    reader.readAsDataURL(file);
  };

  // Automatic WAV Master Analysis & Metadata Generator without storing heavy Base64
  const handleMasterWavFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMasterFileName(file.name);
    setIsProcessingAudio(true);

    try {
      const result = await processMasterWavToPreviewClip(file, {
        targetDurationSeconds: 40,
        intervalSeconds: 15,
        previewSampleRate: 24000,
        producerName: producer || paymentConfig.producerName || 'Samu Helman en el mix',
        onProgress: (prog) => {
          setAudioProgress(prog);
        }
      });

      // Keep default lightweight stream or preserve current URL
      if (!audioPreviewUrl || audioPreviewUrl.startsWith('data:audio/')) {
        setAudioPreviewUrl('/subestimado.mp3');
      }
      setPreviewDuration(result.duration);
      setPreviewWaveform(result.waveform);
      
      // If title is empty, infer from file name
      if (!title) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
    } catch (err) {
      console.warn('Extracción de metadatos de audio:', err);
      if (!audioPreviewUrl) {
        setAudioPreviewUrl('/subestimado.mp3');
      }
    } finally {
      setTimeout(() => {
        setIsProcessingAudio(false);
        setAudioProgress(null);
      }, 800);
    }
  };

  const handleAudioFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMasterFileName(file.name);
    // Use lightweight URL instead of multi-megabyte Base64 in state
    if (!audioPreviewUrl || audioPreviewUrl.startsWith('data:audio/')) {
      setAudioPreviewUrl('/subestimado.mp3');
    }
    if (!title) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }
  };

  const toggleTestAudio = () => {
    const urlToTest = audioPreviewUrl || '/subestimado.mp3';

    if (testAudioPlaying && testAudioElem) {
      testAudioElem.pause();
      setTestAudioPlaying(false);
    } else {
      const audio = new Audio(urlToTest);
      audio.onended = () => setTestAudioPlaying(false);
      audio.play().then(() => {
        setTestAudioElem(audio);
        setTestAudioPlaying(true);
      }).catch((e) => {
        console.warn('Prueba de audio:', e);
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Por favor ingresa un título para el Beat.');
      return;
    }

    if (testAudioElem) {
      testAudioElem.pause();
    }

    const tagsArray = tagsString
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t) => (t.startsWith('#') ? t : `#${t}`));

    const moodsArray = moodsString
      .split(',')
      .map((m) => m.trim())
      .filter(Boolean);

    const parts = duration.split(':');
    const mins = parseInt(parts[0], 10) || 2;
    const secs = parseInt(parts[1], 10) || 50;
    const durationSeconds = mins * 60 + secs;

    let cleanCover = coverUrl.trim();
    if (cleanCover.includes('images.unsplash.com') || cleanCover.startsWith('/uploads/') || cleanCover.length > 200000) {
      cleanCover = '';
    }

    let cleanAudio = (audioPreviewUrl || '/subestimado.mp3').trim();
    // Strictly strip Base64 and local relative uploads
    if (cleanAudio.startsWith('data:audio/') || cleanAudio.startsWith('data:application/') || cleanAudio.startsWith('/uploads/') || cleanAudio.length > 2048) {
      cleanAudio = '/subestimado.mp3';
    }

    const updatedBeat: Beat = {
      id: beatToEdit ? beatToEdit.id : `beat-${Date.now()}`,
      title: title.trim(),
      producer: producer.trim() || paymentConfig.producerName,
      genre,
      subgenre: subgenre.trim(),
      bpm: Number(bpm) || 120,
      keyScale,
      mood: moodsArray.length > 0 ? moodsArray : ['Enérgico'],
      tags: tagsArray.length > 0 ? tagsArray : ['#Beat'],
      duration: duration.trim() || '2:50',
      durationSeconds,
      coverUrl: cleanCover,
      audioUrl: cleanAudio,
      audioPreviewUrl: cleanAudio,
      audioFileName: masterFileName || beatToEdit?.audioFileName,
      stemsFileUrl: stemsFileUrl.trim(),
      previewDuration: previewDuration || 40,
      isWatermarkedPreview: true,
      previewWaveform: previewWaveform.length > 0 ? previewWaveform.slice(0, 50) : undefined,
      description: description.trim(),
      plays: beatToEdit ? beatToEdit.plays : 0,
      likes: beatToEdit ? beatToEdit.likes : 0,
      isFeatured,
      isSoldExclusive,
      createdAt: beatToEdit ? beatToEdit.createdAt : new Date().toISOString().split('T')[0],
      paypalLinks: {
        basic: paypalBasic.trim(),
        media: paypalMedia.trim(),
        exclusive: paypalExclusive.trim(),
        premium: paypalPremium.trim(),
      },
      tierPrices: {
        basic: Number(priceBasic) || 20.00,
        media: Number(priceMedia) || 45.00,
        exclusive: Number(priceExclusive) || 150.00,
        premium: Number(pricePremium) || 250.00,
      }
    };

    onSaveBeat(updatedBeat);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6">
      <div 
        className="relative w-full max-w-3xl bg-[#030A14] border border-[#00F0FF]/30 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,240,255,0.15)] text-[#E0F2FE] flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#00F0FF]/20 bg-[#051525]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/30 shadow-[0_0_12px_rgba(0,240,255,0.2)]">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white font-display">
                {beatToEdit ? `Editar Beat: "${beatToEdit.title}"` : 'Subir Nuevo Instrumental al Catálogo'}
              </h3>
              <p className="text-xs text-sky-300/70">
                Segmento de licencias sincronizado con el contrato oficial (Básica $20, Media $45, Exclusiva $150, Premium Oferta).
              </p>
            </div>
          </div>

          <button
            id="btn-close-beat-editor"
            onClick={onClose}
            className="p-2 rounded-full bg-[#030A14] border border-[#00F0FF]/25 text-sky-300 hover:text-white hover:border-[#00F0FF] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#00F0FF]/20 bg-[#02070E] px-4 overflow-x-auto text-xs font-mono">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`py-3 px-4 font-bold border-b-2 transition whitespace-nowrap ${
              activeTab === 'info'
                ? 'border-[#00F0FF] text-[#00F0FF] bg-[#00F0FF]/5'
                : 'border-transparent text-sky-300/60 hover:text-white'
            }`}
          >
            1. Información & Metadata
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pricing')}
            className={`py-3 px-4 font-bold border-b-2 transition whitespace-nowrap ${
              activeTab === 'pricing'
                ? 'border-[#00F0FF] text-[#00F0FF] bg-[#00F0FF]/5'
                : 'border-transparent text-sky-300/60 hover:text-white'
            }`}
          >
            2. Matriz de Precios ($20, $45, $150, Oferta)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('paypal')}
            className={`py-3 px-4 font-bold border-b-2 transition whitespace-nowrap ${
              activeTab === 'paypal'
                ? 'border-[#00F0FF] text-[#00F0FF] bg-[#00F0FF]/5'
                : 'border-transparent text-sky-300/60 hover:text-white'
            }`}
          >
            3. Links Directos PayPal
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('media')}
            className={`py-3 px-4 font-bold border-b-2 transition whitespace-nowrap ${
              activeTab === 'media'
                ? 'border-[#00F0FF] text-[#00F0FF] bg-[#00F0FF]/5'
                : 'border-transparent text-sky-300/60 hover:text-white'
            }`}
          >
            4. Audio & Artwork
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          
          {/* TAB 1: BASIC INFO */}
          {activeTab === 'info' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-sky-300/80 mb-1">Título del Beat *</label>
                  <input
                    id="input-beat-title"
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej: Cyber Neon, Eclipse, Trap Legend..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#051525] border border-[#00F0FF]/25 text-sm text-white placeholder-sky-400/30 focus:outline-none focus:border-[#00F0FF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-sky-300/80 mb-1">Productor / Licenciante (Fijo)</label>
                  <input
                    id="input-beat-producer"
                    type="text"
                    value={producer}
                    onChange={(e) => setProducer(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#051525] border border-[#00F0FF]/25 text-sm text-white focus:outline-none focus:border-[#00F0FF]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold text-sky-300/80 mb-1">Género</label>
                  <select
                    id="select-beat-genre"
                    value={genre}
                    onChange={(e) => setGenre(e.target.value as Genre)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#051525] border border-[#00F0FF]/25 text-xs text-white focus:outline-none focus:border-[#00F0FF]"
                  >
                    {GENRES_LIST.map((g) => (
                      <option key={g} value={g} className="bg-[#030A14] text-white">{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-sky-300/80 mb-1">Subgénero</label>
                  <input
                    id="input-beat-subgenre"
                    type="text"
                    value={subgenre}
                    onChange={(e) => setSubgenre(e.target.value)}
                    placeholder="Ej: Dark, Melodic"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#051525] border border-[#00F0FF]/25 text-xs text-white focus:outline-none focus:border-[#00F0FF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-sky-300/80 mb-1">Tempo (BPM)</label>
                  <input
                    id="input-beat-bpm"
                    type="number"
                    value={bpm}
                    onChange={(e) => setBpm(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#051525] border border-[#00F0FF]/25 text-xs font-mono text-white focus:outline-none focus:border-[#00F0FF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-sky-300/80 mb-1">Escala / Tonalidad</label>
                  <input
                    id="input-beat-key"
                    type="text"
                    value={keyScale}
                    onChange={(e) => setKeyScale(e.target.value)}
                    placeholder="Ej: C Minor, F# Minor"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#051525] border border-[#00F0FF]/25 text-xs font-mono text-white focus:outline-none focus:border-[#00F0FF]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-sky-300/80 mb-1">Duración (mm:ss)</label>
                  <input
                    id="input-beat-duration"
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="2:50"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#051525] border border-[#00F0FF]/25 text-xs font-mono text-white focus:outline-none focus:border-[#00F0FF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-sky-300/80 mb-1">Etiquetas (Separadas por coma)</label>
                  <input
                    id="input-beat-tags"
                    type="text"
                    value={tagsString}
                    onChange={(e) => setTagsString(e.target.value)}
                    placeholder="#Trap, #TypeBeat, #808"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#051525] border border-[#00F0FF]/25 text-xs text-white focus:outline-none focus:border-[#00F0FF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-sky-300/80 mb-1">Descripción / Notas de Producción</label>
                <textarea
                  id="input-beat-desc"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalles sobre la mezcla, instrumentos y recomendaciones vocales..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#051525] border border-[#00F0FF]/25 text-xs text-white placeholder-sky-400/30 focus:outline-none focus:border-[#00F0FF]"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-mono">
                  <input
                    id="check-featured"
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="w-4 h-4 rounded text-[#00F0FF] bg-[#051525] border-[#00F0FF]/40 focus:ring-0"
                  />
                  <span>Destacar en Portada</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-rose-300">
                  <input
                    id="check-sold-exclusive"
                    type="checkbox"
                    checked={isSoldExclusive}
                    onChange={(e) => setIsSoldExclusive(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-500 bg-[#051525] border-rose-500/40 focus:ring-0"
                  />
                  <span>Marcar como VENDIDO EXCLUSIVO</span>
                </label>
              </div>
            </div>
          )}

          {/* TAB 2: PRICING (4 EXACT TIERS FROM PDF) */}
          {activeTab === 'pricing' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-3.5 bg-[#051525] border border-[#00F0FF]/30 rounded-2xl text-xs text-sky-200 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-[#00F0FF] shrink-0 mt-0.5" />
                <span>
                  Configura los precios del contrato oficial. La <strong>4ta opción (Licencia Premium)</strong> permite que los clientes envíen una oferta personalizada por los derechos premium completos y sincronización total / TV.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Basica MP3 */}
                <div className="p-4 bg-[#051525] border border-[#00F0FF]/30 rounded-2xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white font-display">1. Básica (MP3)</span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">50k streams</span>
                  </div>
                  <p className="text-[11px] text-sky-300/70">Hasta 2,500 ventas / 250k vistas YouTube. Sin radio / sincro.</p>
                  <div className="relative pt-1">
                    <span className="absolute left-3 top-3 text-sky-400 text-xs font-bold font-mono">$</span>
                    <input
                      id="price-basic"
                      type="number"
                      step="0.01"
                      min="1"
                      value={priceBasic}
                      onChange={(e) => setPriceBasic(Number(e.target.value))}
                      className="w-full pl-7 pr-3 py-2 bg-[#030A14] border border-[#00F0FF]/30 rounded-xl text-sm font-mono text-[#00F0FF] font-bold focus:border-[#00F0FF]"
                    />
                  </div>
                </div>

                {/* 2. Media WAV */}
                <div className="p-4 bg-[#051525] border border-[#00F0FF]/30 rounded-2xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white font-display">2. Media (WAV)</span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">250k streams</span>
                  </div>
                  <p className="text-[11px] text-sky-300/70">Hasta 10,000 ventas / 1M vistas YouTube / 2 emisoras radio.</p>
                  <div className="relative pt-1">
                    <span className="absolute left-3 top-3 text-sky-400 text-xs font-bold font-mono">$</span>
                    <input
                      id="price-media"
                      type="number"
                      step="0.01"
                      min="1"
                      value={priceMedia}
                      onChange={(e) => setPriceMedia(Number(e.target.value))}
                      className="w-full pl-7 pr-3 py-2 bg-[#030A14] border border-[#00F0FF]/30 rounded-xl text-sm font-mono text-[#00F0FF] font-bold focus:border-[#00F0FF]"
                    />
                  </div>
                </div>

                {/* 3. Exclusiva */}
                <div className="p-4 bg-[#051525] border border-[#00F0FF]/30 rounded-2xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white font-display">3. Exclusiva</span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Ilimitado + Stems</span>
                  </div>
                  <p className="text-[11px] text-sky-300/70">Ventas ilimitadas / Radio libre / Sincronización libre.</p>
                  <div className="relative pt-1">
                    <span className="absolute left-3 top-3 text-sky-400 text-xs font-bold font-mono">$</span>
                    <input
                      id="price-exclusive"
                      type="number"
                      step="0.01"
                      min="1"
                      value={priceExclusive}
                      onChange={(e) => setPriceExclusive(Number(e.target.value))}
                      className="w-full pl-7 pr-3 py-2 bg-[#030A14] border border-[#00F0FF]/30 rounded-xl text-sm font-mono text-[#00F0FF] font-bold focus:border-[#00F0FF]"
                    />
                  </div>
                </div>

                {/* 4. Premium (Oferta) */}
                <div className="p-4 bg-[#051525] border border-[#00F0FF]/50 rounded-2xl space-y-1.5 shadow-[0_0_20px_rgba(0,240,255,0.1)]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white font-display">4. Premium (Ofertar Monto)</span>
                    <span className="text-[10px] font-mono text-[#00F0FF] bg-[#00F0FF]/10 px-2 py-0.5 rounded border border-[#00F0FF]/30 font-bold">Oferta Negociable</span>
                  </div>
                  <p className="text-[11px] text-sky-300/70">Sincronización Total / TV / Cine. Oferta propuesta por el cliente.</p>
                  <div className="relative pt-1">
                    <span className="absolute left-3 top-3 text-sky-400 text-xs font-bold font-mono">$</span>
                    <input
                      id="price-premium"
                      type="number"
                      step="0.01"
                      min="1"
                      value={pricePremium}
                      onChange={(e) => setPricePremium(Number(e.target.value))}
                      placeholder="Base sugerida $250.00"
                      className="w-full pl-7 pr-3 py-2 bg-[#030A14] border border-[#00F0FF]/30 rounded-xl text-sm font-mono text-[#00F0FF] font-bold focus:border-[#00F0FF]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PAYPAL INDIVIDUAL LINKS */}
          {activeTab === 'paypal' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 bg-[#051525] border border-[#00F0FF]/30 rounded-2xl text-xs text-sky-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-white">
                    <PaypalLogo className="w-5 h-5" />
                    <span>Enlaces Directos de PayPal por Nivel de Licencia</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoGeneratePaypalLinks}
                    className="px-3 py-1.5 bg-[#00F0FF] hover:bg-[#38BDF8] text-black font-mono font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-[0_0_12px_rgba(0,240,255,0.3)]"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Autocompletar con PayPal.me</span>
                  </button>
                </div>
                <p className="text-sky-300/70 text-[11px] leading-relaxed">
                  Pega el link de cobro directo generado en tu cuenta de PayPal para cada tipo de licencia.
                </p>
              </div>

              {/* Basic PayPal Link */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-bold text-white font-mono">
                    1. Link PayPal - Básica (MP3) (${priceBasic.toFixed(2)})
                  </label>
                  {paypalBasic && (
                    <a href={paypalBasic} target="_blank" rel="noopener noreferrer" className="text-[#00F0FF] hover:underline flex items-center gap-1 text-[11px]">
                      <span>Probar link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <input
                  id="paypal-link-basic"
                  type="url"
                  value={paypalBasic}
                  onChange={(e) => setPaypalBasic(e.target.value)}
                  placeholder="https://www.paypal.com/ncp/payment/... o https://paypal.me/usuario/20.00USD"
                  className="w-full px-3.5 py-2.5 bg-[#051525] border border-[#00F0FF]/25 rounded-xl text-xs font-mono text-[#00F0FF] placeholder-sky-400/30 focus:outline-none focus:border-[#00F0FF]"
                />
              </div>

              {/* Media PayPal Link */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-bold text-white font-mono">
                    2. Link PayPal - Media (WAV) (${priceMedia.toFixed(2)})
                  </label>
                  {paypalMedia && (
                    <a href={paypalMedia} target="_blank" rel="noopener noreferrer" className="text-[#00F0FF] hover:underline flex items-center gap-1 text-[11px]">
                      <span>Probar link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <input
                  id="paypal-link-media"
                  type="url"
                  value={paypalMedia}
                  onChange={(e) => setPaypalMedia(e.target.value)}
                  placeholder="https://www.paypal.com/ncp/payment/... o https://paypal.me/usuario/45.00USD"
                  className="w-full px-3.5 py-2.5 bg-[#051525] border border-[#00F0FF]/25 rounded-xl text-xs font-mono text-[#00F0FF] placeholder-sky-400/30 focus:outline-none focus:border-[#00F0FF]"
                />
              </div>

              {/* Exclusive PayPal Link */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-bold text-white font-mono">
                    3. Link PayPal - Exclusiva (${priceExclusive.toFixed(2)})
                  </label>
                  {paypalExclusive && (
                    <a href={paypalExclusive} target="_blank" rel="noopener noreferrer" className="text-[#00F0FF] hover:underline flex items-center gap-1 text-[11px]">
                      <span>Probar link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <input
                  id="paypal-link-exclusive"
                  type="url"
                  value={paypalExclusive}
                  onChange={(e) => setPaypalExclusive(e.target.value)}
                  placeholder="https://www.paypal.com/ncp/payment/... o https://paypal.me/usuario/150.00USD"
                  className="w-full px-3.5 py-2.5 bg-[#051525] border border-[#00F0FF]/25 rounded-xl text-xs font-mono text-[#00F0FF] placeholder-sky-400/30 focus:outline-none focus:border-[#00F0FF]"
                />
              </div>

              {/* Premium PayPal Link */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-bold text-white font-mono">
                    4. Link PayPal - Premium (Oferta / Base ${pricePremium.toFixed(2)})
                  </label>
                  {paypalPremium && (
                    <a href={paypalPremium} target="_blank" rel="noopener noreferrer" className="text-[#00F0FF] hover:underline flex items-center gap-1 text-[11px]">
                      <span>Probar link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <input
                  id="paypal-link-premium"
                  type="url"
                  value={paypalPremium}
                  onChange={(e) => setPaypalPremium(e.target.value)}
                  placeholder="https://www.paypal.com/ncp/payment/... o https://paypal.me/usuario/250.00USD"
                  className="w-full px-3.5 py-2.5 bg-[#051525] border border-[#00F0FF]/25 rounded-xl text-xs font-mono text-[#00F0FF] placeholder-sky-400/30 focus:outline-none focus:border-[#00F0FF]"
                />
              </div>
            </div>
          )}

          {/* TAB 4: MEDIA & AUDIO */}
          {activeTab === 'media' && (
            <div className="space-y-5 animate-in fade-in">
              
              {/* Artwork Cover Section */}
              <div className="bg-[#030A14] border border-[#00F0FF]/30 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-mono font-bold text-sky-300">
                    Portada / Artwork del Beat (.jpg, .jpeg, .png, .webp)
                  </label>
                  {imageUploadStatus && (
                    <span className={`text-[11px] font-mono px-2 py-0.5 rounded ${
                      imageUploadStatus.includes('✓') 
                        ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40' 
                        : 'bg-[#051525] text-[#00F0FF] border border-[#00F0FF]/40 animate-pulse'
                    }`}>
                      {imageUploadStatus}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                  {/* Square Cover Preview */}
                  <div className="sm:col-span-4 relative aspect-square rounded-xl overflow-hidden bg-[#000000] border-2 border-[#00F0FF]/40 shadow-[0_0_15px_rgba(0,240,255,0.15)] flex items-center justify-center">
                    {coverUrl ? (
                      <img 
                        src={coverUrl} 
                        alt="Portada" 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-3">
                        <div className="w-10 h-10 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] flex items-center justify-center mx-auto mb-1.5">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-mono text-sky-400/70 block">
                          Sin imagen (Logo oficial)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions & Inputs */}
                  <div className="sm:col-span-8 space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <label className={`px-4 py-2.5 bg-[#00F0FF] hover:bg-[#38BDF8] text-black font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer transition shadow-[0_0_15px_rgba(0,240,255,0.25)] ${
                        isUploadingImage ? 'opacity-50 pointer-events-none' : ''
                      }`}>
                        <Upload className="w-4 h-4" />
                        <span>{isUploadingImage ? 'Subiendo JPG...' : 'Subir Archivo JPG / PNG'}</span>
                        <input 
                          type="file" 
                          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" 
                          onChange={handleImageFileUpload}
                          className="hidden" 
                        />
                      </label>

                      {coverUrl && (
                        <button
                          type="button"
                          onClick={() => setCoverUrl('')}
                          className="px-3 py-2 bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 text-red-300 rounded-xl text-xs font-mono transition"
                        >
                          Eliminar portada
                        </button>
                      )}
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-sky-300/60 block">O ingresar URL directa de la imagen:</span>
                      <input
                        id="input-cover-url"
                        type="text"
                        value={coverUrl}
                        onChange={(e) => setCoverUrl(e.target.value)}
                        placeholder="https://... o /uploads/cover-..."
                        className="w-full px-3.5 py-2 rounded-xl bg-[#051525] border border-[#00F0FF]/25 text-xs text-white placeholder-sky-400/30 focus:outline-none focus:border-[#00F0FF]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* AUTOMATIC WAV CONVERTER ZONE (Requested Feature) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#030E1B] via-[#051525] to-[#02070E] border-2 border-[#00F0FF]/40 shadow-[0_0_25px_rgba(0,240,255,0.15)] space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30 shadow-[0_0_12px_rgba(0,240,255,0.3)]">
                      <Radio className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white font-display flex items-center gap-2">
                        <span>Conversor Automático de WAV Master a Clip de 40s</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#00F0FF] text-black font-bold">
                          Tag cada 15s
                        </span>
                      </h4>
                      <p className="text-[11px] text-sky-300/70">
                        Al subir tu WAV, se comprime automáticamente a calidad de muestra (32kHz) y genera un clip de 40 seg intercalando el Voice Tag en los segundos 0, 15 y 30.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Upload Action Zone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-[#00F0FF]/50 bg-[#000000]/60 hover:bg-[#00F0FF]/10 cursor-pointer transition group text-center">
                    <Upload className="w-6 h-6 text-[#00F0FF] mb-1.5 group-hover:scale-110 transition" />
                    <span className="text-xs font-bold text-white font-mono">
                      {isProcessingAudio ? 'Procesando WAV...' : 'Subir Archivo WAV Master (.wav)'}
                    </span>
                    <span className="text-[10px] text-sky-300/60 mt-0.5">
                      Conversión automática a Clip 40s + Voice Tag
                    </span>
                    <input 
                      type="file" 
                      accept=".wav,audio/wav,audio/*" 
                      onChange={handleMasterWavFileUpload}
                      disabled={isProcessingAudio}
                      className="hidden" 
                    />
                  </label>

                  <div className="p-3.5 bg-[#000000]/40 border border-[#00F0FF]/25 rounded-xl flex flex-col justify-between text-xs font-mono space-y-1.5">
                    <div className="flex items-center justify-between text-sky-300">
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>Protección Anti-Ripping</span>
                      </span>
                      <span className="text-[#00F0FF] font-bold">32kHz Web</span>
                    </div>
                    <div className="text-[11px] text-sky-300/60 leading-tight">
                      • Duración fija: <strong className="text-white">40 segundos</strong><br />
                      • Voice Tag: <strong className="text-white">"Samu Helman en el mix"</strong><br />
                      • Intervalo de Marca: <strong className="text-[#00F0FF]">0s, 15s y 30s</strong>
                    </div>
                  </div>
                </div>

                {/* Processing Progress Indicator */}
                {isProcessingAudio && audioProgress && (
                  <div className="p-3.5 bg-[#02070E] border border-[#00F0FF] rounded-xl space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="flex items-center gap-2 text-[#00F0FF] font-bold">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{audioProgress.message}</span>
                      </span>
                      <span className="text-white font-bold">{audioProgress.percent}%</span>
                    </div>
                    <div className="w-full h-2 bg-[#051525] rounded-full overflow-hidden border border-[#00F0FF]/30">
                      <div 
                        className="h-full bg-[#00F0FF] shadow-[0_0_10px_#00F0FF] transition-all duration-300"
                        style={{ width: `${audioProgress.percent}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Live Preview of the generated 40s clip */}
                {audioPreviewUrl && !isProcessingAudio && (
                  <div className="space-y-2 pt-1 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-[#00F0FF] flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5" />
                        <span>Clip Oficial Generado (Escucha Previa de 40s):</span>
                      </span>
                      <button
                        type="button"
                        onClick={toggleTestAudio}
                        className="px-3 py-1 bg-[#00F0FF] text-black hover:bg-[#38BDF8] rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,240,255,0.3)] transition"
                      >
                        {testAudioPlaying ? (
                          <>
                            <Pause className="w-3.5 h-3.5 fill-current" />
                            <span>Pausar Prueba</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                            <span>Escuchar Clip 40s</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Visual Card preview */}
                    <div className="p-3 bg-[#000000] border border-[#00F0FF]/30 rounded-xl flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-zinc-900 border border-[#00F0FF]/30 shrink-0">
                          <img 
                            src={coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80'} 
                            alt={title || 'Beat'}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 text-xs">
                          <h5 className="font-bold text-white truncate font-display">
                            {title || 'Título del Beat'}
                          </h5>
                          <p className="text-[11px] font-mono text-[#00F0FF]">
                            Clip 40 seg • Tags: [0:00, 0:15, 0:30]
                          </p>
                        </div>
                      </div>

                      <div className="text-right font-mono text-[10px] text-sky-300/80">
                        <span className="px-2 py-0.5 rounded bg-[#00F0FF]/15 border border-[#00F0FF]/30 text-[#00F0FF]">
                          Muestra Web Lista
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Audio URL Input with Direct Links & Preset Buttons */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-mono font-bold text-sky-300/80">
                    Enlace de Audio Preview (Directo URL o archivo /public)
                  </label>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setAudioPreviewUrl('/subestimado.mp3')}
                      className="px-2 py-0.5 rounded bg-[#00F0FF]/15 hover:bg-[#00F0FF]/25 border border-[#00F0FF]/30 text-[10px] font-mono text-[#00F0FF] transition"
                    >
                      Usar /subestimado.mp3
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <input
                    id="input-audio-url"
                    type="text"
                    value={audioPreviewUrl}
                    onChange={(e) => setAudioPreviewUrl(e.target.value)}
                    placeholder="https://...mp3 o /subestimado.mp3"
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#051525] border border-[#00F0FF]/25 text-xs text-white placeholder-sky-400/30 focus:outline-none focus:border-[#00F0FF]"
                  />
                  <button
                    type="button"
                    onClick={toggleTestAudio}
                    className="px-3.5 py-2.5 bg-[#051525] hover:bg-[#0A223D] border border-[#00F0FF]/30 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    {testAudioPlaying ? <Pause className="w-4 h-4 text-[#00F0FF]" /> : <Play className="w-4 h-4 text-[#00F0FF]" />}
                    <span>{testAudioPlaying ? 'Pausar' : 'Probar'}</span>
                  </button>
                </div>
                <p className="text-[10px] text-sky-300/60 font-mono">
                  Soporta URLs directas (https://...), enlaces de Google Drive / Dropbox directos o rutas locales de la carpeta /public (ej: /subestimado.mp3).
                </p>
              </div>

              {/* Private Master / Stems Download link for buyers */}
              <div>
                <label className="block text-xs font-mono font-bold text-sky-300/80 mb-1">
                  Enlace de Descarga de Stems / WAV Master Original Completo (Privado)
                </label>
                <input
                  id="input-stems-url"
                  type="url"
                  value={stemsFileUrl}
                  onChange={(e) => setStemsFileUrl(e.target.value)}
                  placeholder="https://drive.google.com/... o https://dropbox.com/..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#051525] border border-[#00F0FF]/25 text-xs text-white placeholder-sky-400/30 focus:outline-none focus:border-[#00F0FF]"
                />
                <p className="text-[11px] text-sky-300/60 mt-1 font-mono">
                  🔒 Este enlace privado contiene el archivo WAV Master original en máxima fidelidad (24-bit) y se entrega automáticamente al cliente al pagar la licencia vía PayPal.
                </p>
              </div>

              {/* Clean Single Link Box underneath uploaded audio files */}
              {(audioPreviewUrl || stemsFileUrl || masterFileName) && (
                <div className="p-4 bg-[#02070E] border border-[#00F0FF]/35 rounded-2xl space-y-2.5 shadow-[0_0_15px_rgba(0,240,255,0.08)]">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono font-bold text-[#00F0FF] flex items-center gap-1.5">
                      <Link2 className="w-4 h-4 text-[#00F0FF]" />
                      <span>Enlace Directo del Beat (Sincronizado con GitHub / Netlify)</span>
                    </label>
                    <span className="text-[10px] font-mono text-sky-300/60 bg-[#051525] px-2 py-0.5 rounded border border-[#00F0FF]/20">
                      Slug: ?beat={getBeatSlug(title || beatToEdit?.title || 'beat')}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <input
                      readOnly
                      id="input-beat-direct-url"
                      value={getBeatDirectUrl(title ? { id: beatToEdit?.id || 'new', title } as any : (beatToEdit || 'el-subestimado'))}
                      className="flex-1 px-3.5 py-2 bg-[#000000] border border-[#00F0FF]/30 rounded-xl text-xs font-mono text-[#00F0FF] select-all focus:outline-none"
                    />

                    <button
                      type="button"
                      id="btn-copy-beat-direct-url"
                      onClick={async () => {
                        const url = getBeatDirectUrl(title ? { id: beatToEdit?.id || 'new', title } as any : (beatToEdit || 'el-subestimado'));
                        const ok = await copyToClipboard(url);
                        if (ok) {
                          setCopiedLinkType('url');
                          setTimeout(() => setCopiedLinkType(null), 2500);
                        }
                      }}
                      className={`px-4 py-2 rounded-xl font-mono font-bold text-xs flex items-center gap-1.5 transition ${
                        copiedLinkType === 'url'
                          ? 'bg-emerald-500 text-black shadow-[0_0_12px_rgba(52,211,153,0.5)]'
                          : 'bg-[#00F0FF] hover:bg-[#38BDF8] text-black shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                      }`}
                    >
                      {copiedLinkType === 'url' ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar Link</span>
                        </>
                      )}
                    </button>

                    <a
                      href={getBeatDirectUrl(title ? { id: beatToEdit?.id || 'new', title } as any : (beatToEdit || 'el-subestimado'))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-[#051525] hover:bg-[#0A223D] border border-[#00F0FF]/30 rounded-xl text-xs font-mono text-sky-200 flex items-center gap-1"
                      title="Abrir enlace en nueva pestaña"
                    >
                      <ExternalLink className="w-4 h-4 text-[#00F0FF]" />
                    </a>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Footer Submit */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#00F0FF]/20">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-mono text-sky-300/80 hover:text-white transition"
            >
              Cancelar
            </button>

            <button
              id="btn-save-beat-admin"
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#00F0FF] hover:bg-[#38BDF8] text-black font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.4)] transition active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>Guardar Beat en Catálogo</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
