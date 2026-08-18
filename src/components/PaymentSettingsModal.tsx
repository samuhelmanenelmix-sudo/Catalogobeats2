import React, { useState } from 'react';
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
  Zap
} from 'lucide-react';
import { PaymentGatewaysConfig, Beat } from '../types';

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
  const [paypalBaseUrl, setPaypalBaseUrl] = useState(config.paypalBaseUrl || 'https://www.paypal.com/paypalme/literlandmusic/');
  const [enableMercadoPago, setEnableMercadoPago] = useState(config.enableMercadoPago);
  const [mercadoPagoAlias, setMercadoPagoAlias] = useState(config.mercadoPagoAlias || '');
  const [enableBankTransfer, setEnableBankTransfer] = useState(config.enableBankTransfer);
  const [bankDetails, setBankDetails] = useState(config.bankDetails || '');
  const [enableWhatsAppCheckout, setEnableWhatsAppCheckout] = useState(config.enableWhatsAppCheckout);
  const [whatsAppNumber, setWhatsAppNumber] = useState(config.whatsAppNumber || '');
  const [currency, setCurrency] = useState(config.currency || 'USD');
  const [currencySymbol, setCurrencySymbol] = useState(config.currencySymbol || '$');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: PaymentGatewaysConfig = {
      producerName: producerName.trim() || 'Literland Music',
      producerEmail: producerEmail.trim() || 'literlandmusic@gmail.com',
      paypalEmailOrUsername: paypalEmailOrUsername.trim() || 'literlandmusic@gmail.com',
      paypalBaseUrl: paypalBaseUrl.trim() || 'https://www.paypal.com/paypalme/literlandmusic/',
      enableDirectPaypalLinks: true,
      enableMercadoPago,
      mercadoPagoAlias: mercadoPagoAlias.trim(),
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

          {/* MERCADO PAGO & LOCAL METHODS */}
          <div className="space-y-3 pt-3 border-t border-[#262626]">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase font-mono tracking-wider text-[#D4AF37] flex items-center gap-1.5">
                <span>🤝</span>
                <span>Mercado Pago & Transferencia Bancaria</span>
              </h4>
            </div>

            <div>
              <label className="block text-xs text-[#888888] mb-1">Alias o CVU de Mercado Pago</label>
              <input
                id="cfg-mp-alias"
                type="text"
                value={mercadoPagoAlias}
                onChange={(e) => setMercadoPagoAlias(e.target.value)}
                placeholder="literland.beats.mp"
                className="w-full px-3.5 py-2 rounded-xl bg-[#121214] border border-[#262626] text-xs font-mono text-white focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <label className="block text-xs text-[#888888] mb-1">Datos de Transferencia Bancaria (CBU / CLABE / IBAN)</label>
              <textarea
                id="cfg-bank-details"
                rows={2}
                value={bankDetails}
                onChange={(e) => setBankDetails(e.target.value)}
                placeholder="Banco BBVA | Titular: Literland Music | CBU / CLABE: 01218000..."
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
