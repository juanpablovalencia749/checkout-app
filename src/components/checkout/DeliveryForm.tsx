// src/components/payment/DeliveryForm.tsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { DeliveryInfo, Customer } from '../../types';

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
        {/* ... los campos que ya tenías ... */}
        <div className="mb-3">
          <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input id="customerEmail" type="email" placeholder="your@email.com"
            {...register('customerEmail')}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.customerEmail ? 'border-red-500' : 'border-gray-300'
            }`} />
          {errors.customerEmail && <p className="mt-1 text-sm text-red-600">{errors.customerEmail.message}</p>}
        </div>

        {/* Full Name */}
        <div className="mb-3">
          <label htmlFor="customerFullName" className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
          <input id="customerFullName" type="text" placeholder="John Doe" {...register('customerFullName')}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.customerFullName ? 'border-red-500' : 'border-gray-300'
            }`} />
          {errors.customerFullName && <p className="mt-1 text-sm text-red-600">{errors.customerFullName.message}</p>}
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
          <input id="customerPhone" type="tel" placeholder="+573001112233" {...register('customerPhone')}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.customerPhone ? 'border-red-500' : 'border-gray-300'
            }`} />
          {errors.customerPhone && <p className="mt-1 text-sm text-red-600">{errors.customerPhone.message}</p>}
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Delivery Address</h3>
        {/* Address */}
        <div className="mb-3">
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
          <input id="address" type="text" placeholder="Calle 123 #45-67" {...register('address')}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.address ? 'border-red-500' : 'border-gray-300'
            }`} />
          {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>}
        </div>

        {/* City */}
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">City *</label>
          <input id="city" type="text" placeholder="Bogotá" {...register('city')}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.city ? 'border-red-500' : 'border-gray-300'
            }`} />
          {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>}
        </div>
      </div>

      {/* Acceptance area */}
      <div className="bg-white p-4 rounded-lg border">
        {acceptanceLoading ? (
          <p className="text-sm text-gray-600">Cargando términos y condiciones...</p>
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

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="h-4 w-4"
              />
              <span className="text-sm text-gray-700">Acepto los términos y condiciones</span>
            </label>
          </>
        ) : (
          <p className="text-sm text-gray-600">No se pudo cargar términos. Intenta recargar.</p>
        )}
      </div>

      <button
        type="submit"
        disabled={!accepted}
        className={`w-full mt-4 py-3 px-4 rounded-lg font-medium transition-colors ${
          !accepted ? 'bg-gray-300 text-gray-700 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        Continue
      </button>
    </form>
  );
};