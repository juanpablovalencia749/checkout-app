import React, { useEffect } from 'react';
import {
  Check,
  X,
  Loader2,
  AlertCircle,
  Receipt,
  Package,
  User
} from 'lucide-react';

import { useAppDispatch, useAppSelector } from '../app/hooks';
import { fetchTransactionById } from '../features/transaction/transactionSlice';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { formatCurrency, formatDate } from '../lib/utils';

interface TransactionStatusPageProps {
  transactionId: string;
}

export const TransactionStatusPage: React.FC<TransactionStatusPageProps> = ({
  transactionId,
}) => {
  const dispatch = useAppDispatch();
  const { currentTransaction, loading, error } = useAppSelector(
    (state) => state.transaction
  );

  useEffect(() => {
    if (transactionId) {
      dispatch(fetchTransactionById(transactionId));
    }
  }, [dispatch, transactionId]);

  /* =========================
     LOADING STATE
  ========================== */
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 flex justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  /* =========================
     ERROR STATE
  ========================== */
  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <ErrorMessage
          message={error}
          onRetry={() => dispatch(fetchTransactionById(transactionId))}
        />
      </div>
    );
  }

  /* =========================
     NOT FOUND STATE
  ========================== */
  if (!currentTransaction) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="mx-auto w-12 h-12 text-gray-400 mb-4" />
        <p className="text-gray-600 text-lg">Transaction not found</p>
      </div>
    );
  }

  const isApproved = currentTransaction.status === 'APPROVED';

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">

        {/* =========================
            STATUS ICON
        ========================== */}
        <div className="flex justify-center mb-6">
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center ${
              isApproved ? 'bg-green-100' : 'bg-red-100'
            }`}
          >
            {isApproved ? (
              <Check className="w-10 h-10 text-green-600" />
            ) : (
              <X className="w-10 h-10 text-red-600" />
            )}
          </div>
        </div>

        {/* =========================
            STATUS MESSAGE
        ========================== */}
        <h2 className="text-2xl font-bold text-center mb-2">
          {isApproved ? 'Payment Successful!' : 'Payment Failed'}
        </h2>

        <p className="text-center text-gray-600 mb-8">
          {isApproved
            ? 'Your order has been confirmed.'
            : 'There was an issue processing your payment.'}
        </p>

        {/* =========================
            TRANSACTION DETAILS
        ========================== */}
        <div className="space-y-6">

          {/* Transaction Card */}
          <div className="bg-gray-50 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Receipt className="w-5 h-5 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-700">
                Transaction Details
              </h3>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Reference:</span>
                <span className="font-mono text-gray-900">
                  {currentTransaction.reference}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span
                  className={`font-semibold ${
                    isApproved ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {currentTransaction.status}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(currentTransaction.amount)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="text-gray-900">
                  {formatDate(currentTransaction.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Product Card */}
          {currentTransaction.product && (
            <div className="bg-gray-50 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Package className="w-5 h-5 text-gray-600" />
                <h3 className="text-sm font-semibold text-gray-700">
                  Product
                </h3>
              </div>

              <div className="text-sm">
                <p className="font-medium text-gray-900">
                  {currentTransaction.product.name}
                </p>
                <p className="text-gray-600 mt-1">
                  Quantity: {currentTransaction.quantity}
                </p>
              </div>
            </div>
          )}

          {/* Customer Card */}
          {currentTransaction.customer && (
            <div className="bg-gray-50 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-gray-600" />
                <h3 className="text-sm font-semibold text-gray-700">
                  Customer Information
                </h3>
              </div>

              <div className="text-sm space-y-1">
                <p className="text-gray-900">
                  {currentTransaction.customer.fullName}
                </p>
                <p className="text-gray-600">
                  {currentTransaction.customer.email}
                </p>
                <p className="text-gray-600">
                  {currentTransaction.customer.phone}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};