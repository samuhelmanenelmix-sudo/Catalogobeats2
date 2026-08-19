import React from 'react';
import { 
  Music, 
  Settings, 
  PlusCircle, 
  ShoppingBag, 
  FileText, 
  Search,
  Sparkles,
  CreditCard,
  Lock,
  Key,
  Cloud
} from 'lucide-react';
import { PaymentGatewaysConfig } from '../types';
import { PaypalLogo } from './PaypalLogo';

interface NavbarProps {
  isAdminMode: boolean;
  onToggleAdminMode: () => void;
  onOpenNewBeatModal: () => void;
  onOpenPaymentSettings: () => void;
  onOpenPurchasesModal: () => void;
  onOpenCodeArchitecture: () => void;
  onOpenProducerLogin?: () => void;
  purchasedCount: number;
  paymentConfig: PaymentGatewaysConfig;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isCloudSynced?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  isAdminMode,
  onToggleAdminMode,
  onOpenNewBeatModal,
  onOpenPaymentSettings,
  onOpenPurchasesModal,
  onOpenCodeArchitecture,
  onOpenProducerLogin,
  purchasedCount,
  paymentConfig,
  searchQuery,
  onSearchChange,
  isCloudSynced = true,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#000000]/95 backdrop-blur-xl border-b border-[#00F0FF]/25 text-[#E0F2FE] shadow-lg shadow-black/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3 sm:gap-4">
          
          {/* Logo & Producer Brand */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div 
              onClick={() => {
                if (!isAdminMode && onOpenProducerLogin) {
                  onOpenProducerLogin();
                }
              }}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#030A14] border border-[#00F0FF]/40 flex items-center justify-center text-[#00F0FF] cursor-pointer hover:border-[#00F0FF] transition shadow-[0_0_10px_rgba(0,240,255,0.2)]"
              title={isAdminMode ? 'Panel de Administración Activo' : 'Samu Helman en el mix'}
            >
              <Music className="w-4 h-4 sm:w-4.5 sm:h-4.5 drop-shadow-[0_0_6px_#00F0FF]" />
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-bold tracking-tight text-white flex items-center gap-1.5 whitespace-nowrap font-display">
                <span className="text-[#00F0FF] font-black drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]">
                  {paymentConfig.producerName || 'Samu Helman en el mix'}
                </span>
              </span>
              
              {/* PayPal Trust Badge */}
              <div className="hidden md:flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#002C66]/50 border border-[#00F0FF]/30 text-[10px] font-mono text-sky-200">
                <PaypalLogo className="w-3 h-3" />
                <span>PayPal Verified</span>
              </div>

              {/* Real-time Cloud Sync Badge */}
              <div 
                className={`hidden lg:flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-mono ${
                  isCloudSynced 
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
                    : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                }`}
                title={isCloudSynced ? 'Catálogo sincronizado en la nube (Firestore en tiempo real)' : 'Conectando a base de datos en la nube...'}
              >
                <Cloud className={`w-3 h-3 ${isCloudSynced ? 'text-emerald-400' : 'text-amber-400 animate-pulse'}`} />
                <span>{isCloudSynced ? 'Nube en Vivo' : 'Conectando...'}</span>
              </div>

              {/* Admin Active Pill */}
              {isAdminMode && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#00F0FF]/15 border border-[#00F0FF]/50 text-[10px] font-mono text-[#00F0FF] font-bold uppercase tracking-wider animate-pulse">
                  Panel Productor
                </span>
              )}
            </div>
          </div>

          {/* Quick Search */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="w-4 h-4 text-sky-400/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="search-beats-nav"
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Buscar por título, género, BPM..."
                className="w-full pl-9 pr-3 py-1.5 bg-[#050C16] border border-[#00F0FF]/25 rounded-xl text-xs text-[#E0F2FE] placeholder-sky-300/40 focus:outline-none focus:border-[#00F0FF] focus:shadow-[0_0_12px_rgba(0,240,255,0.25)] transition"
              />
            </div>
          </div>

          {/* Actions & Public / Admin Controls */}
          <div className="flex items-center gap-2">
            
            {/* My Licenses / Purchases button (Visible for clients who purchased) */}
            <button
              id="btn-my-licenses"
              onClick={onOpenPurchasesModal}
              className="relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-[#E0F2FE] bg-[#050C16] border border-[#00F0FF]/30 hover:bg-[#0A192F] hover:text-[#00F0FF] hover:border-[#00F0FF] transition font-mono"
              title="Ver contratos y descargas temporales"
            >
              <FileText className="w-3.5 h-3.5 text-[#00F0FF]" />
              <span className="hidden sm:inline">Mis Licencias</span>
              {purchasedCount > 0 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[10px] font-bold text-black bg-[#00F0FF] rounded-full shadow-[0_0_6px_#00F0FF]">
                  {purchasedCount}
                </span>
              )}
            </button>

            {/* ONLY SHOWN TO ADMIN WHEN LOGGED IN / ?admin=true */}
            {isAdminMode ? (
              <>
                {/* Code Architecture button */}
                <button
                  id="btn-code-architecture"
                  onClick={onOpenCodeArchitecture}
                  className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg text-[#00F0FF] bg-[#00F0FF]/10 border border-[#00F0FF]/30 hover:bg-[#00F0FF]/20 transition font-mono"
                  title="Ver código y arquitectura Full-Stack"
                >
                  <span className="text-xs">📦</span>
                  <span className="hidden xl:inline">Código</span>
                </button>

                {/* Subir Beat */}
                <button
                  id="btn-add-beat-nav"
                  onClick={onOpenNewBeatModal}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg text-black bg-[#00F0FF] hover:bg-[#38BDF8] shadow-[0_0_15px_rgba(0,240,255,0.4)] transition active:scale-95 font-mono"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Subir Beat</span>
                </button>

                {/* Pasarelas de Pago */}
                <button
                  id="btn-payment-settings"
                  onClick={onOpenPaymentSettings}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg text-[#E0F2FE] bg-[#050C16] border border-[#00F0FF]/30 hover:bg-[#0A192F] hover:text-[#00F0FF] transition font-mono"
                  title="Configurar Pasarelas y Enlaces PayPal"
                >
                  <CreditCard className="w-3.5 h-3.5 text-[#00F0FF]" />
                  <span className="hidden lg:inline">Medios de Pago</span>
                </button>

                {/* Cambiar Clave Admin */}
                {onOpenProducerLogin && (
                  <button
                    id="btn-change-password-nav"
                    onClick={onOpenProducerLogin}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg text-sky-200 bg-[#050C16] border border-[#00F0FF]/25 hover:border-[#00F0FF] hover:text-white transition font-mono"
                    title="Cambiar contraseña de administración"
                  >
                    <Key className="w-3.5 h-3.5 text-[#00F0FF]" />
                    <span className="hidden xl:inline">Clave</span>
                  </button>
                )}

                {/* Exit Admin Button */}
                <button
                  id="btn-exit-admin-mode"
                  onClick={onToggleAdminMode}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-red-950/40 border border-red-500/40 text-red-300 hover:bg-red-900/50 hover:text-white transition font-mono"
                  title="Salir de la vista de administración"
                >
                  <Settings className="w-3.5 h-3.5 text-red-400" />
                  <span>Salir Admin</span>
                </button>
              </>
            ) : null}

          </div>

        </div>

        {/* Mobile Search Bar */}
        <div className="pb-2.5 pt-0.5 md:hidden">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-sky-400/60 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="search-beats-mobile"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar título, género, BPM..."
              className="w-full pl-8 pr-3 py-1 bg-[#050C16] border border-[#00F0FF]/25 rounded-lg text-xs text-[#E0F2FE] placeholder-sky-300/40 focus:outline-none focus:border-[#00F0FF]"
            />
          </div>
        </div>
      </div>
    </header>
  );
};
