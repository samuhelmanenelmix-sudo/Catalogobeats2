import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import * as _archiver from 'archiver';
const archiver: any = (_archiver as any).default || _archiver;
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

// Security & Middlewares
app.use(cors());
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

// File-backed Persistence, Uploads & Private storage setup
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Serve /uploads statically with range requests support and audio/image headers
app.use('/uploads', express.static(UPLOADS_DIR, {
  setHeaders: (res, filePath) => {
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    if (filePath.endsWith('.wav')) {
      res.setHeader('Content-Type', 'audio/wav');
    } else if (filePath.endsWith('.mp3')) {
      res.setHeader('Content-Type', 'audio/mpeg');
    } else if (filePath.endsWith('.m4a') || filePath.endsWith('.mp4')) {
      res.setHeader('Content-Type', 'audio/mp4');
    } else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (filePath.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    } else if (filePath.endsWith('.webp')) {
      res.setHeader('Content-Type', 'image/webp');
    }
  }
}));

const BEATS_FILE = path.join(DATA_DIR, 'beats.json');
const TOKENS_FILE = path.join(DATA_DIR, 'tokens.json');
const PRIVATE_STORAGE_DIR = path.join(process.cwd(), 'private_storage', 'beats');
if (!fs.existsSync(PRIVATE_STORAGE_DIR)) {
  fs.mkdirSync(PRIVATE_STORAGE_DIR, { recursive: true });
}

const SIGNING_SECRET = process.env.DOWNLOAD_SIGNING_SECRET || 'samu-helman-secure-delivery-key-v1';

// Helper to generate HMAC signature
function generateSignedToken(token: string, expiresAtMs: number): string {
  const crypto = require('crypto');
  return crypto.createHmac('sha256', SIGNING_SECRET).update(`${token}:${expiresAtMs}`).digest('hex');
}

function verifyTokenSignature(token: string, expiresAtMs: number, signature: string): boolean {
  if (!signature) return false;
  const expected = generateSignedToken(token, expiresAtMs);
  return expected === signature;
}

// In-Memory / File-backed Download Token Store
interface DownloadTokenRecord {
  token: string;
  signature?: string;
  orderId: string;
  beatId: string;
  beatTitle: string;
  tierKey: string;
  tierName: string;
  format: string;
  amountPaid: number;
  currency: string;
  buyerName: string;
  buyerEmail: string;
  artistStageName: string;
  downloadCount: number;
  maxDownloads: number;
  createdAt: string;
  expiresAt: string;
  expiresAtMs: number;
  contractText: string;
  contractHtml: string;
  filePath?: string;
}

const tokenStore: Map<string, DownloadTokenRecord> = new Map();

// Load persistent tokens if available
function loadTokensFromDisk() {
  try {
    if (fs.existsSync(TOKENS_FILE)) {
      const data = JSON.parse(fs.readFileSync(TOKENS_FILE, 'utf-8'));
      if (Array.isArray(data)) {
        data.forEach((item: DownloadTokenRecord) => {
          tokenStore.set(item.token, item);
        });
      }
    }
  } catch (err) {
    console.error('Error cargando tokens de disco:', err);
  }
}
loadTokensFromDisk();

function saveTokensToDisk() {
  try {
    const list = Array.from(tokenStore.values());
    fs.writeFileSync(TOKENS_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error guardando tokens en disco:', err);
  }
}

// Load Beats Catalog from beats.json
function loadBeatsCatalog(): any[] {
  try {
    if (fs.existsSync(BEATS_FILE)) {
      const content = fs.readFileSync(BEATS_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error leyendo data/beats.json:', err);
  }
  return [];
}

function saveBeatsCatalog(beats: any[]): boolean {
  try {
    const sanitizedBeats = Array.isArray(beats) ? beats.map((b) => {
      let cover = b.coverUrl || '';
      if (typeof cover === 'string') {
        if (cover.includes('images.unsplash.com') || cover.startsWith('/uploads/') || cover.length > 200000) {
          cover = '';
        }
      }
      let audioUrl = b.audioUrl || b.audioPreviewUrl || '/subestimado.mp3';
      if (typeof audioUrl === 'string' && (audioUrl.startsWith('data:audio/') || audioUrl.startsWith('data:application/') || audioUrl.startsWith('/uploads/') || audioUrl.length > 2048)) {
        audioUrl = '/subestimado.mp3';
      }
      let audioPreview = b.audioPreviewUrl || audioUrl;
      if (typeof audioPreview === 'string' && (audioPreview.startsWith('data:audio/') || audioPreview.startsWith('data:application/') || audioPreview.startsWith('/uploads/') || audioPreview.length > 2048)) {
        audioPreview = audioUrl;
      }
      return {
        ...b,
        coverUrl: cover,
        audioUrl,
        audioPreviewUrl: audioPreview,
      };
    }) : [];

    fs.writeFileSync(BEATS_FILE, JSON.stringify(sanitizedBeats, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error guardando en data/beats.json:', err);
    return false;
  }
}

let BEATS_CATALOG: any[] = loadBeatsCatalog();

const PRODUCER_INFO = {
  name: 'Samu helman en el mix / Samuel Helman',
  email: 'samuhelmanenelmix@gmail.com',
  brandName: 'Samu helman en el mix'
};

// Helper: Generate Server HTML Contract
function generateServerContractHtml(params: {
  buyerName: string;
  buyerEmail: string;
  artistStageName: string;
  beatTitle: string;
  purchaseDate: string;
  tierKey: string;
  tierName: string;
  amountPaid: number;
  transactionId: string;
}): string {
  const clientName = params.artistStageName && params.artistStageName !== params.buyerName
    ? `${params.buyerName} (${params.artistStageName})`
    : params.buyerName;

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Contrato de Licencia - ${params.beatTitle} - ${PRODUCER_INFO.brandName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #111827; background: #FFFFFF; padding: 32px 40px; font-size: 11px; line-height: 1.45; }
    .header-bar { background: #0B1726; color: #FFFFFF; padding: 16px 20px; border-radius: 4px; margin-bottom: 20px; }
    .header-title { font-size: 16px; font-weight: 800; text-transform: uppercase; }
    .header-subtitle { font-size: 9px; font-weight: 600; color: #94A3B8; letter-spacing: 1px; margin-top: 4px; text-transform: uppercase; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px 24px; margin-bottom: 22px; }
    .info-label { font-size: 9.5px; font-weight: 800; color: #64748B; text-transform: uppercase; margin-bottom: 2px; }
    .info-value-strong { font-size: 12px; font-weight: 700; color: #0F172A; }
    .info-value-client { font-size: 12px; font-weight: 700; color: #2563EB; }
    .info-value { color: #334155; }
    .section-title { font-size: 12px; font-weight: 800; color: #0F172A; margin-bottom: 10px; text-transform: uppercase; }
    .matrix-table { width: 100%; border-collapse: collapse; margin-bottom: 6px; font-size: 10px; }
    .matrix-table th { background: #0B1726; color: #FFFFFF; font-weight: 700; text-align: left; padding: 8px 10px; font-size: 9.5px; text-transform: uppercase; }
    .matrix-table td { padding: 7px 10px; border-bottom: 1px solid #E2E8F0; color: #334155; }
    .matrix-table tr.active-tier { background: #EFF6FF; font-weight: 700; }
    .matrix-table tr.active-tier td { color: #1E3A8A; border-bottom: 2px solid #3B82F6; }
    .matrix-note { font-size: 9px; color: #64748B; font-style: italic; margin-bottom: 18px; }
    .clause-item { margin-bottom: 8px; text-align: justify; color: #334155; }
    .confirmation-box { background: #F0FDF4; border-left: 4px solid #10B981; padding: 10px 14px; margin-bottom: 24px; font-size: 10.5px; color: #065F46; }
    .signature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-top: 24px; }
    .sig-line { border-top: 1px solid #94A3B8; padding-top: 6px; font-size: 11px; color: #0F172A; }
    .sig-role { font-size: 9.5px; color: #64748B; }
    .footer-stamp { text-align: center; font-size: 8.5px; color: #94A3B8; margin-top: 16px; border-top: 1px dashed #CBD5E1; padding-top: 10px; }
  </style>
</head>
<body>
  <div class="header-bar">
    <div class="header-title">CONTRATO DE LICENCIA Y ACUERDO DE USO DE BEAT</div>
    <div class="header-subtitle">REGISTRO OFICIAL DE LICENCIAMIENTO | SAMU HELMAN EN EL MIX</div>
  </div>

  <div class="info-grid">
    <div>
      <div class="info-label">LICENCIANTE / PRODUCTOR:</div>
      <div class="info-value-strong">${PRODUCER_INFO.name}</div>
      <div class="info-value">Email: ${PRODUCER_INFO.email}</div>
    </div>
    <div>
      <div class="info-label">LICENCIATARIO / CLIENTE:</div>
      <div class="info-value-client">${clientName}</div>
      <div class="info-value">Email: ${params.buyerEmail}</div>
    </div>
    <div>
      <div class="info-label">INSTRUMENTAL:</div>
      <div class="info-value-strong">${params.beatTitle}</div>
      <div class="info-label" style="margin-top: 6px;">FECHA COMPRA:</div>
      <div class="info-value">${params.purchaseDate}</div>
    </div>
    <div>
      <div class="info-label">LICENCIA ADQUIRIDA:</div>
      <div class="info-value-strong" style="color: #059669;">${params.tierName}</div>
      <div class="info-label" style="margin-top: 6px;">ID TRANSACCIÓN:</div>
      <div class="info-value" style="font-family: monospace;">${params.transactionId}</div>
    </div>
  </div>

  <div class="section-title">1. MATRIZ DE LICENCIAS Y MATRIZ DE TELEMETRÍA DE DERECHOS</div>
  <table class="matrix-table">
    <thead>
      <tr>
        <th>Tipo Licencia</th>
        <th>Precio USD</th>
        <th>Streaming</th>
        <th>Ventas / Copias</th>
        <th>YouTube / Vevo</th>
        <th>Radio / Sincro</th>
      </tr>
    </thead>
    <tbody>
      <tr class="${params.tierKey === 'basic' ? 'active-tier' : ''}">
        <td><strong>Básica (MP3)</strong></td>
        <td>$20.00</td>
        <td>Hasta 50,000</td>
        <td>Hasta 2,500 unid.</td>
        <td>Hasta 250,000 vistas</td>
        <td>Sin radio / Sin sincro</td>
      </tr>
      <tr class="${params.tierKey === 'media' ? 'active-tier' : ''}">
        <td><strong>Media (WAV)</strong></td>
        <td>$45.00</td>
        <td>Hasta 250,000</td>
        <td>Hasta 10,000 unid.</td>
        <td>Hasta 1,000,000 vistas</td>
        <td>2 Emisoras / Sin sincro</td>
      </tr>
      <tr class="${params.tierKey === 'exclusive' ? 'active-tier' : ''}">
        <td><strong>Exclusiva</strong></td>
        <td>$150.00</td>
        <td>Ilimitado</td>
        <td>Ilimitado</td>
        <td>Ilimitado</td>
        <td>Radio libre / Sincro libre</td>
      </tr>
      <tr class="${params.tierKey === 'premium' ? 'active-tier' : ''}">
        <td><strong>Premium</strong></td>
        <td style="color: #2563EB; font-weight: bold;">$${params.amountPaid.toFixed(2)} USD*</td>
        <td>Ilimitado + Stems</td>
        <td>Ilimitado + Stems</td>
        <td>Ilimitado + Stems</td>
        <td>Sincronización Total / TV</td>
      </tr>
    </tbody>
  </table>
  <div class="matrix-note">* Licencia Premium: Modalidad bajo oferta negociada directamente. Requiere aceptación explícita por escrito del Productor.</div>

  <div class="section-title">2. CLÁUSULAS Y CONDICIONES LEGALES DEL ACUERDO</div>
  <div class="clause-item"><strong>2.1 Otorgamiento y Propiedad:</strong> El Licenciante otorga el derecho de uso según el nivel de licencia. El Productor (${PRODUCER_INFO.name}) retiene la propiedad intelectual original.</div>
  <div class="clause-item"><strong>2.2 Créditos Obligatorios:</strong> Se debe acreditar al Productor como <em>"Producido por Samu helman en el mix"</em>.</div>
  <div class="clause-item"><strong>2.3 Prohibición de Content ID:</strong> Prohibido registrar la obra en YouTube Content ID o Meta Rights Manager bajo escaneo que bloquee a terceros.</div>
  <div class="clause-item"><strong>2.4 Composición y Publishing:</strong> Regalías de publishing 50% Productor y 50% Licenciatario. Master 100% Licenciatario.</div>
  <div class="clause-item"><strong>2.5 Licencia Premium:</strong> Opera bajo oferta económica del cliente con efecto legal tras confirmación de pago.</div>

  <div class="confirmation-box">
    <strong>CONFIRMACIÓN DE ADQUISICIÓN:</strong> Certifica que <strong>${clientName}</strong> ha adquirido la licencia '<strong>${params.tierName}</strong>'.
  </div>

  <div class="signature-grid">
    <div>
      <div class="sig-line"><strong>${PRODUCER_INFO.name}</strong></div>
      <div class="sig-role">Licenciante / Productor Musical</div>
    </div>
    <div>
      <div class="sig-line"><strong>${clientName}</strong></div>
      <div class="sig-role">Licenciatario / Cliente</div>
    </div>
  </div>

  <div class="footer-stamp">
    Documento con validez legal digital emitido por el sistema de licencias de Samu helman en el mix. Ref: ${params.transactionId}
  </div>
</body>
</html>`;
}

// Helper: Get PayPal Access Token (REST v2)
async function getPayPalAccessToken(): Promise<string | null> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const mode = process.env.PAYPAL_MODE || 'sandbox';

  if (!clientId || !clientSecret) {
    return null; // Fallback to simulated sandbox if keys are not yet provided
  }

  const host = mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  try {
    const response = await fetch(`${host}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials'
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('PayPal OAuth Token Error:', errText);
      return null;
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error fetching PayPal token:', error);
    return null;
  }
}

// ----------------------------------------------------
// 1. API: Get PayPal Public Config
// ----------------------------------------------------
app.get('/api/config/paypal', (req, res) => {
  const clientId = process.env.PAYPAL_CLIENT_ID || '';
  const mode = process.env.PAYPAL_MODE || 'sandbox';
  res.json({
    clientId: clientId.trim(),
    mode,
    currency: 'USD',
    hasCredentials: Boolean(clientId && process.env.PAYPAL_CLIENT_SECRET)
  });
});

// ----------------------------------------------------
// 2. API: Get Beats Catalog & CRUD Persistence
// ----------------------------------------------------
app.get('/api/beats', (req, res) => {
  BEATS_CATALOG = loadBeatsCatalog();
  res.json({ beats: BEATS_CATALOG });
});

// Create or update a beat
app.post('/api/beats', (req, res) => {
  try {
    const beat = req.body;
    if (!beat || !beat.title) {
      return res.status(400).json({ error: 'El título del beat es obligatorio' });
    }

    if (!beat.id) {
      beat.id = `beat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    }

    BEATS_CATALOG = loadBeatsCatalog();
    const existingIndex = BEATS_CATALOG.findIndex((b) => b.id === beat.id);

    if (existingIndex >= 0) {
      BEATS_CATALOG[existingIndex] = { ...BEATS_CATALOG[existingIndex], ...beat };
    } else {
      BEATS_CATALOG.unshift(beat);
    }

    saveBeatsCatalog(BEATS_CATALOG);
    res.json({ success: true, beat });
  } catch (error: any) {
    console.error('Error guardando beat:', error);
    res.status(500).json({ error: 'Error al persistir el beat en la base de datos' });
  }
});

// Bulk sync beats
app.post('/api/beats/bulk', (req, res) => {
  try {
    const { beats } = req.body;
    if (!Array.isArray(beats)) {
      return res.status(400).json({ error: 'Formato de beats inválido' });
    }
    BEATS_CATALOG = beats;
    saveBeatsCatalog(BEATS_CATALOG);
    res.json({ success: true, count: beats.length });
  } catch (error: any) {
    console.error('Error en sync masivo de beats:', error);
    res.status(500).json({ error: 'Error al sincronizar beats' });
  }
});

// Delete beat
app.delete('/api/beats/:id', (req, res) => {
  try {
    const { id } = req.params;
    BEATS_CATALOG = loadBeatsCatalog();
    BEATS_CATALOG = BEATS_CATALOG.filter((b) => b.id !== id);
    saveBeatsCatalog(BEATS_CATALOG);
    res.json({ success: true, deletedId: id });
  } catch (error: any) {
    console.error('Error eliminando beat:', error);
    res.status(500).json({ error: 'Error al eliminar beat' });
  }
});

// ----------------------------------------------------
// 2.1 API: POST /api/upload-audio (Universal Audio Upload & Permanent File Storage)
// ----------------------------------------------------
app.post('/api/upload-audio', (req, res) => {
  try {
    const { fileBase64, fileName, fileType } = req.body;
    if (!fileBase64 || typeof fileBase64 !== 'string') {
      return res.status(400).json({ error: 'Datos de audio no válidos (se requiere fileBase64)' });
    }

    // Strip data URL prefixes if present
    const base64Data = fileBase64.replace(/^data:(audio|application)\/[a-zA-Z0-9_-]+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    if (buffer.length === 0) {
      return res.status(400).json({ error: 'El archivo de audio está vacío' });
    }

    let ext = '.wav';
    if (fileName && path.extname(fileName)) {
      ext = path.extname(fileName).toLowerCase();
    } else if (fileType) {
      if (fileType.includes('mpeg') || fileType.includes('mp3')) ext = '.mp3';
      else if (fileType.includes('mp4') || fileType.includes('m4a') || fileType.includes('aac')) ext = '.m4a';
      else if (fileType.includes('wav')) ext = '.wav';
    }

    const baseNameRaw = fileName ? path.basename(fileName, ext) : 'beat-audio';
    const cleanBaseName = baseNameRaw.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 35) || 'audio';
    const uniqueFileName = `${cleanBaseName}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}${ext}`;

    const filePath = path.join(UPLOADS_DIR, uniqueFileName);
    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/${uniqueFileName}`;
    console.log(`[Audio Upload] Stored permanent audio file at ${filePath} (${buffer.length} bytes), accessible at ${publicUrl}`);

    return res.status(200).json({
      success: true,
      url: publicUrl,
      fileName: uniqueFileName,
      size: buffer.length,
      ext
    });
  } catch (error: any) {
    console.error('Error al procesar carga de audio:', error);
    return res.status(500).json({ error: 'Error del servidor al almacenar el archivo de audio' });
  }
});

// ----------------------------------------------------
// 2.12 API: POST /api/voice-tag/upload & GET /api/voice-tag (Official Producer Voice Tag)
// ----------------------------------------------------
const VOICE_TAG_FILE = path.join(UPLOADS_DIR, 'producer-voice-tag.mp3');

app.get('/api/voice-tag', (req, res) => {
  const exists = fs.existsSync(VOICE_TAG_FILE) || fs.existsSync(path.join(process.cwd(), 'public', 'producer-voice-tag.mp3'));
  res.json({
    success: true,
    hasVoiceTag: exists,
    url: '/uploads/producer-voice-tag.mp3',
    fallbackUrl: '/producer-voice-tag.mp3',
    producerName: 'Samu Helman en el mix'
  });
});

app.get('/api/voice-tag/audio', (req, res) => {
  let tagPath = VOICE_TAG_FILE;
  if (!fs.existsSync(tagPath)) {
    tagPath = path.join(process.cwd(), 'public', 'producer-voice-tag.mp3');
  }
  if (!fs.existsSync(tagPath)) {
    return res.status(404).json({ error: 'Audio tag no encontrado' });
  }
  res.setHeader('Content-Type', 'audio/mpeg');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  fs.createReadStream(tagPath).pipe(res);
});

app.post('/api/voice-tag/upload', (req, res) => {
  try {
    const { fileBase64, fileName } = req.body;
    if (!fileBase64 || typeof fileBase64 !== 'string') {
      return res.status(400).json({ error: 'Se requiere el archivo de audio base64' });
    }

    const commaIndex = fileBase64.indexOf(',');
    const rawBase64 = commaIndex !== -1 ? fileBase64.substring(commaIndex + 1) : fileBase64;
    const buffer = Buffer.from(rawBase64, 'base64');

    if (buffer.length === 0) {
      return res.status(400).json({ error: 'El archivo de audio está vacío' });
    }

    // Save directly to uploads directory as the permanent producer voice tag
    fs.writeFileSync(VOICE_TAG_FILE, buffer);

    // Also sync to public/ and dist/
    const publicDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
    fs.writeFileSync(path.join(publicDir, 'producer-voice-tag.mp3'), buffer);

    const distDir = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distDir)) {
      fs.writeFileSync(path.join(distDir, 'producer-voice-tag.mp3'), buffer);
    }

    console.log(`[Voice Tag Upload] Official producer voice tag updated (${buffer.length} bytes) by Samu Helman`);

    return res.status(200).json({
      success: true,
      message: 'Audio tag oficial de Samu Helman guardado y activado para todos los beats',
      url: '/uploads/producer-voice-tag.mp3',
      size: buffer.length
    });
  } catch (err: any) {
    console.error('Error guardando audio tag:', err);
    return res.status(500).json({ error: 'Error del servidor al guardar audio tag' });
  }
});

// ----------------------------------------------------
// 2.15 API: POST /api/upload-image (Image Cover Upload to Disk)
// ----------------------------------------------------
app.post('/api/upload-image', (req, res) => {
  try {
    const { imageBase64, fileName } = req.body;
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({ error: 'Datos de imagen no válidos' });
    }

    // Split at comma to safely extract Base64 data regardless of MIME type prefix
    const commaIndex = imageBase64.indexOf(',');
    const rawBase64 = commaIndex !== -1 ? imageBase64.substring(commaIndex + 1) : imageBase64;
    const buffer = Buffer.from(rawBase64, 'base64');

    if (buffer.length === 0) {
      return res.status(400).json({ error: 'El archivo de imagen está vacío' });
    }

    let ext = '.jpg';
    if (fileName && path.extname(fileName)) {
      const parsedExt = path.extname(fileName).toLowerCase();
      if (['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'].includes(parsedExt)) {
        ext = parsedExt === '.jpeg' ? '.jpg' : parsedExt;
      }
    } else if (imageBase64.includes('image/png')) {
      ext = '.png';
    } else if (imageBase64.includes('image/webp')) {
      ext = '.webp';
    } else if (imageBase64.includes('image/jpeg') || imageBase64.includes('image/jpg')) {
      ext = '.jpg';
    }

    const cleanBaseName = fileName 
      ? path.basename(fileName, path.extname(fileName)).replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 35) 
      : 'artwork';
    const uniqueFileName = `cover-${cleanBaseName}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}${ext}`;
    const filePath = path.join(UPLOADS_DIR, uniqueFileName);

    fs.writeFileSync(filePath, buffer);
    const publicUrl = `/uploads/${uniqueFileName}`;

    console.log(`[Upload Image] Portada guardada exitosamente: ${publicUrl} (${(buffer.length / 1024).toFixed(1)} KB)`);

    return res.status(200).json({
      success: true,
      url: publicUrl,
      fileName: uniqueFileName,
      size: buffer.length
    });
  } catch (error: any) {
    console.error('Error al procesar carga de imagen:', error);
    return res.status(500).json({ error: 'Error del servidor al almacenar la portada' });
  }
});

// ----------------------------------------------------
// 2.2 API: GET /api/audio-stream/:filename (Range Requests Audio Streaming)
// ----------------------------------------------------
app.get('/api/audio-stream/:filename', (req, res) => {
  try {
    const filename = path.basename(req.params.filename);
    const filePath = path.join(UPLOADS_DIR, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Archivo de audio no encontrado' });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    let contentType = 'audio/wav';
    if (filename.endsWith('.mp3')) contentType = 'audio/mpeg';
    else if (filename.endsWith('.m4a') || filename.endsWith('.mp4')) contentType = 'audio/mp4';

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;
      const file = fs.createReadStream(filePath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*'
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
        'Access-Control-Allow-Origin': '*'
      };
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (err: any) {
    console.error('Error en audio-stream:', err);
    res.status(500).json({ error: 'Error al transmitir audio' });
  }
});

// ----------------------------------------------------
// 3. API: POST /api/orders/create (PayPal Order Creation)
// ----------------------------------------------------
app.post('/api/orders/create', async (req, res) => {
  try {
    const { beatId, beatTitle, producer, tierKey = 'basic', customPrice } = req.body;

    const beat = BEATS_CATALOG.find((b) => b.id === beatId) || {
      id: beatId || 'custom-beat',
      title: beatTitle || 'Beat Instrumental',
      producer: producer || PRODUCER_INFO.name,
      prices: { basic: 20.00, media: 45.00, exclusive: 150.00, premium: 250.00 }
    };
    const tierPrices: Record<string, number> = beat.prices || { basic: 20.00, media: 45.00, exclusive: 150.00, premium: 250.00 };
    const priceAmount = customPrice ? Number(customPrice).toFixed(2) : (tierPrices[tierKey] || 20.00).toFixed(2);

    const mode = process.env.PAYPAL_MODE || 'sandbox';
    const host = mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
    const accessToken = await getPayPalAccessToken();

    // If real PayPal credentials exist, create order via PayPal Orders API v2
    if (accessToken) {
      const orderPayload = {
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: `BEAT-${beat.id}-${tierKey}`,
            description: `Licencia ${tierKey.toUpperCase()} - Beat: ${beat.title}`,
            amount: {
              currency_code: 'USD',
              value: priceAmount,
              breakdown: {
                item_total: {
                  currency_code: 'USD',
                  value: priceAmount
                }
              }
            },
            items: [
              {
                name: `Licencia ${tierKey.toUpperCase()} - ${beat.title}`,
                description: `Instrumental Beat producido por ${PRODUCER_INFO.brandName}`,
                unit_amount: {
                  currency_code: 'USD',
                  value: priceAmount
                },
                quantity: '1',
                category: 'DIGITAL_GOODS'
              }
            ]
          }
        ],
        application_context: {
          brand_name: PRODUCER_INFO.brandName,
          landing_page: 'NO_PREFERENCE',
          user_action: 'PAY_NOW',
          shipping_preference: 'NO_SHIPPING'
        }
      };

      const response = await fetch(`${host}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'PayPal-Request-Id': uuidv4()
        },
        body: JSON.stringify(orderPayload)
      });

      const orderData = await response.json();

      if (!response.ok) {
        return res.status(response.status).json({
          error: 'Error al crear la orden en PayPal',
          details: orderData
        });
      }

      return res.status(201).json({
        id: orderData.id,
        orderID: orderData.id,
        status: orderData.status
      });
    }

    // Fallback sandbox simulation for testing when API keys are not yet configured in UI
    const simulatedOrderId = `SANDBOX-ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    return res.status(201).json({
      id: simulatedOrderId,
      orderID: simulatedOrderId,
      status: 'CREATED',
      simulated: true,
      amount: priceAmount
    });
  } catch (error: any) {
    console.error('Error in /api/orders/create:', error);
    return res.status(500).json({
      error: 'Error interno del servidor al procesar la orden',
      message: error.message
    });
  }
});

// ----------------------------------------------------
// 4. API: POST /api/orders/capture (PayPal Order Capture & Secure Token Gen)
// ----------------------------------------------------
app.post('/api/orders/capture', async (req, res) => {
  try {
    const { 
      orderID, 
      beatId, 
      tierKey = 'basic', 
      buyerName = 'Comprador Anónimo', 
      buyerEmail = 'cliente@ejemplo.com', 
      artistName = '',
      contractHtml: clientProvidedHtml,
      contractText: clientProvidedTxt,
      customPrice
    } = req.body;

    if (!orderID) {
      return res.status(400).json({ error: 'Falta el orderID requerido para capturar el pago.' });
    }

    const mode = process.env.PAYPAL_MODE || 'sandbox';
    const host = mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
    const accessToken = await getPayPalAccessToken();

    let captureResult: any = null;
    let isCompleted = false;

    // Real PayPal Capture
    if (accessToken && !orderID.startsWith('SANDBOX-')) {
      const response = await fetch(`${host}/v2/checkout/orders/${orderID}/capture`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'PayPal-Request-Id': uuidv4()
        }
      });

      captureResult = await response.json();
      isCompleted = captureResult.status === 'COMPLETED';

      if (!isCompleted) {
        return res.status(400).json({
          error: 'El pago no ha sido completado o fue rechazado por PayPal',
          details: captureResult
        });
      }
    } else {
      // Simulated sandbox capture
      isCompleted = true;
      captureResult = {
        id: orderID,
        status: 'COMPLETED',
        payer: {
          name: { given_name: buyerName },
          email_address: buyerEmail
        }
      };
    }

    // Resolve Beat & Tier details
    const beat = BEATS_CATALOG.find((b) => b.id === beatId) || {
      id: beatId || 'custom-beat',
      title: req.body.beatTitle || 'Beat Instrumental',
      producer: req.body.producer || PRODUCER_INFO.name,
      bpm: req.body.bpm || 120,
      keyScale: req.body.keyScale || 'C Minor',
      prices: { basic: 20.00, media: 45.00, exclusive: 150.00, premium: 250.00 }
    };
    const tierPrices: Record<string, number> = beat.prices || { basic: 20.00, media: 45.00, exclusive: 150.00, premium: 250.00 };
    const pricePaid = customPrice ? Number(customPrice) : (tierPrices[tierKey] || 20.00);
    const effectiveArtist = (artistName && artistName.trim()) ? artistName.trim() : buyerName;

    // Generate Secure Unique UUID Download Token
    const downloadToken = uuidv4();
    const purchaseDate = new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const tierFormatMap: Record<string, string> = {
      basic: 'MP3 Estándar 320kbps + Contrato Oficial',
      media: 'WAV Master 24-Bit + MP3 320kbps + Contrato Oficial',
      exclusive: 'WAV Master 24-Bit + MP3 + Stems + Derechos Exclusivos',
      premium: 'WAV Master + MP3 + Stems + Sincronización Total / TV'
    };

    const tierNameMap: Record<string, string> = {
      basic: 'Licencia Básica (MP3)',
      media: 'Licencia Media (WAV)',
      exclusive: 'Licencia Exclusiva',
      premium: 'Licencia Premium (Oferta Personalizada)'
    };

    const formatDescription = tierFormatMap[tierKey] || 'WAV + MP3 Master';
    const tierName = tierNameMap[tierKey] || 'Licencia Estándar';

    // Generate contract HTML and Text
    const contractHtml = clientProvidedHtml || generateServerContractHtml({
      buyerName,
      buyerEmail,
      artistStageName: effectiveArtist,
      beatTitle: beat.title,
      purchaseDate,
      tierKey,
      tierName,
      amountPaid: pricePaid,
      transactionId: orderID
    });

    const contractText = clientProvidedTxt || `========================================================================
CONTRATO DE LICENCIA DE INSTRUMENTAL / BEAT (${tierName.toUpperCase()})
ID de Orden PayPal: ${orderID}
Token Seguro de Descarga: ${downloadToken}
Fecha de Emisión: ${purchaseDate}
========================================================================

1. PARTES CONTRATANTES:
- Productor / Licenciante: ${PRODUCER_INFO.name} (${PRODUCER_INFO.email})
- Comprador / Licenciatario: ${buyerName}
- Nombre Artístico: ${effectiveArtist}
- Correo Electrónico: ${buyerEmail}

2. DETALLES DE LA OBRA MUSICAL:
- Título del Beat: "${beat.title}"
- Precio Total Pagado: $${pricePaid.toFixed(2)} USD
- Formato Entregado: ${formatDescription}

3. CLÁUSULAS RESUMIDAS:
- Crédito obligatorio: "Prod. by Samu helman en el mix"
- Prohibición expresa de registrar en Content ID de YouTube / Meta Rights Manager.
- Publishing 50% Productor / 50% Licenciatario. Master 100% Licenciatario.
========================================================================`;

    // Ensure protected zip file exists in private storage
    const zipFilePath = path.join(PRIVATE_STORAGE_DIR, `${downloadToken}.zip`);

    // Create a real ZIP package asynchronously in private storage
    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.pipe(output);

    // 1. Add contract HTML and TXT files
    archive.append(contractHtml, { name: `CONTRATO_OFICIAL_${beat.title.replace(/\s+/g, '_')}.html` });
    archive.append(contractText, { name: `CONTRATO_OFICIAL_${beat.title.replace(/\s+/g, '_')}.txt` });

    // 2. Add README instructions
    const readmeContent = `¡Gracias por adquirir "${beat.title}" de ${PRODUCER_INFO.name}!

Detalles de tu compra:
- Tipo de Licencia: ${tierName}
- Artista: ${effectiveArtist}
- Archivos incluidos: ${formatDescription}
- Monto pagado: $${pricePaid.toFixed(2)} USD

Instrucciones de Mezcla & Master:
1. Pistas ecualizadas con headroom de -6dB para masterización profesional.
2. Créditos requeridos: "Prod. by Samu helman en el mix".
3. Para soporte o consultas, escribe a: ${PRODUCER_INFO.email}`;

    archive.append(readmeContent, { name: 'LEEME_INSTRUCCIONES.txt' });

    // 3. Add audio file mock master
    const mockAudioHeader = `RIFF....WAVEfmt ....data....[MASTER AUDIO STREAM - ${beat.title} - ${beat.bpm || 120} BPM - SAMU HELMAN EN EL MIX STUDIO QUALITY]`;
    archive.append(Buffer.from(mockAudioHeader), { name: `${beat.title.replace(/\s+/g, '_')}_MASTER.wav` });

    await archive.finalize();

    // Store token record with 3 max downloads and exact 2 Hours temporary validity
    const expiresAtMs = Date.now() + 2 * 60 * 60 * 1000; // Exact 2 Hours
    const expiresDate = new Date(expiresAtMs);
    const signature = generateSignedToken(downloadToken, expiresAtMs);

    const tokenRecord: DownloadTokenRecord = {
      token: downloadToken,
      signature,
      orderId: orderID,
      beatId: beat.id,
      beatTitle: beat.title,
      tierKey,
      tierName,
      format: formatDescription,
      amountPaid: pricePaid,
      currency: 'USD',
      buyerName,
      buyerEmail,
      artistStageName: effectiveArtist,
      downloadCount: 0,
      maxDownloads: 3,
      createdAt: new Date().toISOString(),
      expiresAt: expiresDate.toISOString(),
      expiresAtMs,
      contractText,
      contractHtml,
      filePath: zipFilePath
    };

    tokenStore.set(downloadToken, tokenRecord);
    saveTokensToDisk();

    const signedDownloadUrl = `/api/download/${downloadToken}?exp=${expiresAtMs}&sig=${signature}`;

    return res.status(200).json({
      success: true,
      status: 'COMPLETED',
      orderId: orderID,
      downloadToken,
      downloadUrl: signedDownloadUrl,
      rawDownloadUrl: `/api/download/${downloadToken}`,
      maxDownloads: 3,
      remainingDownloads: 3,
      expiresAt: tokenRecord.expiresAt,
      expiresInHours: 2,
      license: {
        orderId: orderID,
        beatTitle: beat.title,
        beatId: beat.id,
        producer: PRODUCER_INFO.name,
        producerEmail: PRODUCER_INFO.email,
        buyerName,
        buyerEmail,
        artistStageName: effectiveArtist,
        tierName,
        tierKey,
        amountPaid: pricePaid,
        currency: 'USD',
        paymentMethod: 'PayPal v2 API (Checkout)',
        transactionRef: orderID,
        purchaseDate,
        contractText,
        contractHtml,
        isOfferAccepted: tierKey === 'premium',
        offeredAmount: tierKey === 'premium' ? pricePaid : undefined
      }
    });

  } catch (error: any) {
    console.error('Error in /api/orders/capture:', error);
    return res.status(500).json({
      error: 'Error al capturar la orden en PayPal',
      message: error.message
    });
  }
});

// ----------------------------------------------------
// 5. API: GET /api/download/:token (Secure File Delivery with Max 3 Uses)
// ----------------------------------------------------
app.get('/api/download/:token', (req, res) => {
  const { token } = req.params;

  if (!token || !tokenStore.has(token)) {
    return res.status(404).send(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Enlace no válido</title>
        <style>
          body { background: #0a0a0b; color: #e0e0e0; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .card { background: #121214; border: 1px solid #262626; padding: 2rem; border-radius: 1rem; text-align: center; max-width: 450px; }
          h2 { color: #ef4444; }
          p { color: #888; font-size: 0.9rem; }
          a { color: #d4af37; text-decoration: none; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>Enlace de Descarga No Válido</h2>
          <p>El token proporcionado no existe o ha caducado. Verifica tu enlace de compra o comunícate con el soporte.</p>
          <a href="/">← Volver al Catálogo</a>
        </div>
      </body>
      </html>
    `);
  }

  const record = tokenStore.get(token)!;

  // Check expiration
  if (new Date() > new Date(record.expiresAt)) {
    return res.status(410).send(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Enlace Expirado</title>
        <style>
          body { background: #0a0a0b; color: #e0e0e0; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .card { background: #121214; border: 1px solid #262626; padding: 2rem; border-radius: 1rem; text-align: center; max-width: 450px; }
          h2 { color: #eab308; }
          p { color: #888; font-size: 0.9rem; }
          a { color: #d4af37; text-decoration: none; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>Enlace Expirado (Límite de 2 Horas)</h2>
          <p>Por medidas de seguridad de derechos de autor y protección de stems, el enlace temporal de 2 horas ha caducado.</p>
          <p>Si necesitas regenerar tu acceso, por favor contacta a ${PRODUCER_INFO.email} con tu ID de Orden de PayPal: <strong>${record.orderId}</strong>.</p>
          <a href="/">← Volver a la Tienda</a>
        </div>
      </body>
      </html>
    `);
  }

  // Check download limits (Max 3 downloads allowed)
  if (record.downloadCount >= record.maxDownloads) {
    return res.status(403).send(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Límite de Descargas Superado</title>
        <style>
          body { background: #0a0a0b; color: #e0e0e0; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .card { background: #121214; border: 1px solid #262626; padding: 2rem; border-radius: 1rem; text-align: center; max-width: 450px; }
          h2 { color: #f97316; }
          p { color: #888; font-size: 0.9rem; }
          a { color: #d4af37; text-decoration: none; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>Límite de Descargas Alcanzado</h2>
          <p>Has alcanzado el límite máximo permitido de ${record.maxDownloads} descargas para esta compra.</p>
          <p>Si necesitas asistencia con tus archivos, contacta a ${PRODUCER_INFO.email} con tu ID de Orden: <strong>${record.orderId}</strong>.</p>
          <a href="/">← Volver al Catálogo</a>
        </div>
      </body>
      </html>
    `);
  }

  // Increment download counter
  record.downloadCount += 1;
  tokenStore.set(token, record);

  const downloadFileName = `Beat_${record.beatTitle.replace(/\s+/g, '_')}_${record.tierKey.toUpperCase()}_Master.zip`;

  // Serve file securely from private directory
  if (record.filePath && fs.existsSync(record.filePath)) {
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${downloadFileName}"`);
    res.setHeader('X-Download-Remaining', String(record.maxDownloads - record.downloadCount));

    return res.download(record.filePath, downloadFileName, (err) => {
      if (err) {
        console.error('Error downloading file:', err);
      }
    });
  }

  // Fallback direct dynamic package stream if file is not on disk
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${downloadFileName}"`);
  res.setHeader('X-Download-Remaining', String(record.maxDownloads - record.downloadCount));

  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.pipe(res);
  archive.append(record.contractText, { name: `CONTRATO_LICENCIA_${record.beatTitle.replace(/\s+/g, '_')}.txt` });
  archive.append(`Paquete de Beat Master para "${record.beatTitle}" emitido para ${record.buyerName}.`, { name: 'LEEME.txt' });
  archive.finalize();
});

// ----------------------------------------------------
// 6. API: GET /api/download/:token/status (Live Token Check)
// ----------------------------------------------------
app.get('/api/download/:token/status', (req, res) => {
  const { token } = req.params;
  const record = tokenStore.get(token);

  if (!record) {
    return res.status(404).json({ valid: false, message: 'Token no encontrado' });
  }

  res.json({
    valid: true,
    beatTitle: record.beatTitle,
    tierName: record.tierName,
    buyerName: record.buyerName,
    buyerEmail: record.buyerEmail,
    downloadCount: record.downloadCount,
    maxDownloads: record.maxDownloads,
    remainingDownloads: Math.max(0, record.maxDownloads - record.downloadCount),
    expiresAt: record.expiresAt,
    orderId: record.orderId
  });
});

// ----------------------------------------------------
// 7. API: GET /api/standalone-code (Standalone Code Package Delivery)
// ----------------------------------------------------
app.get('/api/standalone-code', (req, res) => {
  res.json({
    files: {
      'server.js': `// ==========================================
// BACK-END EXPRESS + PAYPAL v2 CHECKOUT API
// ==========================================
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const archiver = require('archiver');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos públicos del front-end
app.use(express.static(path.join(__dirname, 'public')));

// Almacén seguro privado para beats (FUERA de public)
const PRIVATE_STORAGE = path.join(__dirname, 'private_beats');
if (!fs.existsSync(PRIVATE_STORAGE)) {
  fs.mkdirSync(PRIVATE_STORAGE, { recursive: true });
}

// Base de datos en memoria para tokens de descarga
const downloadTokens = new Map();

// Catálogo de beats con precios
const BEATS = [
  { id: 'beat-1', title: 'NOCHE EN MEDELLIN', bpm: 96, key: 'F Minor', price: 24.99 },
  { id: 'beat-2', title: 'ASTRO PHANTOM', bpm: 145, key: 'C# Minor', price: 24.99 },
  { id: 'beat-3', title: 'LONDON FOG', bpm: 142, key: 'D Minor', price: 24.99 }
];

// Helper: Obtener Access Token de PayPal
async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const mode = process.env.PAYPAL_MODE || 'sandbox';

  if (!clientId || !clientSecret) return null;

  const host = mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
  const auth = Buffer.from(\`\${clientId}:\${clientSecret}\`).toString('base64');

  const response = await fetch(\`\${host}/v1/oauth2/token\`, {
    method: 'POST',
    headers: {
      'Authorization': \`Basic \${auth}\`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  const data = await response.json();
  return data.access_token;
}

// 1. Crear Orden en PayPal
app.post('/api/orders/create', async (req, res) => {
  try {
    const { beatId } = req.body;
    const beat = BEATS.find(b => b.id === beatId) || BEATS[0];
    const amount = beat.price.toFixed(2);

    const mode = process.env.PAYPAL_MODE || 'sandbox';
    const host = mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
    const token = await getPayPalAccessToken();

    if (token) {
      const response = await fetch(\`\${host}/v2/checkout/orders\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${token}\`
        },
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [{
            description: \`Licencia Beat: \${beat.title}\`,
            amount: { currency_code: 'USD', value: amount }
          }]
        })
      });
      const order = await response.json();
      return res.json({ id: order.id });
    }

    // Modo Sandbox de prueba
    res.json({ id: \`SANDBOX-\${Date.now()}\` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Capturar Orden y Generar Token Único
app.post('/api/orders/capture', async (req, res) => {
  try {
    const { orderID, beatId, buyerName, buyerEmail } = req.body;
    const beat = BEATS.find(b => b.id === beatId) || BEATS[0];

    const mode = process.env.PAYPAL_MODE || 'sandbox';
    const host = mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
    const token = await getPayPalAccessToken();

    if (token && !orderID.startsWith('SANDBOX-')) {
      const response = await fetch(\`\${host}/v2/checkout/orders/\${orderID}/capture\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${token}\`
        }
      });
      const data = await response.json();
      if (data.status !== 'COMPLETED') {
        return res.status(400).json({ error: 'Pago no completado' });
      }
    }

    // Generar Token Criptográfico Seguro
    const downloadToken = uuidv4();
    const tokenData = {
      token: downloadToken,
      orderId: orderID,
      beatTitle: beat.title,
      buyerName: buyerName || 'Artista',
      buyerEmail: buyerEmail || 'correo@ejemplo.com',
      downloadCount: 0,
      maxDownloads: 3,
      createdAt: new Date()
    };

    downloadTokens.set(downloadToken, tokenData);

    res.json({
      success: true,
      orderId: orderID,
      downloadToken,
      downloadUrl: \`/api/download/\${downloadToken}\`,
      maxDownloads: 3
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Descarga Segura con Límite de 3 Usos
app.get('/api/download/:token', (req, res) => {
  const { token } = req.params;
  const data = downloadTokens.get(token);

  if (!data) return res.status(404).send('Token de descarga inválido o no encontrado.');
  if (data.downloadCount >= data.maxDownloads) {
    return res.status(403).send('Has alcanzado el límite máximo de 3 descargas.');
  }

  data.downloadCount += 1;
  downloadTokens.set(token, data);

  const fileName = \`Beat_\${data.beatTitle.replace(/\\s+/g, '_')}_Master.zip\`;
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', \`attachment; filename="\${fileName}"\`);

  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.pipe(res);
  archive.append(\`CONTRATO DE LICENCIA OFICIAL\\nBeat: \${data.beatTitle}\\nComprador: \${data.buyerName}\\nOrden: \${data.orderId}\`, { name: 'CONTRATO_LICENCIA.txt' });
  archive.append('Master Audio WAV 24Bit 48kHz', { name: \`\${data.beatTitle}.wav\` });
  archive.finalize();
});

app.listen(PORT, () => {
  console.log(\`Servidor ejecutándose en http://localhost:\${PORT}\`);
});`,
      'package.json': `{
  "name": "beat-store-paypal",
  "version": "1.0.0",
  "description": "Tienda de Beats con Checkout v2 de PayPal y descargas seguras",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.21.2",
    "cors": "^2.8.5",
    "dotenv": "^16.4.7",
    "uuid": "^11.0.5",
    "archiver": "^7.0.1"
  },
  "devDependencies": {
    "nodemon": "^3.1.9"
  }
}`,
      '.env.example': `# Credenciales de PayPal Developer (https://developer.paypal.com)
PAYPAL_CLIENT_ID=tu_client_id_aqui
PAYPAL_CLIENT_SECRET=tu_client_secret_aqui
PAYPAL_MODE=sandbox # Cambiar a 'live' para producción

# Puerto del servidor
PORT=3000`,
      'public/index.html': `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Literland Music | Catálogo & Licencias de Beats</title>
  <link rel="stylesheet" href="style.css">
  <!-- SDK Oficial de PayPal JS -->
  <script src="https://www.paypal.com/sdk/js?client-id=YOUR_CLIENT_ID&currency=USD"></script>
</head>
<body class="dark-mode">
  <header>
    <div class="logo">🎵 LITERLAND MUSIC</div>
    <div class="tagline">Catálogo Oficial de Beats & Licencias</div>
  </header>

  <main>
    <h2>Instrumentales Disponibles</h2>
    <div class="beats-grid" id="beatsContainer">
      <!-- Los beats se renderizan dinámicamente con app.js -->
    </div>

    <!-- Modal de Compra y PayPal -->
    <div id="checkoutModal" class="modal hidden">
      <div class="modal-content">
        <span class="close-btn" onclick="closeModal()">&times;</span>
        <h3 id="modalBeatTitle">Comprar Licencia</h3>
        <p id="modalBeatInfo" class="beat-meta"></p>
        
        <div class="form-group">
          <label>Nombre Legal del Artista:</label>
          <input type="text" id="buyerName" placeholder="Tu Nombre / Nombre Artístico" required>
        </div>

        <div class="form-group">
          <label>Correo Electrónico (para el envío):</label>
          <input type="email" id="buyerEmail" placeholder="correo@ejemplo.com" required>
        </div>

        <div id="paypalButtonContainer" class="paypal-btn-area"></div>
        <div id="successArea" class="success-box hidden"></div>
      </div>
    </div>
  </main>

  <script src="app.js"></script>
</body>
</html>`,
      'public/style.css': `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body.dark-mode {
  background-color: #0a0a0b;
  color: #e0e0e0;
  font-family: 'Segoe UI', Roboto, sans-serif;
  padding: 2rem;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #262626;
  padding-bottom: 1.5rem;
  margin-bottom: 2rem;
}

.logo {
  font-size: 1.4rem;
  font-weight: 800;
  color: #d4af37;
}

.tagline {
  color: #888;
  font-size: 0.9rem;
}

.beats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.beat-card {
  background: #121214;
  border: 1px solid #262626;
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: transform 0.2s, border-color 0.2s;
}

.beat-card:hover {
  border-color: #d4af37;
  transform: translateY(-2px);
}

.beat-title {
  font-size: 1.2rem;
  font-weight: bold;
  color: #fff;
  margin-bottom: 0.5rem;
}

.beat-meta {
  color: #888;
  font-size: 0.85rem;
  margin-bottom: 1rem;
}

.beat-price {
  font-size: 1.4rem;
  font-weight: bold;
  color: #d4af37;
  margin-bottom: 1rem;
}

.buy-btn {
  background: #d4af37;
  color: #000;
  border: none;
  padding: 0.8rem;
  border-radius: 10px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.buy-btn:hover {
  background: #e5c158;
}

/* Modal */
.modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal.hidden {
  display: none;
}

.modal-content {
  background: #121214;
  border: 1px solid #262626;
  border-radius: 20px;
  padding: 2rem;
  width: 90%;
  max-width: 500px;
  position: relative;
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1.5rem;
  font-size: 1.5rem;
  cursor: pointer;
  color: #888;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-size: 0.8rem;
  color: #888;
  margin-bottom: 0.3rem;
}

.form-group input {
  width: 100%;
  padding: 0.7rem;
  background: #0a0a0b;
  border: 1px solid #262626;
  border-radius: 8px;
  color: #fff;
}

.success-box {
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid #10b981;
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  margin-top: 1rem;
}

.download-link-btn {
  display: inline-block;
  background: #10b981;
  color: #fff;
  text-decoration: none;
  font-weight: bold;
  padding: 0.8rem 1.5rem;
  border-radius: 10px;
  margin-top: 1rem;
}`,
      'public/app.js': `// Front-end JavaScript Vanilla
let currentBeat = null;

const BEATS = [
  { id: 'beat-1', title: 'NOCHE EN MEDELLIN', bpm: 96, key: 'F Minor', price: 24.99 },
  { id: 'beat-2', title: 'ASTRO PHANTOM', bpm: 145, key: 'C# Minor', price: 24.99 },
  { id: 'beat-3', title: 'LONDON FOG', bpm: 142, key: 'D Minor', price: 24.99 }
];

function renderBeats() {
  const container = document.getElementById('beatsContainer');
  container.innerHTML = BEATS.map(beat => \`
    <div class="beat-card">
      <div>
        <div class="beat-title">\${beat.title}</div>
        <div class="beat-meta">\${beat.bpm} BPM • \${beat.key}</div>
      </div>
      <div>
        <div class="beat-price">$\${beat.price.toFixed(2)} USD</div>
        <button class="buy-btn" onclick="openCheckout('\${beat.id}')">
          <span>🅿️ Comprar con PayPal</span>
        </button>
      </div>
    </div>
  \`).join('');
}

function openCheckout(beatId) {
  currentBeat = BEATS.find(b => b.id === beatId);
  document.getElementById('modalBeatTitle').innerText = \`Comprar "\${currentBeat.title}"\`;
  document.getElementById('modalBeatInfo').innerText = \`$\${currentBeat.price.toFixed(2)} USD • \${currentBeat.bpm} BPM • \${currentBeat.key}\`;
  document.getElementById('checkoutModal').classList.remove('hidden');
  document.getElementById('successArea').classList.add('hidden');
  document.getElementById('paypalButtonContainer').innerHTML = '';

  // Renderizar Botones Inteligentes de PayPal
  if (window.paypal) {
    paypal.Buttons({
      createOrder: async function () {
        const buyerName = document.getElementById('buyerName').value;
        const buyerEmail = document.getElementById('buyerEmail').value;

        if (!buyerName || !buyerEmail) {
          alert('Por favor ingresa tu Nombre y Correo.');
          throw new Error('Campos requeridos');
        }

        const res = await fetch('/api/orders/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ beatId: currentBeat.id })
        });
        const data = await res.json();
        return data.id;
      },
      onApprove: async function (data) {
        const buyerName = document.getElementById('buyerName').value;
        const buyerEmail = document.getElementById('buyerEmail').value;

        const res = await fetch('/api/orders/capture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderID: data.orderID,
            beatId: currentBeat.id,
            buyerName,
            buyerEmail
          })
        });

        const captureData = await res.json();
        if (captureData.success) {
          showSuccess(captureData);
        }
      }
    }).render('#paypalButtonContainer');
  }
}

function showSuccess(data) {
  document.getElementById('paypalButtonContainer').innerHTML = '';
  const success = document.getElementById('successArea');
  success.classList.remove('hidden');
  success.innerHTML = \`
    <h4 style="color: #10b981;">¡Pago Exitoso!</h4>
    <p style="font-size: 0.85rem; margin: 0.5rem 0;">Tu orden \${data.orderId} fue procesada.</p>
    <a href="\${data.downloadUrl}" class="download-link-btn">⬇️ Descargar Beat Master (ZIP)</a>
    <p style="font-size: 0.75rem; color: #888; margin-top: 0.5rem;">Límite: \${data.maxDownloads} descargas permitidas.</p>
  \`;
}

function closeModal() {
  document.getElementById('checkoutModal').classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', renderBeats);`
    }
  });
});

// Vite Middleware for Development / Static serving for Production
async function setupVite() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Express PayPal API Server running on port ${PORT}`);
  });
}

setupVite().catch((err) => {
  console.error('Failed to start server:', err);
});
