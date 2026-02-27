import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';import type { CheckoutState } from './types';
import type { Product, Customer, DeliveryInfo, CreditCard } from '../../types';
import { CHECKOUT_STEPS, STORAGE_KEYS } from '../../constants';

// Load initial state from localStorage if available
const loadPersistedState = (): CheckoutState => {
  try {
    const persistedState = localStorage.getItem(STORAGE_KEYS.CHECKOUT_STATE);
    if (persistedState) {
      return JSON.parse(persistedState);
    }
  } catch (error) {
    console.error('Error loading persisted checkout state:', error);
  }
  
  return {
    currentStep: CHECKOUT_STEPS.PRODUCT,
    selectedProduct: null,
    quantity: 1,
    customerInfo: {},
    deliveryInfo: {},
    cardInfo: {},
    transactionId: null,
    isModalOpen: false,
    isBackdropOpen: false,
  };
};

const initialState: CheckoutState = loadPersistedState();

// Slice
const checkoutSlice = createSlice({
  name: 'checkout',
  initialState,
  reducers: {
    setCurrentStep: (state, action: PayloadAction<number>) => {
      state.currentStep = action.payload;
      persistState(state);
    },
    
    setSelectedProduct: (state, action: PayloadAction<Product>) => {
      state.selectedProduct = action.payload;
      persistState(state);
    },
    
    setQuantity: (state, action: PayloadAction<number>) => {
      state.quantity = action.payload;
      persistState(state);
    },
    
    setCustomerInfo: (state, action: PayloadAction<Partial<Customer>>) => {
      state.customerInfo = { ...state.customerInfo, ...action.payload };
      persistState(state);
    },
    
    setDeliveryInfo: (state, action: PayloadAction<Partial<DeliveryInfo>>) => {
      state.deliveryInfo = { ...state.deliveryInfo, ...action.payload };
      persistState(state);
    },
    
    setCardInfo: (state, action: PayloadAction<Partial<CreditCard>>) => {
      state.cardInfo = { ...state.cardInfo, ...action.payload };
      // Note: In production, never persist full card info
      // Only persist non-sensitive data
      const stateToSave = { ...state, cardInfo: {} };
      persistState(stateToSave);
    },
    
    setTransactionId: (state, action: PayloadAction<string>) => {
      state.transactionId = action.payload;
      persistState(state);
    },
    
    openModal: (state) => {
      state.isModalOpen = true;
    },
    
    closeModal: (state) => {
      state.isModalOpen = false;
    },
    
    openBackdrop: (state) => {
      state.isBackdropOpen = true;
    },
    
    closeBackdrop: (state) => {
      state.isBackdropOpen = false;
    },
    
    nextStep: (state) => {
      if (state.currentStep < CHECKOUT_STEPS.COMPLETE) {
        state.currentStep += 1;
        persistState(state);
      }
    },
    
    previousStep: (state) => {
      if (state.currentStep > CHECKOUT_STEPS.PRODUCT) {
        state.currentStep -= 1;
        persistState(state);
      }
    },
    
    resetCheckout: (state) => {
      Object.assign(state, {
        currentStep: CHECKOUT_STEPS.PRODUCT,
        selectedProduct: null,
        quantity: 1,
        customerInfo: {},
        deliveryInfo: {},
        cardInfo: {},
        transactionId: null,
        isModalOpen: false,
        isBackdropOpen: false,
      });
      clearPersistedState();
    },
  },
});

// Helper function to persist state to localStorage
const persistState = (state: CheckoutState) => {
  try {
    localStorage.setItem(STORAGE_KEYS.CHECKOUT_STATE, JSON.stringify(state));
  } catch (error) {
    console.error('Error persisting checkout state:', error);
  }
};

// Helper function to clear persisted state
const clearPersistedState = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.CHECKOUT_STATE);
  } catch (error) {
    console.error('Error clearing persisted checkout state:', error);
  }
};

export const {
  setCurrentStep,
  setSelectedProduct,
  setQuantity,
  setCustomerInfo,
  setDeliveryInfo,
  setCardInfo,
  setTransactionId,
  openModal,
  closeModal,
  openBackdrop,
  closeBackdrop,
  nextStep,
  previousStep,
  resetCheckout,
} = checkoutSlice.actions;

export default checkoutSlice.reducer;
