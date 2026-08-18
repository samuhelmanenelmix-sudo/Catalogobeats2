import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle, 
  ExternalLink, 
  FileText, 
  Download, 
  ShieldCheck, 
  Lock, 
  RefreshCw, 
  AlertTriangle, 
  Sparkles, 
  Printer,
  DollarSign
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Beat, LicenseTierKey, PaymentGatewaysConfig, PurchasedLicense } from '../types';
import { DEFAULT_LICENSE_TIERS } from '../data/defaultBeats';
import { PaypalLogo } from './PaypalLogo';
import { generateContractHtml, generateContractPlainText, PRODUCER_DATA } from '../utils/contractTemplate';
import { BeatCoverImage } from './BeatCoverImage';

interface CheckoutModalProps {
  beat: Beat | null;
  selectedTier: LicenseTierKey;
  isOpen: boolean;
  onClose: () => void;
  paymentConfig: PaymentGatewaysConfig;
  onPurchaseComplete: (license: PurchasedLicense) => void;
  currencySymbol: string;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  beat,
  selectedTier,
  isOpen,
  onClose,
  paymentConfig,
  onPurchaseComplete,
  currencySymbol,
}) => {
  const [buyerName, setBuyerName] = useState('');
  const [artistName, setArtistName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  
  // Custom Offer for 4th tier (Premium)
  const isPremiumTier = selectedTier === 'premium';
  const [clientOfferAmount, setClientOfferAmount] = useState<number>(250.00);

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<PurchasedLicense | null>(null);
  
  // Real token & download metadata returned by /api/orders/capture
  const [downloadToken, setDownloadToken] = useState<string | null>(null);
  const [downloadCount, setDownloadCount] = useState<number>(0);
  const [maxDownloads, setMaxDownloads] = useState<number>(3);
  const [isDownloading, setIsDownloading] = useState(false);

  const tierInfo = DEFAULT_LICENSE_TIERS.find((t) => t.id === selectedTier) || DEFAULT_LICENSE_TIERS[0];
  
  const getStandardPrice = (): number => {
    if (selectedTier === 'basic') return beat?.tierPrices?.basic ?? 20.00;
    if (selectedTier === 'media') return beat?.tierPrices?.media ?? 45.00;
    if (selectedTier === 'exclusive') return beat?.tierPrices?.exclusive ?? 150.00;
    if (selectedTier === 'premium') return clientOfferAmount > 0 ? clientOfferAmount : 250.00;
    return 20.00;
  };

  const finalPrice = isPremiumTier ? clientOfferAmount : getStandardPrice();

  // Custom fallback PayPal link
  const customPaypalLink = beat?.paypalLinks?.[selectedTier] || 
    `${paymentConfig.paypalBaseUrl}${finalPrice.toFixed(2)}${paymentConfig.currency}`;

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 120,
        spread: 75,
        origin: { y: 0.6 }
      });
    } catch {
      // ignore
    }
  };

  // Reset state on open/close
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setCompletedOrder(null);
      setDownloadToken(null);
      setDownloadCount(0);
      if (isPremiumTier) {
        setClientOfferAmount(beat?.tierPrices?.premium ?? 250.00);
      }
    }
  }, [isOpen, beat, selectedTier, isPremiumTier]);

  if (!isOpen || !beat) return null;

  // --------------------------------------------------------------------------
  // PAYPAL API v2: Create Order via Back-End (/api/orders/create)
  // --------------------------------------------------------------------------
  const handleCreatePayPalOrder = async (): Promise<string> => {
    if (!buyerName.trim() || !buyerEmail.trim()) {
      throw new Error('Por favor completa tu Nombre y Correo Electrónico para generar la orden.');
    }

    if (isPremiumTier && (!clientOfferAmount || clientOfferAmount <= 0)) {
      throw new Error('Por favor ingresa un monto válido de oferta para los derechos Premium.');
    }

    const res = await fetch('/api/orders/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        beatId: beat.id,
        beatTitle: beat.title,
        producer: beat.producer || PRODUCER_DATA.name,
        tierKey: selectedTier,
        customPrice: finalPrice
      })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al comunicarse con la API de PayPal.');
    }

    const orderData = await res.json();
    return orderData.id || orderData.orderID;
  };

  // --------------------------------------------------------------------------
  // PAYPAL API v2: Capture Order via Back-End (/api/orders/capture)
  // --------------------------------------------------------------------------
  const handleCapturePayPalOrder = async (orderIdToCapture: string) => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const effectiveArtist = artistName.trim() || buyerName.trim();
      const purchaseDateFormatted = new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Generate exact HTML and PlainText contract from the PDF template
      const generatedHtml = generateContractHtml({
        buyerName: buyerName.trim(),
        buyerEmail: buyerEmail.trim(),
        artistStageName: effectiveArtist,
        beatTitle: beat.title,
        purchaseDate: purchaseDateFormatted,
        tierKey: selectedTier,
        tierName: tierInfo.name,
        amountPaid: finalPrice,
        transactionId: orderIdToCapture,
        isOfferBased: isPremiumTier,
        offeredAmount: isPremiumTier ? finalPrice : undefined
      });

      const generatedTxt = generateContractPlainText({
        buyerName: buyerName.trim(),
        buyerEmail: buyerEmail.trim(),
        artistStageName: effectiveArtist,
        beatTitle: beat.title,
        purchaseDate: purchaseDateFormatted,
        tierKey: selectedTier,
        tierName: tierInfo.name,
        amountPaid: finalPrice,
        transactionId: orderIdToCapture
      });

      const res = await fetch('/api/orders/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderID: orderIdToCapture,
          beatId: beat.id,
          beatTitle: beat.title,
          producer: beat.producer || PRODUCER_DATA.name,
          bpm: beat.bpm,
          keyScale: beat.keyScale,
          tierKey: selectedTier,
          buyerName: buyerName.trim() || 'Comprador Anónimo',
          buyerEmail: buyerEmail.trim(),
          artistName: effectiveArtist,
          contractHtml: generatedHtml,
          contractText: generatedTxt,
          customPrice: finalPrice
        })
      });

      const captureResult = await res.json();

      if (!res.ok || !captureResult.success) {
        throw new Error(captureResult.error || 'No se pudo capturar la orden en el servidor.');
      }

      // Store download token & metadata
      setDownloadToken(captureResult.downloadToken);
      setMaxDownloads(captureResult.maxDownloads || 3);
      setDownloadCount(0);

      const newLicense: PurchasedLicense = captureResult.license || {
        orderId: captureResult.orderId,
        beatTitle: beat.title,
        beatId: beat.id,
        producer: PRODUCER_DATA.name,
        producerEmail: PRODUCER_DATA.email,
        buyerName: buyerName.trim(),
        buyerEmail: buyerEmail.trim(),
        artistStageName: effectiveArtist,
        tierName: tierInfo.name,
        tierKey: selectedTier,
        amountPaid: finalPrice,
        currency: 'USD',
        paymentMethod: 'PayPal v2 API Checkout',
        transactionRef: captureResult.orderId,
        purchaseDate: purchaseDateFormatted,
        contractText: generatedTxt,
        contractHtml: generatedHtml,
        isOfferAccepted: isPremiumTier,
        offeredAmount: isPremiumTier ? finalPrice : undefined
      };

      setCompletedOrder(newLicense);
      onPurchaseComplete(newLicense);
      triggerConfetti();
    } catch (err: any) {
      console.error('Error capturando pago:', err);
      setErrorMessage(err.message || 'Ocurrió un error inesperado al procesar el pago.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDirectPayPalCheckout = async () => {
    if (!buyerName.trim() || !buyerEmail.trim()) {
      setErrorMessage('Por favor ingresa tu Nombre Legal y Correo Electrónico antes de proceder al pago.');
      return;
    }

    if (isPremiumTier && (!clientOfferAmount || clientOfferAmount <= 0)) {
      setErrorMessage('Por favor ingresa un monto de oferta válido.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const orderId = await handleCreatePayPalOrder();
      await handleCapturePayPalOrder(orderId);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al procesar el checkout de PayPal.');
      setIsProcessing(false);
    }
  };

  const handleTriggerSecureDownload = async () => {
    if (!downloadToken) return;

    setIsDownloading(true);
    try {
      const downloadUrl = `/api/download/${downloadToken}`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `Beat_${beat.title.replace(/\s+/g, '_')}_Master.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(async () => {
        try {
          const res = await fetch(`/api/download/${downloadToken}/status`);
          if (res.ok) {
            const data = await res.json();
            setDownloadCount(data.downloadCount || downloadCount + 1);
          }
        } catch {
          setDownloadCount((prev) => prev + 1);
        }
      }, 800);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadContractHtml = (license: PurchasedLicense) => {
    const blob = new Blob([license.contractHtml || ''], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Contrato_Licencia_${license.beatTitle.replace(/\s+/g, '_')}_${license.orderId}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadContractTxt = (license: PurchasedLicense) => {
    const blob = new Blob([license.contractText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Contrato_Licencia_${license.beatTitle.replace(/\s+/g, '_')}_${license.orderId}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintContract = (license: PurchasedLicense) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(license.contractHtml || '');
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 300);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6">
      <div 
        className="relative w-full max-w-2xl bg-[#030A14] border border-[#00F0FF]/35 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,240,255,0.2)] text-[#E0F2FE] animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-[#00F0FF]/25 bg-[#051525]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/40 flex items-center justify-center text-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.25)]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white font-display">
                {completedOrder ? '¡Licencia Adquirida & Verificada!' : 'Pasarela de Pago PayPal Checkout'}
              </h3>
              <p className="text-xs text-sky-300/70 font-mono">
                {beat.title} • {tierInfo.name}
              </p>
            </div>
          </div>

          <button
            id="btn-close-checkout"
            onClick={onClose}
            className="p-2 rounded-full bg-[#030A14] text-sky-300/60 hover:text-white transition border border-[#00F0FF]/20"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-6 bg-[#030A14]">
          {errorMessage && (
            <div className="mb-4 p-3.5 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-start gap-2.5 text-xs text-red-300">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Error en la transacción:</p>
                <p>{errorMessage}</p>
              </div>
            </div>
          )}

          {completedOrder ? (
            /* SUCCESS & SECURE DOWNLOAD VIEW */
            <div className="text-center py-2 space-y-5 animate-in fade-in">
              <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                <CheckCircle className="w-10 h-10" />
              </div>

              <div>
                <h4 className="text-xl sm:text-2xl font-bold text-white font-display">
                  ¡Felicitaciones, {completedOrder.artistStageName}!
                </h4>
                <p className="text-sm text-sky-200/80 max-w-md mx-auto mt-1">
                  Tu orden ha sido confirmada en PayPal. El contrato HTML oficial ha sido emitido con tus datos legales.
                </p>
              </div>

              {/* Order summary card */}
              <div className="bg-[#051525] border border-[#00F0FF]/25 rounded-2xl p-4 text-left text-xs text-sky-100 space-y-2 max-w-lg mx-auto">
                <div className="flex justify-between border-b border-[#00F0FF]/15 pb-2">
                  <span className="text-sky-300/60">ID de Orden PayPal:</span>
                  <span className="font-mono font-bold text-[#00F0FF]">{completedOrder.orderId}</span>
                </div>
                <div className="flex justify-between border-b border-[#00F0FF]/15 pb-2">
                  <span className="text-sky-300/60">Licencia Adquirida:</span>
                  <span className="font-semibold text-white">{completedOrder.tierName}</span>
                </div>
                <div className="flex justify-between border-b border-[#00F0FF]/15 pb-2">
                  <span className="text-sky-300/60">Cliente / Licenciatario:</span>
                  <span className="text-white">{completedOrder.buyerName} ({completedOrder.artistStageName})</span>
                </div>
                <div className="flex justify-between border-b border-[#00F0FF]/15 pb-2">
                  <span className="text-sky-300/60">Licenciante / Productor:</span>
                  <span className="text-white">{PRODUCER_DATA.name}</span>
                </div>
                <div className="flex justify-between border-b border-[#00F0FF]/15 pb-2">
                  <span className="text-sky-300/60">Monto Verificado:</span>
                  <span className="font-bold text-[#00F0FF] font-mono">
                    {currencySymbol}{completedOrder.amountPaid.toFixed(2)} USD
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-sky-300/60">Token Criptográfico:</span>
                  <span className="font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/25 truncate max-w-[200px]">
                    {downloadToken || 'TOKEN-UUID-SECURE'}
                  </span>
                </div>
              </div>

              {/* Secure Download & Contract Actions */}
              <div className="p-4 bg-[#051525] border border-[#00F0FF]/25 rounded-2xl max-w-lg mx-auto space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-sky-300/60 font-mono">Descargas de Archivos:</span>
                  <span className={`font-mono font-bold px-2 py-0.5 rounded ${
                    downloadCount >= maxDownloads 
                      ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {downloadCount} de {maxDownloads} descargas usadas
                  </span>
                </div>

                <button
                  id="btn-trigger-secure-download"
                  onClick={handleTriggerSecureDownload}
                  disabled={downloadCount >= maxDownloads || isDownloading}
                  className={`w-full py-3.5 px-4 rounded-xl font-bold uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-2 transition ${
                    downloadCount >= maxDownloads
                      ? 'bg-[#030A14] text-sky-400/40 cursor-not-allowed border border-[#00F0FF]/15'
                      : 'bg-[#00F0FF] hover:bg-[#38BDF8] text-black shadow-[0_0_20px_rgba(0,240,255,0.4)] active:scale-98'
                  }`}
                >
                  {isDownloading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>
                    {downloadCount >= maxDownloads 
                      ? 'Límite de Descargas Alcanzado'
                      : '⬇️ Descargar Master Audio & Stems (ZIP)'}
                  </span>
                </button>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  <button
                    id="btn-print-contract-pdf"
                    onClick={() => handlePrintContract(completedOrder)}
                    className="py-2 px-2.5 rounded-lg bg-[#030A14] hover:bg-[#0A223D] border border-[#00F0FF]/25 text-xs text-sky-100 hover:text-white flex items-center justify-center gap-1 transition"
                  >
                    <Printer className="w-3.5 h-3.5 text-[#00F0FF]" />
                    <span>PDF</span>
                  </button>

                  <button
                    id="btn-download-contract-html"
                    onClick={() => handleDownloadContractHtml(completedOrder)}
                    className="py-2 px-2.5 rounded-lg bg-[#030A14] hover:bg-[#0A223D] border border-[#00F0FF]/25 text-xs text-sky-100 hover:text-white flex items-center justify-center gap-1 transition"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#00F0FF]" />
                    <span>.HTML</span>
                  </button>

                  <button
                    id="btn-download-contract-txt"
                    onClick={() => handleDownloadContractTxt(completedOrder)}
                    className="py-2 px-2.5 rounded-lg bg-[#030A14] hover:bg-[#0A223D] border border-[#00F0FF]/25 text-xs text-sky-100 hover:text-white flex items-center justify-center gap-1 transition"
                  >
                    <Download className="w-3.5 h-3.5 text-[#00F0FF]" />
                    <span>.TXT</span>
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-sky-300/60">
                Hemos enviado una copia del recibo y contrato a <strong className="text-white">{completedOrder.buyerEmail}</strong>.
              </p>
            </div>
          ) : (
            /* CHECKOUT FORM VIEW */
            <div className="space-y-5">
              
              {/* Order Header Summary */}
              <div className="flex items-center justify-between p-4 bg-[#051525] border border-[#00F0FF]/25 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-[#00F0FF]/25">
                    <BeatCoverImage
                      coverUrl={beat.coverUrl}
                      title={beat.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">{beat.title}</h4>
                    <p className="text-xs text-[#00F0FF] font-medium">{tierInfo.name}</p>
                    <span className="text-[10px] text-sky-300/60 font-mono">{tierInfo.format}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-sky-300/60 block font-mono">
                    {isPremiumTier ? 'OFERTA PROPUESTA:' : 'TOTAL:'}
                  </span>
                  <span className="text-xl font-black text-[#00F0FF] font-mono drop-shadow-[0_0_8px_rgba(0,240,255,0.4)]">
                    {currencySymbol}{finalPrice.toFixed(2)} USD
                  </span>
                </div>
              </div>

              {/* 4TH OPTION: CUSTOM OFFER INPUT (When Premium License is selected) */}
              {isPremiumTier && (
                <div className="p-4 bg-[#051525] border-2 border-[#00F0FF]/50 rounded-2xl space-y-2.5 shadow-[0_0_20px_rgba(0,240,255,0.15)] animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#00F0FF]" />
                      <span className="text-xs font-bold font-mono text-white">
                        4. Oferta Económica por Derechos Premium
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-[#00F0FF] bg-[#00F0FF]/10 px-2 py-0.5 rounded border border-[#00F0FF]/30 font-bold">
                      Personalizable
                    </span>
                  </div>

                  <p className="text-[11px] text-sky-300/80 leading-relaxed">
                    Ingresa el monto en USD que deseas ofertar por los derechos premium completos de la pista (incluye Stems y sincronización total / TV).
                  </p>

                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sky-400 font-bold font-mono text-sm">$</span>
                    <input
                      id="input-client-offer-amount"
                      type="number"
                      min="10"
                      step="5"
                      value={clientOfferAmount}
                      onChange={(e) => setClientOfferAmount(Number(e.target.value))}
                      placeholder="Monto de tu oferta (USD)"
                      className="w-full pl-8 pr-16 py-2.5 rounded-xl bg-[#030A14] border border-[#00F0FF]/40 text-base font-bold font-mono text-[#00F0FF] focus:outline-none focus:border-[#00F0FF]"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-sky-400/70">
                      USD
                    </span>
                  </div>

                  <p className="text-[10px] text-sky-300/60 italic">
                    * Licencia Premium: Modalidad bajo oferta negociada directamente. Requiere aceptación explícita por escrito del Productor (Samu helman en el mix).
                  </p>
                </div>
              )}

              {/* Form: Artist Details */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase font-mono tracking-wider text-sky-300/80">
                  1. Datos del Cliente / Licenciatario (Inyección Automática en Contrato)
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-sky-300/70 mb-1">Nombre Completo Legal *</label>
                    <input
                      id="input-buyer-name"
                      type="text"
                      required
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      placeholder="Ej: Carlos Mendoza"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#051525] border border-[#00F0FF]/25 text-sm text-white placeholder-sky-400/30 focus:outline-none focus:border-[#00F0FF]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-sky-300/70 mb-1">Nombre Artístico / AKA</label>
                    <input
                      id="input-artist-name"
                      type="text"
                      value={artistName}
                      onChange={(e) => setArtistName(e.target.value)}
                      placeholder="Ej: MC King"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#051525] border border-[#00F0FF]/25 text-sm text-white placeholder-sky-400/30 focus:outline-none focus:border-[#00F0FF]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-sky-300/70 mb-1">Correo Electrónico (Para recibir la licencia y token) *</label>
                  <input
                    id="input-buyer-email"
                    type="email"
                    required
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                    placeholder="tu-correo@ejemplo.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#051525] border border-[#00F0FF]/25 text-sm text-white placeholder-sky-400/30 focus:outline-none focus:border-[#00F0FF]"
                  />
                </div>
              </div>

              {/* Payment Section */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold uppercase font-mono tracking-wider text-sky-300/80">
                  2. Procesamiento de Pago PayPal
                </h4>

                <div className="bg-[#051525] border border-[#00F0FF]/25 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-[#00F0FF]/15">
                    <div className="flex items-center gap-2">
                      <PaypalLogo className="w-5 h-5" />
                      <div>
                        <p className="font-bold text-white">PayPal Instant Checkout</p>
                        <p className="text-[11px] text-sky-300/60">Destino: {paymentConfig.producerEmail}</p>
                      </div>
                    </div>
                    <span className="font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                      Sandbox / Live Verified
                    </span>
                  </div>

                  {/* Primary Checkout Action */}
                  <button
                    id="btn-execute-paypal-api"
                    onClick={handleDirectPayPalCheckout}
                    disabled={isProcessing}
                    className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-[#004B99] to-[#001E50] hover:from-[#0066CC] hover:to-[#002D7A] border border-[#00F0FF]/40 text-white flex items-center justify-center gap-2.5 shadow-lg shadow-blue-900/30 active:scale-98 transition"
                  >
                    {isProcessing ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <PaypalLogo className="w-5 h-5" />
                    )}
                    <span>
                      {isProcessing 
                        ? 'Procesando en PayPal API...' 
                        : isPremiumTier 
                          ? `Ofertar y Pagar ${currencySymbol}${finalPrice.toFixed(2)} USD con PayPal`
                          : `Pagar ${currencySymbol}${finalPrice.toFixed(2)} USD con PayPal`}
                    </span>
                  </button>

                  <div className="flex items-center justify-between text-[11px] text-sky-300/60 pt-1">
                    <span className="flex items-center gap-1">
                      <Lock className="w-3 h-3 text-[#00F0FF]" />
                      <span>Cifrado SSL 256-Bit & Token UUID</span>
                    </span>
                    <a
                      href={customPaypalLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-300/60 hover:text-[#00F0FF] flex items-center gap-1 transition underline"
                    >
                      <span>Abrir PayPal.Me directo</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
};
