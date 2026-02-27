import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as transactionApi from './transactionApi';
import type { TransactionState } from './types';
import type { TransactionCreatePayload, ProcessPaymentPayload } from '../../types';

// Initial state
const initialState: TransactionState = {
  currentTransaction: null,
  transactions: [],
  loading: false,
  error: null,
  processingPayment: false,
};

// Async thunks
export const createTransaction = createAsyncThunk(
  'transaction/create',
  async (payload: TransactionCreatePayload, { rejectWithValue }) => {
    try {
      const transaction = await transactionApi.createTransaction(payload);
      return transaction;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to create transaction'
      );
    }
  }
);

export const processPayment = createAsyncThunk(
  'transaction/processPayment',
  async (
    { transactionId, payload }: { transactionId: string; payload: ProcessPaymentPayload },
    { rejectWithValue }
  ) => {
    try {
      const transaction = await transactionApi.processPayment(transactionId, payload);
      return transaction;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to process payment'
      );
    }
  }
);

export const fetchTransactions = createAsyncThunk(
  'transaction/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const transactions = await transactionApi.fetchTransactions();
      return transactions;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch transactions'
      );
    }
  }
);

export const fetchTransactionById = createAsyncThunk(
  'transaction/fetchById',
  async (transactionId: string, { rejectWithValue }) => {
    try {
      const transaction = await transactionApi.fetchTransactionById(transactionId);
      return transaction;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch transaction'
      );
    }
  }
);

// Slice
const transactionSlice = createSlice({
  name: 'transaction',
  initialState,
  reducers: {
    clearTransaction: (state) => {
      state.currentTransaction = null;
      state.error = null;
      state.processingPayment = false;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Create transaction
    builder
      .addCase(createTransaction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTransaction.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTransaction = action.payload;
      })
      .addCase(createTransaction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Process payment
    builder
      .addCase(processPayment.pending, (state) => {
        state.processingPayment = true;
        state.error = null;
      })
      .addCase(processPayment.fulfilled, (state, action) => {
        state.processingPayment = false;
        state.currentTransaction = action.payload;
      })
      .addCase(processPayment.rejected, (state, action) => {
        state.processingPayment = false;
        state.error = action.payload as string;
      });

    // Fetch all transactions
    builder
      .addCase(fetchTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions = action.payload;
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch transaction by ID
    builder
      .addCase(fetchTransactionById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransactionById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTransaction = action.payload;
      })
      .addCase(fetchTransactionById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearTransaction, clearError } = transactionSlice.actions;

export default transactionSlice.reducer;
