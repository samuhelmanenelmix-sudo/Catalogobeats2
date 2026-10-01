import React, { useState, useEffect, useMemo } from 'react';
import { 
  Music, 
  Flame, 
  Sparkles, 
  Layers, 
  ShieldCheck, 
  PlusCircle, 
  Settings, 
  Radio, 
  Disc, 
  ExternalLink,
  Heart,
  TrendingUp,
  Headphones,
  CheckCircle2,
  DollarSign,
  Cloud,
  Instagram
} from 'lucide-react';
import { Beat, Genre, LicenseTierKey, PaymentGatewaysConfig, PurchasedLicense } from './types';
import { INITIAL_BEATS, DEFAULT_PAYMENT_CONFIG, GENRES_LIST, DEFAULT_LICENSE_TIERS } from './data/defaultBeats';
import { audioEngine } from './utils/audioSynth';

import { Navbar } from './components/Navbar';
import { GenreSelector } from './components/GenreSelector';
import { FilterBar } from './components/FilterBar';
import { BeatCard } from './components/BeatCard';
import { AudioPlayer } from './components/AudioPlayer';
import { BeatDetailModal } from './components/BeatDetailModal';
import { CheckoutModal } from './components/CheckoutModal';
import { LicenseContractModal } from './components/LicenseContractModal';
import { AdminBeatEditorModal } from './components/AdminBeatEditorModal';
import { AdminPanel } from './components/AdminPanel';
import { PaymentSettingsModal } from './components/PaymentSettingsModal';
import { CodeArchitectureModal } from './components/CodeArchitectureModal';
import { MercadoPagoReturnModal } from './components/MercadoPagoReturnModal';
import { PromoBanner } from './components/PromoBanner';
import { BeatCoverImage } from './components/BeatCoverImage';
import { getBeatSlug } from './utils/beatLinks';

import { 
  testConnection, 
  subscribeToRealtimeBeats, 
  saveBeatToFirestore, 
  deleteBeatFromFirestore, 
  seedInitialBeatsIfEmpty, 
  subscribeToPaymentConfig, 
  savePaymentConfigToFirestore, 
  savePurchasedLicenseToFirestore,
  subscribeToRealtimePurchases,
  deletePurchasedLicenseFromFirestore,
  sanitizeBeatForFirestore
} from './lib/firebase';

const STORAGE_KEYS = {
  BEATS: 'samuhelman_beats_catalog_v1',
  PAYMENT_CONFIG: 'beatcatalog_payment_cfg_v3',
  PURCHASES: 'beatcatalog_purchases_v2',
  LIKES: 'beatcatalog_likes_v2',
};

// Immediate startup cleanup to purge oversized or corrupted Base64 audio from localStorage
if (typeof window !== 'undefined') {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BEATS);
    if (raw && (raw.includes('data:audio/') || raw.length > 300000)) {
      localStorage.removeItem(STORAGE_KEYS.BEATS);
    }
  } catch {
    try {
      localStorage.removeItem(STORAGE_KEYS.BEATS);
    } catch {}
  }
}

// Helper to safely read beats from localStorage without failing or blocking
const getSavedBeatsFromStorage = (): Beat[] => {
  if (typeof window === 'undefined') return INITIAL_BEATS;
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.BEATS);
    if (saved) {
      if (saved.includes('data:audio/') || saved.length > 300000) {
        localStorage.removeItem(STORAGE_KEYS.BEATS);
        return INITIAL_BEATS;
      }
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((b) => ({
          ...b,
          audioUrl: (b.audioUrl && !b.audioUrl.startsWith('data:audio/') && !b.audioUrl.startsWith('/uploads/')) ? b.audioUrl : '/subestimado.mp3',
          audioPreviewUrl: (b.audioPreviewUrl && !b.audioPreviewUrl.startsWith('data:audio/') && !b.audioPreviewUrl.startsWith('/uploads/')) ? b.audioPreviewUrl : '/subestimado.mp3',
          coverUrl: (b.coverUrl && b.coverUrl.length < 200000 && !b.coverUrl.startsWith('/uploads/')) ? b.coverUrl : '',
        }));
      }
    }
  } catch (err) {
    try {
      localStorage.removeItem(STORAGE_KEYS.BEATS);
    } catch {}
  }
  return INITIAL_BEATS;
};

// Helper to safely write lightweight beats to localStorage
const saveBeatsToStorage = (beatsList: Beat[]) => {
  if (typeof window === 'undefined') return;
  try {
    const lightweightBeats = beatsList.map((b) => ({
      ...b,
      audioUrl: (b.audioUrl && !b.audioUrl.startsWith('data:audio/') && !b.audioUrl.startsWith('/uploads/')) ? b.audioUrl : '/subestimado.mp3',
      audioPreviewUrl: (b.audioPreviewUrl && !b.audioPreviewUrl.startsWith('data:audio/') && !b.audioPreviewUrl.startsWith('/uploads/')) ? b.audioPreviewUrl : '/subestimado.mp3',
      coverUrl: (b.coverUrl && b.coverUrl.length < 200000 && !b.coverUrl.startsWith('/uploads/')) ? b.coverUrl : '',
    }));
    localStorage.setItem(STORAGE_KEYS.BEATS, JSON.stringify(lightweightBeats));
  } catch {
    try {
      localStorage.removeItem(STORAGE_KEYS.BEATS);
    } catch {}
  }
};

export default function App() {
  // Cloud Firestore sync status
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(true);

  // Load persisted states directly from localStorage as instant fallback
  const [beats, setBeats] = useState<Beat[]>(() => {
    const localBeats = getSavedBeatsFromStorage();
    if (localBeats.length > 0) return localBeats;
    return INITIAL_BEATS;
  });

  // Real-time Cloud Sync with Firebase Firestore + Server backup
  useEffect(() => {
    // 1. Test cloud connectivity
    testConnection().then((connected) => {
      setIsCloudSynced(connected);
    });

    // 2. Initial check & seed cloud database if empty
    seedInitialBeatsIfEmpty(INITIAL_BEATS);

    // 3. Real-time Firestore Beats Listener
    const unsubscribeBeats = subscribeToRealtimeBeats(
      (cloudBeats) => {
        if (cloudBeats && cloudBeats.length > 0) {
          setBeats(cloudBeats);
          saveBeatsToStorage(cloudBeats);
          setIsCloudSynced(true);
        } else {
          // If cloud collection was empty, seed with initial beats
          seedInitialBeatsIfEmpty(INITIAL_BEATS);
        }
      },
      (err) => {
        console.warn('Fallo de conexión en tiempo real Firestore (usando fallback local):', err);
        setIsCloudSynced(false);
      }
    );

    // 4. Real-time Payment & Producer Config Listener
    const unsubscribeConfig = subscribeToPaymentConfig((cloudConfig) => {
      if (cloudConfig && cloudConfig.producerName) {
        setPaymentConfig(cloudConfig);
        localStorage.setItem(STORAGE_KEYS.PAYMENT_CONFIG, JSON.stringify(cloudConfig));
      }
    });

    // 5. Real-time Purchases Listener (Admin & Producer Sales Overview)
    const unsubscribePurchases = subscribeToRealtimePurchases((cloudPurchases) => {
      if (cloudPurchases && Array.isArray(cloudPurchases)) {
        setPurchases(cloudPurchases);
        localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(cloudPurchases));
      }
    });

    // 6. Fallback fetch from local Express backend
    fetch('/api/beats')
      .then((res) => res.json())
      .then((data) => {
        const serverBeats: Beat[] = data && Array.isArray(data.beats) ? data.beats : [];
        if (serverBeats.length > 0) {
          setBeats((prev) => (prev.length === 0 ? serverBeats : prev));
        }
      })
      .catch((err) => {
        console.log('Operando con catálogo Firestore / localStorage:', err);
      });

    // 7. Sync server PayPal completed orders if any
    fetch('/api/admin/sales')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.success && Array.isArray(data.sales) && data.sales.length > 0) {
          setPurchases((prev) => {
            const existingOrderIds = new Set(prev.map((p) => p.orderId));
            const newServerSales: PurchasedLicense[] = [];
            for (const s of data.sales) {
              if (!existingOrderIds.has(s.orderId)) {
                newServerSales.push({
                  orderId: s.orderId,
                  beatTitle: s.beatTitle,
                  beatId: s.beatId,
                  producer: 'Samu Helman en el mix',
                  producerEmail: 'samuhelmanenelmix@gmail.com',
                  buyerName: s.buyerName || 'Cliente',
                  buyerEmail: s.buyerEmail || 'cliente@ejemplo.com',
                  artistStageName: s.artistStageName || s.buyerName,
                  tierName: s.tierName || 'Licencia',
                  tierKey: s.tierKey || 'basic',
                  amountPaid: Number(s.amountPaid) || 0,
                  currency: s.currency || 'USD',
                  paymentMethod: s.paymentMethod || 'PayPal v2 API',
                  transactionRef: s.orderId,
                  purchaseDate: new Date(s.createdAt).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }),
                  contractText: s.contractText || '',
                  contractHtml: s.contractHtml || ''
                });
              }
            }
            if (newServerSales.length > 0) {
              const combined = [...prev, ...newServerSales];
              localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(combined));
              return combined;
            }
            return prev;
          });
        }
      })
      .catch(() => {
        // quiet fallback
      });

    return () => {
      unsubscribeBeats();
      unsubscribeConfig();
      unsubscribePurchases();
    };
  }, []);

  const [paymentConfig, setPaymentConfig] = useState<PaymentGatewaysConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PAYMENT_CONFIG);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            ...DEFAULT_PAYMENT_CONFIG,
            ...parsed,
            producerName: (!parsed.producerName || parsed.producerName.toLowerCase().includes('literland')) ? 'Samu Helman en el mix' : parsed.producerName,
            mercadopago_public_key: parsed.mercadopago_public_key || DEFAULT_PAYMENT_CONFIG.mercadopago_public_key,
            mercadopago_access_token: parsed.mercadopago_access_token || DEFAULT_PAYMENT_CONFIG.mercadopago_access_token,
          };
        }
      } catch {
        // ignore
      }
    }
    return DEFAULT_PAYMENT_CONFIG;
  });

  const [purchases, setPurchases] = useState<PurchasedLicense[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PURCHASES);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // ignore
      }
    }
    return [];
  });

  const [likedBeatIds, setLikedBeatIds] = useState<string[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LIKES);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // ignore
      }
    }
    return ['beat-samu-01', 'beat-samu-02'];
  });

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BEATS, JSON.stringify(beats));
  }, [beats]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PAYMENT_CONFIG, JSON.stringify(paymentConfig));
  }, [paymentConfig]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(purchases));
  }, [purchases]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LIKES, JSON.stringify(likedBeatIds));
  }, [likedBeatIds]);

  // Check if current environment is the Google AI Studio development session
  const isStudioSession = typeof window !== 'undefined' && (
    window.location.hostname.toLowerCase().includes('ais-dev-') ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  );

  // Admin privileges are STRICTLY restricted to this session in Google AI Studio.
  // External clients (from YouTube or shared preview ais-pre-*) will NEVER have admin access.
  const [isAdminMode, setIsAdminMode] = useState<boolean>(() => {
    if (!isStudioSession) {
      return false;
    }
    // In Google AI Studio, Samu Helman has producer controls enabled by default
    return true;
  });

  // Remove any legacy admin password keys from client browsers
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('samuhelman_admin_pwd_v1');
      } catch {
        // ignore
      }
    }
  }, []);

  // Toggle Admin Mode Handler (Allowed ONLY in Google AI Studio session)
  const handleToggleAdminMode = () => {
    if (!isStudioSession) return;
    setIsAdminMode((prev) => !prev);
  };

  const [selectedGenre, setSelectedGenre] = useState<Genre | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBpmRange, setSelectedBpmRange] = useState('ALL');
  const [selectedKey, setSelectedKey] = useState('ALL');
  const [selectedMood, setSelectedMood] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');

  // Audio Playback State
  const [currentBeat, setCurrentBeat] = useState<Beat | null>(beats[0] || null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Modals state
  const [detailBeat, setDetailBeat] = useState<Beat | null>(null);
  const [checkoutBeat, setCheckoutBeat] = useState<Beat | null>(null);
  const [checkoutTier, setCheckoutTier] = useState<LicenseTierKey>('premium');
  const [editorBeat, setEditorBeat] = useState<Beat | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isPaymentSettingsOpen, setIsPaymentSettingsOpen] = useState(false);
  const [isPurchasesOpen, setIsPurchasesOpen] = useState(false);
  const [isCodeArchitectureOpen, setIsCodeArchitectureOpen] = useState(false);
  const [directLinkBeat, setDirectLinkBeat] = useState<Beat | null>(null);
  const [audioNotice, setAudioNotice] = useState<string | null>(null);

  // Deep Link listener: Auto-detects ?beat=<id_or_slug> from YouTube descriptions & shares
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkUrlBeat = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const beatParam = params.get('beat') || params.get('pista') || params.get('b');
        const hashParam = window.location.hash.replace(/^#beat-|^#/, '');
        const rawTarget = beatParam || (hashParam && hashParam.startsWith('beat-') ? hashParam : null);

        if (rawTarget && beats.length > 0) {
          const decodedTarget = decodeURIComponent(rawTarget).trim().toLowerCase();
          const targetSlug = getBeatSlug(decodedTarget);

          const found = beats.find((b) => {
            const bId = b.id.toLowerCase();
            const bTitle = b.title.toLowerCase();
            const bSlug = getBeatSlug(b);
            return (
              bId === decodedTarget ||
              bTitle === decodedTarget ||
              bSlug === targetSlug ||
              bTitle.replace(/\s+/g, '-') === decodedTarget ||
              bTitle.replace(/\s+/g, '_') === decodedTarget ||
              (targetSlug.length >= 3 && (bSlug.includes(targetSlug) || targetSlug.includes(bSlug))) ||
              bId.includes(decodedTarget)
            );
          });

          if (found) {
            setCurrentBeat(found);
            setDetailBeat(found);
            setDirectLinkBeat(found);

            // Auto-play preview
            setIsPlaying(true);
            audioEngine.playBeat(
              found.id,
              found.bpm,
              found.keyScale,
              found.audioPreviewUrl,
              found.durationSeconds || 165
            );

            // Smooth scroll into view
            setTimeout(() => {
              const cardEl = document.getElementById(`beat-card-${found.id}`);
              if (cardEl) {
                cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }, 300);
          }
        }
      } catch (err) {
        console.error('Error procesando enlace de beat:', err);
      }
    };

    checkUrlBeat();
    window.addEventListener('popstate', checkUrlBeat);
    return () => window.removeEventListener('popstate', checkUrlBeat);
  }, [beats]);

  // Genre counts calculation
  const genreCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    beats.forEach((b) => {
      counts[b.genre] = (counts[b.genre] || 0) + 1;
    });
    return counts;
  }, [beats]);

  // Unique available keys and moods for filters
  const availableKeys = useMemo(() => {
    const set = new Set<string>();
    beats.forEach((b) => {
      if (b.keyScale) set.add(b.keyScale);
    });
    return Array.from(set).sort();
  }, [beats]);

  const availableMoods = useMemo(() => {
    const set = new Set<string>();
    beats.forEach((b) => {
      b.mood?.forEach((m) => set.add(m));
    });
    return Array.from(set).sort();
  }, [beats]);

  // Filtered & Sorted Beats
  const filteredBeats = useMemo(() => {
    return beats.filter((beat) => {
      // Genre filter
      if (selectedGenre !== 'ALL' && beat.genre !== selectedGenre) {
        return false;
      }

      // Search Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = beat.title.toLowerCase().includes(q);
        const matchesGenre = beat.genre.toLowerCase().includes(q);
        const matchesSubgenre = beat.subgenre?.toLowerCase().includes(q);
        const matchesKey = beat.keyScale.toLowerCase().includes(q);
        const matchesBpm = beat.bpm.toString().includes(q);
        const matchesTags = beat.tags?.some((t) => t.toLowerCase().includes(q));
        const matchesMood = beat.mood?.some((m) => m.toLowerCase().includes(q));

        if (!matchesTitle && !matchesGenre && !matchesSubgenre && !matchesKey && !matchesBpm && !matchesTags && !matchesMood) {
          return false;
        }
      }

      // BPM Range filter
      if (selectedBpmRange !== 'ALL') {
        if (selectedBpmRange === 'SLOW' && beat.bpm >= 90) return false;
        if (selectedBpmRange === 'MEDIUM' && (beat.bpm < 90 || beat.bpm > 125)) return false;
        if (selectedBpmRange === 'UPTEMPO' && (beat.bpm < 125 || beat.bpm > 145)) return false;
        if (selectedBpmRange === 'FAST' && beat.bpm <= 145) return false;
      }

      // Key scale filter
      if (selectedKey !== 'ALL' && beat.keyScale !== selectedKey) {
        return false;
      }

      // Mood filter
      if (selectedMood !== 'ALL' && !beat.mood?.includes(selectedMood)) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
      if (sortBy === 'popular') {
        return (b.plays || 0) - (a.plays || 0);
      }
      if (sortBy === 'likes') {
        return (b.likes || 0) - (a.likes || 0);
      }
      if (sortBy === 'price-asc') {
        return (a.tierPrices?.basic || 24.99) - (b.tierPrices?.basic || 24.99);
      }
      if (sortBy === 'price-desc') {
        return (b.tierPrices?.basic || 24.99) - (a.tierPrices?.basic || 24.99);
      }
      if (sortBy === 'bpm-asc') {
        return a.bpm - b.bpm;
      }
      if (sortBy === 'bpm-desc') {
        return b.bpm - a.bpm;
      }
      return 0;
    });
  }, [beats, selectedGenre, searchQuery, selectedBpmRange, selectedKey, selectedMood, sortBy]);

  // Audio Playback Controls - Pure Real Audio (No Synthetic Fallbacks)
  const handleTogglePlay = (beat?: Beat) => {
    const targetBeat = beat || currentBeat || beats[0];
    if (!targetBeat) return;

    if (currentBeat?.id === targetBeat.id && isPlaying) {
      audioEngine.pause();
      setIsPlaying(false);
    } else {
      setCurrentBeat(targetBeat);

      const cleanAudioUrl = targetBeat.audioPreviewUrl?.trim();
      if (!cleanAudioUrl || cleanAudioUrl === '' || cleanAudioUrl === '#') {
        audioEngine.stop();
        setIsPlaying(false);
        setAudioNotice('Error al cargar la pista de audio. Verifica el enlace MP3');
        setTimeout(() => setAudioNotice(null), 5000);
        return;
      }

      const res = audioEngine.playBeat(
        targetBeat.id,
        targetBeat.bpm,
        targetBeat.keyScale,
        cleanAudioUrl,
        targetBeat.durationSeconds || 165
      );

      if (res.success) {
        setIsPlaying(true);
        setAudioNotice(null);
        // Increment play count locally
        setBeats((prev) =>
          prev.map((b) => (b.id === targetBeat.id ? { ...b, plays: (b.plays || 0) + 1 } : b))
        );
      } else {
        setIsPlaying(false);
        setAudioNotice('Error al cargar la pista de audio. Verifica el enlace MP3');
        setTimeout(() => setAudioNotice(null), 5000);
      }
    }
  };

  const handleNextBeat = () => {
    if (!currentBeat || beats.length === 0) return;
    const currentIndex = beats.findIndex((b) => b.id === currentBeat.id);
    const nextIndex = (currentIndex + 1) % beats.length;
    const nextBeat = beats[nextIndex];
    handleTogglePlay(nextBeat);
  };

  const handlePrevBeat = () => {
    if (!currentBeat || beats.length === 0) return;
    const currentIndex = beats.findIndex((b) => b.id === currentBeat.id);
    const prevIndex = (currentIndex - 1 + beats.length) % beats.length;
    const prevBeat = beats[prevIndex];
    handleTogglePlay(prevBeat);
  };

  const handleToggleLike = (beatId: string) => {
    if (likedBeatIds.includes(beatId)) {
      setLikedBeatIds((prev) => prev.filter((id) => id !== beatId));
      setBeats((prev) =>
        prev.map((b) => (b.id === beatId ? { ...b, likes: Math.max(0, (b.likes || 1) - 1) } : b))
      );
    } else {
      setLikedBeatIds((prev) => [...prev, beatId]);
      setBeats((prev) =>
        prev.map((b) => (b.id === beatId ? { ...b, likes: (b.likes || 0) + 1 } : b))
      );
    }
  };

  // Modal Handlers
  const handleOpenDetails = (beat: Beat) => {
    setDetailBeat(beat);
    if (typeof window !== 'undefined' && window.history?.replaceState) {
      const url = new URL(window.location.href);
      url.searchParams.set('beat', beat.id);
      window.history.replaceState({}, '', url.toString());
    }
  };

  const handleCloseDetails = () => {
    setDetailBeat(null);
    if (typeof window !== 'undefined' && window.history?.replaceState) {
      const url = new URL(window.location.href);
      url.searchParams.delete('beat');
      url.searchParams.delete('pista');
      url.searchParams.delete('b');
      window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
    }
  };

  const handleOpenCheckout = (beat: Beat, tier: LicenseTierKey = 'premium') => {
    setCheckoutBeat(beat);
    setCheckoutTier(tier);
  };

  const handleOpenNewBeatModal = () => {
    setEditorBeat(null);
    setIsEditorOpen(true);
  };

  const handleOpenEditBeatModal = (beat: Beat) => {
    setEditorBeat(beat);
    setIsEditorOpen(true);
  };

  const handleSaveBeat = async (savedBeat: Beat) => {
    // 1. Optimistic update and instant localStorage write
    setBeats((prev) => {
      const exists = prev.some((b) => b.id === savedBeat.id);
      const nextBeats = exists
        ? prev.map((b) => (b.id === savedBeat.id ? savedBeat : b))
        : [savedBeat, ...prev];
      
      saveBeatsToStorage(nextBeats);
      return nextBeats;
    });

    // 2. Persist to Cloud Firestore in Realtime
    try {
      await saveBeatToFirestore(savedBeat);
      setIsCloudSynced(true);
    } catch (err) {
      console.error('Error persistiendo beat en Firestore:', err);
    }

    // 3. Persist to local server disk as secondary backup
    try {
      await fetch('/api/beats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(savedBeat),
      });
    } catch (err) {
      console.error('Error persistiendo beat en el servidor:', err);
    }
  };

  const handleDeleteBeat = async (beatId: string) => {
    // 1. Optimistic update and instant localStorage write
    setBeats((prev) => {
      const nextBeats = prev.filter((b) => b.id !== beatId);
      saveBeatsToStorage(nextBeats);
      return nextBeats;
    });

    if (currentBeat?.id === beatId) {
      audioEngine.stop();
      setIsPlaying(false);
      setCurrentBeat(beats.find((b) => b.id !== beatId) || null);
    }

    // 2. Delete from Cloud Firestore in Realtime
    try {
      await deleteBeatFromFirestore(beatId);
      setIsCloudSynced(true);
    } catch (err) {
      console.error('Error eliminando beat en Firestore:', err);
    }

    // 3. Delete on local server disk
    try {
      await fetch(`/api/beats/${beatId}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Error eliminando beat en el servidor:', err);
    }
  };

  const handleSavePaymentConfig = async (newConfig: PaymentGatewaysConfig) => {
    setPaymentConfig(newConfig);
    localStorage.setItem(STORAGE_KEYS.PAYMENT_CONFIG, JSON.stringify(newConfig));
    try {
      await savePaymentConfigToFirestore(newConfig);
    } catch (err) {
      console.error('Error guardando configuración de pago en Firestore:', err);
    }
  };

  const handlePurchaseComplete = async (license: PurchasedLicense) => {
    setPurchases((prev) => [license, ...prev]);
    // If exclusive tier purchased, mark beat as sold
    if (license.tierKey === 'exclusive') {
      const targetBeat = beats.find((b) => b.id === license.beatId);
      if (targetBeat) {
        const updatedBeat = { ...targetBeat, isSoldExclusive: true };
        handleSaveBeat(updatedBeat);
      }
    }

    // Save purchase record to Firestore
    try {
      await savePurchasedLicenseToFirestore(license);
    } catch (err) {
      console.error('Error registrando compra en Firestore:', err);
    }
  };

  const handleDeletePurchase = async (orderId: string) => {
    setPurchases((prev) => prev.filter((p) => p.orderId !== orderId));
    try {
      await deletePurchasedLicenseFromFirestore(orderId);
    } catch (err) {
      console.error('Error eliminando compra de Firestore:', err);
    }
    try {
      await fetch(`/api/admin/sales/${orderId}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Error eliminando compra del servidor:', err);
    }
  };

  const handleResetFilters = () => {
    setSelectedGenre('ALL');
    setSelectedBpmRange('ALL');
    setSelectedKey('ALL');
    setSelectedMood('ALL');
    setSearchQuery('');
  };

  const hasActiveFilters = 
    selectedGenre !== 'ALL' ||
    selectedBpmRange !== 'ALL' ||
    selectedKey !== 'ALL' ||
    selectedMood !== 'ALL' ||
    searchQuery.trim().length > 0;

  return (
    <div className="min-h-screen bg-[#000000] text-[#E0F2FE] flex flex-col selection:bg-[#00F0FF] selection:text-black font-sans pb-32 relative overflow-x-hidden">
      
      {/* Tri-Neon ambient background glows across the whole app: Celeste, Naranja Oscuro, Verde Oscuro */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-[#00F0FF]/7 rounded-full blur-[150px] pointer-events-none -z-10" />
      <div className="fixed top-1/3 right-10 w-[450px] h-[450px] bg-[#FF5500]/6 rounded-full blur-[160px] pointer-events-none -z-10" />
      <div className="fixed bottom-24 left-10 w-[450px] h-[450px] bg-[#00C853]/6 rounded-full blur-[150px] pointer-events-none -z-10" />

      {/* Navbar */}
      <Navbar
        isAdminMode={isAdminMode}
        isStudioSession={isStudioSession}
        onToggleAdminMode={handleToggleAdminMode}
        onOpenNewBeatModal={handleOpenNewBeatModal}
        onOpenPaymentSettings={() => setIsPaymentSettingsOpen(true)}
        onOpenPurchasesModal={() => setIsPurchasesOpen(true)}
        onOpenCodeArchitecture={() => setIsCodeArchitectureOpen(true)}
        purchasedCount={purchases.length}
        paymentConfig={paymentConfig}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isCloudSynced={isCloudSynced}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 flex-1 w-full">
        
        {/* Direct Link Arrival Banner from YouTube */}
        {directLinkBeat && (
          <div className="mb-6 p-4 rounded-2xl bg-[#030A14] border border-[#00F0FF]/60 shadow-[0_0_25px_rgba(0,240,255,0.25)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-black border border-[#00F0FF]/40 shrink-0">
                <BeatCoverImage 
                  coverUrl={directLinkBeat.coverUrl} 
                  title={directLinkBeat.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[#FF5500] text-black shadow-[0_0_8px_#FF5500]">
                    Link Directo de YouTube
                  </span>
                  <span className="text-xs text-[#00F0FF] font-mono font-semibold">
                    {directLinkBeat.bpm} BPM • {directLinkBeat.keyScale}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white font-display mt-0.5">
                  Estás viendo: <span className="text-[#00F0FF]">"{directLinkBeat.title}"</span> ({directLinkBeat.producer || 'Samu Helman en el mix'})
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={() => handleOpenDetails(directLinkBeat)}
                className="px-3 py-1.5 rounded-xl bg-[#00C853] text-black font-mono font-bold text-xs hover:bg-[#00E676] shadow-[0_0_12px_rgba(0,200,83,0.4)] transition"
              >
                Ver Licencias & Comprar
              </button>
              <button
                onClick={() => setDirectLinkBeat(null)}
                className="px-2.5 py-1.5 rounded-xl bg-[#030A14] border border-[#00F0FF]/30 text-sky-300 hover:text-white text-xs font-mono transition"
                title="Cerrar aviso"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Audio Notice Warning Toast / Banner */}
        {audioNotice && (
          <div className="mb-6 p-4 rounded-2xl bg-[#0a192f] border border-amber-400/50 shadow-[0_0_20px_rgba(251,191,36,0.2)] flex items-center justify-between gap-3 text-amber-200 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/30 flex items-center justify-center shrink-0 text-amber-400 font-bold">
                ⚠️
              </div>
              <p className="text-xs sm:text-sm font-medium">
                {audioNotice}
              </p>
            </div>
            <button
              onClick={() => setAudioNotice(null)}
              className="p-1.5 rounded-lg hover:bg-amber-400/20 text-amber-300 transition text-xs font-mono"
            >
              ✕
            </button>
          </div>
        )}

        {/* Producer Studio / Admin Suite (ONLY when in Admin Mode) */}
        {isAdminMode && (
          <AdminPanel
            beats={beats}
            onOpenNewBeatModal={handleOpenNewBeatModal}
            onOpenPaymentSettings={() => setIsPaymentSettingsOpen(true)}
            onEditBeat={handleOpenEditBeatModal}
            paymentConfig={paymentConfig}
            currencySymbol={paymentConfig.currencySymbol}
            isCloudSynced={isCloudSynced}
            purchases={purchases}
            onAddManualPurchase={handlePurchaseComplete}
            onDeletePurchase={handleDeletePurchase}
            isStudioSession={isStudioSession}
          />
        )}

        {/* Storefront Promo & Advertising Banner (Beats desde 20 USD + PayPal) */}
        {!isAdminMode && (
          <PromoBanner 
            isAdminMode={isAdminMode}
            onUploadClick={handleOpenNewBeatModal}
          />
        )}

        {/* Section 1: Genre Selector Carousel */}
        <div className="mb-5">
          <GenreSelector
            selectedGenre={selectedGenre}
            onSelectGenre={setSelectedGenre}
            genreCounts={genreCounts}
            totalBeatsCount={beats.length}
          />
        </div>

        {/* Section 2: Detailed Filters & Sorting */}
        <FilterBar
          selectedBpmRange={selectedBpmRange}
          onSelectBpmRange={setSelectedBpmRange}
          selectedKey={selectedKey}
          onSelectKey={setSelectedKey}
          availableKeys={availableKeys}
          selectedMood={selectedMood}
          onSelectMood={setSelectedMood}
          availableMoods={availableMoods}
          sortBy={sortBy}
          onSortChange={setSortBy}
          onResetFilters={handleResetFilters}
          hasActiveFilters={hasActiveFilters}
        />

        {/* Section 3: Beats Catalog Grid */}
        {beats.length === 0 ? (
          isAdminMode ? (
            /* Admin view when empty */
            <div className="text-center py-16 bg-[#030A14] border border-[#00F0FF]/30 rounded-3xl p-6 sm:p-10 space-y-5 max-w-2xl mx-auto shadow-[0_0_30px_rgba(0,240,255,0.1)]">
              <div className="w-16 h-16 rounded-2xl bg-[#00F0FF]/10 border border-[#00F0FF]/40 flex items-center justify-center mx-auto text-[#00F0FF] shadow-[0_0_20px_rgba(0,240,255,0.3)]">
                <Music className="w-8 h-8 drop-shadow-[0_0_10px_#00F0FF]" />
              </div>
              
              <div className="space-y-1.5">
                <span className="px-3 py-0.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-[#00F0FF]/10 border border-[#00F0FF]/40 text-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.2)]">
                  Panel de Productor
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-white font-display">
                  Comienza a Construir tu Catálogo
                </h3>
                <p className="text-xs sm:text-sm text-sky-200/70 max-w-lg mx-auto leading-relaxed">
                  Sube tus instrumentales de forma manual con BPM, escala, precio (desde $20 USD) y links de PayPal para comenzar a vender de inmediato.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
                <button
                  id="btn-empty-add-first-beat"
                  onClick={handleOpenNewBeatModal}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#00F0FF] hover:bg-[#38BDF8] text-black font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.4)] transition active:scale-95"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Subir Mi Primer Beat</span>
                </button>

                <button
                  id="btn-empty-open-payment"
                  onClick={() => setIsPaymentSettingsOpen(true)}
                  className="w-full sm:w-auto px-4 py-3 rounded-xl bg-[#051525] hover:bg-[#0A223D] border border-[#00F0FF]/30 text-[#E0F2FE] hover:text-[#00F0FF] font-medium text-xs flex items-center justify-center gap-2 transition"
                >
                  <Settings className="w-4 h-4 text-[#00F0FF]" />
                  <span>Configurar Pasarelas</span>
                </button>
              </div>
            </div>
          ) : (
            /* Safe Public Visitor view when empty */
            <div className="text-center py-16 bg-[#030A14] border border-[#00F0FF]/25 rounded-3xl p-6 sm:p-10 space-y-4 max-w-2xl mx-auto shadow-xl">
              <div className="w-16 h-16 rounded-2xl bg-[#051525] border border-[#00F0FF]/30 flex items-center justify-center mx-auto text-[#00F0FF]">
                <Music className="w-8 h-8 drop-shadow-[0_0_8px_#00F0FF]" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white font-display">
                  Próximamente Nuevos Beats & Instrumentales
                </h3>
                <p className="text-xs sm:text-sm text-sky-200/70 max-w-md mx-auto leading-relaxed">
                  Estamos preparando nuevos lanzamientos exclusivos de estudio. Vuelve pronto para escuchar el catálogo o suscríbete a nuestro canal de YouTube.
                </p>
              </div>
            </div>
          )
        ) : filteredBeats.length === 0 ? (
          <div className="text-center py-14 bg-[#030A14] border border-[#00F0FF]/30 rounded-2xl p-6 space-y-3 shadow-lg">
            <div className="w-12 h-12 rounded-full bg-[#051525] border border-[#00F0FF]/30 flex items-center justify-center mx-auto text-[#00F0FF]">
              <Music className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white font-display">
              No se encontraron pistas con esos filtros
            </h3>
            <p className="text-xs text-sky-200/70 max-w-md mx-auto">
              Intenta cambiar el género, tempo o borra los términos de búsqueda.
            </p>
            <button
              onClick={handleResetFilters}
              className="px-3.5 py-1.5 rounded-lg bg-[#00F0FF] text-black font-mono font-bold text-xs uppercase hover:bg-[#38BDF8] shadow-[0_0_12px_rgba(0,240,255,0.3)] transition"
            >
              Restablecer filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 items-stretch">
            {filteredBeats.map((beat) => (
              <BeatCard
                key={beat.id}
                beat={beat}
                isPlaying={isPlaying}
                isCurrentTrack={currentBeat?.id === beat.id}
                onTogglePlay={handleTogglePlay}
                onOpenDetails={handleOpenDetails}
                onOpenCheckout={(b) => handleOpenCheckout(b, 'basic')}
                onEditBeat={handleOpenEditBeatModal}
                onToggleLike={handleToggleLike}
                isLiked={likedBeatIds.includes(beat.id)}
                isAdminMode={isAdminMode}
                currencySymbol={paymentConfig.currencySymbol}
              />
            ))}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 pt-8 pb-12 border-t border-[#00F0FF]/15 text-center text-xs text-sky-400/50 space-y-4">
          <div className="flex items-center justify-center">
            <a
              id="btn-footer-instagram"
              href="https://www.instagram.com/samuelhelmann?igsi=MXYyOTRyeGRxa2dldg=="
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#833ab4]/20 via-[#fd1d1d]/20 to-[#fcb045]/20 border border-pink-500/40 hover:border-pink-400 text-pink-200 hover:text-white text-xs font-mono font-bold transition shadow-[0_0_15px_rgba(236,72,153,0.2)] active:scale-95"
            >
              <Instagram className="w-4 h-4 text-pink-400" />
              <span>Sígueme en Instagram (@samuelhelmann)</span>
            </a>
          </div>

          <p>
            © {new Date().getFullYear()}{' '}
            <span 
              className="font-bold text-[#00F0FF]"
              title="Samu Helman en el mix"
            >
              {paymentConfig.producerName || 'Samu Helman en el mix'}
            </span>
            . Todos los derechos reservados.
          </p>
          <p className="text-[11px] text-sky-500/40">
            Licencias instrumentales directas con entrega automatizada de contratos e instrumentales en alta definición.
          </p>
        </footer>

      </main>

      {/* Persistent Bottom Audio Player Dock */}
      <AudioPlayer
        currentBeat={currentBeat}
        isPlaying={isPlaying}
        onTogglePlay={() => handleTogglePlay()}
        onNextBeat={handleNextBeat}
        onPrevBeat={handlePrevBeat}
        onOpenCheckout={(b) => handleOpenCheckout(b, 'premium')}
        onOpenDetails={handleOpenDetails}
        currencySymbol={paymentConfig.currencySymbol}
        onAudioError={(msg) => {
          setIsPlaying(false);
          setAudioNotice(msg);
          setTimeout(() => setAudioNotice(null), 5000);
        }}
      />

      {/* Modal 1: Beat Detail & Track Specs */}
      <BeatDetailModal
        beat={detailBeat}
        isOpen={Boolean(detailBeat)}
        onClose={handleCloseDetails}
        isPlaying={isPlaying}
        isCurrentTrack={currentBeat?.id === detailBeat?.id}
        onTogglePlay={handleTogglePlay}
        onSelectTierAndCheckout={(beat, tier) => {
          handleCloseDetails();
          handleOpenCheckout(beat, tier);
        }}
        onToggleLike={handleToggleLike}
        isLiked={detailBeat ? likedBeatIds.includes(detailBeat.id) : false}
        currencySymbol={paymentConfig.currencySymbol}
        isAdmin={isAdminMode}
      />

      {/* Modal 2: Checkout & Automated License Generation */}
      <CheckoutModal
        beat={checkoutBeat}
        selectedTier={checkoutTier}
        isOpen={Boolean(checkoutBeat)}
        onClose={() => setCheckoutBeat(null)}
        paymentConfig={paymentConfig}
        onPurchaseComplete={handlePurchaseComplete}
        currencySymbol={paymentConfig.currencySymbol}
      />

      {/* Modal 3: Purchases & Legal Contracts Vault */}
      <LicenseContractModal
        purchases={purchases}
        isOpen={isPurchasesOpen}
        onClose={() => setIsPurchasesOpen(false)}
      />

      {/* Modal 4: Producer Admin Beat Editor (Product & Custom PayPal Links) */}
      <AdminBeatEditorModal
        beatToEdit={editorBeat}
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSaveBeat={handleSaveBeat}
        onDeleteBeat={handleDeleteBeat}
        paymentConfig={paymentConfig}
      />

      {/* Modal 5: Global Payment Gateways Settings */}
      <PaymentSettingsModal
        isOpen={isPaymentSettingsOpen}
        onClose={() => setIsPaymentSettingsOpen(false)}
        config={paymentConfig}
        onSaveConfig={handleSavePaymentConfig}
        beats={beats}
        onImportBeats={setBeats}
      />

      {/* Modal 6: Standalone Code & Architecture Exporter */}
      <CodeArchitectureModal
        isOpen={isCodeArchitectureOpen}
        onClose={() => setIsCodeArchitectureOpen(false)}
      />

      {/* Modal 7: Mercado Pago Checkout Pro Return & Immediate Delivery */}
      <MercadoPagoReturnModal
        beats={beats}
        onPurchaseComplete={handlePurchaseComplete}
        onOpenContractVault={() => setIsPurchasesOpen(true)}
      />

    </div>
  );
}
