import type { CardBrand } from '../types';
import { CARD_PATTERNS } from '../constants';

/**
 * Detect card brand based on card number
 */
export const detectCardBrand = (cardNumber: string): CardBrand => {
  const cleanNumber = cardNumber.replace(/\s/g, '');
  
  if (CARD_PATTERNS.VISA.test(cleanNumber)) {
    return 'visa';
  }
  
  if (CARD_PATTERNS.MASTERCARD.test(cleanNumber)) {
    return 'mastercard';
  }
  
  return 'unknown';
};

/**
 * Format card number with spaces (e.g., "4242 4242 4242 4242")
 */
export const formatCardNumber = (value: string): string => {
  const cleaned = value.replace(/\s/g, '');
  const chunks = cleaned.match(/.{1,4}/g);
  return chunks ? chunks.join(' ') : cleaned;
};

/**
 * Format currency to COP
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format date to locale string
 */
export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Validate expiration date
 */
export const isCardExpired = (month: number, year: number): boolean => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  if (year < currentYear) return true;
  if (year === currentYear && month < currentMonth) return true;
  
  return false;
};

/**
 * Mask credit card number (show only last 4 digits)
 */
export const maskCardNumber = (cardNumber: string): string => {
  const cleaned = cardNumber.replace(/\s/g, '');
  const lastFour = cleaned.slice(-4);
  return `**** **** **** ${lastFour}`;
};

/**
 * Generate a unique reference ID
 */
export const generateReference = (): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `ORDER-${timestamp}-${random}`;
};

/**
 * Calculate total amount including fees
 */
export const calculateTotal = (
  productPrice: number,
  quantity: number,
  baseFee: number,
  deliveryFee: number
): number => {
  return productPrice * quantity + baseFee + deliveryFee;
};

/**
 * Debounce function
 */
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Check if object is empty
 */
export const isEmpty = (obj: Record<string, unknown>): boolean => {
  return Object.keys(obj).length === 0;
};

/**
 * Deep clone object
 */
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};
