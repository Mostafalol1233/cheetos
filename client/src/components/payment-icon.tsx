import React from 'react';
import { FaPaypal, FaCreditCard, FaWhatsapp } from 'react-icons/fa';

function VodafoneLogo({ className }: { className?: string }) {
  return (
    <div className={`${className} flex items-center justify-center`}>
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <circle cx="20" cy="20" r="20" fill="#E60000" />
        <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="22" fontWeight="bold" fontFamily="Arial">V</text>
      </svg>
    </div>
  );
}

function InstaPayLogo({ className }: { className?: string }) {
  return (
    <div className={`${className} flex items-center justify-center`}>
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect width="40" height="40" rx="10" fill="url(#instaGrad)" />
        <defs>
          <linearGradient id="instaGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#00B09B" />
            <stop offset="1" stopColor="#96C93D" />
          </linearGradient>
        </defs>
        <path d="M10 20 L18 28 L30 12" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10 13 L20 13 M20 13 L30 20 M30 20 L20 27 M20 27 L10 27" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      </svg>
    </div>
  );
}

function OrangeCashLogo({ className }: { className?: string }) {
  return (
    <div className={`${className} flex items-center justify-center`}>
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <circle cx="20" cy="20" r="20" fill="#FF7900" />
        <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold" fontFamily="Arial">O</text>
      </svg>
    </div>
  );
}

function EtisalatLogo({ className }: { className?: string }) {
  return (
    <div className={`${className} flex items-center justify-center`}>
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <circle cx="20" cy="20" r="20" fill="#6DC030" />
        <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold" fontFamily="Arial">etis</text>
      </svg>
    </div>
  );
}

function WEPayLogo({ className }: { className?: string }) {
  return (
    <div className={`${className} flex items-center justify-center`}>
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect width="40" height="40" rx="8" fill="#5C2D91" />
        <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold" fontFamily="Arial">WE</text>
      </svg>
    </div>
  );
}

export const PaymentIcon = ({ methodKey, className }: { methodKey: string, className?: string }) => {
  const baseClass = className || "w-9 h-9";

  switch (methodKey) {
    case 'vodafone_cash':
      return <VodafoneLogo className={baseClass} />;
    case 'orange_cash':
      return <OrangeCashLogo className={baseClass} />;
    case 'etisalat_cash':
      return <EtisalatLogo className={baseClass} />;
    case 'we_pay':
      return <WEPayLogo className={baseClass} />;
    case 'instapay':
      return <InstaPayLogo className={baseClass} />;
    case 'credit_card':
      return (
        <div className={`${baseClass} flex items-center justify-center rounded-lg bg-blue-900`}>
          <FaCreditCard className="w-5 h-5 text-white" />
        </div>
      );
    case 'paypal':
      return (
        <div className={`${baseClass} flex items-center justify-center rounded-lg bg-[#003087]`}>
          <FaPaypal className="w-5 h-5 text-white" />
        </div>
      );
    case 'whatsapp':
      return (
        <div className={`${baseClass} flex items-center justify-center rounded-full bg-[#25D366]`}>
          <FaWhatsapp className="w-5 h-5 text-white" />
        </div>
      );
    default:
      return (
        <div className={`${baseClass} flex items-center justify-center rounded-lg bg-gray-700`}>
          <FaCreditCard className="w-5 h-5 text-gray-300" />
        </div>
      );
  }
};
