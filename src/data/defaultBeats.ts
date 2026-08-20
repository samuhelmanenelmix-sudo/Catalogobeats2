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
    id: "beat-1787199692068",
    title: "Pista de Reggaeton 2026 \"Nos conocemos\"",
    producer: "Samu helman en el mix / Samuel Helman",
    genre: "Reggaeton",
    subgenre: "Latino",
    bpm: 100,
    keyScale: "F Minor",
    mood: [
      "Agresivo",
      "Oscuro"
    ],
    tags: [
      "#reggaeton",
      "#latino",
      "#romantico"
    ],
    duration: "3:50",
    durationSeconds: 230,
    coverUrl: "https://files.catbox.moe/pxyisk.png",
    audioUrl: "https://files.catbox.moe/bxyzl1.mp3",
    audioPreviewUrl: "https://files.catbox.moe/bxyzl1.mp3",
    stemsFileUrl: "https://drive.google.com/drive/folders/1OxDHixRapUrl1rGFmBHftn5gmO5fhSHY",
    previewDuration: 40,
    isWatermarkedPreview: true,
    description: "Beat instrumental masterizado listo para grabación vocal profesional con contrato legal incluido.",
    plays: 0,
    likes: 0,
    isFeatured: true,
    isSoldExclusive: false,
    createdAt: "2026-08-20",
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
    },
    audioFileName: "Free_Pista_de_Reggaeton_2026__Nos_conocemos__Samuel_Helman.wav",
    previewWaveform: [
      0.15, 0.12, 0.20, 0.18, 0.20, 0.20, 0.19, 0.23, 0.21, 0.19,
      0.16, 0.20, 0.34, 0.34, 0.22, 0.24, 0.23, 0.25, 0.21, 0.38,
      0.35, 0.40, 0.38, 0.32, 0.34, 0.32, 0.33, 0.36, 0.36, 0.33,
      0.28, 0.38, 0.39, 0.43, 0.41, 0.44, 0.37, 0.35, 0.41, 0.57
    ]
  },
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
    coverUrl: "",
    audioFileName: "el-subestimado-preview.mp3",
    stemsFileUrl: "https://drive.google.com/drive/folders/1C6EsgU0hOQOFflauJX3QNhmmmQqi9zy1",
    previewDuration: 40,
    isWatermarkedPreview: true,
    previewWaveform: [
      0.12, 0.41, 0.54, 0.38, 0.46, 0.28, 0.4, 0.56, 0.42, 0.46,
      0.49, 0.41, 0.42, 0.54, 0.41, 0.43, 0.42, 0.47, 0.5, 0.43,
      0.39, 0.55, 0.38, 0.47, 0.29, 0.41, 0.56, 0.42, 0.46, 0.49,
      0.41, 0.42, 0.54, 0.41, 0.43, 0.42, 0.47, 0.5, 0.43, 0.4
    ],
    description: "Beat instrumental masterizado listo para grabación vocal profesional con contrato legal incluido.",
    plays: 46,
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
  },
  {
    id: "beat-1787089249056",
    title: "Cleopatra Hip Hop R&B Beat",
    producer: "Samu helman en el mix / Samuel Helman",
    genre: "Hip Hop",
    subgenre: "R&B",
    bpm: 99,
    keyScale: "D MAJOR",
    mood: [
      "Agresivo",
      "Oscuro"
    ],
    tags: [
      "#HipHop",
      "#R&B",
      "#Egypcian",
      "#Beat"
    ],
    duration: "3:04",
    durationSeconds: 184,
    coverUrl: "",
    audioUrl: "/subestimado.mp3",
    audioPreviewUrl: "/subestimado.mp3",
    audioFileName: "Cleopatra_beat__Samuel_Helman.mp3",
    stemsFileUrl: "https://drive.google.com/drive/folders/17ZAIXpNkUiOtMyYoTanw7oJIR2uJxrh0",
    previewDuration: 40,
    isWatermarkedPreview: true,
    previewWaveform: [
      0.15, 0.16, 0.36, 0.19, 0.24, 0.17, 0.17, 0.3, 0.15, 0.24,
      0.21, 0.25, 0.3, 0.33, 0.34, 0.24, 0.32, 0.37, 0.26, 0.31,
      0.26, 0.59, 0.37, 0.47, 0.44, 0.42, 0.67, 0.39, 0.49, 0.36,
      0.34, 0.49, 0.35, 0.52, 0.39, 0.44, 0.69, 0.41, 0.48, 0.37
    ],
    description: "Beat instrumental masterizado listo para grabación vocal profesional con contrato legal incluido.",
    plays: 1,
    likes: 0,
    isFeatured: true,
    isSoldExclusive: false,
    createdAt: "2026-08-18",
    paypalLinks: {
      basic: "https://www.paypal.com/paypalme/samuhelman/20.00USD",
      media: "https://www.paypal.com/paypalme/samuhelman/45.00USD",
      exclusive: "https://www.paypal.com/paypalme/samuhelman/150.00USD",
      premium: "https://www.paypal.com/paypalme/samuhelman/300.00USD"
    },
    tierPrices: {
      basic: 20,
      media: 45,
      exclusive: 150,
      premium: 300
    }
  }
];
