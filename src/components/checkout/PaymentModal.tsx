// src/components/checkout/PaymentModal.tsx
import React, { useEffect, useState } from 'react';
import { CreditCardForm } from './CreditCardForm';
import { DeliveryForm } from './DeliveryForm';
import type { CreditCard, Customer, DeliveryInfo } from '../../types';
import { X, ChevronLeft } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (transactionId: string, status: string) => void;
  defaultValues?: {
    customer?: Partial<Customer>;
    delivery?: Partial<DeliveryInfo>;
    card?: Partial<CreditCard>;
  };
  productId?: string;
  productTitle?: string;
  amount?: number;
  quantity?: number;
}

type Step = 'delivery' | 'payment' | 'summary' | 'result';

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  defaultValues,
  productId,
  productTitle = 'Producto',
  amount,
  quantity = 1,
}) => {
  const [step, setStep] = useState<Step>('delivery');
  const [deliveryData, setDeliveryData] = useState<{ customer: Customer; delivery: DeliveryInfo } | null>(null);
  const [cardData, setCardData] = useState<CreditCard | null>(null);
  const [acceptance, setAcceptance] = useState<null | { acceptance_token: string; permalink: string; type: string }>(null);
  const [acceptLoading, setAcceptLoading] = useState(false);

  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [txStatus, setTxStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const BASE_FEE_PERCENT = 0.03;
  const DELIVERY_FEE = 5000;

  useEffect(() => {
    if (isOpen) {
      const savedTxId = localStorage.getItem('wompi_pending_tx');
      if (savedTxId) {
        setTransactionId(savedTxId);
        setStep('result');
        setProcessing(true);
        setTxStatus('PENDING');
        checkStatusAndSubscribe(savedTxId);
      } else if (step === 'result') {
        // Si no hay tx pendiente y estábamos en result, volvemos al inicio al reabrir
        setStep('delivery');
      }
    } else {
      setProcessing(false);
    }
  }, [isOpen]);

  const fetchAcceptance = async () => {
    setAcceptLoading(true);
    try {
      const res = await fetch('http://localhost:3000/payments/acceptance-data');
      const json = await res.json();
      setAcceptance(json?.data ?? null);
    } catch (e) {
      setAcceptance(null);
    } finally {
      setAcceptLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !transactionId) fetchAcceptance();
  }, [isOpen]);

  const checkStatusAndSubscribe = async (txId: string) => {
    try {
      const res = await fetch(`http://localhost:3000/transactions/${txId}`);
      const json = await res.json();
      const currentStatus = (json?.data?.status ?? json?.status)?.toString().toUpperCase();

      if (currentStatus && currentStatus !== 'PENDING') {
        handleTransactionStateUpdate(currentStatus);
        return;
      }

      const eventSource = new EventSource(`http://localhost:3000/payments/transactions/${txId}/events`);

      eventSource.onmessage = (event) => {
        try {
          const parsedData = JSON.parse(event.data);
          // Ajuste: Wompi puede enviar el status en la raíz o dentro de data
          const status = (parsedData?.status || parsedData?.data?.status)?.toUpperCase();

          if (status === 'APPROVED' || status === 'DECLINED' || status === 'ERROR' || status === 'VOIDED') {
            handleTransactionStateUpdate(status);
            eventSource.close();
          }
        } catch (err) {
          console.error('Error parseando SSE:', err);
        }
      };

      eventSource.onerror = () => eventSource.close();
    } catch (error) {
      console.error('Error verificando estado:', error);
    }
  };

  const handleTransactionStateUpdate = (status: string) => {
    setTxStatus(status);
    setProcessing(false);
    // IMPORTANTE: No llamamos a onComplete aquí para que el modal no se cierre solo
  };

  const unitPrice = amount ?? 150000;
  const subtotal = unitPrice * (quantity || 1);
  const baseFee = Math.ceil(subtotal * BASE_FEE_PERCENT);
  const totalAmount = Math.round(subtotal + baseFee + DELIVERY_FEE);

  const handleDeliverySubmit = async (customer: Customer, delivery: DeliveryInfo) => {
    setError(null);
    setDeliveryData({ customer, delivery });
    try {
      const payload = {
        productId: productId || 'b0d0dc1b-88c7-40d2-b507-9abdeafee850',
        quantity,
        customerEmail: customer.email,
        customerFullName: customer.fullName,
        customerPhone: customer.phone,
        city: delivery.city,
        address: delivery.address,
        amount: totalAmount,
      };

      const res = await fetch('http://localhost:3000/transactions/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      const txId = json?.data?.id ?? json?.data?.transactionId;
      if (!txId) throw new Error('No se recibió ID de transacción');
      
      setTransactionId(txId);
      setStep('payment');
    } catch (err: any) {
      setError(err?.message || 'Error al iniciar transacción');
    }
  };

  const handleConfirmPayment = async () => {
    if (!deliveryData || !transactionId || !acceptance || !cardData) return;
    
    setError(null);
    setProcessing(true);
    setTxStatus('PENDING');
    setStep('result');
    localStorage.setItem('wompi_pending_tx', transactionId);

    try {
      const publicKey = import.meta.env.VITE_WOMPI_PUBLIC_KEY;
      
      // 1. Tokenizar tarjeta directamente con Wompi
      const tokenRes = await fetch('https://api-sandbox.co.uat.wompi.dev/v1/tokens/cards', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${publicKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          number: cardData.number.replace(/\s+/g, ''),
          exp_month: String(cardData.exp_month).padStart(2, '0'),
          exp_year: String(cardData.exp_year).slice(-2),
          cvc: String(cardData.cvv),
          card_holder: deliveryData.customer.fullName,
        }),
      });

      const tokenJson = await tokenRes.json();
      if (!tokenRes.ok) throw new Error('Error al validar tarjeta');

      const cardToken = tokenJson.data.id;

      // 2. Procesar en tu Backend
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
      const status = (processJson?.data?.status || processJson?.status)?.toUpperCase();

      if (status === 'PENDING') {
        checkStatusAndSubscribe(transactionId);
      } else {
        handleTransactionStateUpdate(status || 'ERROR');
      }
    } catch (err: any) {
      setError(err.message);
      setProcessing(false);
      setTxStatus('ERROR');
    }
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(val / 100);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={() => !processing && onClose()} />
      <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-white sticky top-0">
          <h2 className="font-bold text-lg">
            {step === 'result' ? 'Estado del Pago' : 'Checkout'}
          </h2>
          {!processing && (
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        <div className="p-6 overflow-y-auto">
          {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md border border-red-200 text-sm">{error}</div>}

          {step === 'delivery' && (
            <DeliveryForm onSubmit={handleDeliverySubmit} acceptance={acceptance} acceptanceLoading={acceptLoading} />
          )}

          {step === 'payment' && (
            <>
              <button onClick={() => setStep('delivery')} className="mb-4 text-sm text-blue-600 flex items-center">
                <ChevronLeft className="w-4 h-4" /> Volver
              </button>
              <CreditCardForm onSubmit={(card) => { setCardData(card); setStep('summary'); }} />
            </>
          )}

          {step === 'summary' && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg border">
                <div className="flex justify-between text-sm mb-1"><span>Subtotal:</span><span>{formatCurrency(subtotal)}</span></div>
                <div className="flex justify-between text-sm mb-1"><span>IVA/Servicio:</span><span>{formatCurrency(baseFee)}</span></div>
                <div className="flex justify-between text-sm mb-1"><span>Envío:</span><span>{formatCurrency(DELIVERY_FEE)}</span></div>
                <div className="flex justify-between font-bold border-t mt-2 pt-2 text-lg"><span>Total:</span><span>{formatCurrency(totalAmount)}</span></div>
              </div>
              <button 
                onClick={handleConfirmPayment} 
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors"
              >
                Confirmar y Pagar
              </button>
            </div>
          )}

          {step === 'result' && (
            <div className="text-center py-6">
              {(processing || txStatus === 'PENDING') ? (
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="font-medium text-gray-700">Procesando tu pago...</p>
                  <p className="text-xs text-gray-500 mt-2">Por favor no cierres esta ventana.</p>
                </div>
              ) : (
                <div className="animate-in fade-in zoom-in duration-300">
                  {txStatus === 'APPROVED' ? (
                    <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                      <div className="text-4xl mb-2">✅</div>
                      <h3 className="text-xl font-bold text-green-800">¡Pago Exitoso!</h3>
                      <p className="text-green-700 text-sm mt-2">Tu pedido ha sido procesado correctamente.</p>
                    </div>
                  ) : (
                    <div className="bg-red-50 p-6 rounded-xl border border-red-200">
                      <div className="text-4xl mb-2">❌</div>
                      <h3 className="text-xl font-bold text-red-800">Pago no completado</h3>
                      <p className="text-red-700 text-sm mt-2">El banco rechazó la transacción o hubo un error.</p>
                    </div>
                  )}
                  
                  <button
                    onClick={() => {
                      localStorage.removeItem('wompi_pending_tx');
                      if (transactionId && txStatus) onComplete?.(transactionId, txStatus);
                      onClose();
                    }}
                    className="w-full mt-6 bg-gray-900 text-white py-3 rounded-lg font-bold hover:bg-black"
                  >
                    Continuar
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
// // src/components/checkout/PaymentModal.tsx
// import React, { useEffect, useRef, useState, useCallback } from 'react';
// import { CreditCardForm } from './CreditCardForm';
// import { DeliveryForm } from './DeliveryForm';
// import type { CreditCard, Customer, DeliveryInfo } from '../../types';
// import { X, ChevronLeft } from 'lucide-react';

// interface PaymentModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onComplete?: (transactionId: string, status: string) => void;
//   defaultValues?: {
//     customer?: Partial<Customer>;
//     delivery?: Partial<DeliveryInfo>;
//     card?: Partial<CreditCard>;
//   };
//   productId?: string;
//   productTitle?: string;
//   amount?: number; // en centavos
//   quantity?: number;
// }

// type Step = 'delivery' | 'payment' | 'summary' | 'result';

// export const PaymentModal: React.FC<PaymentModalProps> = ({
//   isOpen,
//   onClose,
//   onComplete,
//   defaultValues,
//   productId,
//   productTitle = 'Producto',
//   amount,
//   quantity = 1,
// }) => {
//   // Steps & form state
//   const [step, setStep] = useState<Step>('delivery');
//   const [deliveryData, setDeliveryData] = useState<{ customer: Customer; delivery: DeliveryInfo } | null>(null);
//   const [cardData, setCardData] = useState<CreditCard | null>(null);
//   const [acceptance, setAcceptance] = useState<null | { acceptance_token: string; permalink: string; type: string }>(null);
//   const [acceptLoading, setAcceptLoading] = useState(false);

//   // Transaction & processing state
//   const [transactionId, setTransactionId] = useState<string | null>(null);
//   const [processing, setProcessing] = useState(false);
//   const [txStatus, setTxStatus] = useState<string | null>(null); // 'PENDING' | 'APPROVED' | 'DECLINED' | null
//   const [error, setError] = useState<string | null>(null);

//   // Polling
//   const pollingRef = useRef<number | null>(null);
//   const attemptsRef = useRef(0);
//   const MAX_ATTEMPTS = 24; // 24 * 5s = 120s
//   const POLL_INTERVAL = 5000;

//   // Fees
//   const BASE_FEE_PERCENT = 0.03; // 3%
//   const DELIVERY_FEE = 5000; // centavos (ejemplo)

//   // Reset / fetch acceptance on open
//   useEffect(() => {
//     if (isOpen) {
//       setStep('delivery');
//       setDeliveryData(null);
//       setCardData(null);
//       setTransactionId(null);
//       setProcessing(false);
//       setTxStatus(null);
//       setError(null);
//       fetchAcceptance();
//     } else {
//       cleanupPolling();
//       setProcessing(false);
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [isOpen]);

//   const fetchAcceptance = async () => {
//     setAcceptLoading(true);
//     try {
//       const res = await fetch('http://localhost:3000/payments/acceptance-data');
//       const json = await res.json();
//       setAcceptance(json?.data ?? null);
//     } catch (e) {
//       console.warn('fetchAcceptance error', e);
//       setAcceptance(null);
//     } finally {
//       setAcceptLoading(false);
//     }
//   };

//   // Prevent scroll
//   useEffect(() => {
//     document.body.style.overflow = isOpen ? 'hidden' : 'unset';
//     return () => { document.body.style.overflow = 'unset'; };
//   }, [isOpen]);

//   // Cleanup on unmount
//   useEffect(() => {
//     return () => cleanupPolling();
//   }, []);

//   const cleanupPolling = () => {
//     if (pollingRef.current) {
//       window.clearInterval(pollingRef.current);
//       pollingRef.current = null;
//     }
//     attemptsRef.current = 0;
//   };

//   // Helper currency formatter
//   const formatCurrency = (cents?: number) => {
//     const value = (cents ?? 0) / 100;
//     try {
//       return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(value);
//     } catch {
//       return `${value.toFixed(2)}`;
//     }
//   };

//   // Derived amounts
//   const productAmount = amount ?? 150000;
//   const baseFee = Math.ceil(productAmount * BASE_FEE_PERCENT);
//   const deliveryFee = DELIVERY_FEE;
//   const totalAmount = productAmount + baseFee + deliveryFee;

//   // 1) Delivery form submit -> create transaction PENDING in backend, get tx id, go to payment (card)
//   const handleDeliverySubmit = async (customer: Customer, delivery: DeliveryInfo) => {
//     setError(null);
//     setDeliveryData({ customer, delivery });

//     try {
//       const payload = {
//         productId: productId ?? 'b0d0dc1b-88c7-40d2-b507-9abdeafee850',
//         quantity,
//         customerEmail: customer.email,
//         customerFullName: customer.fullName,
//         customerPhone: customer.phone,
//         city: delivery.city,
//         address: delivery.address,
//         amount: productAmount,
//       };

//       const res = await fetch('http://localhost:3000/transactions/init', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(payload),
//       });

//       if (!res.ok) {
//         const j = await res.json().catch(() => null);
//         throw new Error(j?.message || 'Error creando transacción');
//       }

//       const json = await res.json();
//       const txId = json?.data?.id ?? json?.data?.transactionId ?? null;
//       if (!txId) throw new Error('No se recibió transactionId del servidor');
//       setTransactionId(txId);

//       // go to card entry (step 2)
//       setStep('payment');
//     } catch (err: any) {
//       console.error('handleDeliverySubmit error', err);
//       setError(err?.message || 'Error creando transacción');
//     }
//   };

//   // 2) Card form submit -> save cardData and go to summary (step 3)
//   const handleCardFormSubmit = (card: CreditCard) => {
//     setCardData(card);
//     setStep('summary'); // Summary is the 3rd step and is readonly
//   };

//   // Utility: mask card number (show last 4)
//   const maskCardNumber = (num?: string) => {
//     if (!num) return '•••• •••• •••• ••••';
//     const cleaned = num.replace(/\s+/g, '');
//     const last4 = cleaned.slice(-4);
//     return `•••• •••• •••• ${last4}`;
//   };

//   // 3) On Summary -> Continue / Pagar => tokenizar y process payment (call backend)
//   const handleConfirmPayment = async () => {
//     setError(null);

//     if (!deliveryData) {
//       setError('Falta información de delivery');
//       return;
//     }
//     if (!transactionId) {
//       setError('Transacción no inicializada');
//       return;
//     }
//     if (!acceptance?.acceptance_token) {
//       setError('Acceptance token no disponible');
//       return;
//     }
//     if (!cardData) {
//       setError('Datos de tarjeta faltantes');
//       return;
//     }

//     setProcessing(true);
//     setTxStatus('PROCESSING');
//     setStep('result'); // show result screen with spinner/pending

//     try {
//       const publicKey: string = import.meta.env.VITE_WOMPI_PUBLIC_KEY!;
//       if (!publicKey) throw new Error('VITE_WOMPI_PUBLIC_KEY not set');

//       const monthStr = String(cardData.exp_month).padStart(2, '0');
//       const yearStr = (Number(cardData.exp_year) % 100).toString().padStart(2, '0');

//       const tokenPayload = {
//         number: (cardData.number || '').replace(/\s+/g, ''),
//         exp_month: monthStr,
//         exp_year: yearStr,
//         cvc: String(cardData.cvv),
//         card_holder: (deliveryData.customer.fullName || '').trim(),
//       };

//       // 3.1 Tokenize card with Wompi (sandbox)
//       const tokenRes = await fetch('https://api-sandbox.co.uat.wompi.dev/v1/tokens/cards', {
//         method: 'POST',
//         headers: {
//           Authorization: `Bearer ${publicKey}`,
//           'Content-Type': 'application/json',
//           Accept: 'application/json',
//         },
//         body: JSON.stringify(tokenPayload),
//       });

//       const tokenJson = await tokenRes.json().catch(() => null);
//       if (!tokenRes.ok) {
//         const maybeError = tokenJson?.error ?? tokenJson ?? {};
//         if (maybeError?.messages && typeof maybeError?.messages === 'object') {
//           const messages = Object.entries(maybeError.messages)
//             .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
//             .join(' | ');
//           throw new Error(messages);
//         }
//         throw new Error(maybeError?.message || 'Error tokenizando tarjeta');
//       }

//       const cardToken = tokenJson?.data?.id ?? tokenJson?.data;
//       if (!cardToken) throw new Error('No cardToken returned from Wompi');

//       // 3.2 Send to backend to process (backend uses private key and acceptance_token)
//       const processRes = await fetch(`http://localhost:3000/transactions/${transactionId}/process`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           cardToken,
//           acceptanceToken: acceptance.acceptance_token,
//           address: deliveryData.delivery.address,
//           city: deliveryData.delivery.city,
//         }),
//       });

//       const processJson = await processRes.json().catch(() => null);
//       if (!processRes.ok) {
//         console.error('process payment error', processJson);
//         throw new Error(processJson?.message || 'Error procesando pago');
//       }

//       // Normalize status
//       const returnedStatus =
//         (processJson?.status ??
//           processJson?.data?.status ??
//           processJson?.data?.transaction?.status ??
//           processJson?.data?.transactionStatus ??
//           null)?.toString().toUpperCase() ?? null;

//       if (returnedStatus === 'PENDING') {
//         setTxStatus('PENDING');
//         // Start polling backend GET /transactions/:id
//         startPollingTransactionStatus(transactionId);
//         // keep processing = true until polling resolves or times out
//         return;
//       }

//       // immediate final state (APPROVED/DECLINED)
//       const final = (returnedStatus ?? 'UNKNOWN').toUpperCase();
//       setTxStatus(final);
//       setProcessing(false);
//       onComplete?.(transactionId, final);
//     } catch (err: any) {
//       console.error('handleConfirmPayment error', err);
//       setError(err?.message || 'Error procesando pago');
//       setProcessing(false);
//       setTxStatus(null);
//     }
//   };

//   // Polling implementation
//   const startPollingTransactionStatus = useCallback(
//     (txId: string) => {
//       cleanupPolling();
//       attemptsRef.current = 0;

//       // initial immediate check
//       (async () => {
//         try {
//           const initial = await fetch(`http://localhost:3000/transactions/${txId}`);
//           const j = await initial.json().catch(() => null);
//           const statusNow = (j?.data?.status ?? j?.status ?? null)?.toString().toUpperCase() ?? null;
//           if (statusNow && statusNow !== 'PENDING') {
//             cleanupPolling();
//             setTxStatus(statusNow);
//             setProcessing(false);
//             onComplete?.(txId, statusNow);
//             return;
//           }
//         } catch (e) {
//           console.warn('initial polling check failed', e);
//         }

//         // interval polling
//         pollingRef.current = window.setInterval(async () => {
//           attemptsRef.current += 1;
//           try {
//             const resp = await fetch(`http://localhost:3000/transactions/${txId}`);
//             const body = await resp.json().catch(() => null);
//             const status = (body?.data?.status ?? body?.status ?? null)?.toString().toUpperCase() ?? null;

//             if (status && status !== 'PENDING') {
//               cleanupPolling();
//               setTxStatus(status);
//               setProcessing(false);
//               onComplete?.(txId, status);
//               return;
//             }

//             if (attemptsRef.current >= MAX_ATTEMPTS) {
//               cleanupPolling();
//               setProcessing(false);
//               setTxStatus('PENDING');
//               setError('Aún no recibimos confirmación del pago. Te notificaremos por correo cuando la tengamos.');
//               return;
//             }
//           } catch (e) {
//             console.warn('polling error', e);
//           }
//         }, POLL_INTERVAL);
//       })();
//     },
//     [onComplete]
//   );

//   // UI controls
//   const handleBackFromSummary = () => {
//     // go back to payment to edit card if user needs
//     setStep('payment');
//   };

//   const handleBackdropClick = () => {
//     if (processing && txStatus === 'PENDING') return;
//     onClose();
//   };

//   const closeDisabled = processing && txStatus === 'PENDING';

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 z-50 overflow-y-auto">
//       {/* Backdrop */}
//       <div
//         className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
//         onClick={handleBackdropClick}
//       />

//       {/* Modal */}
//       <div className="flex min-h-full items-center justify-center p-4">
//         <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">

//           {/* Header */}
//           <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
//             <h2 className="text-xl font-semibold text-gray-900">
//               {step === 'delivery' ? 'Delivery & Contact Info' : step === 'payment' ? 'Payment Information' : step === 'summary' ? 'Resumen de pago' : 'Estado del pago'}
//             </h2>
//             <button
//               onClick={() => { if (!closeDisabled) onClose(); }}
//               className={`text-gray-400 hover:text-gray-600 transition-colors ${closeDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
//               aria-label="Close modal"
//             >
//               <X className="h-6 w-6" />
//             </button>
//           </div>

//           {/* Progress Indicator */}
//           <div className="px-6 pt-4">
//             <div className="flex items-center text-sm font-medium text-gray-700">
//               <div className={step === 'delivery' ? 'text-blue-600 font-semibold' : ''}>1. Delivery</div>
//               <div className="mx-2">→</div>
//               <div className={step === 'payment' ? 'text-blue-600 font-semibold' : ''}>2. Card</div>
//               <div className="mx-2">→</div>
//               <div className={step === 'summary' ? 'text-blue-600 font-semibold' : ''}>3. Summary</div>
//             </div>
//           </div>

//           {/* Content */}
//           <div className="px-6 py-6">
//             {error && <div className="mb-4 text-sm text-red-600">{error}</div>}

//             {/* STEP 1: DELIVERY */}
//             {step === 'delivery' && (
//               <DeliveryForm
//                 onSubmit={handleDeliverySubmit}
//                 defaultValues={defaultValues}
//                 acceptance={acceptance}
//                 acceptanceLoading={acceptLoading}
//               />
//             )}

//             {/* STEP 2: CARD ENTRY */}
//             {step === 'payment' && (
//               <>
//                 <button
//                   onClick={() => setStep('delivery')}
//                   className="mb-4 text-sm text-blue-600 hover:text-blue-700 flex items-center"
//                 >
//                   <ChevronLeft className="h-4 w-4 mr-1" />
//                   Back to delivery
//                 </button>
//                 <CreditCardForm
//                   onSubmit={handleCardFormSubmit}
//                   defaultValues={defaultValues?.card}
//                   disabled={processing}
//                 />
//               </>
//             )}

//             {/* STEP 3: SUMMARY (READ-ONLY) */}
//             {step === 'summary' && deliveryData && cardData && (
//               <>
//                 <div className="bg-gray-50 p-4 rounded-lg mb-4">
//                   <h3 className="text-sm font-semibold text-gray-700 mb-2">Producto</h3>
//                   <div className="flex justify-between">
//                     <div>
//                       <div className="font-medium">{productTitle}</div>
//                       <div className="text-sm text-gray-500">Cantidad: {quantity}</div>
//                     </div>
//                     <div className="text-sm font-medium">{formatCurrency(productAmount)}</div>
//                   </div>
//                 </div>

//                 <div className="bg-white p-4 rounded-lg border mb-4">
//                   <h3 className="text-sm font-semibold text-gray-700 mb-2">Detalle del pago</h3>
//                   <div className="flex justify-between py-1"><div className="text-sm text-gray-600">Monto producto</div><div className="text-sm font-medium">{formatCurrency(productAmount)}</div></div>
//                   <div className="flex justify-between py-1"><div className="text-sm text-gray-600">Fee base</div><div className="text-sm font-medium">{formatCurrency(baseFee)}</div></div>
//                   <div className="flex justify-between py-1"><div className="text-sm text-gray-600">Envío</div><div className="text-sm font-medium">{formatCurrency(deliveryFee)}</div></div>
//                   <div className="border-t mt-2 pt-2 flex justify-between"><div className="font-medium">Total</div><div className="font-medium">{formatCurrency(totalAmount)}</div></div>
//                 </div>

//                 <div className="bg-gray-50 p-4 rounded-lg mb-4">
//                   <h3 className="text-sm font-semibold text-gray-700 mb-2">Datos de contacto</h3>
//                   <div className="text-sm text-gray-700">Nombre: <span className="font-medium">{deliveryData.customer.fullName}</span></div>
//                   <div className="text-sm text-gray-700">Email: <span className="font-medium">{deliveryData.customer.email}</span></div>
//                   <div className="text-sm text-gray-700">Teléfono: <span className="font-medium">{deliveryData.customer.phone}</span></div>
//                 </div>

//                 <div className="bg-white p-4 rounded-lg border mb-4">
//                   <h3 className="text-sm font-semibold text-gray-700 mb-2">Dirección de envío</h3>
//                   <div className="text-sm text-gray-700">{deliveryData.delivery.address}</div>
//                   <div className="text-sm text-gray-700">{deliveryData.delivery.city}</div>
//                 </div>

//                 <div className="bg-gray-50 p-4 rounded-lg">
//                   <h3 className="text-sm font-semibold text-gray-700 mb-2">Tarjeta</h3>
//                   <div className="text-sm text-gray-700">Titular: <span className="font-medium">{deliveryData.customer.fullName}</span></div>
//                   <div className="text-sm text-gray-700">Número: <span className="font-medium">{maskCardNumber(cardData.number)}</span></div>
//                   <div className="text-sm text-gray-700">Expira: <span className="font-medium">{String(cardData.exp_month).padStart(2, '0')}/{String(cardData.exp_year).slice(-2)}</span></div>
//                 </div>

//                 <div className="mt-4 flex space-x-2">
//                   <button
//                     onClick={handleBackFromSummary}
//                     className="flex-1 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300"
//                   >
//                     Editar tarjeta
//                   </button>
//                   <button
//                     onClick={handleConfirmPayment}
//                     disabled={processing}
//                     className={`py-2 px-4 rounded-lg ${processing ? 'bg-gray-300 text-gray-700 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
//                   >
//                     {processing ? 'Procesando...' : `Continuar y Pagar ${formatCurrency(totalAmount)}`}
//                   </button>
//                 </div>
//               </>
//             )}

//             {/* STEP 4: RESULT */}
//             {step === 'result' && (
//               <>
//                 {(processing || txStatus === 'PENDING') && (
//                   <div className="mt-4 flex items-center space-x-3">
//                     <div className="w-6 h-6 rounded-full border-4 border-t-transparent border-blue-600 animate-spin" />
//                     <div className="text-sm text-gray-700">
//                       {txStatus === 'PENDING'
//                         ? 'Pago en proceso — esperando confirmación.'
//                         : 'Procesando pago...'}
//                     </div>
//                   </div>
//                 )}

//                 {txStatus && txStatus !== 'PENDING' && (
//                   <div className="mt-4">
//                     {txStatus === 'APPROVED' ? (
//                       <div className="text-sm text-green-700">Pago aprobado ✅ — Tu pedido está confirmado.</div>
//                     ) : txStatus === 'DECLINED' ? (
//                       <div className="text-sm text-red-700">Pago rechazado ❌ — Intenta con otra tarjeta o contacta soporte.</div>
//                     ) : (
//                       <div className="text-sm text-gray-700">Estado: {txStatus}</div>
//                     )}

//                     <div className="mt-4">
//                       <button
//                         onClick={() => {
//                           if (transactionId && txStatus) onComplete?.(transactionId, txStatus);
//                           onClose();
//                         }}
//                         className="py-2 px-4 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
//                       >
//                         Volver al producto
//                       </button>
//                     </div>
//                   </div>
//                 )}

//                 {/* Timeout/fallback when polling finished but still pending */}
//                 {txStatus === 'PENDING' && !processing && (
//                   <div className="mt-4">
//                     <div className="text-sm text-gray-700 mb-3">Aún no recibimos confirmación del pago. Puedes revisar en "Mis pedidos" más tarde.</div>
//                     <div className="flex space-x-2">
//                       <button onClick={() => onClose()} className="flex-1 py-2 rounded-lg bg-gray-200">Cerrar</button>
//                       <button
//                         onClick={() => {
//                           if (transactionId) {
//                             startPollingTransactionStatus(transactionId);
//                             setProcessing(true);
//                           }
//                         }}
//                         className="py-2 px-4 rounded-lg bg-blue-600 text-white"
//                       >
//                         Reintentar comprobación
//                       </button>
//                     </div>
//                   </div>
//                 )}
//               </>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };