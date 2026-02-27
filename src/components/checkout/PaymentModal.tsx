import React, { useState, useEffect } from 'react';
import { CreditCardForm } from './CreditCardForm';
import { DeliveryForm } from './DeliveryForm';
import type { CreditCard, Customer, DeliveryInfo } from '../../types';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (customer: Customer, delivery: DeliveryInfo, card: CreditCard) => void;
  defaultValues?: {
    customer?: Partial<Customer>;
    delivery?: Partial<DeliveryInfo>;
    card?: Partial<CreditCard>;
  };
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  defaultValues,
}) => {
  const [step, setStep] = useState<'delivery' | 'payment'>('delivery');
  const [deliveryData, setDeliveryData] = useState<{
    customer: Customer;
    delivery: DeliveryInfo;
  } | null>(null);

  // Reset step when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('delivery');
      setDeliveryData(null);
    }
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

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

  const handleDeliverySubmit = (customer: Customer, delivery: DeliveryInfo) => {
    setDeliveryData({ customer, delivery });
    setStep('payment');
  };

  const handleCardSubmit = (card: CreditCard) => {
    if (deliveryData) {
      onComplete(deliveryData.customer, deliveryData.delivery, card);
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
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
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
            {step === 'delivery' ? (
              <DeliveryForm
                onSubmit={handleDeliverySubmit}
                defaultValues={defaultValues}
              />
            ) : (
              <>
                <button
                  onClick={handleBackToDelivery}
                  className="mb-4 text-sm text-blue-600 hover:text-blue-700 flex items-center"
                >
                  <svg
                    className="h-4 w-4 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  Back to delivery info
                </button>
                <CreditCardForm
                  onSubmit={handleCardSubmit}
                  defaultValues={defaultValues?.card}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
