// src/components/payment/PaymentModal.tsx
import React, { useState, useEffect } from 'react';
import { CreditCardForm } from './CreditCardForm';
import { DeliveryForm } from './DeliveryForm';
import type { CreditCard, Customer, DeliveryInfo } from '../../types';
import { X, ChevronLeft } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  // callback final (opcional) para notificar éxito y refrescar UI
  onComplete?: (transactionId: string, status: string) => void;
  defaultValues?: {
    customer?: Partial<Customer>;
    delivery?: Partial<DeliveryInfo>;
    card?: Partial<CreditCard>;
  };
  // Si tu modal sabe el producto/amount pásalos; si no, adapta la llamada a /transactions/init desde el parent.
  productId?: string;
  amount?: number; // en centavos o en tu unidad (ajusta)
  quantity?: number;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  defaultValues,
  productId,
  amount,
  quantity = 1,
}) => {
  const [step, setStep] = useState<'delivery' | 'payment'>('delivery');
  const [deliveryData, setDeliveryData] = useState<{
    customer: Customer;
    delivery: DeliveryInfo;
  } | null>(null);

  const [acceptance, setAcceptance] = useState<null | {
    acceptance_token: string;
    permalink: string;
    type: string;
  }>(null);
  const [acceptLoading, setAcceptLoading] = useState(false);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset step when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('delivery');
      setDeliveryData(null);
      setTransactionId(null);
      setError(null);
      // obtener acceptance token al abrir modal
      fetchAcceptance();
    }
  }, [isOpen]);

  const fetchAcceptance = async () => {
    setAcceptLoading(true);
    try {
      const res = await fetch('http://localhost:3000/payments/acceptance-data');
      const json = await res.json();
      console.log('acceptance data', json);
      // backend responde { success: true, data: { acceptance_token, permalink, type } }
      setAcceptance(json?.data ?? null);
    } catch (err: any) {
      console.error('fetch acceptance error', err);
      setAcceptance(null);
    } finally {
      setAcceptLoading(false);
    }
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Se ejecuta cuando DeliveryForm valida y hace submit
  const handleDeliverySubmit = async (customer: Customer, delivery: DeliveryInfo) => {
    setError(null);
    // 1) guarda localmente
    setDeliveryData({ customer, delivery });

    // 2) crea transacción en la BD llamando a tu endpoint (POST /transactions o /transactions/init)
    // Ajusta payload según lo que tu backend espera. En Postman tienes un ejemplo.
    try {
      const payload = {
        productId: productId ?? 'b0d0dc1b-88c7-40d2-b507-9abdeafee850', // ajustar según tu flujo
        quantity: quantity,
        customerEmail: customer.email,
        customerFullName: customer.fullName,
        customerPhone: customer.phone,
        amount: amount ?? 150000, // en centavos o en la unidad que uses en tu API
      };

      console.log('creating transaction with payload', payload);

      const res = await fetch('http://localhost:3000/transactions/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.message || 'Error creando transacción');
      }
      const json = await res.json();
      // asumo respuesta shape { data: { id: 'uuid', ... } } como en tus APIs previas
      const txId = json?.data?.id ?? json?.data?.transactionId ?? null;
      if (!txId) throw new Error('No se recibió transactionId del servidor');
      setTransactionId(txId);

      // avanza al siguiente paso
      setStep('payment');
    } catch (err: any) {
      console.error('create transaction error', err);
      setError(err?.message || 'Error creando transacción');
    }
  };

const handleCardSubmit = async (card: CreditCard) => {
  setError(null);

  if (!deliveryData) {
    setError('Delivery data missing');
    return;
  }
  if (!transactionId) {
    setError('Transaction not initialized');
    return;
  }
  if (!acceptance?.acceptance_token) {
    setError('Acceptance token missing');
    return;
  }

  // Validaciones básicas antes de enviar
  if (!card.number || !card.exp_month || !card.exp_year || !card.cvv) {
    setError('Todos los campos de la tarjeta son requeridos');
    return;
  }
  if (!deliveryData.customer.fullName) {
    setError('El nombre del titular (card_holder) es requerido');
    return;
  }

  setProcessing(true);

  try {
    const publicKey: string = import.meta.env.VITE_WOMPI_PUBLIC_KEY!;
    if (!publicKey) throw new Error('VITE_WOMPI_PUBLIC_KEY not set');

    // Formatear mes y año como string: mes 2 dígitos, año 2 dígitos (tal como sugiere la doc)
    const monthStr = String(card.exp_month).padStart(2, '0'); // ej. "06"
    // convertir año a dos últimos dígitos (ej. 2026 -> "26")
    const yearNum = Number(card.exp_year);
    const yearStr = (yearNum % 100).toString().padStart(2, '0'); // ej. "26"

    // Construimos body al nivel superior (NO dentro de { card: {...} })
    const payload = {
      number: (card.number || '').replace(/\s+/g, ''),
      exp_month: monthStr,
      exp_year: yearStr,
      cvc: String(card.cvv),
      card_holder: (deliveryData.customer.fullName || '').trim(),
    };

    console.log('-> Wompi token request body (final):', payload);

    const tokenRes = await fetch('https://api-sandbox.co.uat.wompi.dev/v1/tokens/cards', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${publicKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const tokenJson = await tokenRes.json().catch((e) => {
      console.error('Error parseando JSON de Wompi:', e);
      return null;
    });

    console.log('-> Wompi token response raw:', tokenJson);

    if (!tokenRes.ok) {
      const maybeError = tokenJson?.error ?? tokenJson ?? {};
      if (maybeError?.messages && typeof maybeError.messages === 'object') {
        const messages = Object.entries(maybeError.messages)
          .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
          .join(' | ');
        throw new Error(messages);
      }
      throw new Error(maybeError?.message || 'Error tokenizando tarjeta');
    }

    const cardToken = tokenJson?.data?.id ?? tokenJson?.data;
    if (!cardToken) throw new Error('No cardToken returned from Wompi');

    console.log('-> cardToken:', cardToken);

    // Enviar al backend para procesar con PRIVATE_KEY y acceptance_token
    const processRes = await fetch(`http://localhost:3000/transactions/${transactionId}/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cardToken,
        acceptanceToken: acceptance.acceptance_token,
        address: deliveryData.delivery.address,
        city: deliveryData.delivery.city,
      }),
    });

    const processJson = await processRes.json();
    if (!processRes.ok) {
      console.error('process payment error', processJson);
      throw new Error(processJson?.message || 'Error procesando pago');
    }

    const finalStatus = processJson?.status ?? processJson?.data?.status ?? 'UNKNOWN';
    onComplete?.(transactionId, finalStatus);

    setProcessing(false);
  } catch (err: any) {
    console.error('Tokenization / payment error:', err);
    setError(err?.message || 'Error procesando pago');
    setProcessing(false);
  }
};

  const handleBackToDelivery = () => {
    setStep('delivery');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">

          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {step === 'delivery' ? 'Delivery & Contact Info' : 'Payment Information'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close modal"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Progress Indicator */}
          <div className="px-6 pt-4">
            <div className="flex items-center">
              <div className="flex items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step === 'delivery'
                      ? 'bg-blue-600 text-white'
                      : 'bg-green-600 text-white'
                  }`}
                >
                  {step === 'payment' ? '✓' : '1'}
                </div>
                <span className="ml-2 text-sm font-medium text-gray-700">Delivery</span>
              </div>
              <div className="h-0.5 flex-1 bg-gray-300 mx-2" />
              <div className="flex items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step === 'payment'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  2
                </div>
                <span className="ml-2 text-sm font-medium text-gray-700">Payment</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            {error && (
              <div className="mb-4 text-sm text-red-600">{error}</div>
            )}

            {step === 'delivery' ? (
              <DeliveryForm
                onSubmit={handleDeliverySubmit}
                defaultValues={defaultValues}
                acceptance={acceptance}
                acceptanceLoading={acceptLoading}
              />
            ) : (
              <>
                <button
                  onClick={handleBackToDelivery}
                  className="mb-4 text-sm text-blue-600 hover:text-blue-700 flex items-center"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back to delivery info
                </button>
                <CreditCardForm
                  onSubmit={handleCardSubmit}
                  defaultValues={defaultValues?.card}
                  disabled={processing}
                />
                {processing && <p className="mt-2 text-sm text-gray-600">Procesando pago...</p>}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};