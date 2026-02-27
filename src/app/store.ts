import { configureStore } from '@reduxjs/toolkit';
import productsReducer from '../features/products/productsSlice';
import transactionReducer from '../features/transaction/transactionSlice';
import checkoutReducer from '../features/checkout/checkoutSlice';

export const store = configureStore({
  reducer: {
    products: productsReducer,
    transaction: transactionReducer,
    checkout: checkoutReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['checkout/setCardInfo'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['payload.cardInfo'],
        // Ignore these paths in the state
        ignoredPaths: ['checkout.cardInfo'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
