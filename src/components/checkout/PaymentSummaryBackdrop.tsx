import React, { useEffect } from 'react';
import { formatCurrency, maskCardNumber } from '../../lib/utils';
import { BASE_FEE, DELIVERY_FEE } from '../../constants';
import type { Product, Customer, DeliveryInfo, CreditCard } from '../../types';
import { X, Loader2 } from 'lucide-react';

interface PaymentSummaryBackdropProps {
  isOpen: boolean;
  product: Product;
  quantity: number;
  customer: Customer;
  delivery: DeliveryInfo;
  card: CreditCard;
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

export const PaymentSummaryBackdrop: React.FC<PaymentSummaryBackdropProps> = ({
  isOpen,
  product,
  quantity,
  customer,
  delivery,
  card,
  onConfirm,
  onCancel,
  isProcessing = false,
}) => {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isProcessing) {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isProcessing, onCancel]);

  // Prevent body scroll when backdrop is open
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

  if (!isOpen) return null;

  const subtotal = product.price * quantity;
  const total = subtotal + BASE_FEE + DELIVERY_FEE;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-60 transition-opacity" />

      {/* Content */}
      <div className="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="relative bg-white w-full sm:max-w-2xl sm:rounded-t-2xl rounded-t-3xl shadow-2xl transform transition-all">

          {/* Handle (mobile) */}
          <div className="sm:hidden flex justify-center pt-3 pb-2">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
          </div>

          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Order Summary</h2>
              {!isProcessing && (
                <button
                  onClick={onCancel}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Close"
                >
                  <X className="h-6 w-6" />
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">

            {/* Product Info */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Product</h3>
              <div className="flex items-center space-x-4 bg-gray-50 p-4 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{product.name}</p>
                  <p className="text-sm text-gray-600 mt-1">Quantity: {quantity}</p>
                </div>
                <p className="font-semibold text-gray-900">
                  {formatCurrency(product.price * quantity)}
                </p>
              </div>
            </div>

            {/* Customer Info */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Contact Information</h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                <p className="text-gray-900">{customer.fullName}</p>
                <p className="text-gray-600">{customer.email}</p>
                <p className="text-gray-600">{customer.phone}</p>
              </div>
            </div>

            {/* Delivery Info */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Delivery Address</h3>
              <div className="bg-gray-50 p-4 rounded-lg text-sm">
                <p className="text-gray-900">{delivery.address}</p>
                <p className="text-gray-600 mt-1">{delivery.city}</p>
              </div>
            </div>

            {/* Payment Method */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Payment Method</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-900">{maskCardNumber(card.number)}</p>
                <p className="text-xs text-gray-600 mt-1">
                  Expires {card.exp_month.toString().padStart(2, '0')}/{card.exp_year}
                </p>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="border-t border-gray-200 pt-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Base Fee</span>
                  <span className="text-gray-900">{formatCurrency(BASE_FEE)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span className="text-gray-900">{formatCurrency(DELIVERY_FEE)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="font-bold text-xl text-gray-900">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 sm:rounded-b-2xl">
            <button
              onClick={onConfirm}
              disabled={isProcessing}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                isProcessing
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800'
              }`}
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin h-5 w-5 text-white" />
                  Processing...
                </span>
              ) : (
                `Confirm & Pay ${formatCurrency(total)}`
              )}
            </button>

            {!isProcessing && (
              <button
                onClick={onCancel}
                className="w-full mt-2 py-2 px-4 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};