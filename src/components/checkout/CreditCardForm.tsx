import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CardBrandDetector } from './CardBrandDetector';
import { detectCardBrand, formatCardNumber } from '../../lib/utils';
import type { CardBrand, CreditCard } from '../../types';

const creditCardFormSchema = z.object({
  cardNumber: z
    .string()
    .min(1, 'Card number is required')
    .regex(/^\d{16}$/, 'Card number must be 16 digits'),
  expMonth: z
    .string()
    .min(1, 'Month is required')
    .regex(/^(0[1-9]|1[0-2])$/, 'Invalid month'),
  expYear: z
    .string()
    .min(1, 'Year is required')
    .regex(/^\d{4}$/, 'Invalid year')
    .refine((val) => parseInt(val) >= new Date().getFullYear(), 'Card has expired'),
  cvv: z
    .string()
    .regex(/^\d{3}$/, 'CVV must be 3 digits'),
});

type CreditCardFormData = z.infer<typeof creditCardFormSchema>;

interface CreditCardFormProps {
  onSubmit: (data: CreditCard) => void;
  defaultValues?: Partial<CreditCard>;
}

export const CreditCardForm: React.FC<CreditCardFormProps> = ({ 
  onSubmit,
  defaultValues,
}) => {
  const [cardBrand, setCardBrand] = useState<CardBrand>('unknown');
  const [formattedNumber, setFormattedNumber] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreditCardFormData>({
    resolver: zodResolver(creditCardFormSchema),
    defaultValues: defaultValues
      ? {
          cardNumber: defaultValues.number || '',
          expMonth: defaultValues.exp_month?.toString().padStart(2, '0') || '',
          expYear: defaultValues.exp_year?.toString() || '',
          cvv: defaultValues.cvv || '',
        }
      : undefined,
  });

  const cardNumber = watch('cardNumber');

  useEffect(() => {
    if (cardNumber) {
      const cleanNumber = cardNumber.replace(/\s/g, '');
      setCardBrand(detectCardBrand(cleanNumber));
      setFormattedNumber(formatCardNumber(cleanNumber));
    } else {
      setCardBrand('unknown');
      setFormattedNumber('');
    }
  }, [cardNumber]);

  const handleFormSubmit = (data: CreditCardFormData) => {
    const cardData: CreditCard = {
      number: data.cardNumber.replace(/\s/g, ''),
      exp_month: parseInt(data.expMonth),
      exp_year: parseInt(data.expYear),
      cvv: data.cvv,
    };
    onSubmit(cardData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {/* Card Number */}
      <div>
        <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-1">
          Card Number
        </label>
        <div className="relative">
          <input
            id="cardNumber"
            type="text"
            maxLength={16}
            placeholder="4242424242424242"
            {...register('cardNumber')}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.cardNumber ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {cardBrand !== 'unknown' && (
            <div className="absolute right-2 top-2">
              <CardBrandDetector brand={cardBrand} />
            </div>
          )}
        </div>
        {formattedNumber && (
          <p className="mt-1 text-sm text-gray-500">{formattedNumber}</p>
        )}
        {errors.cardNumber && (
          <p className="mt-1 text-sm text-red-600">{errors.cardNumber.message}</p>
        )}
      </div>

      {/* Expiration Date and CVV */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="expMonth" className="block text-sm font-medium text-gray-700 mb-1">
            Month
          </label>
          <input
            id="expMonth"
            type="text"
            maxLength={2}
            placeholder="MM"
            {...register('expMonth')}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.expMonth ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.expMonth && (
            <p className="mt-1 text-sm text-red-600">{errors.expMonth.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="expYear" className="block text-sm font-medium text-gray-700 mb-1">
            Year
          </label>
          <input
            id="expYear"
            type="text"
            maxLength={4}
            placeholder="YYYY"
            {...register('expYear')}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.expYear ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.expYear && (
            <p className="mt-1 text-sm text-red-600">{errors.expYear.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="cvv" className="block text-sm font-medium text-gray-700 mb-1">
            CVV
          </label>
          <input
            id="cvv"
            type="text"
            maxLength={3}
            placeholder="123"
            {...register('cvv')}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.cvv ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.cvv && (
            <p className="mt-1 text-sm text-red-600">{errors.cvv.message}</p>
          )}
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
      >
        Continue
      </button>
    </form>
  );
};
