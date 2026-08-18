import { LicenseTierKey } from '../types';

export interface ContractGenerationParams {
  buyerName: string;
  buyerEmail: string;
  artistStageName?: string;
  beatTitle: string;
  purchaseDate: string;
  tierKey: LicenseTierKey;
  tierName: string;
  amountPaid: number;
  transactionId: string;
  isOfferBased?: boolean;
  offeredAmount?: number;
}

export const PRODUCER_DATA = {
  name: 'Samu helman en el mix / Samuel Helman',
  email: 'samuhelmanenelmix@gmail.com',
  brandName: 'Samu helman en el mix',
  systemName: 'sistema de licencias de Samu helman en el mix',
};

/**
 * Generates the official HTML contract based directly on the provided PDF document.
 * Features:
 * - Exact legal header & telemetry matrix table
 * - Dynamic buyer replacement while strictly preserving seller data
 * - Clauses 2.1 to 2.5
 * - Digital signatures & verification
 */
export function generateContractHtml(params: ContractGenerationParams): string {
  const {
    buyerName,
    buyerEmail,
    artistStageName,
    beatTitle,
    purchaseDate,
    tierKey,
    tierName,
    amountPaid,
    transactionId,
    isOfferBased = false,
    offeredAmount
  } = params;

  const clientName = artistStageName && artistStageName.trim() && artistStageName !== buyerName
    ? `${buyerName} (${artistStageName})`
    : buyerName;

  const offerDisplay = tierKey === 'premium' || isOfferBased
    ? `$${(offeredAmount || amountPaid || 0).toFixed(2)} USD (Oferta del Cliente)`
    : '$250.00 USD (Base Sugerida)';

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Contrato de Licencia - ${beatTitle} - ${PRODUCER_DATA.brandName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #111827;
      background: #FFFFFF;
      padding: 32px 40px;
      font-size: 11px;
      line-height: 1.45;
    }
    .header-bar {
      background: #0B1726;
      color: #FFFFFF;
      padding: 16px 20px;
      border-radius: 4px;
      margin-bottom: 20px;
    }
    .header-title {
      font-size: 16px;
      font-weight: 800;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .header-subtitle {
      font-size: 9px;
      font-weight: 600;
      color: #94A3B8;
      letter-spacing: 1px;
      margin-top: 4px;
      text-transform: uppercase;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px 24px;
      margin-bottom: 22px;
      padding: 0 4px;
    }
    .info-block {
      font-size: 11px;
    }
    .info-label {
      font-size: 9.5px;
      font-weight: 800;
      color: #64748B;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }
    .info-value-strong {
      font-size: 12px;
      font-weight: 700;
      color: #0F172A;
    }
    .info-value-client {
      font-size: 12px;
      font-weight: 700;
      color: #2563EB;
    }
    .info-value {
      color: #334155;
    }
    .section-title {
      font-size: 12px;
      font-weight: 800;
      color: #0F172A;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .matrix-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 6px;
      font-size: 10px;
    }
    .matrix-table th {
      background: #0B1726;
      color: #FFFFFF;
      font-weight: 700;
      text-align: left;
      padding: 8px 10px;
      font-size: 9.5px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .matrix-table td {
      padding: 7px 10px;
      border-bottom: 1px solid #E2E8F0;
      color: #334155;
    }
    .matrix-table tr.active-tier {
      background: #EFF6FF;
      font-weight: 700;
    }
    .matrix-table tr.active-tier td {
      color: #1E3A8A;
      border-bottom: 2px solid #3B82F6;
    }
    .price-tag {
      font-weight: 800;
      color: #059669;
    }
    .price-offer {
      font-weight: 800;
      color: #2563EB;
    }
    .matrix-note {
      font-size: 9px;
      color: #64748B;
      font-style: italic;
      margin-bottom: 18px;
    }
    .clauses-container {
      margin-bottom: 18px;
    }
    .clause-item {
      margin-bottom: 8px;
      text-align: justify;
      color: #334155;
    }
    .clause-item strong {
      color: #0F172A;
    }
    .confirmation-box {
      background: #F0FDF4;
      border-left: 4px solid #10B981;
      padding: 10px 14px;
      margin-bottom: 24px;
      border-radius: 0 4px 4px 0;
      font-size: 10.5px;
      color: #065F46;
    }
    .confirmation-box strong {
      color: #047857;
    }
    .signature-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
      margin-top: 24px;
      margin-bottom: 16px;
    }
    .sig-line {
      border-top: 1px solid #94A3B8;
      padding-top: 6px;
      font-size: 11px;
      color: #0F172A;
    }
    .sig-role {
      font-size: 9.5px;
      color: #64748B;
    }
    .footer-stamp {
      text-align: center;
      font-size: 8.5px;
      color: #94A3B8;
      margin-top: 16px;
      border-top: 1px dashed #CBD5E1;
      padding-top: 10px;
    }
    @media print {
      body { padding: 10px 15px; }
      .header-bar { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .matrix-table th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .matrix-table tr.active-tier { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>

  <!-- HEADER -->
  <div class="header-bar">
    <div class="header-title">CONTRATO DE LICENCIA Y ACUERDO DE USO DE BEAT</div>
    <div class="header-subtitle">REGISTRO OFICIAL DE LICENCIAMIENTO | SAMU HELMAN EN EL MIX</div>
  </div>

  <!-- METADATA INFORMATION GRID -->
  <div class="info-grid">
    <div class="info-block">
      <div class="info-label">LICENCIANTE / PRODUCTOR:</div>
      <div class="info-value-strong">${PRODUCER_DATA.name}</div>
      <div class="info-value">Email: ${PRODUCER_DATA.email}</div>
    </div>

    <div class="info-block">
      <div class="info-label">LICENCIATARIO / CLIENTE:</div>
      <div class="info-value-client">${clientName}</div>
      <div class="info-value">Email: ${buyerEmail}</div>
    </div>

    <div class="info-block">
      <div class="info-label">INSTRUMENTAL:</div>
      <div class="info-value-strong">${beatTitle}</div>
      <div class="info-label" style="margin-top: 6px;">FECHA COMPRA:</div>
      <div class="info-value">${purchaseDate}</div>
    </div>

    <div class="info-block">
      <div class="info-label">LICENCIA ADQUIRIDA:</div>
      <div class="info-value-strong" style="color: #059669;">${tierName}</div>
      <div class="info-label" style="margin-top: 6px;">ID TRANSACCIÓN:</div>
      <div class="info-value" style="font-family: monospace; font-size: 10px;">${transactionId}</div>
    </div>
  </div>

  <!-- 1. MATRIZ DE TELEMETRIA -->
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
      <tr class="${tierKey === 'basic' ? 'active-tier' : ''}">
        <td><strong>Básica (MP3)</strong></td>
        <td class="price-tag">$20.00</td>
        <td>Hasta 50,000</td>
        <td>Hasta 2,500 unid.</td>
        <td>Hasta 250,000 vistas</td>
        <td>Sin radio / Sin sincro</td>
      </tr>
      <tr class="${tierKey === 'media' ? 'active-tier' : ''}">
        <td><strong>Media (WAV)</strong></td>
        <td class="price-tag">$45.00</td>
        <td>Hasta 250,000</td>
        <td>Hasta 10,000 unid.</td>
        <td>Hasta 1,000,000 vistas</td>
        <td>2 Emisoras / Sin sincro</td>
      </tr>
      <tr class="${tierKey === 'exclusive' ? 'active-tier' : ''}">
        <td><strong>Exclusiva</strong></td>
        <td class="price-tag">$150.00</td>
        <td>Ilimitado</td>
        <td>Ilimitado</td>
        <td>Ilimitado</td>
        <td>Radio libre / Sincro libre</td>
      </tr>
      <tr class="${tierKey === 'premium' ? 'active-tier' : ''}">
        <td><strong>Premium</strong></td>
        <td class="price-offer">${tierKey === 'premium' ? `$${amountPaid.toFixed(2)} USD*` : '{{OFERTA_CLIENTE}}*'}</td>
        <td>Ilimitado + Stems</td>
        <td>Ilimitado + Stems</td>
        <td>Ilimitado + Stems</td>
        <td>Sincronización Total / TV</td>
      </tr>
    </tbody>
  </table>

  <div class="matrix-note">
    * Licencia Premium: Modalidad bajo oferta negociada directamente. Requiere aceptación explícita por escrito del Productor.
  </div>

  <!-- 2. CLAUSULAS LEGALES -->
  <div class="section-title">2. CLÁUSULAS Y CONDICIONES LEGALES DEL ACUERDO</div>

  <div class="clauses-container">
    <div class="clause-item">
      <strong>2.1 Otorgamiento y Propiedad:</strong> El Licenciante otorga al Licenciatario el derecho de uso de la obra instrumental según el nivel de licencia especificado arriba. El Productor (${PRODUCER_DATA.name}) retiene la propiedad intelectual y los derechos de autor originales de la composición.
    </div>

    <div class="clause-item">
      <strong>2.2 Créditos Obligatorios:</strong> El Licenciatario debe acreditar al Productor en todo lanzamiento público como: <em>"Producido por Samu helman en el mix"</em> o <em>"(Prod. por Samu helman en el mix)"</em> en descripciones, metadatos y material promocional.
    </div>

    <div class="clause-item">
      <strong>2.3 Prohibición de Content ID:</strong> Se prohíbe estrictamente al Licenciatario registrar la obra resultante en YouTube Content ID, Meta Rights Manager o agregadoras bajo escaneo automático que bloquee la obra a terceros (salvo en licencias Exclusiva o Premium expresamente autorizadas).
    </div>

    <div class="clause-item">
      <strong>2.4 Composición y Publishing:</strong> Las regalías de composición/publishing se distribuyen 50% para el Productor (Samu helman en el mix) y 50% para el Licenciatario. La recaudación de Master pertenece 100% al Licenciatario dentro de los límites contratados.
    </div>

    <div class="clause-item">
      <strong>2.5 Licencia Premium (Oferta/Aceptación):</strong> La Licencia Premium opera bajo oferta económica del cliente. El contrato solo surtirá efecto legal pleno tras la verificación y aprobación explícita de la cifra ofertada por parte del Productor.
    </div>
  </div>

  <!-- CONFIRMACION -->
  <div class="confirmation-box">
    <strong>CONFIRMACIÓN DE ADQUISICIÓN:</strong> Este documento certifica que el cliente <strong>${clientName}</strong> ha adquirido la licencia '<strong>${tierName}</strong>' bajo los límites estipulados en la matriz de telemetría superior.
  </div>

  <!-- SIGNATURES -->
  <div class="signature-grid">
    <div>
      <div class="sig-line"><strong>${PRODUCER_DATA.name}</strong></div>
      <div class="sig-role">Licenciante / Productor Musical</div>
    </div>

    <div>
      <div class="sig-line"><strong>${clientName}</strong></div>
      <div class="sig-role">Licenciatario / Cliente (Confirmado vía Pago)</div>
    </div>
  </div>

  <!-- FOOTER -->
  <div class="footer-stamp">
    Documento con validez legal digital emitido por el ${PRODUCER_DATA.systemName}. Ref: ${transactionId}
  </div>

</body>
</html>
`;
}

/**
 * Plain text representation of the contract matching the PDF content
 */
export function generateContractPlainText(params: ContractGenerationParams): string {
  const {
    buyerName,
    buyerEmail,
    artistStageName,
    beatTitle,
    purchaseDate,
    tierKey,
    tierName,
    amountPaid,
    transactionId
  } = params;

  const clientName = artistStageName && artistStageName.trim() && artistStageName !== buyerName
    ? `${buyerName} (${artistStageName})`
    : buyerName;

  return `================================================================================
CONTRATO DE LICENCIA Y ACUERDO DE USO DE BEAT
REGISTRO OFICIAL DE LICENCIAMIENTO | SAMU HELMAN EN EL MIX
================================================================================

LICENCIANTE / PRODUCTOR:
${PRODUCER_DATA.name}
Email: ${PRODUCER_DATA.email}

LICENCIATARIO / CLIENTE:
${clientName}
Email: ${buyerEmail}

INSTRUMENTAL: ${beatTitle}
FECHA COMPRA: ${purchaseDate}
LICENCIA ADQUIRIDA: ${tierName}
ID TRANSACCIÓN: ${transactionId}
MONTO ABONADO: $${amountPaid.toFixed(2)} USD

--------------------------------------------------------------------------------
1. MATRIZ DE LICENCIAS Y MATRIZ DE TELEMETRÍA DE DERECHOS
--------------------------------------------------------------------------------
- Básica (MP3):    $20.00 USD  | Stream: 50,000  | Ventas: 2,500 unid.  | YouTube: 250,000 vistas  | Sin radio/sincro
- Media (WAV):     $45.00 USD  | Stream: 250,000 | Ventas: 10,000 unid. | YouTube: 1,000,000 vistas | 2 Emisoras / Sin sincro
- Exclusiva:       $150.00 USD | Stream: Ilimitado | Ventas: Ilimitado   | YouTube: Ilimitado       | Radio libre / Sincro libre
- Premium:         $${amountPaid.toFixed(2)} USD* | Stream: Ilimitado+Stems | Ventas: Ilimitado+Stems | Sincronización Total / TV

* Licencia Premium: Modalidad bajo oferta negociada directamente. Requiere aceptación explícita por escrito del Productor.

--------------------------------------------------------------------------------
2. CLÁUSULAS Y CONDICIONES LEGALES DEL ACUERDO
--------------------------------------------------------------------------------
2.1 Otorgamiento y Propiedad: El Licenciante otorga al Licenciatario el derecho de uso de la obra instrumental según el nivel de licencia especificado arriba. El Productor (${PRODUCER_DATA.name}) retiene la propiedad intelectual y los derechos de autor originales de la composición.

2.2 Créditos Obligatorios: El Licenciatario debe acreditar al Productor en todo lanzamiento público como: "Producido por Samu helman en el mix" o "(Prod. por Samu helman en el mix)" en descripciones, metadatos y material promocional.

2.3 Prohibición de Content ID: Se prohíbe estrictamente al Licenciatario registrar la obra resultante en YouTube Content ID, Meta Rights Manager o agregadoras bajo escaneo automático que bloquee la obra a terceros (salvo en licencias Exclusiva o Premium expresamente autorizadas).

2.4 Composición y Publishing: Las regalías de composición/publishing se distribuyen 50% para el Productor (Samu helman en el mix) y 50% para el Licenciatario. La recaudación de Master pertenece 100% al Licenciatario dentro de los límites contratados.

2.5 Licencia Premium (Oferta/Aceptación): La Licencia Premium opera bajo oferta económica del cliente. El contrato solo surtirá efecto legal pleno tras la verificación y aprobación explícita de la cifra ofertada por parte del Productor.

CONFIRMACIÓN DE ADQUISICIÓN: Este documento certifica que el cliente ${clientName} ha adquirido la licencia '${tierName}' bajo los límites estipulados en la matriz de telemetría superior.

_________________________________________
${PRODUCER_DATA.name}
Licenciante / Productor Musical

_________________________________________
${clientName}
Licenciatario / Cliente (Confirmado vía Pago)

Documento con validez legal digital emitido por el ${PRODUCER_DATA.systemName}.
Ref ID: ${transactionId}
================================================================================`;
}
