// src/components/payment/DeliveryForm.tsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { DeliveryInfo, Customer } from '../../types';

// ui
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Button } from '../ui/button';

const deliveryFormSchema = z.object({
  customerEmail: z.string().email('Invalid email address'),
  customerFullName: z.string().min(3, 'Full name must be at least 3 characters'),
  customerPhone: z.string().min(10, 'Phone number is too short'),
  address: z.string().min(10, 'Address must be at least 10 characters'),
  city: z.string().min(3, 'City is required'),
});

type DeliveryFormData = z.infer<typeof deliveryFormSchema>;

interface DeliveryFormProps {
  onSubmit: (customer: Customer, delivery: DeliveryInfo) => void;
  defaultValues?: {
    customer?: Partial<Customer>;
    delivery?: Partial<DeliveryInfo>;
  };
  acceptance?: {
    acceptance_token: string;
    permalink: string;
    type: string;
  } | null;
  acceptanceLoading?: boolean;
}

export const DeliveryForm: React.FC<DeliveryFormProps> = ({
  onSubmit,
  defaultValues,
  acceptance,
  acceptanceLoading = false,
}) => {
  const [accepted, setAccepted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DeliveryFormData>({
    resolver: zodResolver(deliveryFormSchema),
    defaultValues: defaultValues
      ? {
          customerEmail: defaultValues.customer?.email || '',
          customerFullName: defaultValues.customer?.fullName || '',
          customerPhone: defaultValues.customer?.phone || '',
          address: defaultValues.delivery?.address || '',
          city: defaultValues.delivery?.city || '',
        }
      : undefined,
  });

  const handleFormSubmit = (data: DeliveryFormData) => {
    if (!accepted) return; // protección extra
    const customer: Customer = {
      email: data.customerEmail,
      fullName: data.customerFullName,
      phone: data.customerPhone,
    };

    const delivery: DeliveryInfo = {
      address: data.address,
      city: data.city,
    };

    onSubmit(customer, delivery);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {/* Contact & Address (igual que antes) */}
      <div className="bg-gray-50 p-4 rounded-lg mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Contact Information</h3>
        {/* ... campos transformados ... */}
        <div className="mb-3">
          <Label htmlFor="customerEmail">Email *</Label>
          <Input
            id="customerEmail"
            type="email"
            placeholder="your@email.com"
            {...register('customerEmail')}
            className={errors.customerEmail ? 'border-red-500' : ''}
          />
          {errors.customerEmail && (
            <p className="mt-1 text-sm text-red-600">
              {errors.customerEmail.message}
            </p>
          )}
        </div>

        {/* Full Name */}
        <div className="mb-3">
          <Label htmlFor="customerFullName">Full Name *</Label>
          <Input
            id="customerFullName"
            type="text"
            placeholder="John Doe"
            {...register('customerFullName')}
            className={errors.customerFullName ? 'border-red-500' : ''}
          />
          {errors.customerFullName && (
            <p className="mt-1 text-sm text-red-600">
              {errors.customerFullName.message}
            </p>
          )}
        </div>

        {/* Phone */}
        <div>
          <Label htmlFor="customerPhone">Phone *</Label>
          <Input
            id="customerPhone"
            type="tel"
            placeholder="+573001112233"
            {...register('customerPhone')}
            className={errors.customerPhone ? 'border-red-500' : ''}
          />
          {errors.customerPhone && (
            <p className="mt-1 text-sm text-red-600">
              {errors.customerPhone.message}
            </p>
          )}
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Delivery Address</h3>
        {/* Address */}
        <div className="mb-3">
          <Label htmlFor="address">Address *</Label>
          <Input
            id="address"
            type="text"
            placeholder="Calle 123 #45-67"
            {...register('address')}
            className={errors.address ? 'border-red-500' : ''}
          />
          {errors.address && (
            <p className="mt-1 text-sm text-red-600">
              {errors.address.message}
            </p>
          )}
        </div>

        {/* City */}
        <div>
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            type="text"
            placeholder="Bogotá"
            {...register('city')}
            className={errors.city ? 'border-red-500' : ''}
          />
          {errors.city && (
            <p className="mt-1 text-sm text-red-600">
              {errors.city.message}
            </p>
          )}
        </div>
      </div>

      {/* Acceptance area */}
      <div className="bg-white p-4 rounded-lg border">
        {acceptanceLoading ? (
          <p className="text-sm text-gray-600">
            Cargando términos y condiciones...
          </p>
        ) : acceptance ? (
          <>
            <div className="text-sm text-gray-700 mb-2">
              Por favor revisa nuestros términos y condiciones:
            </div>
            <a
              href={acceptance.permalink}
              target="_blank"
              rel="noreferrer"
              className="block text-sm text-blue-600 hover:underline mb-3"
            >
              Ver términos y condiciones
            </a>

            <Label className="flex items-center space-x-2">
              <Checkbox
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
              />
              <span className="text-sm text-gray-700">
                Acepto los términos y condiciones
              </span>
            </Label>
          </>
        ) : (
          <p className="text-sm text-gray-600">
            No se pudo cargar términos. Intenta recargar.
          </p>
        )}
      </div>

      <Button
        type="submit"
        disabled={!accepted}
        className="w-full mt-4"
        variant={!accepted ? 'secondary' : 'default'}
      >
        Continue
      </Button>
    </form>
  );
};