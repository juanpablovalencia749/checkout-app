// src/pages/ProductsPage.tsx
import React, { useEffect, useState } from 'react';
import { Check, X, Loader2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { fetchProducts } from '../features/products/productsSlice';
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
  setSelectedProduct as setCheckoutSelectedProduct,
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
    // NUEVO: Verificamos si hay una transacción en curso persistida en localStorage (F5 / Reload)
    const pendingTx = localStorage.getItem('wompi_pending_tx');
    
    if (pendingTx) {
      // Fuerza a abrir el modal para recuperar la sesión y que se conecte al SSE
      dispatch(openModal());
    } else {
      // Lógica original de Redux (si no hubo recarga dura pero sí estado guardado en el store)
      const txId = checkout.transactionId;
      const step = checkout.currentStep;
      if (txId && step >= CHECKOUT_STEPS.SUMMARY) {
        dispatch(openModal());
        if (step === CHECKOUT_STEPS.SUMMARY || step === CHECKOUT_STEPS.STATUS) {
          dispatch(openBackdrop());
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  // Seleccionar producto desde la lista — ahora guarda en checkout slice
  const handleSelectProduct = (product: Product, quantityParam: number = 1) => {
    console.log('[ProductsPage] handleSelectProduct called with', product.id, quantityParam);

    // normalizar id por si acaso
    const normalizedId =
      (product as any).id ??
      (product as any)._id ??
      (product as any).uuid ??
      (product as any).productId ??
      null;

    if (!normalizedId || typeof normalizedId !== 'string') {
      console.error('[ProductsPage] product id missing on product:', product);
      alert('Error: el producto seleccionado no tiene identificador. Revisa la consola.');
      return;
    }

    const normalizedProduct: Product = {
      ...product,
      id: normalizedId,
    } as Product;

    // Guardar en checkout slice (flujo de compra)
    dispatch(setCheckoutSelectedProduct(normalizedProduct));
    dispatch(setQuantity(quantityParam));

    // Avanzar al paso de payment info y abrir modal
    dispatch(setCurrentStep(CHECKOUT_STEPS.PAYMENT_INFO));
    dispatch(openModal());
  };

  // const handlePaymentModalComplete = async (
  //   customerOrTxId: any, // Adaptado por si recibe los datos del nuevo modal SSE o del antiguo
  //   delivery?: DeliveryInfo,
  //   card?: CreditCard
  // ) => {
  //   if (!checkout.selectedProduct) return;

  //   // Si viene del Modal unificado (recuperación de SSE), cerramos todo.
  //   if (typeof customerOrTxId === 'string') {
  //     dispatch(closeModal());
  //     dispatch(closeBackdrop());
  //     // Aquí podrías forzar la navegación final a CHECKOUT_STEPS.COMPLETE si lo deseas
  //     return;
  //   }

  //   // Lógica original
  //   dispatch(setCustomerInfo(customerOrTxId));
  //   dispatch(setDeliveryInfo(delivery!));
  //   dispatch(setCardInfo(card!));

  //   dispatch(closeModal());
  //   dispatch(setCurrentStep(CHECKOUT_STEPS.SUMMARY));
  //   dispatch(openBackdrop());
  // };
// src/pages/ProductsPage.tsx

const handlePaymentModalComplete = async (
  txId: string,
  status: string
) => {
  console.log("Transacción terminada:", txId, status);
  
  // Limpiamos estados de Redux si es necesario
  dispatch(closeModal());
  dispatch(closeBackdrop());

  if (status === 'APPROVED') {
    // Actualizamos el stock de los productos
    dispatch(fetchProducts());
    // Opcional: Podrías redirigir a una página de "Gracias" o simplemente 
    // resetear el checkout.
    dispatch(resetCheckout());
  } else {
    // Manejar error si se desea
    console.warn("El pago no fue aprobado");
  }
};
  const handleConfirmPayment = async () => {
    if (!checkout.selectedProduct || !checkout.customerInfo || !checkout.deliveryInfo || !checkout.cardInfo) {
      return;
    }

    try {
      dispatch(setCurrentStep(CHECKOUT_STEPS.STATUS));

      const subtotal = checkout.selectedProduct.price * checkout.quantity;
      const total = subtotal + BASE_FEE + DELIVERY_FEE;

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
        
        // Antes de procesar, guardamos en localStorage para el SSE!
        localStorage.setItem('wompi_pending_tx', createResult.id);

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

        if (processResult) {
          setNavigatingToStatus(true);

          setTimeout(() => {
            dispatch(closeBackdrop());
            dispatch(setCurrentStep(CHECKOUT_STEPS.COMPLETE));
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

  /* ==============================
     STATUS PAGE
  ============================== */

  if (checkout.currentStep === CHECKOUT_STEPS.COMPLETE && currentTransaction) {
    const isApproved = currentTransaction.status === 'APPROVED';

    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
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

          <h2 className="text-2xl font-bold text-center mb-2">
            {isApproved ? 'Payment Successful!' : 'Payment Failed'}
          </h2>

          <p className="text-center text-gray-600 mb-6">
            {isApproved
              ? 'Your order has been confirmed and will be delivered soon.'
              : 'There was an issue processing your payment. Please try again.'}
          </p>

          <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Transaction ID:</span>
              <span className="font-mono text-gray-900">
                {currentTransaction.reference}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span
                className={`font-semibold ${isApproved ? 'text-green-600' : 'text-red-600'}`}
              >
                {currentTransaction.status}
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              dispatch(resetCheckout());
              dispatch(clearTransaction());
              dispatch(fetchProducts());
            }}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  /* ==============================
     PRODUCTS LIST
  ============================== */

  console.log('selectedProduct (checkout slice) ->', checkout.selectedProduct);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Our Products</h1>
        <p className="mt-2 text-gray-600">Browse our selection of quality products</p>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        </div>
      )}

      <ProductList
        products={products}
        loading={loading}
        error={error}
        onSelectProduct={handleSelectProduct}
        onRetry={handleRetryFetch}
      />

      {/* <PaymentModal
        isOpen={checkout.isModalOpen}
        onClose={handleCloseModal}
        onComplete={handlePaymentModalComplete}
        defaultValues={{
          customer: checkout.customerInfo,
          delivery: checkout.deliveryInfo,
          card: checkout.cardInfo,
        }}
        productId={checkout.selectedProduct?.id ?? undefined}
        productTitle={checkout.selectedProduct?.name ?? undefined}
        amount={checkout.selectedProduct?.price ?? undefined}
        quantity={checkout.quantity}
      /> */}

      <PaymentModal
  isOpen={checkout.isModalOpen}
  onClose={() => dispatch(closeModal())}
  onComplete={handlePaymentModalComplete}
  productId={checkout.selectedProduct?.id}
  productTitle={checkout.selectedProduct?.name}
  amount={checkout.selectedProduct?.price}
  quantity={checkout.quantity}
  defaultValues={{
    customer: checkout.customerInfo,
    delivery: checkout.deliveryInfo,
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