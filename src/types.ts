export type Genre = 
  | 'Trap'
  | 'Hip Hop'
  | 'Drill'
  | 'Reggaeton'
  | 'R&B / Soul'
  | 'Afrobeat'
  | 'Pop'
  | 'Boom Bap'
  | 'Synthwave'
  | 'Dancehall'
  | 'Lo-Fi'
  | 'Rock / Indie';

export type LicenseTierKey = 'basic' | 'media' | 'exclusive' | 'premium';

export interface LicenseTier {
  id: LicenseTierKey;
  name: string;
  price: number;
  format: string; // e.g. "MP3 (320kbps)" | "WAV (24-bit) + MP3" | "WAV + Trackout Stems"
  streamsLimit: string;
  salesCopiesLimit: string;
  youtubeViewsLimit: string;
  radioSyncLimit: string;
  forProfitPerformances: boolean;
  stemsIncluded: boolean;
  contractIncluded: boolean;
  isOfferBased?: boolean; // 4th option where the client can make a custom offer
  customPaypalLink?: string;
  description: string;
}

export interface PaymentGatewaysConfig {
  producerName: string; // "Samu helman en el mix / Samuel Helman"
  producerEmail: string; // "samuhelmanenelmix@gmail.com"
  paypalEmailOrUsername: string; // "samuhelmanenelmix@gmail.com"
  paypalBaseUrl: string; // "https://www.paypal.com/paypalme/samuhelman/"
  enableDirectPaypalLinks: boolean;
  enableMercadoPago: boolean;
  mercadoPagoAlias?: string;
  enableBankTransfer: boolean;
  bankDetails?: string;
  enableWhatsAppCheckout: boolean;
  whatsAppNumber?: string;
  currency: string; // "USD"
  currencySymbol: string; // "$"
}

export interface Beat {
  id: string;
  title: string;
  producer: string;
  genre: Genre;
  subgenre?: string;
  bpm: number;
  keyScale: string; // e.g., "C# Minor", "F Minor", "A Major"
  mood: string[]; // e.g. ["Dark", "Aggressive", "Hard"]
  tags: string[]; // e.g. ["#TravisScott", "#MetroBoomin", "#808"]
  duration: string; // e.g. "2:45"
  durationSeconds: number;
  coverUrl: string;
  audioPreviewUrl: string; // URL or synthesized audio
  audioFileName?: string;
  stemsFileUrl?: string;
  previewDuration?: number; // Usually 40s preview clip
  isWatermarkedPreview?: boolean; // Indicates 40s preview clip with 15s voice tags
  previewWaveform?: number[]; // Extracted waveform points
  description: string;
  plays: number;
  likes: number;
  isFeatured?: boolean;
  isSoldExclusive?: boolean;
  createdAt: string;
  // Specific custom PayPal payment links per tier for this individual beat
  paypalLinks: {
    basic?: string;
    media?: string;
    exclusive?: string;
    premium?: string;
    unlimited?: string; // backwards compatibility
  };
  // Custom price overrides per beat if different from defaults
  tierPrices: {
    basic: number;
    media: number;
    exclusive: number;
    premium?: number; // suggested base offer or custom price
    unlimited?: number; // backwards compatibility
  };
}

export interface CartItem {
  beat: Beat;
  tier: LicenseTierKey;
  price: number;
  offeredPrice?: number;
  customPaypalLink?: string;
}

export interface PurchasedLicense {
  orderId: string;
  beatTitle: string;
  beatId: string;
  producer: string;
  producerEmail: string;
  buyerName: string;
  buyerEmail: string;
  artistStageName: string;
  tierName: string;
  tierKey: LicenseTierKey;
  amountPaid: number;
  isOfferAccepted?: boolean;
  offeredAmount?: number;
  currency: string;
  paymentMethod: string;
  transactionRef: string;
  purchaseDate: string;
  contractText: string;
  contractHtml: string;
}
