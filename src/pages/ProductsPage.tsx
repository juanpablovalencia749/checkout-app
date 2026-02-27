import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { fetchProducts, setSelectedProduct } from '../features/products/productsSlice';
import { 
  setCurrentStep, 
  setQuantity, 
  openModal,
  closeModal,
  openBackdrop,
  closeBackdrop,
  setCustomerInfo,
  setDeliveryInfo,
  setCardInfo,
  setTransactionId,
  resetCheckout,
} from '../features/checkout/checkoutSlice';
import { 
  createTransaction, 
  processPayment,
  clearTransaction,
} from '../features/transaction/transactionSlice';
import { ProductList } from '../components/product/ProductList';
import { PaymentModal } from '../components/checkout/PaymentModal';
import { PaymentSummaryBackdrop } from '../components/checkout/PaymentSummaryBackdrop';
import { CHECKOUT_STEPS, BASE_FEE, DELIVERY_FEE } from '../constants';
import type { Product, Customer, DeliveryInfo, CreditCard } from '../types';

export const ProductsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { products, loading, error } = useAppSelector((state) => state.products);
  const checkout = useAppSelector((state) => state.checkout);
  const { currentTransaction, processingPayment } = useAppSelector((state) => state.transaction);
  const [navigatingToStatus, setNavigatingToStatus] = useState(false);

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  const handleSelectProduct = (product: Product) => {
    dispatch(setSelectedProduct(product));
    dispatch(setQuantity(1));
    dispatch(setCurrentStep(CHECKOUT_STEPS.PAYMENT_INFO));
    dispatch(openModal());
  };

  const handlePaymentModalComplete = async (
    customer: Customer,
    delivery: DeliveryInfo,
    card: CreditCard
  ) => {
    if (!checkout.selectedProduct) return;

    // Save data to checkout state
    dispatch(setCustomerInfo(customer));
    dispatch(setDeliveryInfo(delivery));
    dispatch(setCardInfo(card));
    
    // Close modal and open backdrop
    dispatch(closeModal());
    dispatch(setCurrentStep(CHECKOUT_STEPS.SUMMARY));
    dispatch(openBackdrop());
  };

  const handleConfirmPayment = async () => {
    if (!checkout.selectedProduct || !checkout.customerInfo || !checkout.deliveryInfo || !checkout.cardInfo) {
      return;
    }

    try {
      dispatch(setCurrentStep(CHECKOUT_STEPS.STATUS));
      
      // Calculate total amount
      const subtotal = checkout.selectedProduct.price * checkout.quantity;
      const total = subtotal + BASE_FEE + DELIVERY_FEE;

      // Step 1: Create transaction
      const createResult = await dispatch(
        createTransaction({
          productId: checkout.selectedProduct.id,
          quantity: checkout.quantity,
          customerEmail: checkout.customerInfo.email!,
          customerFullName: checkout.customerInfo.fullName!,
          customerPhone: checkout.customerInfo.phone!,
          amount: total,
        })
      ).unwrap();

      if (createResult && createResult.id) {
        dispatch(setTransactionId(createResult.id));

        // Step 2: Process payment
        const processResult = await dispatch(
          processPayment({
            transactionId: createResult.id,
            payload: {
              card: {
                number: checkout.cardInfo.number!,
                exp_month: checkout.cardInfo.exp_month!,
                exp_year: checkout.cardInfo.exp_year!,
                cvv: checkout.cardInfo.cvv!,
              },
              address: checkout.deliveryInfo.address!,
              city: checkout.deliveryInfo.city!,
            },
          })
        ).unwrap();

        // Navigate to status page
        if (processResult) {
          setNavigatingToStatus(true);
          // Wait a bit to show the result, then navigate
          setTimeout(() => {
            dispatch(closeBackdrop());
            dispatch(setCurrentStep(CHECKOUT_STEPS.COMPLETE));
            // Reload products to get updated stock
            dispatch(fetchProducts());
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Payment failed:', error);
      dispatch(closeBackdrop());
      alert('Payment failed. Please try again.');
    }
  };

  const handleCancelPayment = () => {
    dispatch(closeBackdrop());
    dispatch(setCurrentStep(CHECKOUT_STEPS.PAYMENT_INFO));
    dispatch(openModal());
  };

  const handleCloseModal = () => {
    dispatch(closeModal());
  };

  const handleRetryFetch = () => {
    dispatch(fetchProducts());
  };

  // Show transaction status page
  if (checkout.currentStep === CHECKOUT_STEPS.COMPLETE && currentTransaction) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
          {/* Status Icon */}
          <div className="flex justify-center mb-6">
            {currentTransaction.status === 'APPROVED' ? (
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
            {currentTransaction.status === 'APPROVED'
              ? 'Payment Successful!'
              : 'Payment Failed'}
          </h2>
          <p className="text-center text-gray-600 mb-6">
            {currentTransaction.status === 'APPROVED'
              ? 'Your order has been confirmed and will be delivered soon.'
              : 'There was an issue processing your payment. Please try again.'}
          </p>

          {/* Transaction Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Transaction ID:</span>
              <span className="font-mono text-gray-900">{currentTransaction.reference}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span
                className={`font-semibold ${
                  currentTransaction.status === 'APPROVED'
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {currentTransaction.status}
              </span>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={() => {
              dispatch(resetCheckout());
              dispatch(clearTransaction());
              dispatch(fetchProducts());
            }}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }
  console.log("products", products)
console.log(loading)
console.log(error)
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Our Products</h1>
        <p className="mt-2 text-gray-600">
          Browse our selection of quality products
        </p>
      </div>

      <ProductList
        products={products}
        loading={loading}
        error={error}
        onSelectProduct={handleSelectProduct}
        onRetry={handleRetryFetch}
      />

      <PaymentModal
        isOpen={checkout.isModalOpen}
        onClose={handleCloseModal}
        onComplete={handlePaymentModalComplete}
        defaultValues={{
          customer: checkout.customerInfo,
          delivery: checkout.deliveryInfo,
          card: checkout.cardInfo,
        }}
      />

      {checkout.selectedProduct && (
        <PaymentSummaryBackdrop
          isOpen={checkout.isBackdropOpen}
          product={checkout.selectedProduct}
          quantity={checkout.quantity}
          customer={checkout.customerInfo as Customer}
          delivery={checkout.deliveryInfo as DeliveryInfo}
          card={checkout.cardInfo as CreditCard}
          onConfirm={handleConfirmPayment}
          onCancel={handleCancelPayment}
          isProcessing={processingPayment || navigatingToStatus}
        />
      )}
    </div>
  );
};
