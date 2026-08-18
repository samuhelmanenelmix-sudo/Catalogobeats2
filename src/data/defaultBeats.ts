import { Beat, Genre, LicenseTier, PaymentGatewaysConfig } from "../types";

export const GENRES_LIST: Genre[] = [
  "Trap",
  "Hip Hop",
  "Drill",
  "Reggaeton",
  "R&B / Soul",
  "Afrobeat",
  "Pop",
  "Boom Bap",
  "Synthwave",
  "Dancehall",
  "Lo-Fi",
  "Rock / Indie"
];

export const DEFAULT_LICENSE_TIERS: LicenseTier[] = [
  {
    id: "basic",
    name: "Básica (MP3)",
    price: 20.00,
    format: "MP3 Master 320 kbps",
    streamsLimit: "Hasta 50,000 streams",
    salesCopiesLimit: "Hasta 2,500 unid.",
    youtubeViewsLimit: "Hasta 250,000 vistas",
    radioSyncLimit: "Sin radio / Sin sincro",
    forProfitPerformances: false,
    stemsIncluded: false,
    contractIncluded: true,
    description: "Ideal para singles independientes, maquetas y primeros lanzamientos."
  },
  {
    id: "media",
    name: "Media (WAV)",
    price: 45.00,
    format: "WAV Master 24-Bit + MP3",
    streamsLimit: "Hasta 250,000 streams",
    salesCopiesLimit: "Hasta 10,000 unid.",
    youtubeViewsLimit: "Hasta 1,000,000 vistas",
    radioSyncLimit: "2 Emisoras / Sin sincro",
    forProfitPerformances: true,
    stemsIncluded: false,
    contractIncluded: true,
    description: "Audio sin compresión para Spotify, videoclips oficiales y shows en vivo."
  },
  {
    id: "exclusive",
    name: "Exclusiva",
    price: 150.00,
    format: "WAV Master + MP3 + Stems (Pistas separadas)",
    streamsLimit: "Ilimitado",
    salesCopiesLimit: "Ilimitado",
    youtubeViewsLimit: "Ilimitado",
    radioSyncLimit: "Radio libre / Sincro libre",
    forProfitPerformances: true,
    stemsIncluded: true,
    contractIncluded: true,
    description: "Propiedad exclusiva de la pista instrumental con todos los stems por canal."
  },
  {
    id: "premium",
    name: "Premium (Ofertar Monto)",
    price: 250.00,
    format: "WAV + MP3 + Stems + Derechos de Sincronización Total / TV",
    streamsLimit: "Ilimitado + Stems",
    salesCopiesLimit: "Ilimitado + Stems",
    youtubeViewsLimit: "Ilimitado + Stems",
    radioSyncLimit: "Sincronización Total / TV",
    forProfitPerformances: true,
    stemsIncluded: true,
    contractIncluded: true,
    isOfferBased: true,
    description: "Modalidad bajo oferta negociada directamente. Requiere aceptación explícita por escrito del Productor."
  }
];

export const DEFAULT_PAYMENT_CONFIG: PaymentGatewaysConfig = {
  producerName: "Samu helman en el mix / Samuel Helman",
  producerEmail: "samuhelmanenelmix@gmail.com",
  paypalEmailOrUsername: "samuhelmanenelmix@gmail.com",
  paypalBaseUrl: "https://www.paypal.com/paypalme/samuhelman/",
  enableDirectPaypalLinks: true,
  enableMercadoPago: true,
  mercadoPagoAlias: "samuhelman.mp",
  enableBankTransfer: true,
  bankDetails: "Banco: BBVA / Santander | Titular: Samu Helman en el mix | CBU / CLABE / IBAN: 012180004567891234",
  enableWhatsAppCheckout: true,
  whatsAppNumber: "+5491123456789",
  currency: "USD",
  currencySymbol: "$"
};

export const INITIAL_BEATS: Beat[] = [
  {
    id: "beat-1787067183422",
    title: "El subestimado",
    producer: "Samu Helman en el mix",
    genre: "Boom Bap",
    subgenre: "Hip hop",
    bpm: 88,
    keyScale: "C# minor",
    mood: [
      "Agresivo",
      "Oscuro"
    ],
    tags: [
      "#basederap",
      "#boombap",
      "#hiphop"
    ],
    duration: "4:00",
    durationSeconds: 290,
    audioUrl: "/subestimado.mp3",
    audioPreviewUrl: "/subestimado.mp3",
    coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
    audioFileName: "el-subestimado-preview.mp3",
    previewDuration: 40,
    isWatermarkedPreview: true,
    previewWaveform: [
      0.12, 0.41, 0.54, 0.38, 0.46, 0.28, 0.4, 0.56, 0.42, 0.46,
      0.49, 0.41, 0.42, 0.54, 0.41, 0.43, 0.42, 0.47, 0.5, 0.43,
      0.39, 0.55, 0.38, 0.47, 0.29, 0.41, 0.56, 0.42, 0.46, 0.49,
      0.41, 0.42, 0.54, 0.41, 0.43, 0.42, 0.47, 0.5, 0.43, 0.4
    ],
    description: "Beat instrumental masterizado listo para grabación vocal profesional con contrato legal incluido.",
    plays: 45,
    likes: 0,
    isFeatured: true,
    isSoldExclusive: false,
    createdAt: "2026-08-18",
    paypalLinks: {
      basic: "https://www.paypal.com/paypalme/samuhelman/20.00USD",
      media: "https://www.paypal.com/paypalme/samuhelman/45.00USD",
      exclusive: "https://www.paypal.com/paypalme/samuhelman/150.00USD",
      premium: "https://www.paypal.com/paypalme/samuhelman/250.00USD"
    },
    tierPrices: {
      basic: 20,
      media: 45,
      exclusive: 150,
      premium: 300
    }
  }
];
