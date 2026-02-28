import React from 'react';
import type { CardBrand } from '../../types';
import { CreditCard } from 'lucide-react';

interface CardBrandDetectorProps {
  brand: CardBrand;
  className?: string;
}

export const CardBrandDetector: React.FC<CardBrandDetectorProps> = ({ 
  brand, 
  className = '' 
}) => {
  if (brand === 'visa') {
    return (
      <div className={`flex items-center ${className}`}>
        <CreditCard className="h-8 w-8 text-blue-700" />
        <span className="ml-2 text-sm font-medium text-gray-700">Visa</span>
      </div>
    );
  }

  if (brand === 'mastercard') {
    return (
      <div className={`flex items-center ${className}`}>
        <CreditCard className="h-8 w-8 text-red-600" />
        <span className="ml-2 text-sm font-medium text-gray-700">Mastercard</span>
      </div>
    );
  }

  return null;
};