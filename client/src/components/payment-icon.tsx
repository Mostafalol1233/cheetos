import React from 'react';

function VodafoneLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="48" height="48" rx="10" fill="#E60000"/>
      <circle cx="24" cy="20" r="11" fill="white"/>
      <circle cx="24" cy="20" r="6" fill="#E60000"/>
      <path d="M30 28 L36 36 L22 31 Z" fill="white"/>
    </svg>
  );
}

function OrangeLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="48" height="48" rx="10" fill="#FF6600"/>
      <circle cx="24" cy="22" r="10" stroke="white" strokeWidth="3.5" fill="none"/>
      <text x="24" y="41" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold" fontFamily="Arial, sans-serif">CASH</text>
    </svg>
  );
}

function EtisalatLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="48" height="48" rx="10" fill="#007A33"/>
      <text x="24" y="28" textAnchor="middle" fill="white" fontSize="17" fontWeight="bold" fontFamily="Arial, sans-serif" fontStyle="italic">e&amp;</text>
      <text x="24" y="41" textAnchor="middle" fill="white" fontSize="8" fontFamily="Arial, sans-serif" opacity="0.85">CASH</text>
    </svg>
  );
}

function WEPayLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="we-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#00539B"/>
          <stop offset="1" stopColor="#0070C0"/>
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="10" fill="url(#we-grad)"/>
      <text x="24" y="27" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold" fontFamily="Arial, sans-serif">WE</text>
      <text x="24" y="40" textAnchor="middle" fill="white" fontSize="9" fontFamily="Arial, sans-serif" opacity="0.85">PAY</text>
    </svg>
  );
}

function InstaPayLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="ip-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#00C48C"/>
          <stop offset="1" stopColor="#00A86B"/>
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="10" fill="url(#ip-grad)"/>
      <path d="M26 8 L15 26 L22 26 L18 40 L33 22 L26 22 Z" fill="white"/>
    </svg>
  );
}

function PayPalLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="48" height="48" rx="10" fill="#003087"/>
      <text x="14" y="32" fill="#009CDE" fontSize="26" fontWeight="bold" fontFamily="Arial, sans-serif">P</text>
      <text x="20" y="32" fill="white" fontSize="26" fontWeight="bold" fontFamily="Arial, sans-serif">P</text>
    </svg>
  );
}

function VisaLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="card-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#1A1F71"/>
          <stop offset="1" stopColor="#2C3CA0"/>
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="10" fill="url(#card-grad)"/>
      <rect x="0" y="12" width="48" height="8" fill="white" opacity="0.15"/>
      <rect x="6" y="30" width="14" height="5" rx="2" fill="#F7B600" opacity="0.85"/>
      <text x="38" y="37" textAnchor="end" fill="white" fontSize="9" fontWeight="bold" fontFamily="Arial, sans-serif" fontStyle="italic">VISA</text>
    </svg>
  );
}

function MeezaLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="meeza-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#C0392B"/>
          <stop offset="1" stopColor="#96281B"/>
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="10" fill="url(#meeza-grad)"/>
      <text x="24" y="28" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold" fontFamily="Arial, sans-serif">ميزة</text>
      <text x="24" y="40" textAnchor="middle" fill="white" fontSize="8" fontFamily="Arial, sans-serif" opacity="0.85">Meeza</text>
    </svg>
  );
}

export const PaymentIcon = ({ methodKey, className }: { methodKey: string; className?: string }) => {
  const base = className || 'w-9 h-9';
  switch (methodKey) {
    case 'vodafone_cash':   return <VodafoneLogo className={base} />;
    case 'orange_cash':     return <OrangeLogo className={base} />;
    case 'etisalat_cash':   return <EtisalatLogo className={base} />;
    case 'we_pay':          return <WEPayLogo className={base} />;
    case 'instapay':        return <InstaPayLogo className={base} />;
    case 'paypal':          return <PayPalLogo className={base} />;
    case 'credit_card':     return <VisaLogo className={base} />;
    case 'meeza':           return <MeezaLogo className={base} />;
    default:                return <VisaLogo className={base} />;
  }
};
