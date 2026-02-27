import { z } from 'zod';
import { VALIDATION, CARD_PATTERNS } from '../constants';

// Credit Card Validation Schema
export const creditCardSchema = z.object({
  number: z
    .string()
    .min(1, 'Card number is required')
    .regex(/^\d+$/, 'Card number must contain only numbers')
    .length(VALIDATION.CARD_NUMBER_LENGTH, `Card number must be ${VALIDATION.CARD_NUMBER_LENGTH} digits`)
    .refine(
      (val) => CARD_PATTERNS.VISA.test(val) || CARD_PATTERNS.MASTERCARD.test(val),
      'Only Visa and Mastercard are accepted'
    ),
  exp_month: z
    .number()
    .min(1, 'Month must be between 1 and 12')
    .max(12, 'Month must be between 1 and 12'),
  exp_year: z
    .number()
    .min(new Date().getFullYear(), 'Card has expired')
    .max(new Date().getFullYear() + 20, 'Invalid expiration year'),
  cvv: z
    .string()
    .length(VALIDATION.CVV_LENGTH, `CVV must be ${VALIDATION.CVV_LENGTH} digits`)
    .regex(/^\d+$/, 'CVV must contain only numbers'),
});

// Delivery Info Validation Schema
export const deliverySchema = z.object({
  address: z
    .string()
    .min(10, 'Address must be at least 10 characters')
    .max(200, 'Address must not exceed 200 characters'),
  city: z
    .string()
    .min(3, 'City must be at least 3 characters')
    .max(100, 'City must not exceed 100 characters'),
});

// Customer Info Validation Schema
export const customerSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .min(1, 'Email is required'),
  fullName: z
    .string()
    .min(3, 'Full name must be at least 3 characters')
    .max(100, 'Full name must not exceed 100 characters'),
  phone: z
    .string()
    .min(VALIDATION.PHONE_MIN_LENGTH, `Phone must be at least ${VALIDATION.PHONE_MIN_LENGTH} digits`)
    .regex(/^\+?[\d\s-()]+$/, 'Invalid phone number format'),
});

// Complete Payment Form Schema
export const paymentFormSchema = z.object({
  // Customer Info
  customerEmail: z.string().email('Invalid email address'),
  customerFullName: z.string().min(3, 'Full name must be at least 3 characters'),
  customerPhone: z.string().min(VALIDATION.PHONE_MIN_LENGTH, 'Phone number is too short'),
  
  // Card Info
  cardNumber: z
    .string()
    .length(VALIDATION.CARD_NUMBER_LENGTH, `Card number must be ${VALIDATION.CARD_NUMBER_LENGTH} digits`)
    .refine(
      (val) => CARD_PATTERNS.VISA.test(val) || CARD_PATTERNS.MASTERCARD.test(val),
      'Only Visa and Mastercard are accepted'
    ),
  expMonth: z.number().min(1).max(12),
  expYear: z.number().min(new Date().getFullYear()),
  cvv: z.string().length(VALIDATION.CVV_LENGTH, `CVV must be ${VALIDATION.CVV_LENGTH} digits`),
  
  // Delivery Info
  address: z.string().min(10, 'Address must be at least 10 characters'),
  city: z.string().min(3, 'City is required'),
});

export type CreditCardFormData = z.infer<typeof creditCardSchema>;
export type DeliveryFormData = z.infer<typeof deliverySchema>;
export type CustomerFormData = z.infer<typeof customerSchema>;
export type PaymentFormData = z.infer<typeof paymentFormSchema>;
