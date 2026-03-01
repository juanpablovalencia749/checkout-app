import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CardBrandDetector } from './CardBrandDetector';
import { detectCardBrand, formatCardNumber } from '../../lib/utils';
import type { CardBrand, CreditCard } from '../../types';

// ui components
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';

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
    disabled?: boolean;
}

export const CreditCardForm: React.FC<CreditCardFormProps> = ({ 
  onSubmit,
  defaultValues,
  disabled
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
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Card Number */}
      <div>
        <Label htmlFor="cardNumber">Card Number</Label>
        <div className="relative">
          <Input
            id="cardNumber"
            type="text"
            maxLength={19}
            placeholder="4242 4242 4242 4242"
            {...register('cardNumber')}
            className={errors.cardNumber ? 'border-red-500' : ''}
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
          <Label htmlFor="expMonth">Month</Label>
          <Input
            id="expMonth"
            type="text"
            maxLength={2}
            placeholder="MM"
            {...register('expMonth')}
            className={errors.expMonth ? 'border-red-500' : ''}
          />
          {errors.expMonth && (
            <p className="mt-1 text-sm text-red-600">{errors.expMonth.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="expYear">Year</Label>
          <Input
            id="expYear"
            type="text"
            maxLength={4}
            placeholder="YYYY"
            {...register('expYear')}
            className={errors.expYear ? 'border-red-500' : ''}
          />
          {errors.expYear && (
            <p className="mt-1 text-sm text-red-600">{errors.expYear.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="cvv">CVV</Label>
          <Input
            id="cvv"
            type="text"
            maxLength={3}
            placeholder="123"
            {...register('cvv')}
            className={errors.cvv ? 'border-red-500' : ''}
          />
          {errors.cvv && (
            <p className="mt-1 text-sm text-red-600">{errors.cvv.message}</p>
          )}
        </div>
      </div>

      <Button type="submit" className="w-full" size="lg">
        Continue
      </Button>
    </form>
  );
};
