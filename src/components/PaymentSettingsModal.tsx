import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  CreditCard, 
  ExternalLink, 
  Download, 
  Upload, 
  CheckCircle, 
  ShieldAlert, 
  DollarSign, 
  MessageCircle, 
  Building,
  Sparkles,
  Zap,
  Eye,
  EyeOff,
  RefreshCw,
  TrendingUp,
  Info
} from 'lucide-react';
import { PaymentGatewaysConfig, Beat } from '../types';
import { MercadoPagoLogo } from './MercadoPagoLogo';

interface PaymentSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: PaymentGatewaysConfig;
  onSaveConfig: (newConfig: PaymentGatewaysConfig) => void;
  beats: Beat[];
  onImportBeats: (importedBeats: Beat[]) => void;
}

export const PaymentSettingsModal: React.FC<PaymentSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  beats,
  onImportBeats,
}) => {
  const [producerName, setProducerName] = useState(config.producerName || '');
  const [producerEmail, setProducerEmail] = useState(config.producerEmail || '');
  const [paypalEmailOrUsername, setPaypalEmailOrUsername] = useState(config.paypalEmailOrUsername || '');
  const [paypalBaseUrl, setPaypalBaseUrl] = useState(config.paypalBaseUrl || 'https://www.paypal.com/paypalme/samuhelman/');
  
  // Mercado Pago config
  const [enableMercadoPago, setEnableMercadoPago] = useState(config.enableMercadoPago ?? true);
  const [mercadoPagoAlias, setMercadoPagoAlias] = useState(config.mercadoPagoAlias || 'samuhelman.mp');
  const [mercadopagoPublicKey, setMercadopagoPublicKey] = useState(config.mercadopago_public_key || '');
  const [mercadopagoAccessToken, setMercadopagoAccessToken] = useState(config.mercadopago_access_token || '');
  const [showAccessToken, setShowAccessToken] = useState(false);

  // Dollar Exchange Rate (ARS) config
  const [dolarExchangeRate, setDolarExchangeRate] = useState<number>(config.dolarExchangeRate || 1350);
  const [dolarRateMode, setDolarRateMode] = useState<'auto' | 'manual'>(config.dolarRateMode || 'auto');
  const [dolarLastUpdated, setDolarLastUpdated] = useState<string>(config.dolarLastUpdated || 'Actualizado a las 00:00 hs');
  const [isSyncingRate, setIsSyncingRate] = useState(false);
  const [rateSyncMessage, setRateSyncMessage] = useState<string | null>(null);

  // Other channels
  const [enableBankTransfer, setEnableBankTransfer] = useState(config.enableBankTransfer);
  const [bankDetails, setBankDetails] = useState(config.bankDetails || '');
  const [enableWhatsAppCheckout, setEnableWhatsAppCheckout] = useState(config.enableWhatsAppCheckout);
  const [whatsAppNumber, setWhatsAppNumber] = useState(config.whatsAppNumber || '');
  const [currency, setCurrency] = useState(config.currency || 'USD');
  const [currencySymbol, setCurrencySymbol] = useState(config.currencySymbol || '$');

  // Load server-side live exchange rate on modal open
  useEffect(() => {
    if (isOpen) {
      fetch('/api/exchange-rate/usd-ars')
        .then((res) => res.json())
        .then((data) => {
          if (data && data.rate) {
            if (dolarRateMode === 'auto') {
              setDolarExchangeRate(data.rate);
            }
            if (data.lastUpdated) {
              const d = new Date(data.lastUpdated);
              setDolarLastUpdated(`Actualizado: ${d.toLocaleDateString('es-AR')} a las 00:00 hs (${data.source || 'Dólar API'})`);
            }
          }
        })
        .catch(() => {});
    }
  }, [isOpen, dolarRateMode]);

  if (!isOpen) return null;

  const handleSyncRateNow = async () => {
    setIsSyncingRate(true);
    setRateSyncMessage(null);
    try {
      const res = await fetch('/api/exchange-rate/sync', { method: 'POST' });
      const data = await res.json();
      if (data && data.rate) {
        setDolarExchangeRate(data.rate);
        setDolarRateMode('auto');
        setDolarLastUpdated(`Actualizado recién a las 00:00 hs (Fuente: ${data.source})`);
        setRateSyncMessage(`¡Cotización actualizada! 1 USD = $${data.rate.toLocaleString('es-AR')} ARS`);
        setTimeout(() => setRateSyncMessage(null), 4000);
      }
    } catch {
      setRateSyncMessage('Error al sincronizar cotización con el servidor.');
    } finally {
      setIsSyncingRate(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: PaymentGatewaysConfig = {
      producerName: producerName.trim() || 'Samu helman en el mix / Samuel Helman',
      producerEmail: producerEmail.trim() || 'samuhelmanenelmix@gmail.com',
      paypalEmailOrUsername: paypalEmailOrUsername.trim() || 'samuhelmanenelmix@gmail.com',
      paypalBaseUrl: paypalBaseUrl.trim() || 'https://www.paypal.com/paypalme/samuhelman/',
      enableDirectPaypalLinks: true,
      enableMercadoPago,
      mercadoPagoAlias: mercadoPagoAlias.trim(),
      mercadopago_public_key: mercadopagoPublicKey.trim(),
      mercadopago_access_token: mercadopagoAccessToken.trim(),
      dolarExchangeRate: Number(dolarExchangeRate) || 1350,
      dolarRateMode,
      dolarLastUpdated,
      enableBankTransfer,
      bankDetails: bankDetails.trim(),
      enableWhatsAppCheckout,
      whatsAppNumber: whatsAppNumber.trim(),
      currency,
      currencySymbol,
    };
    onSaveConfig(updated);
    onClose();
  };

  const handleExportCatalogJSON = () => {
    const dataStr = JSON.stringify(
      {
        producer: producerName,
        exportDate: new Date().toISOString(),
        config: {
          producerName,
          producerEmail,
          paypalBaseUrl,
          mercadoPagoAlias,
          bankDetails,
          currency,
        },
        beatsCount: beats.length,
        beats,
      },
      null,
      2
    );
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Catalogo_Beats_PayPal_${producerName.replace(/\s+/g, '_')}_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportCatalogJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(reader.result as string);
          if (parsed && Array.isArray(parsed.beats)) {
            onImportBeats(parsed.beats);
            alert(`¡Éxito! Se importaron ${parsed.beats.length} beats con sus enlaces de PayPal.`);
            onClose();
          } else if (Array.isArray(parsed)) {
            onImportBeats(parsed);
            alert(`¡Éxito! Se importaron ${parsed.length} beats.`);
            onClose();
          } else {
            alert('El archivo no tiene el formato de catálogo válido.');
          }
        } catch {
          alert('Error al leer el archivo JSON.');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6">
      <div 
        className="relative w-full max-w-2xl bg-[#0A0A0B] border border-[#262626] rounded-3xl overflow-hidden shadow-2xl text-[#E0E0E0] flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#262626] bg-[#121214]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-serif italic font-bold text-white">
                Configuración de Medios de Pago & Pasarelas
              </h3>
              <p className="text-xs text-[#888888]">
                Ajusta tu cuenta de PayPal, alias de cobro y datos bancarios para automatizar ventas.
              </p>
            </div>
          </div>

          <button
            id="btn-close-payment-settings"
            onClick={onClose}
            className="p-2 rounded-full bg-[#1A1A1C] text-[#888888] hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          
          {/* General Producer Info */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase font-mono tracking-wider text-[#D4AF37] flex items-center gap-1.5">
              <span>👤</span>
              <span>Datos del Productor / Marca</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#888888] mb-1">Nombre Artístico del Productor</label>
                <input
                  id="cfg-producer-name"
                  type="text"
                  required
                  value={producerName}
                  onChange={(e) => setProducerName(e.target.value)}
                  placeholder="Literland Music"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#121214] border border-[#262626] text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-xs text-[#888888] mb-1">Correo Electrónico de Contacto</label>
                <input
                  id="cfg-producer-email"
                  type="email"
                  required
                  value={producerEmail}
                  onChange={(e) => setProducerEmail(e.target.value)}
                  placeholder="literlandmusic@gmail.com"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#121214] border border-[#262626] text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>

            {/* Currency settings */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#888888] mb-1">Código de Moneda</label>
                <select
                  id="cfg-currency"
                  value={currency}
                  onChange={(e) => {
                    setCurrency(e.target.value);
                    if (e.target.value === 'EUR') setCurrencySymbol('€');
                    else if (e.target.value === 'GBP') setCurrencySymbol('£');
                    else setCurrencySymbol('$');
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-[#121214] border border-[#262626] text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="USD">USD ($ Dólares Americanos)</option>
                  <option value="EUR">EUR (€ Euros)</option>
                  <option value="MXN">MXN ($ Pesos Mexicanos)</option>
                  <option value="ARS">ARS ($ Pesos Argentinos)</option>
                  <option value="COP">COP ($ Pesos Colombianos)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-[#888888] mb-1">Símbolo</label>
                <input
                  id="cfg-currency-symbol"
                  type="text"
                  value={currencySymbol}
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#121214] border border-[#262626] text-xs font-mono text-white text-center focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>
          </div>

          {/* PAYPAL INTEGRATION CONFIGURATION */}
          <div className="space-y-3 pt-3 border-t border-[#262626]">
            <h4 className="text-xs font-bold uppercase font-mono tracking-wider text-sky-400 flex items-center gap-1.5">
              <span>🅿️</span>
              <span>Integración con PayPal</span>
            </h4>

            <div>
              <label className="block text-xs text-[#CCCCCC] font-semibold mb-1">
                URL Base de PayPal.me o Perfil de Cobro
              </label>
              <input
                id="cfg-paypal-base-url"
                type="text"
                value={paypalBaseUrl}
                onChange={(e) => setPaypalBaseUrl(e.target.value)}
                placeholder="https://www.paypal.com/paypalme/literlandmusic/"
                className="w-full px-3.5 py-2 rounded-xl bg-[#121214] border border-[#262626] text-xs font-mono text-sky-300 focus:outline-none focus:border-sky-500"
              />
              <p className="text-[11px] text-[#888888] mt-1">
                Se usará para autocompletar los botones de pago en beats donde no hayas ingresado un link específico.
              </p>
            </div>
          </div>

          {/* MERCADO PAGO INTEGRATION CONFIGURATION */}
          <div className="space-y-4 pt-3 border-t border-[#262626]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MercadoPagoLogo variant="badge" />
                <span className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                  Mercado Pago (Argentina & Latinoamérica)
                </span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs text-[#888888]">
                  {enableMercadoPago ? 'Activo' : 'Desactivado'}
                </span>
                <input
                  id="cfg-enable-mercadopago"
                  type="checkbox"
                  checked={enableMercadoPago}
                  onChange={(e) => setEnableMercadoPago(e.target.checked)}
                  className="w-4 h-4 accent-[#009EE3] rounded cursor-pointer"
                />
              </label>
            </div>

            {enableMercadoPago && (
              <div className="p-4 bg-[#121214] border border-[#009EE3]/30 rounded-2xl space-y-4">
                
                {/* Credentials notice */}
                <div className="p-3 bg-[#009EE3]/10 border border-[#009EE3]/25 rounded-xl flex items-start gap-2.5 text-xs text-sky-200">
                  <Info className="w-4 h-4 text-[#009EE3] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white">Credenciales Oficiales de Mercado Pago</p>
                    <p className="text-[11px] text-sky-200/80 leading-relaxed mt-0.5">
                      Ingresa a <a href="https://www.mercadopago.com.ar/developers" target="_blank" rel="noopener noreferrer" className="text-[#009EE3] underline font-bold">Mercado Pago Developers</a> &gt; <em>Tus integraciones</em> &gt; <em>Credenciales</em> (Producción o Prueba) para recibir pagos con tarjeta de crédito/débito, dinero en cuenta y cuotas.
                    </p>
                  </div>
                </div>

                {/* Public Key */}
                <div>
                  <label className="block text-xs font-semibold text-[#CCCCCC] mb-1">
                    Mercado Pago Public Key (mercadopago_public_key)
                  </label>
                  <input
                    id="cfg-mercadopago-public-key"
                    type="text"
                    value={mercadopagoPublicKey}
                    onChange={(e) => setMercadopagoPublicKey(e.target.value)}
                    placeholder="APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx o TEST-..."
                    className="w-full px-3.5 py-2 rounded-xl bg-[#0A0A0B] border border-[#262626] text-xs font-mono text-[#009EE3] focus:outline-none focus:border-[#009EE3]"
                  />
                  <p className="text-[11px] text-[#888888] mt-1">
                    Clave pública utilizada por el Checkout oficial para validar transacciones del comprador.
                  </p>
                </div>

                {/* Access Token */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-[#CCCCCC]">
                      Mercado Pago Access Token (mercadopago_access_token)
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowAccessToken(!showAccessToken)}
                      className="text-[11px] text-[#888888] hover:text-white flex items-center gap-1 transition"
                    >
                      {showAccessToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showAccessToken ? 'Ocultar' : 'Ver token'}</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      id="cfg-mercadopago-access-token"
                      type={showAccessToken ? 'text' : 'password'}
                      value={mercadopagoAccessToken}
                      onChange={(e) => setMercadopagoAccessToken(e.target.value)}
                      placeholder="APP_USR-xxxxxxxxxxxxxxxxxxxxxxxxx..."
                      className="w-full px-3.5 py-2 rounded-xl bg-[#0A0A0B] border border-[#262626] text-xs font-mono text-[#009EE3] focus:outline-none focus:border-[#009EE3]"
                    />
                  </div>
                  <p className="text-[11px] text-[#888888] mt-1">
                    Token privado de servidor para crear preferencias de cobro y verificar pagos seguros.
                  </p>
                </div>

                {/* Alias or CVU */}
                <div>
                  <label className="block text-xs font-semibold text-[#CCCCCC] mb-1">
                    Alias o CVU de Mercado Pago (Cobro directo opcional)
                  </label>
                  <input
                    id="cfg-mp-alias"
                    type="text"
                    value={mercadoPagoAlias}
                    onChange={(e) => setMercadoPagoAlias(e.target.value)}
                    placeholder="samuhelman.mp"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#0A0A0B] border border-[#262626] text-xs font-mono text-white focus:outline-none focus:border-[#009EE3]"
                  />
                  <p className="text-[11px] text-[#888888] mt-1">
                    Mostrado a compradores argentinos que prefieran transferir directamente por alias.
                  </p>
                </div>

                {/* DOLAR EXCHANGE RATE (ARS) SECTION */}
                <div className="p-3.5 bg-[#0A0A0B] border border-[#262626] rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-white uppercase font-mono">
                        Cotización del Dólar (USD → ARS)
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/25">
                      Cálculo a las 00:00 hs
                    </span>
                  </div>

                  <p className="text-[11px] text-[#888888] leading-relaxed">
                    Dado que los precios de los beats se publican en dólares (USD), este valor calcula automáticamente el precio del beat en Pesos Argentinos (ARS) cuando el cliente elija pagar con Mercado Pago.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                    <div>
                      <label className="block text-[11px] text-[#888888] mb-1">
                        Modo de Cálculo
                      </label>
                      <select
                        id="cfg-dolar-mode"
                        value={dolarRateMode}
                        onChange={(e) => setDolarRateMode(e.target.value as 'auto' | 'manual')}
                        className="w-full px-3 py-2 rounded-xl bg-[#121214] border border-[#262626] text-xs text-white focus:outline-none focus:border-[#009EE3]"
                      >
                        <option value="auto">Automático diario a las 00:00 hs (Dólar API)</option>
                        <option value="manual">Manual (Fijar valor personalizado)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] text-[#888888] mb-1">
                        Valor del Dólar (ARS por 1 USD)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-[#888888]">$</span>
                        <input
                          id="cfg-dolar-exchange-rate"
                          type="number"
                          min="1"
                          step="1"
                          disabled={dolarRateMode === 'auto'}
                          value={dolarExchangeRate}
                          onChange={(e) => setDolarExchangeRate(Number(e.target.value))}
                          className={`w-full pl-6 pr-12 py-2 rounded-xl bg-[#121214] border border-[#262626] text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-500 ${
                            dolarRateMode === 'auto' ? 'opacity-80 cursor-not-allowed' : ''
                          }`}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[#888888]">
                          ARS
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#262626]/80 text-[11px]">
                    <div className="text-[#888888]">
                      <span>{dolarLastUpdated}</span>
                    </div>

                    <button
                      type="button"
                      onClick={handleSyncRateNow}
                      disabled={isSyncingRate}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#009EE3]/15 hover:bg-[#009EE3]/25 border border-[#009EE3]/40 text-[#009EE3] text-[11px] font-semibold transition"
                    >
                      <RefreshCw className={`w-3 h-3 ${isSyncingRate ? 'animate-spin' : ''}`} />
                      <span>{isSyncingRate ? 'Calculando...' : 'Sincronizar Cotización Ahora'}</span>
                    </button>
                  </div>

                  {rateSyncMessage && (
                    <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{rateSyncMessage}</span>
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>

          {/* BANK TRANSFER & WHATSAPP */}
          <div className="space-y-3 pt-3 border-t border-[#262626]">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase font-mono tracking-wider text-[#D4AF37] flex items-center gap-1.5">
                <span>🏦</span>
                <span>Transferencia Bancaria & Pedidos Asistidos</span>
              </h4>
            </div>

            <div>
              <label className="block text-xs text-[#888888] mb-1">Datos de Transferencia Bancaria (CBU / CLABE / IBAN)</label>
              <textarea
                id="cfg-bank-details"
                rows={2}
                value={bankDetails}
                onChange={(e) => setBankDetails(e.target.value)}
                placeholder="Banco BBVA | Titular: Samu Helman en el mix | CBU: 01218000..."
                className="w-full px-3.5 py-2 rounded-xl bg-[#121214] border border-[#262626] text-xs text-white focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <label className="block text-xs text-[#888888] mb-1">Número de WhatsApp para Pedidos Asistidos</label>
              <input
                id="cfg-whatsapp"
                type="text"
                value={whatsAppNumber}
                onChange={(e) => setWhatsAppNumber(e.target.value)}
                placeholder="+5491123456789"
                className="w-full px-3.5 py-2 rounded-xl bg-[#121214] border border-[#262626] text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* BACKUP & RESTORE */}
          <div className="space-y-3 pt-3 border-t border-[#262626]">
            <h4 className="text-xs font-bold uppercase font-mono tracking-wider text-[#888888] flex items-center gap-1.5">
              <span>💾</span>
              <span>Copia de Seguridad del Catálogo & Enlaces</span>
            </h4>

            <div className="flex flex-wrap items-center gap-3">
              <button
                id="btn-export-catalog"
                type="button"
                onClick={handleExportCatalogJSON}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#121214] border border-[#262626] text-[#CCCCCC] hover:bg-[#1A1A1C] text-xs font-semibold transition"
              >
                <Download className="w-4 h-4 text-[#D4AF37]" />
                <span>Exportar Catálogo JSON</span>
              </button>

              <label className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#121214] border border-[#262626] text-[#CCCCCC] hover:bg-[#1A1A1C] text-xs font-semibold cursor-pointer transition">
                <Upload className="w-4 h-4 text-sky-400" />
                <span>Restaurar Catálogo JSON</span>
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={handleImportCatalogJSON}
                  className="hidden" 
                />
              </label>
            </div>
          </div>

          {/* Footer Save */}
          <div className="pt-4 border-t border-[#262626] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-[#121214] hover:bg-[#1A1A1C] border border-[#262626] text-[#CCCCCC] text-xs font-semibold transition"
            >
              Cerrar
            </button>

            <button
              id="btn-save-payment-config"
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#E5C158] text-black text-xs sm:text-sm font-extrabold uppercase font-mono shadow-lg shadow-[#D4AF37]/20 transition active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Configuración</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
