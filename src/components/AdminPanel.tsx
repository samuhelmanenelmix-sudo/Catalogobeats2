import React, { useState } from 'react';
import { 
  PlusCircle, 
  Settings, 
  Sparkles, 
  Music, 
  DollarSign, 
  Layers, 
  ExternalLink, 
  Edit3, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  ShieldCheck,
  Disc,
  Link2,
  Copy,
  Check,
  Share2,
  Cloud,
  Database
} from 'lucide-react';
import { Beat, PaymentGatewaysConfig } from '../types';
import { BeatCoverImage } from './BeatCoverImage';
import { getBeatDirectUrl, getBeatSlug, copyToClipboard } from '../utils/beatLinks';

interface AdminPanelProps {
  beats: Beat[];
  onOpenNewBeatModal: () => void;
  onOpenPaymentSettings: () => void;
  onEditBeat: (beat: Beat) => void;
  paymentConfig: PaymentGatewaysConfig;
  currencySymbol: string;
  isCloudSynced?: boolean;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  beats,
  onOpenNewBeatModal,
  onOpenPaymentSettings,
  onEditBeat,
  paymentConfig,
  currencySymbol,
  isCloudSynced = true,
}) => {
  const [copiedBeatId, setCopiedBeatId] = useState<string | null>(null);
  const [selectedBeatForLink, setSelectedBeatForLink] = useState<string>(beats[0]?.id || '');

  const beatsWithPaypal = beats.filter(
    (b) => b.paypalLinks?.basic || b.paypalLinks?.premium || b.paypalLinks?.unlimited || b.paypalLinks?.exclusive
  ).length;

  const totalPlays = beats.reduce((acc, b) => acc + (b.plays || 0), 0);

  const handleCopyShortLink = async (beat: Beat, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    const directUrl = getBeatDirectUrl(beat);
    const success = await copyToClipboard(directUrl);
    if (success) {
      setCopiedBeatId(beat.id);
      setTimeout(() => setCopiedBeatId(null), 2500);
    }
  };

  const currentSelectedBeat = beats.find(b => b.id === selectedBeatForLink) || beats[0];

  return (
    <div className="bg-[#030A14] border border-[#00F0FF]/35 rounded-3xl p-5 sm:p-6 mb-8 text-[#E0F2FE] shadow-[0_0_30px_rgba(0,240,255,0.12)] relative overflow-hidden">
      
      {/* Subtle neon cyan glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#00F0FF]/10 blur-3xl pointer-events-none -mr-20 -mt-20 rounded-full" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        
        {/* Left: Producer Banner */}
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold font-mono uppercase tracking-wider bg-[#00F0FF] text-black shadow-[0_0_10px_#00F0FF]">
              Panel de Control Samu Helman
            </span>
            <span className="text-xs text-[#00F0FF] font-mono">
              ● Modo Administrador Activo
            </span>
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${
              isCloudSynced 
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300' 
                : 'bg-amber-950/60 border-amber-500/50 text-amber-300'
            }`}>
              <Cloud className={`w-3 h-3 ${isCloudSynced ? 'text-emerald-400' : 'text-amber-400 animate-pulse'}`} />
              <span>{isCloudSynced ? 'Base de Datos Nube (Firestore): En Tiempo Real' : 'Conectando a Firestore...'}</span>
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-display">
            Gestión de Catálogo, Precios & Enlaces de PayPal
          </h2>
          <p className="text-xs sm:text-sm text-sky-200/70 max-w-2xl mt-1">
            Sube nuevos instrumentales, edita BPM y escalas, define precios por licencias y vincula tus links de PayPal directos para automatizar las ventas.
          </p>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            <div className="bg-[#051525] border border-[#00F0FF]/25 rounded-2xl p-3">
              <span className="text-[10px] font-bold text-sky-300/70 uppercase tracking-wider block font-mono">Catálogo Total</span>
              <span className="text-lg font-bold text-white font-mono">{beats.length} Beats</span>
            </div>

            <div className="bg-[#051525] border border-[#00F0FF]/25 rounded-2xl p-3">
              <span className="text-[10px] font-bold text-sky-300/70 uppercase tracking-wider block font-mono">Con Links PayPal</span>
              <span className="text-lg font-bold text-[#00F0FF] font-mono">{beatsWithPaypal} / {beats.length}</span>
            </div>

            <div className="bg-[#051525] border border-[#00F0FF]/25 rounded-2xl p-3">
              <span className="text-[10px] font-bold text-sky-300/70 uppercase tracking-wider block font-mono">Reproducciones</span>
              <span className="text-lg font-bold text-[#38BDF8] font-mono">{totalPlays.toLocaleString()}</span>
            </div>

            <div className="bg-[#051525] border border-[#00F0FF]/25 rounded-2xl p-3">
              <span className="text-[10px] font-bold text-sky-300/70 uppercase tracking-wider block font-mono">Moneda de Cobro</span>
              <span className="text-lg font-bold text-emerald-400 font-mono">{paymentConfig.currency} ({currencySymbol})</span>
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
          <button
            id="admin-btn-new-beat"
            onClick={onOpenNewBeatModal}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-mono font-extrabold uppercase text-xs sm:text-sm text-black bg-[#00F0FF] hover:bg-[#38BDF8] shadow-[0_0_20px_rgba(0,240,255,0.4)] transition active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Subir Nuevo Beat</span>
          </button>

          <button
            id="admin-btn-payment-cfg"
            onClick={onOpenPaymentSettings}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl font-semibold text-xs text-[#E0F2FE] bg-[#051525] hover:bg-[#0A223D] border border-[#00F0FF]/30 hover:border-[#00F0FF]/60 transition"
          >
            <Settings className="w-4 h-4 text-[#00F0FF]" />
            <span>Configurar Pasarelas & PayPal</span>
          </button>
        </div>

      </div>

      {/* Quick Beat Inventory Strip */}
      <div className="mt-5 pt-4 border-t border-[#00F0FF]/20">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold font-mono uppercase tracking-wider text-sky-300/80">
            Acceso Rápido: Editar Links de PayPal por Producto
          </span>
          <span className="text-[11px] text-sky-400/60 font-mono">
            Haz clic en cualquier beat para abrir su editor individual
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none py-1">
          {beats.length === 0 ? (
            <div className="w-full py-4 px-4 bg-[#051525] border border-dashed border-[#00F0FF]/30 rounded-2xl text-center flex items-center justify-between">
              <span className="text-xs text-sky-200/70">
                El catálogo está vacío. Sube tu primer beat para gestionarlo aquí.
              </span>
              <button
                onClick={onOpenNewBeatModal}
                className="px-3 py-1.5 rounded-xl bg-[#00F0FF]/15 hover:bg-[#00F0FF]/25 border border-[#00F0FF]/40 text-[#00F0FF] text-xs font-mono font-bold flex items-center gap-1 transition shadow-[0_0_10px_rgba(0,240,255,0.2)]"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Agregar Beat</span>
              </button>
            </div>
          ) : (
            beats.map((beat) => {
              const hasLinks = Boolean(
                beat.paypalLinks?.basic || beat.paypalLinks?.premium || beat.paypalLinks?.unlimited || beat.paypalLinks?.exclusive
              );

              return (
                <div
                  key={beat.id}
                  onClick={() => onEditBeat(beat)}
                  className="shrink-0 flex items-center gap-2.5 px-3 py-2 bg-[#051525] border border-[#00F0FF]/25 hover:border-[#00F0FF] rounded-xl cursor-pointer transition text-xs group"
                  title={`Editar ${beat.title} e ingresar links de PayPal`}
                >
                  <div className="w-7 h-7 rounded-lg overflow-hidden shrink-0 border border-[#00F0FF]/25">
                    <BeatCoverImage
                      coverUrl={beat.coverUrl}
                      title={beat.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="max-w-[120px] truncate">
                    <span className="font-bold text-white group-hover:text-[#00F0FF] block truncate">
                      {beat.title}
                    </span>
                    <span className="text-[10px] text-sky-300/60 font-mono">
                      {beat.bpm} BPM • {beat.genre}
                    </span>
                  </div>
                  <div className="ml-1 flex items-center gap-1.5">
                    {hasLinks ? (
                      <span className="text-[10px] text-[#00F0FF] bg-[#00F0FF]/15 border border-[#00F0FF]/40 px-1.5 py-0.5 rounded font-mono font-bold" title="Links de PayPal configurados">
                        🅿️ OK
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-300 bg-amber-950/60 border border-amber-500/30 px-1.5 py-0.5 rounded font-mono" title="Falta configurar links de PayPal">
                        ⚠️ Configurar
                      </span>
                    )}
                    
                    <button
                      type="button"
                      id={`admin-btn-copy-shortlink-${beat.id}`}
                      onClick={(e) => handleCopyShortLink(beat, e)}
                      title={`Copiar Enlace Corto para YouTube: ?beat=${getBeatSlug(beat)}`}
                      className={`p-1.5 rounded-lg border transition flex items-center justify-center ${
                        copiedBeatId === beat.id
                          ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.5)]'
                          : 'bg-[#00F0FF]/10 border-[#00F0FF]/30 text-[#00F0FF] hover:bg-[#00F0FF]/25 hover:border-[#00F0FF]'
                      }`}
                    >
                      {copiedBeatId === beat.id ? (
                        <Check className="w-3 h-3 text-emerald-300 animate-in zoom-in" />
                      ) : (
                        <Link2 className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                  <Edit3 className="w-3 h-3 text-sky-400/60 group-hover:text-white" />
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Single Beat Link Box (Synchronized with GitHub / Netlify) */}
      {beats.length > 0 && currentSelectedBeat && (
        <div className="mt-4 pt-4 border-t border-[#00F0FF]/20 bg-[#020B17]/70 -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 p-4 sm:p-5 rounded-b-3xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-[#00F0FF]/15 border border-[#00F0FF]/30 text-[#00F0FF]">
                <Link2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-white flex items-center gap-2">
                  <span>Enlace Directo del Beat (Sincronizado con GitHub / Netlify)</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30">
                    Slug: ?beat={getBeatSlug(currentSelectedBeat)}
                  </span>
                </h4>
                <p className="text-[11px] text-sky-300/70">
                  Enlace público sincronizado con la URL de despliegue para compartir en redes o con clientes.
                </p>
              </div>
            </div>

            {/* Beat Selector */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-[11px] font-mono text-sky-300/80 whitespace-nowrap">Beat:</span>
              <select
                id="admin-select-beat-for-link"
                value={selectedBeatForLink || currentSelectedBeat.id}
                onChange={(e) => setSelectedBeatForLink(e.target.value)}
                className="w-full md:w-56 px-2.5 py-1.5 bg-[#051525] border border-[#00F0FF]/30 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-[#00F0FF]"
              >
                {beats.map((b) => (
                  <option key={b.id} value={b.id} className="bg-[#030A14] text-white">
                    {b.title} ({b.bpm} BPM)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Copy Link Bar */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-center">
            <div className="lg:col-span-8 flex items-center gap-2 px-3 py-2 bg-[#051525] border border-[#00F0FF]/30 rounded-xl">
              <Link2 className="w-4 h-4 text-[#00F0FF] shrink-0" />
              <input
                readOnly
                id="admin-input-direct-slug-url"
                value={getBeatDirectUrl(currentSelectedBeat)}
                className="w-full bg-transparent text-xs font-mono text-[#00F0FF] select-all focus:outline-none truncate"
              />
            </div>

            <div className="lg:col-span-4 flex gap-2">
              <button
                type="button"
                id="admin-btn-copy-short-url"
                onClick={() => handleCopyShortLink(currentSelectedBeat)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-mono font-bold transition ${
                  copiedBeatId === currentSelectedBeat.id
                    ? 'bg-emerald-500 text-black shadow-[0_0_12px_rgba(52,211,153,0.5)]'
                    : 'bg-[#00F0FF] hover:bg-[#38BDF8] text-black shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                }`}
              >
                {copiedBeatId === currentSelectedBeat.id ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>¡Link Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Link</span>
                  </>
                )}
              </button>

              <a
                href={getBeatDirectUrl(currentSelectedBeat)}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-[#051525] hover:bg-[#0A223D] border border-[#00F0FF]/30 rounded-xl text-sky-200 flex items-center justify-center transition"
                title="Abrir enlace en nueva pestaña"
              >
                <ExternalLink className="w-4 h-4 text-[#00F0FF]" />
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
