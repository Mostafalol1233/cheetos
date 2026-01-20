import React from 'react';
import { FaPaypal, FaMobileAlt, FaWallet, FaCreditCard, FaWhatsapp } from 'react-icons/fa';
import { BiTransfer } from 'react-icons/bi';

export const PaymentIcon = ({ methodKey, className }: { methodKey: string, className?: string }) => {
  const baseClass = className || "w-8 h-8"; // Default to 32x32px (w-8 is 2rem = 32px)

  switch (methodKey) {
    case 'vodafone_cash':
      return <FaMobileAlt className={baseClass} style={{ color: '#E60000' }} />;
    case 'orange_cash':
      return <FaMobileAlt className={baseClass} style={{ color: '#FF7900' }} />;
    case 'etisalat_cash':
      return <FaMobileAlt className={baseClass} style={{ color: '#99CC33' }} />;
    case 'we_pay':
      return <FaMobileAlt className={baseClass} style={{ color: '#5C2D91' }} />;
    case 'instapay':
      return <BiTransfer className={baseClass} style={{ color: '#4F46E5' }} />;
    case 'credit_card':
      return <FaCreditCard className={baseClass} style={{ color: '#003087' }} />;
    case 'paypal':
      return <FaPaypal className={baseClass} style={{ color: '#003087' }} />;
    case 'whatsapp':
      return <FaWhatsapp className={baseClass} style={{ color: '#25D366' }} />;
    default:
      return <FaWallet className={baseClass} />;
  }
};
