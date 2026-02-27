import api from '../../lib/api';
import type { Transaction, TransactionCreatePayload, ProcessPaymentPayload } from '../../types';
import type { 
  TransactionResponse, 
  TransactionsResponse, 
  ProcessPaymentResponse 
} from './types';

/**
 * Create a new transaction
 */
export const createTransaction = async (
  payload: TransactionCreatePayload
): Promise<Transaction> => {
  const response = await api.post<TransactionResponse>('/transactions', payload);
  return response.data.data;
};

/**
 * Process payment for a transaction
 */
export const processPayment = async (
  transactionId: string,
  payload: ProcessPaymentPayload
): Promise<Transaction> => {
  const response = await api.post<ProcessPaymentResponse>(
    `/transactions/${transactionId}/process`,
    payload
  );
  return response.data.data;
};

/**
 * Fetch all transactions
 */
export const fetchTransactions = async (): Promise<Transaction[]> => {
  const response = await api.get<TransactionsResponse>('/transactions');
  return response.data.data;
};

/**
 * Fetch transaction by ID
 */
export const fetchTransactionById = async (transactionId: string): Promise<Transaction> => {
  const response = await api.get<TransactionResponse>(`/transactions/${transactionId}`);
  return response.data.data;
};
