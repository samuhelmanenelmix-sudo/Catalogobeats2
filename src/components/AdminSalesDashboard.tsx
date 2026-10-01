import React, { useState, useMemo } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  ShoppingBag, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  Download, 
  PlusCircle, 
  Search, 
  FileText, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Copy, 
  Check, 
  Disc, 
  Calendar, 
  User, 
  Mail, 
  Music, 
  RefreshCw,
  Sparkles,
  X,
  Printer
} from 'lucide-react';
import { Beat, PurchasedLicense, LicenseTierKey, PaymentGatewaysConfig } from '../types';
import { BeatCoverImage } from './BeatCoverImage';
import { copyToClipboard } from '../utils/beatLinks';
import { generateContractHtml, generateContractPlainText, PRODUCER_DATA } from '../utils/contractTemplate';

interface AdminSalesDashboardProps {
  beats: Beat[];
  purchases: PurchasedLicense[];
  onAddManualPurchase?: (purchase: PurchasedLicense) => void;
  onDeletePurchase?: (orderId: string) => void;
  paymentConfig: PaymentGatewaysConfig;
  currencySymbol: string;
  isStudioSession: boolean;
}

const AUTHORIZED_PRODUCER_EMAIL = 'samuhelmanenelmix@gmail.com';
const PRODUCER_NAME = 'Samu Helman';

export const AdminSalesDashboard: React.FC<AdminSalesDashboardProps> = ({
  beats,
  purchases,
  onAddManualPurchase,
  onDeletePurchase,
  paymentConfig,
  currencySymbol,
  isStudioSession,
}) => {
  // State for security lock (strictly owner-only access)
  const [isUnlocked, setIsUnlocked] = useState<boolean>(true);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState<string>('ALL');

  // Copied state
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);

  // Manual Sale Modal state
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualBeatId, setManualBeatId] = useState<string>(beats[0]?.id || '');
  const [manualTierKey, setManualTierKey] = useState<LicenseTierKey>('basic');
  const [manualAmount, setManualAmount] = useState<number>(20);
  const [manualBuyerName, setManualBuyerName] = useState('');
  const [manualBuyerEmail, setManualBuyerEmail] = useState('');
  const [manualArtistName, setManualArtistName] = useState('');
  const [manualPaymentMethod, setManualPaymentMethod] = useState('Transferencia Bancaria');
  const [manualNotes, setManualNotes] = useState('');

  // Inspect Contract Modal state
  const [inspectingContract, setInspectingContract] = useState<PurchasedLicense | null>(null);

  // Delete Confirmation state
  const [deleteConfirmOrderId, setDeleteConfirmOrderId] = useState<string | null>(null);

  // Total metrics calculations
  const totalSalesCount = purchases.length;
  const totalRevenueUsd = useMemo(() => {
    return purchases.reduce((acc, p) => acc + (Number(p.amountPaid) || 0), 0);
  }, [purchases]);

  const averageTicketUsd = totalSalesCount > 0 ? totalRevenueUsd / totalSalesCount : 0;

  // Breakdown by license tier
  const tierBreakdown = useMemo(() => {
    const counts = { basic: 0, media: 0, exclusive: 0, premium: 0 };
    const amounts = { basic: 0, media: 0, exclusive: 0, premium: 0 };

    purchases.forEach((p) => {
      const key = (p.tierKey || 'basic') as keyof typeof counts;
      if (counts[key] !== undefined) {
        counts[key] += 1;
        amounts[key] += Number(p.amountPaid) || 0;
      }
    });

    return { counts, amounts };
  }, [purchases]);

  // Top selling beat
  const topSellingBeat = useMemo(() => {
    if (purchases.length === 0) return null;
    const beatMap = new Map<string, { title: string; count: number; revenue: number }>();
    purchases.forEach((p) => {
      const current = beatMap.get(p.beatTitle) || { title: p.beatTitle, count: 0, revenue: 0 };
      current.count += 1;
      current.revenue += Number(p.amountPaid) || 0;
      beatMap.set(p.beatTitle, current);
    });
    const sorted = Array.from(beatMap.values()).sort((a, b) => b.revenue - a.revenue);
    return sorted[0] || null;
  }, [purchases]);

  // Filtered purchases
  const filteredPurchases = useMemo(() => {
    return purchases.filter((p) => {
      const matchesTier = filterTier === 'ALL' || p.tierKey === filterTier;
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = !query || 
        p.beatTitle.toLowerCase().includes(query) ||
        p.buyerName.toLowerCase().includes(query) ||
        p.buyerEmail.toLowerCase().includes(query) ||
        (p.artistStageName && p.artistStageName.toLowerCase().includes(query)) ||
        p.orderId.toLowerCase().includes(query);
      return matchesTier && matchesSearch;
    });
  }, [purchases, searchQuery, filterTier]);

  // Handle PIN unlock
  const handleUnlockWithPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === '7777' || pinInput.toLowerCase() === 'samu' || pinInput.toLowerCase() === 'samuhelman') {
      setIsUnlocked(true);
      setPinError(null);
      setPinInput('');
    } else {
      setPinError('PIN o clave incorrecta. Por favor intenta de nuevo.');
    }
  };

  // Copy Order ID / Download link
  const handleCopyText = async (text: string, orderId: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedOrderId(orderId);
      setTimeout(() => setCopiedOrderId(null), 2500);
    }
  };

  // Handle Export CSV
  const handleExportCsv = () => {
    if (purchases.length === 0) return;
    const headers = ['ID_Orden', 'Fecha', 'Beat', 'Licencia', 'Monto_USD', 'Comprador', 'Nombre_Artistico', 'Email', 'Metodo_Pago'];
    const rows = purchases.map((p) => [
      `"${p.orderId}"`,
      `"${p.purchaseDate}"`,
      `"${p.beatTitle}"`,
      `"${p.tierName || p.tierKey}"`,
      p.amountPaid.toFixed(2),
      `"${p.buyerName}"`,
      `"${p.artistStageName || ''}"`,
      `"${p.buyerEmail}"`,
      `"${p.paymentMethod || 'PayPal'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Ventas_Samu_Helman_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle Add Manual Sale Submit
  const handleManualSaleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedBeat = beats.find(b => b.id === manualBeatId) || beats[0];
    const tierNameMap: Record<LicenseTierKey, string> = {
      basic: 'Licencia Básica (MP3)',
      media: 'Licencia Media (WAV)',
      exclusive: 'Licencia Exclusiva',
      premium: 'Licencia Premium (Oferta Personalizada)'
    };

    const orderId = `ORD-MANUAL-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
    const purchaseDate = new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const effectiveArtist = manualArtistName.trim() || manualBuyerName.trim();

    const newSale: PurchasedLicense = {
      orderId,
      beatTitle: selectedBeat?.title || 'Beat Instrumental',
      beatId: selectedBeat?.id || 'manual-beat',
      producer: PRODUCER_DATA.name,
      producerEmail: PRODUCER_DATA.email,
      buyerName: manualBuyerName.trim() || 'Comprador Directo',
      buyerEmail: manualBuyerEmail.trim() || 'cliente@ejemplo.com',
      artistStageName: effectiveArtist,
      tierName: tierNameMap[manualTierKey] || 'Licencia Estándar',
      tierKey: manualTierKey,
      amountPaid: Number(manualAmount) || 0,
      currency: 'USD',
      paymentMethod: manualPaymentMethod || 'Venta Manual Directa',
      transactionRef: orderId,
      purchaseDate,
      contractText: `Venta manual registrada por ${PRODUCER_NAME}. Pago confirmado por ${manualPaymentMethod}. Orden: ${orderId}. ${manualNotes ? 'Notas: ' + manualNotes : ''}`,
      contractHtml: generateContractHtml({
        buyerName: manualBuyerName.trim() || 'Comprador Directo',
        buyerEmail: manualBuyerEmail.trim() || 'cliente@ejemplo.com',
        artistStageName: effectiveArtist,
        beatTitle: selectedBeat?.title || 'Beat Instrumental',
        purchaseDate,
        tierKey: manualTierKey,
        tierName: tierNameMap[manualTierKey],
        amountPaid: Number(manualAmount) || 0,
        transactionId: orderId
      })
    };

    if (onAddManualPurchase) {
      onAddManualPurchase(newSale);
    }

    // Reset and close
    setManualBuyerName('');
    setManualBuyerEmail('');
    setManualArtistName('');
    setManualNotes('');
    setIsManualModalOpen(false);
  };

  // Handle Load Demo Sales for quick preview
  const handleLoadDemoSales = () => {
    if (!onAddManualPurchase) return;
    const demoItems: PurchasedLicense[] = [
      {
        orderId: `ORD-PAYPAL-${Date.now().toString(36).toUpperCase()}-01`,
        beatTitle: beats[0]?.title || 'El Subestimado',
        beatId: beats[0]?.id || 'demo-1',
        producer: PRODUCER_DATA.name,
        producerEmail: PRODUCER_DATA.email,
        buyerName: 'Lucas Martínez',
        buyerEmail: 'lucas.martinez@musica.com',
        artistStageName: 'Lucas Flow',
        tierName: 'Licencia Media (WAV)',
        tierKey: 'media',
        amountPaid: 45.00,
        currency: 'USD',
        paymentMethod: 'PayPal v2 API Checkout',
        transactionRef: 'PP-TX-984310',
        purchaseDate: new Date(Date.now() - 86400000 * 2).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }),
        contractText: 'Contrato de Licencia WAV Oficial emitido por Samu Helman en el mix.',
        contractHtml: '<p>Contrato Oficial WAV emitido por Samu Helman</p>'
      },
      {
        orderId: `ORD-PAYPAL-${Date.now().toString(36).toUpperCase()}-02`,
        beatTitle: beats[1]?.title || 'Astro Phantom',
        beatId: beats[1]?.id || 'demo-2',
        producer: PRODUCER_DATA.name,
        producerEmail: PRODUCER_DATA.email,
        buyerName: 'Carlos Benítez',
        buyerEmail: 'carlos.rap@gmail.com',
        artistStageName: 'CB King',
        tierName: 'Licencia Básica (MP3)',
        tierKey: 'basic',
        amountPaid: 20.00,
        currency: 'USD',
        paymentMethod: 'PayPal v2 API Checkout',
        transactionRef: 'PP-TX-551299',
        purchaseDate: new Date(Date.now() - 86400000 * 5).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }),
        contractText: 'Contrato de Licencia MP3 Oficial emitido por Samu Helman en el mix.',
        contractHtml: '<p>Contrato Oficial MP3 emitido por Samu Helman</p>'
      },
      {
        orderId: `ORD-PAYPAL-${Date.now().toString(36).toUpperCase()}-03`,
        beatTitle: beats[0]?.title || 'El Subestimado',
        beatId: beats[0]?.id || 'demo-3',
        producer: PRODUCER_DATA.name,
        producerEmail: PRODUCER_DATA.email,
        buyerName: 'Estudio Alpha Records',
        buyerEmail: 'alpha.records.label@gmail.com',
        artistStageName: 'Matías R.',
        tierName: 'Licencia Exclusiva',
        tierKey: 'exclusive',
        amountPaid: 150.00,
        currency: 'USD',
        paymentMethod: 'PayPal v2 API Checkout',
        transactionRef: 'PP-TX-773120',
        purchaseDate: new Date(Date.now() - 86400000 * 12).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }),
        contractText: 'Contrato de Derechos Exclusivos emitido por Samu Helman en el mix.',
        contractHtml: '<p>Contrato Exclusivo emitido por Samu Helman</p>'
      }
    ];

    demoItems.forEach(item => onAddManualPurchase(item));
  };

  // -------------------------------------------------------------
  // PRIVACY LOCK SCREEN: Show if locked to protect financial data
  // -------------------------------------------------------------
  if (!isUnlocked) {
    return (
      <div className="bg-[#020710] border border-[#00F0FF]/30 rounded-3xl p-6 sm:p-8 text-center relative overflow-hidden shadow-[0_0_40px_rgba(0,240,255,0.08)]">
        <div className="max-w-md mx-auto py-6">
          <div className="w-16 h-16 rounded-2xl bg-[#00F0FF]/15 border border-[#00F0FF]/50 text-[#00F0FF] flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(0,240,255,0.3)]">
            <Lock className="w-8 h-8" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#FF5500]/15 border border-[#FF5500]/50 text-[#FF5500] mb-2 uppercase tracking-wider">
            <span>🛡️ Acceso Exclusivo de Propietario</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-display mb-2">
            Panel de Ventas Protegido
          </h3>

          <p className="text-xs sm:text-sm text-sky-200/70 mb-6 leading-relaxed">
            Este apartado contiene el registro contable confidencial, ingresos totales y la base de datos de compradores de <strong className="text-white font-mono">{AUTHORIZED_PRODUCER_EMAIL}</strong>.
          </p>

          <form onSubmit={handleUnlockWithPin} className="flex flex-col sm:flex-row items-center gap-2.5 justify-center">
            <input
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Ingresa PIN maestro (ej: 7777)"
              className="w-full sm:w-60 px-4 py-2.5 bg-[#051525] border border-[#00F0FF]/40 rounded-xl text-sm text-white font-mono placeholder-sky-400/40 focus:outline-none focus:border-[#00F0FF] focus:shadow-[0_0_15px_rgba(0,240,255,0.25)] text-center"
              autoFocus
            />
            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-mono font-extrabold text-xs uppercase bg-[#00F0FF] hover:bg-[#38BDF8] text-black shadow-[0_0_15px_rgba(0,240,255,0.4)] transition active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Unlock className="w-4 h-4" />
              <span>Desbloquear</span>
            </button>
          </form>

          {pinError && (
            <p className="text-xs text-rose-400 font-mono mt-2.5 flex items-center justify-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{pinError}</span>
            </p>
          )}

          {/* Quick unlock button for developer/studio session */}
          {isStudioSession && (
            <div className="mt-5 pt-4 border-t border-sky-900/40">
              <button
                type="button"
                onClick={() => setIsUnlocked(true)}
                className="text-xs font-mono text-sky-400 hover:text-[#00F0FF] underline underline-offset-4 transition"
              >
                ● Autenticar como Samu Helman en esta sesión de estudio
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // UNLOCKED VIEW: FULL PRODUCER SALES DASHBOARD
  // -------------------------------------------------------------
  return (
    <div className="bg-[#020710] border border-[#00F0FF]/35 rounded-3xl p-5 sm:p-7 text-[#E0F2FE] shadow-[0_0_35px_rgba(0,240,255,0.12)] relative overflow-hidden">
      
      {/* Background radial glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#00F0FF]/10 blur-3xl pointer-events-none -mr-20 -mt-20 rounded-full" />

      {/* Top Header: Producer Verified ID & Controls */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#00F0FF]/20">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold font-mono uppercase tracking-wider bg-[#FF5500] text-black shadow-[0_0_12px_rgba(255,85,0,0.5)]">
              Acceso Exclusivo • Samu Helman
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>{AUTHORIZED_PRODUCER_EMAIL}</span>
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-display flex items-center gap-2">
            <span>Control de Ventas & Facturación de Beats</span>
          </h2>
          <p className="text-xs sm:text-sm text-sky-200/70 max-w-2xl mt-0.5">
            Monitorea en tiempo real todas las licencias vendidas, montos recaudados en PayPal y ventas manuales directas con contratos emitidos.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            id="admin-btn-manual-sale"
            onClick={() => setIsManualModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono font-bold bg-[#00F0FF] hover:bg-[#38BDF8] text-black shadow-[0_0_15px_rgba(0,240,255,0.35)] transition active:scale-95"
            title="Registrar una venta realizada por fuera de PayPal (transferencia, efectivo, etc.)"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ Registrar Venta Manual</span>
          </button>

          <button
            id="admin-btn-export-csv"
            onClick={handleExportCsv}
            disabled={purchases.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono font-bold bg-[#051525] hover:bg-[#0A223D] border border-[#00F0FF]/40 text-[#00F0FF] transition disabled:opacity-40 disabled:cursor-not-allowed"
            title="Exportar balance completo en formato CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>

          <button
            id="admin-btn-lock-sales"
            onClick={() => setIsUnlocked(false)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-semibold bg-[#051525] hover:bg-rose-950/40 border border-sky-800/60 hover:border-rose-500/50 text-sky-300 hover:text-rose-300 transition"
            title="Bloquear pantalla para ocultar métricas financieras"
          >
            <Lock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Bloquear</span>
          </button>
        </div>
      </div>

      {/* Hero Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-5">
        
        {/* Total Sales Count */}
        <div className="bg-[#04111E] border border-[#00F0FF]/30 rounded-2xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-sky-300/80">
              Ventas Totales
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#00F0FF]/15 border border-[#00F0FF]/40 flex items-center justify-center text-[#00F0FF]">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-white font-mono">
              {totalSalesCount}
            </span>
            <span className="text-xs text-sky-400/80 font-mono">licencias vendidas</span>
          </div>
          <div className="mt-2 text-[11px] text-sky-300/60 font-mono flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Registro acumulado oficial</span>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-[#04111E] border border-emerald-500/40 rounded-2xl p-4 relative overflow-hidden shadow-[0_0_20px_rgba(16,185,129,0.1)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-300/80">
              Ingresos Totales (USD)
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono">
              ${totalRevenueUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-300/70 font-mono">
            {currencySymbol} {paymentConfig.currency} • Recaudación Bruta
          </div>
        </div>

        {/* Average Ticket */}
        <div className="bg-[#04111E] border border-[#00F0FF]/30 rounded-2xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-sky-300/80">
              Ticket Promedio
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#00F0FF]/15 border border-[#00F0FF]/40 flex items-center justify-center text-[#00F0FF]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-[#38BDF8] font-mono">
              ${averageTicketUsd.toFixed(2)}
            </span>
            <span className="text-xs text-sky-400/80 font-mono">/ orden</span>
          </div>
          <div className="mt-2 text-[11px] text-sky-300/60 font-mono">
            Valor medio por comprador
          </div>
        </div>

        {/* Top Beat */}
        <div className="bg-[#04111E] border border-[#00F0FF]/30 rounded-2xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-sky-300/80">
              Beat Más Vendido
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#FF5500]/15 border border-[#FF5500]/40 flex items-center justify-center text-[#FF5500]">
              <Disc className="w-4 h-4" />
            </div>
          </div>
          {topSellingBeat ? (
            <div>
              <div className="text-base sm:text-lg font-bold text-white truncate" title={topSellingBeat.title}>
                {topSellingBeat.title}
              </div>
              <div className="mt-1 text-xs text-[#00F0FF] font-mono">
                {topSellingBeat.count} ventas • ${topSellingBeat.revenue.toFixed(2)} USD
              </div>
            </div>
          ) : (
            <div className="text-xs text-sky-300/50 font-mono pt-1">
              Sin ventas registradas aún
            </div>
          )}
          <div className="mt-2 text-[10px] text-sky-400/60 font-mono">
            Mayor rendimiento en catálogo
          </div>
        </div>

      </div>

      {/* Breakdown by License Tier Strip */}
      <div className="mt-4 p-4 rounded-2xl bg-[#030D19] border border-[#00F0FF]/25">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-sky-300/90">
            Desglose por Tipo de Licencia
          </span>
          <span className="text-[11px] text-sky-400/60 font-mono">
            {totalSalesCount} licencias totales comercializadas
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          
          <div className="p-3 rounded-xl bg-[#051525] border border-sky-500/25">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-sky-300 font-mono">Básica (MP3)</span>
              <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold rounded bg-sky-500/20 text-sky-300">$20</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-xl font-bold text-white font-mono">{tierBreakdown.counts.basic}</span>
              <span className="text-xs font-mono text-emerald-400">${tierBreakdown.amounts.basic.toFixed(2)}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#051525] border border-blue-500/25">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-blue-300 font-mono">Media (WAV)</span>
              <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold rounded bg-blue-500/20 text-blue-300">$45</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-xl font-bold text-white font-mono">{tierBreakdown.counts.media}</span>
              <span className="text-xs font-mono text-emerald-400">${tierBreakdown.amounts.media.toFixed(2)}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#051525] border border-amber-500/25">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-300 font-mono">Exclusiva</span>
              <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold rounded bg-amber-500/20 text-amber-300">$150</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-xl font-bold text-white font-mono">{tierBreakdown.counts.exclusive}</span>
              <span className="text-xs font-mono text-emerald-400">${tierBreakdown.amounts.exclusive.toFixed(2)}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#051525] border border-purple-500/25">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-purple-300 font-mono">Premium (Oferta)</span>
              <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold rounded bg-purple-500/20 text-purple-300">Custom</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-xl font-bold text-white font-mono">{tierBreakdown.counts.premium}</span>
              <span className="text-xs font-mono text-emerald-400">${tierBreakdown.amounts.premium.toFixed(2)}</span>
            </div>
          </div>

        </div>
      </div>

      {/* Transactions & Sales History Table Section */}
      <div className="mt-6 pt-5 border-t border-[#00F0FF]/20">
        
        {/* Table Controls: Search & Filters */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <span>Historial Detallado de Ventas</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30">
                {filteredPurchases.length} de {purchases.length}
              </span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-sky-400/60 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="search-sales-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por beat, cliente, email..."
                className="w-full pl-8 pr-3 py-1.5 bg-[#051525] border border-[#00F0FF]/30 rounded-xl text-xs text-white placeholder-sky-400/40 focus:outline-none focus:border-[#00F0FF]"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-sky-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Filter by Tier */}
            <select
              id="filter-sales-tier"
              value={filterTier}
              onChange={(e) => setFilterTier(e.target.value)}
              className="px-2.5 py-1.5 bg-[#051525] border border-[#00F0FF]/30 rounded-xl text-xs text-sky-200 font-mono focus:outline-none focus:border-[#00F0FF]"
            >
              <option value="ALL">Todas las Licencias</option>
              <option value="basic">Básica (MP3)</option>
              <option value="media">Media (WAV)</option>
              <option value="exclusive">Exclusiva</option>
              <option value="premium">Premium</option>
            </select>
          </div>
        </div>

        {/* Empty state or Table */}
        {purchases.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#030D19] border border-dashed border-[#00F0FF]/30 text-center">
            <ShoppingBag className="w-10 h-10 text-sky-400/40 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-white font-mono">
              Aún no hay ventas registradas
            </h4>
            <p className="text-xs text-sky-300/70 max-w-md mx-auto mt-1 mb-4 leading-relaxed">
              Cada vez que un cliente adquiera un beat a través de la pasarela de PayPal o registres una venta manual, aparecerá aquí con su monto, contrato emitido y datos de comprador.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <button
                onClick={() => setIsManualModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-[#00F0FF] text-black text-xs font-mono font-bold hover:bg-[#38BDF8] transition shadow-[0_0_12px_rgba(0,240,255,0.3)]"
              >
                + Registrar Primera Venta Manual
              </button>
              <button
                onClick={handleLoadDemoSales}
                className="px-4 py-2 rounded-xl bg-[#051525] border border-[#00F0FF]/40 text-[#00F0FF] text-xs font-mono hover:bg-[#0A223D] transition flex items-center gap-1.5"
                title="Cargar 3 ventas de demostración para ver estadísticas completas"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Cargar Ventas de Prueba (Demo)</span>
              </button>
            </div>
          </div>
        ) : filteredPurchases.length === 0 ? (
          <div className="p-6 rounded-2xl bg-[#030D19] border border-[#00F0FF]/20 text-center">
            <p className="text-xs text-sky-300/70 font-mono">
              No se encontraron ventas con los filtros actuales.
            </p>
            <button
              onClick={() => { setSearchQuery(''); setFilterTier('ALL'); }}
              className="mt-2 text-xs text-[#00F0FF] underline underline-offset-4 font-mono"
            >
              Restablecer filtros
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-[#00F0FF]/20 bg-[#030D19]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#00F0FF]/20 bg-[#051525] text-sky-300/70 font-mono text-[10px] uppercase tracking-wider">
                  <th className="py-3 px-3.5">Fecha</th>
                  <th className="py-3 px-3.5">Beat Instrumental</th>
                  <th className="py-3 px-3.5">Licencia</th>
                  <th className="py-3 px-3.5">Monto Pagado</th>
                  <th className="py-3 px-3.5">Comprador / Artista</th>
                  <th className="py-3 px-3.5">Método / Orden</th>
                  <th className="py-3 px-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#00F0FF]/15 font-mono">
                {filteredPurchases.map((purchase) => {
                  const targetBeat = beats.find(b => b.id === purchase.beatId);
                  const isCopied = copiedOrderId === purchase.orderId;

                  const tierColorMap: Record<string, { bg: string; text: string; border: string }> = {
                    basic: { bg: 'bg-sky-950/60', text: 'text-sky-300', border: 'border-sky-500/40' },
                    media: { bg: 'bg-blue-950/60', text: 'text-blue-300', border: 'border-blue-500/40' },
                    exclusive: { bg: 'bg-amber-950/60', text: 'text-amber-300', border: 'border-amber-500/40' },
                    premium: { bg: 'bg-purple-950/60', text: 'text-purple-300', border: 'border-purple-500/40' }
                  };
                  const colors = tierColorMap[purchase.tierKey] || tierColorMap.basic;

                  return (
                    <tr key={purchase.orderId} className="hover:bg-[#05182C] transition-colors">
                      {/* Date */}
                      <td className="py-3 px-3.5 text-sky-300/80 whitespace-nowrap text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-sky-400/60 shrink-0" />
                          <span>{purchase.purchaseDate}</span>
                        </div>
                      </td>

                      {/* Beat */}
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg overflow-hidden border border-[#00F0FF]/30 shrink-0 bg-black">
                            <BeatCoverImage
                              coverUrl={targetBeat?.coverUrl}
                              title={purchase.beatTitle}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="max-w-[150px] truncate">
                            <span className="font-bold text-white block truncate font-sans">
                              {purchase.beatTitle}
                            </span>
                            <span className="text-[10px] text-sky-400/60 block truncate">
                              ID: {purchase.beatId}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Tier */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${colors.bg} ${colors.text} ${colors.border}`}>
                          {purchase.tierName || purchase.tierKey}
                        </span>
                      </td>

                      {/* Amount Paid */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span className="text-sm font-black text-emerald-400 font-mono">
                          ${Number(purchase.amountPaid || 0).toFixed(2)} USD
                        </span>
                      </td>

                      {/* Buyer */}
                      <td className="py-3 px-3.5">
                        <div className="max-w-[180px] truncate">
                          <span className="text-white font-medium block truncate flex items-center gap-1 font-sans">
                            <User className="w-3 h-3 text-sky-400 shrink-0" />
                            <span>{purchase.buyerName}</span>
                            {purchase.artistStageName && purchase.artistStageName !== purchase.buyerName && (
                              <span className="text-[10px] text-sky-300/70 font-mono">({purchase.artistStageName})</span>
                            )}
                          </span>
                          <span className="text-[10px] text-sky-300/60 block truncate font-mono">
                            {purchase.buyerEmail}
                          </span>
                        </div>
                      </td>

                      {/* Payment Method & Order ID */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div>
                          <span className="text-[10px] text-sky-300/80 block font-mono">
                            {purchase.paymentMethod || 'PayPal'}
                          </span>
                          <span className="text-[9.5px] text-[#00F0FF]/80 font-mono truncate max-w-[120px] block" title={purchase.orderId}>
                            {purchase.orderId}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Contract Button */}
                          <button
                            type="button"
                            onClick={() => setInspectingContract(purchase)}
                            title="Inspeccionar Contrato Oficial Emitido"
                            className="p-1.5 rounded-lg bg-[#00F0FF]/10 hover:bg-[#00F0FF]/20 border border-[#00F0FF]/30 text-[#00F0FF] transition"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>

                          {/* Copy Order ID */}
                          <button
                            type="button"
                            onClick={() => handleCopyText(purchase.orderId, purchase.orderId)}
                            title="Copiar ID de orden para el cliente"
                            className={`p-1.5 rounded-lg border transition ${
                              isCopied
                                ? 'bg-emerald-500/30 border-emerald-400 text-emerald-300'
                                : 'bg-[#051525] border-sky-800/60 text-sky-300 hover:text-white'
                            }`}
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>

                          {/* Delete purchase button */}
                          {onDeletePurchase && (
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmOrderId(purchase.orderId)}
                              title="Eliminar registro de venta"
                              className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-400 hover:text-rose-200 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* ------------------------------------------------------------------ */}
      {/* MODAL: REGISTRAR VENTA MANUAL (FUERA DE PAYPAL)                    */}
      {/* ------------------------------------------------------------------ */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#030A14] border border-[#00F0FF]/40 rounded-3xl p-5 sm:p-6 w-full max-w-lg text-[#E0F2FE] shadow-[0_0_40px_rgba(0,240,255,0.25)] relative">
            <div className="flex items-center justify-between pb-3 border-b border-[#00F0FF]/20 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#00F0FF]/15 text-[#00F0FF]">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-display">Registrar Venta Manual / Directa</h3>
                  <p className="text-[11px] text-sky-300/70 font-mono">Para transferencias, efectivo o pagos fuera de PayPal</p>
                </div>
              </div>
              <button 
                onClick={() => setIsManualModalOpen(false)}
                className="p-1.5 rounded-lg text-sky-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleManualSaleSubmit} className="space-y-3.5">
              
              {/* Select Beat */}
              <div>
                <label className="block text-xs font-mono font-bold text-sky-300 uppercase mb-1">
                  Beat Instrumental Vendido:
                </label>
                <select
                  value={manualBeatId}
                  onChange={(e) => setManualBeatId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#051525] border border-[#00F0FF]/30 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-[#00F0FF]"
                >
                  {beats.map((b) => (
                    <option key={b.id} value={b.id} className="bg-[#030A14] text-white">
                      {b.title} ({b.bpm} BPM - {b.genre})
                    </option>
                  ))}
                </select>
              </div>

              {/* License Tier & Amount */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold text-sky-300 uppercase mb-1">
                    Tipo de Licencia:
                  </label>
                  <select
                    value={manualTierKey}
                    onChange={(e) => {
                      const tier = e.target.value as LicenseTierKey;
                      setManualTierKey(tier);
                      if (tier === 'basic') setManualAmount(20);
                      if (tier === 'media') setManualAmount(45);
                      if (tier === 'exclusive') setManualAmount(150);
                      if (tier === 'premium') setManualAmount(250);
                    }}
                    className="w-full px-3 py-2 bg-[#051525] border border-[#00F0FF]/30 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-[#00F0FF]"
                  >
                    <option value="basic">Básica (MP3 - $20)</option>
                    <option value="media">Media (WAV - $45)</option>
                    <option value="exclusive">Exclusiva ($150)</option>
                    <option value="premium">Premium (Oferta)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-sky-300 uppercase mb-1">
                    Monto Cobrado (USD):
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sky-400 font-mono text-xs">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={manualAmount}
                      onChange={(e) => setManualAmount(Number(e.target.value))}
                      className="w-full pl-7 pr-3 py-2 bg-[#051525] border border-[#00F0FF]/30 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-[#00F0FF]"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Buyer info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold text-sky-300 uppercase mb-1">
                    Nombre del Comprador:
                  </label>
                  <input
                    type="text"
                    value={manualBuyerName}
                    onChange={(e) => setManualBuyerName(e.target.value)}
                    placeholder="Ej: Juan Pérez"
                    className="w-full px-3 py-2 bg-[#051525] border border-[#00F0FF]/30 rounded-xl text-xs text-white placeholder-sky-400/40 focus:outline-none focus:border-[#00F0FF]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-sky-300 uppercase mb-1">
                    Nombre Artístico (Opcional):
                  </label>
                  <input
                    type="text"
                    value={manualArtistName}
                    onChange={(e) => setManualArtistName(e.target.value)}
                    placeholder="Ej: JP Flow"
                    className="w-full px-3 py-2 bg-[#051525] border border-[#00F0FF]/30 rounded-xl text-xs text-white placeholder-sky-400/40 focus:outline-none focus:border-[#00F0FF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-sky-300 uppercase mb-1">
                  Email del Cliente:
                </label>
                <input
                  type="email"
                  value={manualBuyerEmail}
                  onChange={(e) => setManualBuyerEmail(e.target.value)}
                  placeholder="cliente@ejemplo.com"
                  className="w-full px-3 py-2 bg-[#051525] border border-[#00F0FF]/30 rounded-xl text-xs text-white placeholder-sky-400/40 focus:outline-none focus:border-[#00F0FF]"
                  required
                />
              </div>

              {/* Payment Method & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold text-sky-300 uppercase mb-1">
                    Método de Pago:
                  </label>
                  <select
                    value={manualPaymentMethod}
                    onChange={(e) => setManualPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-[#051525] border border-[#00F0FF]/30 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-[#00F0FF]"
                  >
                    <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                    <option value="Mercado Pago">Mercado Pago</option>
                    <option value="Efectivo / Cash">Efectivo / Mano a mano</option>
                    <option value="Bizum / Zelle">Bizum / Zelle</option>
                    <option value="Western Union">Western Union</option>
                    <option value="PayPal Directo">PayPal Directo (Factura)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-sky-300 uppercase mb-1">
                    Notas o Referencia:
                  </label>
                  <input
                    type="text"
                    value={manualNotes}
                    onChange={(e) => setManualNotes(e.target.value)}
                    placeholder="Ej: Acordado por WhatsApp"
                    className="w-full px-3 py-2 bg-[#051525] border border-[#00F0FF]/30 rounded-xl text-xs text-white placeholder-sky-400/40 focus:outline-none focus:border-[#00F0FF]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#00F0FF]/20 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-mono text-sky-300 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-mono font-extrabold uppercase bg-[#00F0FF] hover:bg-[#38BDF8] text-black shadow-[0_0_15px_rgba(0,240,255,0.4)] transition"
                >
                  ✓ Guardar Venta y Emitir Registro
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MODAL: INSPECCIONAR CONTRATO OFICIAL                               */}
      {/* ------------------------------------------------------------------ */}
      {inspectingContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0B1726] border border-[#00F0FF]/40 rounded-3xl p-5 sm:p-6 w-full max-w-2xl max-h-[90vh] flex flex-col text-white shadow-[0_0_40px_rgba(0,240,255,0.25)] relative">
            
            <div className="flex items-center justify-between pb-3 border-b border-[#00F0FF]/20 shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#00F0FF]" />
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white font-display">
                    Contrato Oficial Emitido • {inspectingContract.beatTitle}
                  </h3>
                  <span className="text-[10px] font-mono text-sky-300/70">
                    Orden: {inspectingContract.orderId} • Comprador: {inspectingContract.buyerName}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setInspectingContract(null)}
                className="p-1.5 rounded-lg text-sky-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Contract content preview */}
            <div className="flex-1 overflow-y-auto my-4 p-4 rounded-xl bg-white text-slate-900 text-xs font-serif leading-relaxed border border-slate-300">
              <div 
                dangerouslySetInnerHTML={{ 
                  __html: inspectingContract.contractHtml || `<pre class="font-mono text-xs whitespace-pre-wrap">${inspectingContract.contractText}</pre>` 
                }} 
              />
            </div>

            {/* Footer controls */}
            <div className="pt-3 border-t border-[#00F0FF]/20 flex items-center justify-between gap-2 shrink-0">
              <span className="text-[11px] font-mono text-emerald-400 font-bold">
                Monto: ${Number(inspectingContract.amountPaid || 0).toFixed(2)} USD ({inspectingContract.tierName})
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const blob = new Blob([inspectingContract.contractHtml || inspectingContract.contractText], { type: 'text/html;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `Contrato_${inspectingContract.beatTitle.replace(/\s+/g, '_')}_${inspectingContract.orderId}.html`;
                    link.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold bg-[#051525] border border-[#00F0FF]/40 text-[#00F0FF] hover:bg-[#0A223D] flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar Contrato</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInspectingContract(null)}
                  className="px-4 py-1.5 rounded-xl text-xs font-mono font-bold bg-[#00F0FF] text-black hover:bg-[#38BDF8] transition"
                >
                  Cerrar
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MODAL: CONFIRMAR ELIMINACIÓN DE VENTA                              */}
      {/* ------------------------------------------------------------------ */}
      {deleteConfirmOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#030A14] border border-rose-500/50 rounded-2xl p-5 w-full max-w-sm text-white text-center shadow-[0_0_30px_rgba(244,63,94,0.3)]">
            <Trash2 className="w-8 h-8 text-rose-400 mx-auto mb-2" />
            <h4 className="text-sm font-bold font-display">¿Eliminar registro de venta?</h4>
            <p className="text-xs text-sky-200/70 mt-1 mb-4 font-mono">
              Se eliminará la orden <strong className="text-rose-300">{deleteConfirmOrderId}</strong> del balance. Esta acción es irreversible.
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmOrderId(null)}
                className="px-3 py-1.5 rounded-xl text-xs font-mono text-sky-300 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeletePurchase) {
                    onDeletePurchase(deleteConfirmOrderId);
                  }
                  setDeleteConfirmOrderId(null);
                }}
                className="px-4 py-1.5 rounded-xl text-xs font-mono font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_10px_rgba(244,63,94,0.4)] transition"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
