// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Fees
export const BASE_FEE = 3000; // COP 3000
export const DELIVERY_FEE = 5000; // COP 5000

// LocalStorage Keys
export const STORAGE_KEYS = {
  CHECKOUT_STATE: 'checkout_state',
  CURRENT_TRANSACTION: 'current_transaction',
  SELECTED_PRODUCT: 'selected_product',
} as const;

// Checkout Steps
export const CHECKOUT_STEPS = {
  PRODUCT: 1,
  PAYMENT_INFO: 2,
  SUMMARY: 3,
  STATUS: 4,
  COMPLETE: 5,
} as const;

// Transaction Status
export const TRANSACTION_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  DECLINED: 'DECLINED',
  ERROR: 'ERROR',
} as const;

// Card Regex Patterns
export const CARD_PATTERNS = {
  VISA: /^4[0-9]{12}(?:[0-9]{3})?$/,
  MASTERCARD: /^5[1-5][0-9]{14}$/,
} as const;

// Validation
export const VALIDATION = {
  CARD_NUMBER_LENGTH: 16,
  CVV_LENGTH: 3,
  PHONE_MIN_LENGTH: 10,
} as const;

// UI
export const BREAKPOINTS = {
  MOBILE: 320,
  MOBILE_L: 375,
  TABLET: 768,
  DESKTOP: 1024,
} as const;
