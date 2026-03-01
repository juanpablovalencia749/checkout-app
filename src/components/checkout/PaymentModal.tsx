// src/components/checkout/PaymentModal.tsx
import React, { useEffect, useState } from 'react';
import { CreditCardForm } from './CreditCardForm';
import { DeliveryForm } from './DeliveryForm';
import type { CreditCard, Customer, DeliveryInfo } from '../../types';
import { X, ChevronLeft } from 'lucide-react';
// ui components
import { Button } from '../ui/button';
import { Card } from '../ui/card';

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
  const [contractNumber, setContractNumber] = useState<string | null>(null);

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

  // const fetchContractNumber = async () => {
  //   try {
  //     const res = await fetch('http://localhost:3000/payments/acceptance-data');
  //     const json = await res.json();
  //     setContractNumber(json?.data?.acceptance_token ?? null);
  //   } catch (e) {
  //     console.error('Error fetching contract number:', e);
  //     setContractNumber(null);
  //   }
  // };

  useEffect(() => {
    if (isOpen) {
      fetchAcceptance();
      // fetchContractNumber();
    } else {
      setAcceptance(null);
      setContractNumber(null);
    }
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
  };

  const unitPrice = amount ?? 150000;
  const subtotal = unitPrice * (quantity || 1);
  const baseFee = Math.ceil(subtotal * BASE_FEE_PERCENT);
  const rawTotal = subtotal + baseFee + DELIVERY_FEE;
  const MIN_AMOUNT = 100; 
  let totalAmount = Math.ceil(rawTotal / 100) * 100;
  if (totalAmount < MIN_AMOUNT) totalAmount = MIN_AMOUNT;

  const handleDeliverySubmit = async (customer: Customer, delivery: DeliveryInfo) => {
    setError(null);
    setDeliveryData({ customer, delivery });
    try {
      const payload = {
        productId: productId,
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
        <div className="p-4 flex justify-between items-center bg-white sticky top-0">
          <h2 className="font-bold text-lg">
            {step === 'result' ? 'Estado del Pago' : 'Checkout'}
          </h2>
          {!processing && (
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="p-1"
            >
              <X className="w-6 h-6" />
            </Button>
          )}
        </div>

        <div className="p-6 overflow-y-auto">
          {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md border border-red-200 text-sm">{error}</div>}

          {step === 'delivery' && (
            <DeliveryForm onSubmit={handleDeliverySubmit} acceptance={acceptance} acceptanceLoading={acceptLoading} />
          )}

          {step === 'payment' && (
            <>
              <Button
                variant="link"
                size="sm"
                className="mb-4 flex items-center"
                onClick={() => setStep('delivery')}
              >
                <ChevronLeft className="w-4 h-4" /> Volver
              </Button>
              <CreditCardForm onSubmit={(card) => { setCardData(card); setStep('summary'); }} />
            </>
          )}

          {step === 'summary' && (
            <div className="space-y-4">
              <Card className="bg-gray-50 p-4 rounded-lg border">
                <div className="flex justify-between text-sm mb-1"><span>Subtotal:</span><span>{formatCurrency(subtotal)}</span></div>
                <div className="flex justify-between text-sm mb-1"><span>IVA/Servicio:</span><span>{formatCurrency(baseFee)}</span></div>
                <div className="flex justify-between text-sm mb-1"><span>Envío:</span><span>{formatCurrency(DELIVERY_FEE)}</span></div>
                <div className="flex justify-between font-bold border-t mt-2 pt-2 text-lg"><span>Total:</span><span>{formatCurrency(totalAmount)}</span></div>
              </Card>
              <Button
                onClick={handleConfirmPayment}
                className="w-full"
                size="lg"
              >
                Confirmar y Pagar
              </Button>
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
                  
                  <Button
                    onClick={() => {
                      localStorage.removeItem('wompi_pending_tx');
                      if (transactionId && txStatus) onComplete?.(transactionId, txStatus);
                      onClose();
                    }}
                    className="w-full mt-6"
                    variant="default"
                    size="lg"
                  >
                    Continuar
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
