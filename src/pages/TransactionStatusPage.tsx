import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { fetchTransactionById } from '../features/transaction/transactionSlice';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
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

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <LoadingSpinner size="lg" className="h-64" />
      </div>
    );
  }

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

  if (!currentTransaction) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-600">Transaction not found</p>
        </div>
      </div>
    );
  }

  const isApproved = currentTransaction.status === 'APPROVED';

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
        {/* Status Icon */}
        <div className="flex justify-center mb-6">
          {isApproved ? (
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          ) : (
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-600"
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
            </div>
          )}
        </div>

        {/* Status Message */}
        <h2 className="text-2xl font-bold text-center mb-2">
          {isApproved ? 'Payment Successful!' : 'Payment Failed'}
        </h2>
        <p className="text-center text-gray-600 mb-6">
          {isApproved
            ? 'Your order has been confirmed.'
            : 'There was an issue processing your payment.'}
        </p>

        {/* Transaction Details */}
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Transaction Details
            </h3>
            <div className="space-y-2 text-sm">
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

          {currentTransaction.product && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Product</h3>
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

          {currentTransaction.customer && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Customer Information
              </h3>
              <div className="text-sm space-y-1">
                <p className="text-gray-900">{currentTransaction.customer.fullName}</p>
                <p className="text-gray-600">{currentTransaction.customer.email}</p>
                <p className="text-gray-600">{currentTransaction.customer.phone}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
