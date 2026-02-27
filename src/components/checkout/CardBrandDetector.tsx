import React from 'react';
import type { CardBrand } from '../../types';

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
        <svg
          className="h-8 w-12"
          viewBox="0 0 48 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="48" height="32" rx="4" fill="#1A1F71" />
          <path
            d="M21.104 20.5h-2.784l-1.728-6.696c-.104-.408-.192-.552-.504-.72-.504-.264-1.344-.528-2.064-.672l.048-.216h3.552c.456 0 .864.312.96.864l.888 4.728 2.184-5.592h2.736L21.104 20.5zm10.8 0h-2.616l2.16-8.304h2.616L31.904 20.5zm4.368-5.496c.024-2.184 3.024-2.304 3-3.288 0-.312-.312-.648-1.008-.744-.336-.048-1.248-.096-2.304.408l-.408-1.92c.504-.192 1.44-.336 2.4-.336 2.256 0 3.744 1.2 3.744 2.88.024 1.248-1.128 1.944-1.968 2.352-.864.408-1.152.672-1.152 1.056 0 .576.648.84 1.248.84.984.024 1.704-.168 2.208-.384l.384 1.896c-.528.192-1.2.384-2.04.384-2.4 0-4.08-1.2-4.104-2.928v-.216zm12.144 5.496h-2.4c-.408 0-.744-.24-.888-.6l-3.168-7.704h2.76l.552 1.512h3.384l.312-1.512h2.448l-2.136 8.304h-.864zm-2.832-3.408l1.368-3.792.792 3.792h-2.16z"
            fill="white"
          />
        </svg>
        <span className="ml-2 text-sm font-medium text-gray-700">Visa</span>
      </div>
    );
  }

  if (brand === 'mastercard') {
    return (
      <div className={`flex items-center ${className}`}>
        <svg
          className="h-8 w-12"
          viewBox="0 0 48 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="48" height="32" rx="4" fill="#EB001B" />
          <circle cx="18" cy="16" r="10" fill="#FF5F00" />
          <circle cx="30" cy="16" r="10" fill="#F79E1B" />
          <path
            d="M24 8.8c-2.4 1.8-4 4.68-4 8s1.6 6.2 4 8c2.4-1.8 4-4.68 4-8s-1.6-6.2-4-8z"
            fill="#FF5F00"
          />
        </svg>
        <span className="ml-2 text-sm font-medium text-gray-700">Mastercard</span>
      </div>
    );
  }

  return null;
};
