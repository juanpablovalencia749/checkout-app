import {
  detectCardBrand,
  formatCardNumber,
  formatCurrency,
  isCardExpired,
  maskCardNumber,
  calculateTotal,
} from '../utils';

describe('utils', () => {
  describe('detectCardBrand', () => {
    it('should detect Visa cards', () => {
      expect(detectCardBrand('4242424242424242')).toBe('visa');
      expect(detectCardBrand('4111111111111111')).toBe('visa');
    });

    it('should detect Mastercard cards', () => {
      expect(detectCardBrand('5555555555554444')).toBe('mastercard');
      expect(detectCardBrand('5105105105105100')).toBe('mastercard');
    });

    it('should return unknown for invalid cards', () => {
      expect(detectCardBrand('1234567890123456')).toBe('unknown');
      expect(detectCardBrand('9999999999999999')).toBe('unknown');
    });
  });

  describe('formatCardNumber', () => {
    it('should format card number with spaces', () => {
      expect(formatCardNumber('4242424242424242')).toBe('4242 4242 4242 4242');
      expect(formatCardNumber('1234567890123456')).toBe('1234 5678 9012 3456');
    });

    it('should handle partial card numbers', () => {
      expect(formatCardNumber('4242')).toBe('4242');
      expect(formatCardNumber('424242')).toBe('4242 42');
    });
  });

  describe('formatCurrency', () => {
    it('should format currency in COP', () => {
      expect(formatCurrency(150000)).toContain('150');
      expect(formatCurrency(1500000)).toContain('1.500');
    });

    it('should handle zero', () => {
      expect(formatCurrency(0)).toContain('0');
    });
  });

  describe('isCardExpired', () => {
    it('should detect expired cards', () => {
      expect(isCardExpired(1, 2020)).toBe(true);
      expect(isCardExpired(12, 2023)).toBe(true);
    });

    it('should detect valid cards', () => {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      
      expect(isCardExpired(12, currentYear + 1)).toBe(false);
      expect(isCardExpired(currentMonth, currentYear)).toBe(false);
    });
  });

  describe('maskCardNumber', () => {
    it('should mask card number showing only last 4 digits', () => {
      expect(maskCardNumber('4242424242424242')).toBe('**** **** **** 4242');
      expect(maskCardNumber('5555 5555 5555 4444')).toBe('**** **** **** 4444');
    });
  });

  describe('calculateTotal', () => {
    it('should calculate total with fees', () => {
      expect(calculateTotal(100000, 1, 3000, 5000)).toBe(108000);
      expect(calculateTotal(50000, 2, 3000, 5000)).toBe(108000);
    });
  });
});
