import type { Transaction } from '../../types';

export interface TransactionState {
  currentTransaction: Transaction | null;
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  processingPayment: boolean;
}

export interface TransactionResponse {
  success: boolean;
  data: Transaction;
}

export interface TransactionsResponse {
  success: boolean;
  data: Transaction[];
}

export interface ProcessPaymentResponse {
  success: boolean;
  data: Transaction;
}
