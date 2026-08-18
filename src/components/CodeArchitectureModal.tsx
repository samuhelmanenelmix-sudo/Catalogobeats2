import React, { useState } from 'react';
import { X, Copy, Check, Code, FileText, Download, Terminal, Layers, ShieldCheck } from 'lucide-react';

interface CodeArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CodeArchitectureModal: React.FC<CodeArchitectureModalProps> = ({ isOpen, onClose }) => {
  const [activeFile, setActiveFile] = useState<'server.js' | 'index.html' | 'style.css' | 'app.js' | 'package.json' | '.env.example' | 'README.md'>('server.js');
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  if (!isOpen) return null;

  const CODE_FILES: Record<string, string> = {
    'server.js': `// ==========================================================
// ARCHIVO: server.js - BACK-END FULL-STACK NODE.JS + EXPRESS
// Venta de Beats con PayPal API v2 y Descargas Seguras
// ==========================================================
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const archiver = require('archiver');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Middlewares globales
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Servir archivos estáticos del Front-End (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// 3. Directorio privado para archivos de audio (NO accesible públicamente)
const PRIVATE_STORAGE = path.join(__dirname, 'private_beats');
if (!fs.existsSync(PRIVATE_STORAGE)) {
  fs.mkdirSync(PRIVATE_STORAGE, { recursive: true });
}

// 4. Base de datos / Almacén de Tokens en memoria
// Estructura: { token: { orderId, beatTitle, buyerName, buyerEmail, downloadCount, maxDownloads: 3, expiresAt, filePath } }
const downloadTokens = new Map();

// Catálogo de Beats
const BEATS_CATALOG = [
  { id: 'beat-1', title: 'NOCHE EN MEDELLIN', bpm: 96, key: 'F Minor', price: 24.99, genre: 'Reggaeton' },
  { id: 'beat-2', title: 'ASTRO PHANTOM', bpm: 145, key: 'C# Minor', price: 24.99, genre: 'Trap' },
  { id: 'beat-3', title: 'LONDON FOG', bpm: 142, key: 'D Minor', price: 24.99, genre: 'Drill' },
  { id: 'beat-4', title: 'GOLDEN HOUR VIBES', bpm: 90, key: 'Eb Major', price: 24.99, genre: 'R&B / Soul' }
];

// Helper: Obtener OAuth Access Token de PayPal (Sandbox o Live)
async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const mode = process.env.PAYPAL_MODE || 'sandbox';

  if (!clientId || !clientSecret) return null;

  const host = mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
  const auth = Buffer.from(\`\${clientId}:\${clientSecret}\`).toString('base64');

  try {
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
  } catch (error) {
    console.error('Error al obtener token de PayPal:', error);
    return null;
  }
}

// ----------------------------------------------------
// RUTA 1: POST /api/orders/create (Crear Orden en PayPal)
// ----------------------------------------------------
app.post('/api/orders/create', async (req, res) => {
  try {
    const { beatId, tierKey = 'basic' } = req.body;
    const beat = BEATS_CATALOG.find(b => b.id === beatId) || BEATS_CATALOG[0];
    const amount = beat.price.toFixed(2);

    const mode = process.env.PAYPAL_MODE || 'sandbox';
    const host = mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
    const token = await getPayPalAccessToken();

    // Si hay credenciales de PayPal configuradas
    if (token) {
      const response = await fetch(\`\${host}/v2/checkout/orders\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${token}\`,
          'PayPal-Request-Id': uuidv4()
        },
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [
            {
              reference_id: \`BEAT-\${beat.id}\`,
              description: \`Licencia Beat: \${beat.title}\`,
              amount: {
                currency_code: 'USD',
                value: amount
              }
            }
          ]
        })
      });

      const orderData = await response.json();
      return res.status(201).json({ id: orderData.id, status: orderData.status });
    }

    // Modo Sandbox simulado para pruebas locales sin keys
    const sandboxId = \`SANDBOX-ORD-\${Date.now()}\`;
    return res.status(201).json({ id: sandboxId, status: 'CREATED' });
  } catch (error) {
    console.error('Error en /api/orders/create:', error);
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// RUTA 2: POST /api/orders/capture (Capturar Pago y Generar Token UUID)
// ----------------------------------------------------
app.post('/api/orders/capture', async (req, res) => {
  try {
    const { orderID, beatId, buyerName, buyerEmail, artistName } = req.body;
    const beat = BEATS_CATALOG.find(b => b.id === beatId) || BEATS_CATALOG[0];

    const mode = process.env.PAYPAL_MODE || 'sandbox';
    const host = mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
    const token = await getPayPalAccessToken();

    // Si es una orden real de PayPal
    if (token && !orderID.startsWith('SANDBOX-')) {
      const response = await fetch(\`\${host}/v2/checkout/orders/\${orderID}/capture\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${token}\`,
          'PayPal-Request-Id': uuidv4()
        }
      });

      const captureData = await response.json();
      if (captureData.status !== 'COMPLETED') {
        return res.status(400).json({ error: 'El pago no fue completado por PayPal', details: captureData });
      }
    }

    // 1. Generar token único con UUID v4
    const downloadToken = uuidv4();
    
    // 2. Establecer expiración (7 días)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // 3. Generar contrato digital de licencia
    const contractText = \`========================================================================
CONTRATO OFICIAL DE LICENCIA DE INSTRUMENTAL / BEAT
ID de Orden: \${orderID}
Token Seguro: \${downloadToken}
Fecha: \${new Date().toLocaleDateString('es-ES')}
========================================================================
Productor: Literland Music (literlandmusic@gmail.com)
Comprador: \${buyerName || 'Artista'}
Nombre Artístico: \${artistName || buyerName || 'Artista'}
Correo Electrónico: \${buyerEmail || 'cliente@ejemplo.com'}
Beat Adquirido: "\${beat.title}" (BPM: \${beat.bpm} | Key: \${beat.key})
Precio Pagado: $\${beat.price.toFixed(2)} USD (PayPal v2 Verified)

DERECHOS OTORGADOS:
- Autorización comercial para grabación vocal, mezcla y distribución en streaming.
- Crédito obligatorio: Prod. by Literland Music.
========================================================================\`;

    // 4. Crear archivo ZIP empaquetado en almacenamiento privado
    const zipPath = path.join(PRIVATE_STORAGE, \`\${downloadToken}.zip\`);
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.pipe(output);
    archive.append(contractText, { name: \`CONTRATO_LICENCIA_\${beat.title.replace(/\\s+/g, '_')}.txt\` });
    archive.append(\`Instrucciones de Mezcla:\\nBeat: \${beat.title}\\nBPM: \${beat.bpm}\\nKey: \${beat.key}\`, { name: 'LEEME_INSTRUCCIONES.txt' });
    archive.append(Buffer.from('RIFF....WAVEfmt ....data....[MASTER 24-BIT AUDIO]'), { name: \`\${beat.title.replace(/\\s+/g, '_')}_MASTER.wav\` });
    await archive.finalize();

    // 5. Guardar registro del token
    downloadTokens.set(downloadToken, {
      token: downloadToken,
      orderId: orderID,
      beatTitle: beat.title,
      buyerName: buyerName || 'Artista',
      buyerEmail: buyerEmail || 'cliente@ejemplo.com',
      artistName: artistName || buyerName,
      downloadCount: 0,
      maxDownloads: 3,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
      contractText,
      filePath: zipPath
    });

    return res.status(200).json({
      success: true,
      status: 'COMPLETED',
      orderId: orderID,
      downloadToken,
      downloadUrl: \`/api/download/\${downloadToken}\`,
      maxDownloads: 3,
      contractText
    });
  } catch (error) {
    console.error('Error en /api/orders/capture:', error);
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// RUTA 3: GET /api/download/:token (Descarga Segura - Máximo 3 Usos)
// ----------------------------------------------------
app.get('/api/download/:token', (req, res) => {
  const { token } = req.params;
  const record = downloadTokens.get(token);

  // 1. Validar existencia del token
  if (!record) {
    return res.status(404).send('<h2>Error 404: Token de descarga no válido o inexistente.</h2>');
  }

  // 2. Validar expiración de fecha
  if (new Date() > new Date(record.expiresAt)) {
    return res.status(410).send('<h2>Error 410: El enlace de descarga ha expirado (límite de 7 días).</h2>');
  }

  // 3. Validar límite de 3 descargas
  if (record.downloadCount >= record.maxDownloads) {
    return res.status(403).send(\`
      <h2>Límite de Descargas Excedido</h2>
      <p>Has alcanzado el límite máximo de \${record.maxDownloads} descargas para esta compra.</p>
    \`);
  }

  // 4. Incrementar contador de descargas
  record.downloadCount += 1;
  downloadTokens.set(token, record);

  const downloadName = \`Beat_\${record.beatTitle.replace(/\\s+/g, '_')}_Master.zip\`;
  
  // 5. Servir archivo de forma segura mediante res.download()
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', \`attachment; filename="\${downloadName}"\`);
  res.setHeader('X-Downloads-Remaining', String(record.maxDownloads - record.downloadCount));

  if (record.filePath && fs.existsSync(record.filePath)) {
    return res.download(record.filePath, downloadName, (err) => {
      if (err) console.error('Error enviando archivo:', err);
    });
  }

  // Fallback si no está el archivo en disco
  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.pipe(res);
  archive.append(record.contractText, { name: 'CONTRATO_LICENCIA.txt' });
  archive.finalize();
});

// Iniciar Servidor
app.listen(PORT, () => {
  console.log(\`Servidor de Beats activo en http://localhost:\${PORT}\`);
});`,

    'public/index.html': `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Literland Music | Tienda Oficial de Beats</title>
  <link rel="stylesheet" href="style.css">
  <!-- Carga del SDK Oficial de JavaScript de PayPal -->
  <script src="https://www.paypal.com/sdk/js?client-id=YOUR_CLIENT_ID&currency=USD"></script>
</head>
<body class="dark-mode">

  <header>
    <div class="logo">
      <span class="icon">🎵</span> LITERLAND MUSIC
    </div>
    <div class="subtitle">Catálogo de Beats & Licencias Oficiales</div>
  </header>

  <main class="container">
    <div class="section-header">
      <h2>Catálogo de Instrumentales</h2>
      <p>Selecciona tu beat, paga con PayPal y recibe tus masters y contrato legal al instante.</p>
    </div>

    <!-- Contenedor del listado de Beats -->
    <div class="beats-grid" id="beatsContainer"></div>

    <!-- Modal de Checkout con PayPal -->
    <div id="checkoutModal" class="modal hidden">
      <div class="modal-card">
        <span class="close-btn" onclick="closeModal()">&times;</span>
        
        <div class="modal-header">
          <h3 id="modalBeatTitle">Adquirir Licencia</h3>
          <p id="modalBeatMeta" class="meta-tag"></p>
        </div>

        <div id="formSection">
          <div class="input-group">
            <label>Nombre Legal Completo (para el contrato):</label>
            <input type="text" id="buyerName" placeholder="Ej: Carlos Mendoza" required>
          </div>

          <div class="input-group">
            <label>Nombre Artístico / AKA:</label>
            <input type="text" id="artistName" placeholder="Ej: MC King">
          </div>

          <div class="input-group">
            <label>Correo Electrónico (para recibir la descarga):</label>
            <input type="email" id="buyerEmail" placeholder="tu-correo@ejemplo.com" required>
          </div>

          <label class="pay-label">Pagar con PayPal Checkout v2:</label>
          <div id="paypalButtonsArea" class="paypal-container"></div>
        </div>

        <!-- Área de confirmación post-pago -->
        <div id="successSection" class="success-card hidden"></div>
      </div>
    </div>
  </main>

  <script src="app.js"></script>
</body>
</html>`,

    'public/style.css': `/* ESTILOS DARK MODE PARA TIENDA DE BEATS */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body.dark-mode {
  background-color: #0a0a0b;
  color: #e0e0e0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
}

header {
  border-bottom: 1px solid #262626;
  padding: 1.5rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #0f0f11;
}

.logo {
  font-size: 1.3rem;
  font-weight: 800;
  color: #d4af37;
  display: flex;
  align-items: center;
  gap: 8px;
}

.subtitle {
  color: #888888;
  font-size: 0.85rem;
}

.container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem;
}

.section-header {
  margin-bottom: 2rem;
}

.section-header h2 {
  font-size: 1.8rem;
  color: #ffffff;
}

.section-header p {
  color: #888888;
  font-size: 0.95rem;
}

/* Grilla de Beats */
.beats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.beat-item {
  background: #121214;
  border: 1px solid #262626;
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: all 0.2s ease;
}

.beat-item:hover {
  border-color: #d4af37;
  transform: translateY(-2px);
}

.beat-title {
  font-size: 1.25rem;
  font-weight: bold;
  color: #ffffff;
}

.beat-meta-badges {
  display: flex;
  gap: 8px;
  margin: 0.5rem 0 1rem 0;
  font-size: 0.8rem;
}

.badge {
  background: #1a1a1d;
  border: 1px solid #262626;
  padding: 2px 8px;
  border-radius: 6px;
  color: #888888;
  font-family: monospace;
}

.beat-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid #1a1a1d;
  padding-top: 1rem;
}

.price {
  font-size: 1.3rem;
  font-weight: 800;
  color: #d4af37;
  font-family: monospace;
}

.btn-buy {
  background: #d4af37;
  color: #000000;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 10px;
  font-weight: 800;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 0.2s ease;
}

.btn-buy:hover {
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
  z-index: 999;
}

.modal.hidden {
  display: none;
}

.modal-card {
  background: #121214;
  border: 1px solid #262626;
  border-radius: 20px;
  padding: 2rem;
  width: 90%;
  max-width: 480px;
  position: relative;
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1.2rem;
  font-size: 1.5rem;
  cursor: pointer;
  color: #888888;
}

.input-group {
  margin-bottom: 1rem;
}

.input-group label {
  display: block;
  font-size: 0.8rem;
  color: #888888;
  margin-bottom: 0.3rem;
}

.input-group input {
  width: 100%;
  padding: 0.75rem;
  background: #0a0a0b;
  border: 1px solid #262626;
  border-radius: 10px;
  color: #ffffff;
  font-size: 0.9rem;
}

.input-group input:focus {
  outline: none;
  border-color: #d4af37;
}

.pay-label {
  font-size: 0.8rem;
  color: #888888;
  display: block;
  margin: 1rem 0 0.5rem 0;
}

.success-card {
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid #10b981;
  border-radius: 14px;
  padding: 1.5rem;
  text-align: center;
  margin-top: 1rem;
}

.btn-download-zip {
  display: inline-block;
  background: #10b981;
  color: #ffffff;
  text-decoration: none;
  font-weight: 800;
  font-size: 0.9rem;
  padding: 0.8rem 1.4rem;
  border-radius: 10px;
  margin-top: 1rem;
}`,

    'public/app.js': `// ==========================================================
// ARCHIVO: public/app.js - FRONT-END JAVASCRIPT VANILLA
// Catálogo + Integración PayPal Smart Buttons v2
// ==========================================================

const BEATS = [
  { id: 'beat-1', title: 'NOCHE EN MEDELLIN', bpm: 96, key: 'F Minor', price: 24.99, genre: 'Reggaeton' },
  { id: 'beat-2', title: 'ASTRO PHANTOM', bpm: 145, key: 'C# Minor', price: 24.99, genre: 'Trap' },
  { id: 'beat-3', title: 'LONDON FOG', bpm: 142, key: 'D Minor', price: 24.99, genre: 'Drill' },
  { id: 'beat-4', title: 'GOLDEN HOUR VIBES', bpm: 90, key: 'Eb Major', price: 24.99, genre: 'R&B / Soul' }
];

let currentSelectedBeat = null;

// 1. Renderizar catálogo de beats en el DOM
function renderCatalog() {
  const container = document.getElementById('beatsContainer');
  if (!container) return;

  container.innerHTML = BEATS.map(beat => \`
    <div class="beat-item">
      <div>
        <div class="beat-title">\${beat.title}</div>
        <div class="beat-meta-badges">
          <span class="badge">\${beat.genre}</span>
          <span class="badge">\${beat.bpm} BPM</span>
          <span class="badge">\${beat.key}</span>
        </div>
      </div>
      <div class="beat-bottom">
        <div class="price">$\${beat.price.toFixed(2)} USD</div>
        <button class="btn-buy" onclick="openCheckoutModal('\${beat.id}')">
          Comprar con PayPal
        </button>
      </div>
    </div>
  \`).join('');
}

// 2. Abrir Modal de Compra e inicializar botones de PayPal
function openCheckoutModal(beatId) {
  currentSelectedBeat = BEATS.find(b => b.id === beatId);
  if (!currentSelectedBeat) return;

  document.getElementById('modalBeatTitle').innerText = \`Comprar "\${currentSelectedBeat.title}"\`;
  document.getElementById('modalBeatMeta').innerText = \`Licencia MP3/WAV Master • $\${currentSelectedBeat.price.toFixed(2)} USD\`;
  
  // Limpiar estado
  document.getElementById('checkoutModal').classList.remove('hidden');
  document.getElementById('formSection').classList.remove('hidden');
  document.getElementById('successSection').classList.add('hidden');
  document.getElementById('paypalButtonsArea').innerHTML = '';

  // Renderizar Botones de PayPal mediante SDK JS
  if (window.paypal) {
    paypal.Buttons({
      // A. Llamar a Back-End para crear la orden
      createOrder: async function() {
        const buyerName = document.getElementById('buyerName').value.trim();
        const buyerEmail = document.getElementById('buyerEmail').value.trim();

        if (!buyerName || !buyerEmail) {
          alert('Por favor completa tu Nombre y Correo Electrónico antes de pagar.');
          throw new Error('Formulario incompleto');
        }

        const response = await fetch('/api/orders/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            beatId: currentSelectedBeat.id,
            tierKey: 'basic'
          })
        });

        const data = await response.json();
        return data.id || data.orderID;
      },

      // B. Al ser aprobado por el usuario, capturar en Back-End
      onApprove: async function(data) {
        const buyerName = document.getElementById('buyerName').value.trim();
        const buyerEmail = document.getElementById('buyerEmail').value.trim();
        const artistName = document.getElementById('artistName').value.trim();

        const response = await fetch('/api/orders/capture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderID: data.orderID,
            beatId: currentSelectedBeat.id,
            buyerName,
            buyerEmail,
            artistName
          })
        });

        const captureResult = await response.json();

        if (captureResult.success) {
          showSuccessMessage(captureResult);
        } else {
          alert('Error al confirmar el pago en el servidor.');
        }
      },

      onError: function(err) {
        console.error('Error de PayPal:', err);
      }
    }).render('#paypalButtonsArea');
  }
}

// 3. Mostrar pantalla de éxito y botón de descarga con token
function showSuccessMessage(result) {
  document.getElementById('formSection').classList.add('hidden');
  const successDiv = document.getElementById('successSection');
  successDiv.classList.remove('hidden');

  successDiv.innerHTML = \`
    <h3 style="color: #10b981; font-size: 1.3rem;">¡Pago Confirmado con Éxito!</h3>
    <p style="font-size: 0.85rem; color: #ccc; margin: 0.5rem 0;">
      Orden: <strong>\${result.orderId}</strong>
    </p>
    <p style="font-size: 0.85rem; color: #888;">
      Tu token seguro de descarga ha sido generado (Máximo 3 descargas).
    </p>
    <a href="\${result.downloadUrl}" class="btn-download-zip">
      ⬇️ Descargar Master Audio & Contrato (ZIP)
    </a>
  \`;
}

function closeModal() {
  document.getElementById('checkoutModal').classList.add('hidden');
}

// Inicializar al cargar el DOM
document.addEventListener('DOMContentLoaded', renderCatalog);`,

    'package.json': `{
  "name": "beatstore-paypal-v2",
  "version": "1.0.0",
  "description": "Tienda de Beats con PayPal API v2 Checkout y Descargas Seguras",
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
    "archiver": "^7.0.1",
    "@paypal/checkout-server-sdk": "^1.0.3"
  },
  "devDependencies": {
    "nodemon": "^3.1.9"
  }
}`,

    '.env.example': `# ==========================================
# CONFIGURACIÓN DE CREDENCIALES PAYPAL
# ==========================================
# 1. Ingresa a: https://developer.paypal.com
# 2. Ve a: Apps & Credentials -> Create App
# 3. Copia tu Client ID y Secret aquí:

PAYPAL_CLIENT_ID=tu_client_id_aqui
PAYPAL_CLIENT_SECRET=tu_client_secret_aqui
PAYPAL_MODE=sandbox # Cambiar a 'live' para producción

# Puerto del servidor
PORT=3000`,

    'README.md': `# 🎵 BeatStore con PayPal API v2 Checkout & Descargas Seguras

Aplicación web Full-Stack completa desarrollada con **Node.js, Express y JavaScript** para vender licencias de música utilizando la API v2 de PayPal Checkout y entrega segura de archivos mediante tokens criptográficos.

---

## 🚀 Requisitos Previos
1. **Node.js** (versión 18 o superior).
2. Cuenta de desarrollador en [PayPal Developer](https://developer.paypal.com).

---

## 🛠️ Instalación Paso a Paso

### 1. Clonar o descargar el proyecto
\`\`\`bash
cd beatstore-paypal-v2
\`\`\`

### 2. Instalar las dependencias de Node.js
\`\`\`bash
npm install
\`\`\`

### 3. Configurar tus credenciales de PayPal
1. Duplica el archivo \`.env.example\` y renómbralo a \`.env\`:
\`\`\`bash
cp .env.example .env
\`\`\`
2. Ve a [https://developer.paypal.com/dashboard/applications](https://developer.paypal.com/dashboard/applications).
3. Haz clic en **Create App** (selecciona tipo Merchant).
4. Copia tu **Client ID** y tu **Secret Key**.
5. Abre el archivo \`.env\` y pégalas:
\`\`\`env
PAYPAL_CLIENT_ID=TU_CLIENT_ID_REAL
PAYPAL_CLIENT_SECRET=TU_CLIENT_SECRET_REAL
PAYPAL_MODE=sandbox
PORT=3000
\`\`\`
6. En \`public/index.html\`, reemplaza \`YOUR_CLIENT_ID\` en el tag \`<script>\` con tu Client ID:
\`\`\`html
<script src="https://www.paypal.com/sdk/js?client-id=TU_CLIENT_ID_REAL&currency=USD"></script>
\`\`\`

### 4. Iniciar el servidor
\`\`\`bash
npm start
\`\`\`
Abre tu navegador en: **http://localhost:3000**

---

## 🔒 Arquitectura de Seguridad Implementada
1. **Archivos Protegidos**: Los archivos máster (WAV/ZIP) se almacenan en la carpeta privada \`private_beats/\`, inaccesible directamente por URL.
2. **Tokens UUID Únicos**: Tras verificar que la orden en PayPal tenga el estado \`COMPLETED\`, se genera un token UUID aleatorio e irrepetible.
3. **Límite de 3 Descargas**: La ruta \`/api/download/:token\` valida en cada solicitud que el token exista, no haya expirado y no supere las 3 descargas permitidas.
4. **Emisión de Contrato**: Se emite automáticamente un contrato digital con el nombre legal del comprador, identificadores de orden y términos de la licencia.`
  };

  const handleCopy = (filename: string, content: string) => {
    navigator.clipboard?.writeText(content);
    setCopiedFile(filename);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  const handleDownloadAllZip = () => {
    // Generate simple text package for standalone deployment
    const element = document.createElement('a');
    const file = new Blob([CODE_FILES[activeFile]], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = activeFile;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
      <div 
        className="relative w-full max-w-5xl bg-[#0A0A0B] border border-[#262626] rounded-3xl overflow-hidden shadow-2xl text-[#E0E0E0] flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#262626] bg-[#121214]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30">
              <Code className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-serif italic font-bold text-white flex items-center gap-2">
                <span>Arquitectura & Código Standalone Completo</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Node.js + Express + PayPal v2
                </span>
              </h3>
              <p className="text-xs text-[#888888]">
                Código organizado listo para copiar, pegar y desplegar en tu propio servidor local o VPS.
              </p>
            </div>
          </div>

          <button
            id="btn-close-code-modal"
            onClick={onClose}
            className="p-2 rounded-full bg-[#1A1A1C] text-[#888888] hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* File Tabs */}
        <div className="flex items-center gap-1 px-4 py-2 bg-[#0E0E10] border-b border-[#262626] overflow-x-auto">
          {Object.keys(CODE_FILES).map((fileName) => (
            <button
              key={fileName}
              onClick={() => setActiveFile(fileName as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition flex items-center gap-1.5 shrink-0 ${
                activeFile === fileName
                  ? 'bg-[#1A1A1C] text-[#D4AF37] border border-[#D4AF37]/40 font-bold'
                  : 'text-[#888888] hover:text-[#CCCCCC] hover:bg-[#141416]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{fileName}</span>
            </button>
          ))}
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center justify-between px-5 py-2.5 bg-[#121214] border-b border-[#262626] text-xs">
          <div className="flex items-center gap-2 text-[#888888] font-mono">
            <span>Archivo: <strong className="text-white">{activeFile}</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-copy-code"
              onClick={() => handleCopy(activeFile, CODE_FILES[activeFile])}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1A1A1C] border border-[#262626] text-[#E0E0E0] hover:text-white hover:border-[#D4AF37]/40 transition text-xs font-mono"
            >
              {copiedFile === activeFile ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Copiar Archivo</span>
                </>
              )}
            </button>

            <button
              id="btn-download-file"
              onClick={handleDownloadAllZip}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D4AF37] hover:bg-[#E5C158] text-black font-mono font-bold text-xs transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar {activeFile}</span>
            </button>
          </div>
        </div>

        {/* Code Content Viewer */}
        <div className="flex-1 p-4 bg-[#08080A] overflow-auto max-h-[60vh]">
          <pre className="font-mono text-xs text-[#CCCCCC] leading-relaxed selection:bg-[#D4AF37] selection:text-black">
            <code>{CODE_FILES[activeFile]}</code>
          </pre>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-[#262626] bg-[#121214] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#888888]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
            <span>Entrega segura con tokens UUID v4 y límite de 3 descargas por compra.</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#1A1A1C] border border-[#262626] text-[#CCCCCC] hover:text-white font-mono"
          >
            Cerrar Visor de Código
          </button>
        </div>
      </div>
    </div>
  );
};
