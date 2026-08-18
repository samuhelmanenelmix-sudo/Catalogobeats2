import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  KeyRound, 
  ShieldAlert, 
  CheckCircle2, 
  X, 
  Eye, 
  EyeOff, 
  Key, 
  ShieldCheck,
  Sparkles
} from 'lucide-react';

const ADMIN_PWD_STORAGE_KEY = 'samuhelman_admin_pwd_v1';
const DEFAULT_FALLBACK_KEYS = ['samuhelman', 'samu', 'admin', 'producer', '1234', 'mix2026', 'samuhelmanenelmix'];

interface ProducerLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ProducerLoginModal: React.FC<ProducerLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'create'>('login');
  
  // Login fields
  const [passkey, setPasskey] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  
  // Create / Change Password fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [createSuccess, setCreateSuccess] = useState('');

  // Check if a custom password already exists in storage
  const [hasCustomPassword, setHasCustomPassword] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError('');
      setCreateSuccess('');
      setPasskey('');
      setNewPassword('');
      setConfirmPassword('');
      
      const stored = localStorage.getItem(ADMIN_PWD_STORAGE_KEY);
      if (stored && stored.trim().length > 0) {
        setHasCustomPassword(true);
        setMode('login');
      } else {
        setHasCustomPassword(false);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = passkey.trim();
    if (!cleanKey) {
      setError('Por favor ingresa tu contraseña.');
      return;
    }

    const storedCustomPwd = localStorage.getItem(ADMIN_PWD_STORAGE_KEY)?.trim();

    // Check custom password if set, or fallback default keys
    const isValidCustom = storedCustomPwd && storedCustomPwd === cleanKey;
    const isValidFallback = DEFAULT_FALLBACK_KEYS.includes(cleanKey.toLowerCase());

    if (isValidCustom || isValidFallback) {
      setError('');
      onSuccess();
      onClose();
    } else {
      setError('Contraseña incorrecta. Si no recuerdas tu clave, puedes crear una nueva.');
    }
  };

  const handleCreatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNew = newPassword.trim();
    const cleanConfirm = confirmPassword.trim();

    if (!cleanNew) {
      setError('Por favor escribe tu nueva contraseña.');
      return;
    }

    if (cleanNew.length < 3) {
      setError('La contraseña debe tener al menos 3 caracteres.');
      return;
    }

    if (cleanNew !== cleanConfirm) {
      setError('Las contraseñas no coinciden. Verifica que estén escritas igual.');
      return;
    }

    // Save custom password in localStorage
    localStorage.setItem(ADMIN_PWD_STORAGE_KEY, cleanNew);
    setHasCustomPassword(true);
    setError('');
    setCreateSuccess('¡Contraseña guardada con éxito! Desbloqueando panel...');

    setTimeout(() => {
      onSuccess();
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md bg-[#030A14] border border-[#00F0FF]/40 rounded-3xl p-6 sm:p-8 shadow-[0_0_40px_rgba(0,240,255,0.25)] text-[#E0F2FE]">
        
        {/* Close button */}
        <button
          id="btn-close-producer-login"
          onClick={onClose}
          className="absolute top-4 right-4 text-sky-400/60 hover:text-[#00F0FF] transition p-1.5 rounded-full bg-[#051525] border border-[#00F0FF]/25"
          aria-label="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2.5 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[#00F0FF]/10 border border-[#00F0FF]/40 flex items-center justify-center mx-auto text-[#00F0FF] shadow-[0_0_20px_rgba(0,240,255,0.3)]">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white font-display">
              {mode === 'login' ? 'Acceso de Administrador' : 'Crear tu Contraseña'}
            </h3>
            <p className="text-xs text-sky-200/70 mt-1">
              {mode === 'login' 
                ? 'Ingresa tu contraseña para subir beats, editar precios y configurar PayPal.'
                : 'Define tu clave secreta personalizada para acceder al panel de control.'}
            </p>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#051525] border border-[#00F0FF]/25 rounded-2xl mb-5 text-xs font-mono">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError('');
              setCreateSuccess('');
            }}
            className={`py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${
              mode === 'login'
                ? 'bg-[#00F0FF] text-black shadow-[0_0_12px_rgba(0,240,255,0.4)]'
                : 'text-sky-300 hover:text-white'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Ingresar</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('create');
              setError('');
              setCreateSuccess('');
            }}
            className={`py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${
              mode === 'create'
                ? 'bg-[#00F0FF] text-black shadow-[0_0_12px_rgba(0,240,255,0.4)]'
                : 'text-sky-300 hover:text-white'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>{hasCustomPassword ? 'Cambiar Clave' : 'Crear Clave'}</span>
          </button>
        </div>

        {/* MODE 1: LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4 animate-in fade-in">
            <div>
              <label className="block text-xs font-mono font-bold text-sky-300 uppercase tracking-wider mb-2">
                Contraseña de Productor
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-[#00F0FF] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="input-admin-login-passkey"
                  type={showPassword ? 'text' : 'password'}
                  value={passkey}
                  onChange={(e) => {
                    setPasskey(e.target.value);
                    setError('');
                  }}
                  placeholder="Escribe tu contraseña..."
                  className="w-full pl-10 pr-10 py-3 bg-[#051525] border border-[#00F0FF]/30 rounded-xl text-sm text-white placeholder-sky-300/40 focus:outline-none focus:border-[#00F0FF] focus:shadow-[0_0_15px_rgba(0,240,255,0.3)] transition"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sky-400/60 hover:text-white p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {error && (
                <div className="flex items-center gap-1.5 text-xs text-red-400 mt-2 font-mono bg-red-950/40 p-2.5 rounded-xl border border-red-500/30">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-[#00F0FF]/20 text-sky-300 hover:text-white text-xs font-mono transition"
              >
                Cancelar
              </button>
              <button
                id="btn-admin-submit-login"
                type="submit"
                className="flex-1 px-5 py-2.5 rounded-xl bg-[#00F0FF] hover:bg-[#38BDF8] text-black font-mono font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(0,240,255,0.4)] transition active:scale-95 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Desbloquear Panel</span>
              </button>
            </div>

            <div className="pt-3 text-center border-t border-[#00F0FF]/20 flex items-center justify-between text-[11px] text-sky-300/60 font-mono">
              <button
                type="button"
                onClick={() => setMode('create')}
                className="text-[#00F0FF] hover:underline"
              >
                ¿Deseas crear o cambiar tu clave?
              </button>
              <span>Samu Helman</span>
            </div>
          </form>
        )}

        {/* MODE 2: CREATE / CHANGE PASSWORD FORM */}
        {mode === 'create' && (
          <form onSubmit={handleCreatePassword} className="space-y-4 animate-in fade-in">
            <div>
              <label className="block text-xs font-mono font-bold text-sky-300 uppercase tracking-wider mb-1.5">
                Nueva Contraseña
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-[#00F0FF] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="input-new-admin-password"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="Ej: miClaveSecreta2026"
                  className="w-full pl-10 pr-10 py-2.5 bg-[#051525] border border-[#00F0FF]/30 rounded-xl text-sm text-white placeholder-sky-300/40 focus:outline-none focus:border-[#00F0FF] transition"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sky-400/60 hover:text-white p-1"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-sky-300 uppercase tracking-wider mb-1.5">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-[#00F0FF] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="input-confirm-admin-password"
                  type={showNewPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="Repite la nueva contraseña..."
                  className="w-full pl-10 pr-3 py-2.5 bg-[#051525] border border-[#00F0FF]/30 rounded-xl text-sm text-white placeholder-sky-300/40 focus:outline-none focus:border-[#00F0FF] transition"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-1.5 text-xs text-red-400 font-mono bg-red-950/40 p-2.5 rounded-xl border border-red-500/30">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {createSuccess && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-500/30">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>{createSuccess}</span>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="px-4 py-2.5 rounded-xl border border-[#00F0FF]/20 text-sky-300 hover:text-white text-xs font-mono transition"
              >
                Volver a Ingresar
              </button>
              <button
                id="btn-admin-submit-create-password"
                type="submit"
                className="flex-1 px-5 py-2.5 rounded-xl bg-[#00F0FF] hover:bg-[#38BDF8] text-black font-mono font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(0,240,255,0.4)] transition active:scale-95 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Guardar y Entrar</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
