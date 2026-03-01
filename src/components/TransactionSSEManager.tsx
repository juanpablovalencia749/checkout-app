// src/components/TransactionSSEManager.tsx
import React, { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { fetchTransactionById } from '../features/transaction/transactionSlice';
import { CHECKOUT_STEPS } from '../constants';

const SSE_BASE = 'http://localhost:3000/transactions'; 

export const TransactionSSEManager: React.FC = () => {
  const dispatch = useAppDispatch();
  const transactionId = useAppSelector((s) => s.checkout.transactionId);
  const currentTransaction = useAppSelector((s) => s.transaction.currentTransaction);
  const sseRef = useRef<EventSource | null>(null);
  const reconnectRef = useRef(0);
  const closedRef = useRef(false);

  useEffect(() => {
    // Si no hay txId o ya está finalizada, no subscribir
    if (!transactionId) return;

    // Si la tx ya llegó a final, no subscribir
    if (currentTransaction && ['APPROVED', 'DECLINED', 'VOIDED'].includes(currentTransaction.status)) {
      return;
    }

    closedRef.current = false;

    const url = `${SSE_BASE}/${transactionId}/events`;
    let es: EventSource | null = null;

    const connect = () => {
      try {
        es = new EventSource(url);
        sseRef.current = es;
        reconnectRef.current = 0;
        console.log('[SSE] connected to', url);

        es.onmessage = (ev) => {
          try {
            const payload = JSON.parse(ev.data);
            const id = payload?.id ?? payload?.data?.id;
            const status = payload?.status ?? payload?.data?.status ?? null;
            console.log('[SSE] message', payload);
            if (id) {
              // trae la tx completa y actualiza Redux
              dispatch(fetchTransactionById(id));
            } else if (payload?.data?.id) {
              dispatch(fetchTransactionById(payload.data.id));
            }
          } catch (err) {
            console.warn('[SSE] parse error', err);
          }
        };

        es.onerror = (err) => {
          console.warn('[SSE] error', err);
          // cerrar antes de reintentar
          if (es) {
            es.close();
            sseRef.current = null;
          }
          scheduleReconnect();
        };

        es.onopen = () => {
          console.log('[SSE] open');
        };
      } catch (err) {
        console.error('[SSE] connect failed', err);
        scheduleReconnect();
      }
    };

    const scheduleReconnect = () => {
      if (closedRef.current) return;
      reconnectRef.current = Math.min(10, reconnectRef.current + 1);
      const delay = Math.min(30000, 1000 * Math.pow(2, reconnectRef.current)); // backoff
      console.log(`[SSE] reconnecting in ${delay}ms`);
      setTimeout(() => {
        if (!closedRef.current) connect();
      }, delay);
    };

    connect();

    return () => {
      closedRef.current = true;
      if (sseRef.current) {
        try { sseRef.current.close(); } catch {}
        sseRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionId]);

  return null; // no renderiza UI
};