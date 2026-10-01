import React from 'react';

interface MercadoPagoLogoProps {
  className?: string;
  variant?: 'icon' | 'badge' | 'full';
}

export const MercadoPagoLogo: React.FC<MercadoPagoLogoProps> = ({ 
  className = "w-4 h-4", 
  variant = 'icon' 
}) => {
  if (variant === 'full') {
    return (
      <div className={`inline-flex items-center gap-1.5 font-bold tracking-tight select-none ${className}`}>
        <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none">
          <rect width="24" height="24" rx="12" fill="#009EE3" />
          <path
            d="M17.8 8.6c-.4-.4-1-.5-1.5-.2l-2.1 1.2c-.3.2-.7.2-1 0L11 8.2c-.5-.3-1.1-.3-1.5.1L7.2 10.6c-.4.4-.5 1-.2 1.5.4.4 1 .5 1.5.2l1.6-1.1c.3-.2.7-.2 1 0l2.2 1.4c.5.3 1.1.3 1.5-.1l2.8-2.4c.5-.4.5-1.1.2-1.5z"
            fill="#FFFFFF"
          />
          <path
            d="M15.2 14.8c-.3.2-.7.2-1 0l-2.2-1.4c-.5-.3-1.1-.3-1.5.1l-2.3 2c-.4.3-.5.9-.2 1.4.3.4.9.5 1.4.2l1.8-1.5c.3-.2.7-.2 1 0l2.2 1.4c.5.3 1.1.3 1.5-.1l2.5-2.2c.4-.3.4-1 0-1.4-.4-.3-1-.3-1.4.1l-1.8 1.4z"
            fill="#FFFFFF"
            opacity="0.9"
          />
        </svg>
        <span className="text-[#009EE3] font-black tracking-tight text-sm">
          Mercado <span className="text-white">Pago</span>
        </span>
      </div>
    );
  }

  if (variant === 'badge') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#009EE3]/15 border border-[#009EE3]/40 text-[#009EE3] text-[11px] font-mono font-bold shadow-[0_0_10px_rgba(0,158,227,0.25)]">
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0" fill="none">
          <circle cx="12" cy="12" r="10" fill="#009EE3" />
          <path
            d="M16.5 9c-.3-.3-.8-.4-1.2-.1l-1.7 1c-.2.1-.5.1-.7 0L11.3 8.7c-.4-.2-.9-.2-1.2.1L8.3 10.6c-.3.3-.4.8-.1 1.2.3.3.8.4 1.2.1l1.3-.9c.2-.1.5-.1.7 0l1.7 1.1c.4.2.9.2 1.2-.1l2.2-1.9c.4-.3.4-.8.1-1.1z"
            fill="#FFFFFF"
          />
        </svg>
        <span>Mercado Pago ARS</span>
      </span>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <rect width="24" height="24" rx="6" fill="#009EE3" />
      <path
        d="M17.5 9.2c-.4-.4-1-.5-1.4-.2l-1.9 1.1c-.3.2-.7.2-1 0L11.4 8.8c-.5-.3-1.1-.3-1.5.1L8 10.9c-.4.4-.5 1-.2 1.4.4.4 1 .5 1.4.2l1.4-1c.3-.2.7-.2 1 0l2 1.3c.5.3 1.1.3 1.5-.1l2.4-2.1c.5-.4.5-1 .2-1.4z"
        fill="#FFFFFF"
      />
      <path
        d="M15 14.5c-.3.2-.7.2-1 0l-2-1.3c-.5-.3-1.1-.3-1.5.1l-2 1.7c-.4.3-.5.9-.2 1.3.3.4.9.5 1.3.2l1.6-1.3c.3-.2.7-.2 1 0l2 1.3c.5.3 1.1.3 1.5-.1l2.1-1.8c.4-.3.4-.9 0-1.3-.3-.3-.9-.3-1.3.1l-1.5 1.2z"
        fill="#FFFFFF"
        opacity="0.9"
      />
    </svg>
  );
};
