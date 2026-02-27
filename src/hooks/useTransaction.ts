import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import {
  createTransaction,
  processPayment,
  fetchTransactionById,
  clearTransaction,
} from '../features/transaction/transactionSlice';
import type { TransactionCreatePayload, ProcessPaymentPayload } from '../types';

/**
 * Custom hook for transaction operations
 */
export const useTransaction = () => {
  const dispatch = useAppDispatch();
  const { 
    currentTransaction, 
    loading, 
    error 
  } = useAppSelector((state) => state.transaction);

  const handleCreateTransaction = useCallback(
    async (payload: TransactionCreatePayload) => {
      const result = await dispatch(createTransaction(payload));
      return result;
    },
    [dispatch]
  );

  const handleProcessPayment = useCallback(
    async (transactionId: string, payload: ProcessPaymentPayload) => {
      const result = await dispatch(processPayment({ transactionId, payload }));
      return result;
    },
    [dispatch]
  );

  const handleFetchTransaction = useCallback(
    async (transactionId: string) => {
      const result = await dispatch(fetchTransactionById(transactionId));
      return result;
    },
    [dispatch]
  );

  const handleClearTransaction = useCallback(() => {
    dispatch(clearTransaction());
  }, [dispatch]);

  return {
    currentTransaction,
    loading,
    error,
    createTransaction: handleCreateTransaction,
    processPayment: handleProcessPayment,
    fetchTransaction: handleFetchTransaction,
    clearTransaction: handleClearTransaction,
  };
};
