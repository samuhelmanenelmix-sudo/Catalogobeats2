import React from 'react';

interface PaypalLogoProps {
  className?: string;
  variant?: 'icon' | 'badge' | 'full';
}

export const PaypalLogo: React.FC<PaypalLogoProps> = ({ 
  className = "w-4 h-4", 
  variant = 'icon' 
}) => {
  if (variant === 'full') {
    return (
      <div className={`inline-flex items-center gap-1.5 font-bold tracking-tight select-none ${className}`}>
        <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="currentColor">
          <path
            fill="#00F0FF"
            d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.388 5.468 0 5.989 0h7.46c2.57 0 4.578.543 5.807 1.57 1.155.965 1.636 2.378 1.43 4.2-.39 3.456-2.483 5.44-6.22 5.44H10.87l-1.464 9.27a.855.855 0 0 1-.845.719z"
          />
          <path
            fill="#38BDF8"
            d="M8.79 17.51l.885-5.61h3.35c3.25 0 5.07-1.725 5.41-4.73.18-1.58-.24-2.81-1.24-3.65-1.07-.89-2.82-1.36-5.06-1.36H4.67a.74.74 0 0 0-.73.62L1.83 17.13a.56.56 0 0 0 .55.65h5.56a.85.85 0 0 0 .85-.27z"
          />
        </svg>
        <span className="text-[#00F0FF] font-black tracking-tighter text-sm">Pay<span className="text-white">Pal</span></span>
      </div>
    );
  }

  if (variant === 'badge') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#002C66]/80 border border-[#00F0FF]/40 text-[#00F0FF] text-[11px] font-mono font-bold shadow-[0_0_8px_rgba(0,240,255,0.25)]">
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0" fill="currentColor">
          <path
            fill="#00F0FF"
            d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.388 5.468 0 5.989 0h7.46c2.57 0 4.578.543 5.807 1.57 1.155.965 1.636 2.378 1.43 4.2-.39 3.456-2.483 5.44-6.22 5.44H10.87l-1.464 9.27a.855.855 0 0 1-.845.719z"
          />
          <path
            fill="#FFFFFF"
            d="M8.79 17.51l.885-5.61h3.35c3.25 0 5.07-1.725 5.41-4.73.18-1.58-.24-2.81-1.24-3.65-1.07-.89-2.82-1.36-5.06-1.36H4.67a.74.74 0 0 0-.73.62L1.83 17.13a.56.56 0 0 0 .55.65h5.56a.85.85 0 0 0 .85-.27z"
          />
        </svg>
        <span>PayPal</span>
      </span>
    );
  }

  // default icon
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.388 5.468 0 5.989 0h7.46c2.57 0 4.578.543 5.807 1.57 1.155.965 1.636 2.378 1.43 4.2-.39 3.456-2.483 5.44-6.22 5.44H10.87l-1.464 9.27a.855.855 0 0 1-.845.719z"
        fill="#00F0FF"
      />
      <path
        d="M8.79 17.51l.885-5.61h3.35c3.25 0 5.07-1.725 5.41-4.73.18-1.58-.24-2.81-1.24-3.65-1.07-.89-2.82-1.36-5.06-1.36H4.67a.74.74 0 0 0-.73.62L1.83 17.13a.56.56 0 0 0 .55.65h5.56a.85.85 0 0 0 .85-.27z"
        fill="#38BDF8"
      />
    </svg>
  );
};
