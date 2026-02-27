import checkoutReducer, {
  setCurrentStep,
  setQuantity,
  openModal,
  closeModal,
  nextStep,
  previousStep,
  resetCheckout,
} from '../../checkoutSlice';
import type { CheckoutState } from '../../types';
import { CHECKOUT_STEPS } from '../../../constants';

describe('checkoutSlice', () => {
  const initialState: CheckoutState = {
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

  it('should return the initial state', () => {
    expect(checkoutReducer(undefined, { type: 'unknown' }).currentStep).toBe(
      CHECKOUT_STEPS.PRODUCT
    );
  });

  it('should handle setCurrentStep', () => {
    const actual = checkoutReducer(initialState, setCurrentStep(CHECKOUT_STEPS.PAYMENT_INFO));
    expect(actual.currentStep).toBe(CHECKOUT_STEPS.PAYMENT_INFO);
  });

  it('should handle setQuantity', () => {
    const actual = checkoutReducer(initialState, setQuantity(3));
    expect(actual.quantity).toBe(3);
  });

  it('should handle openModal', () => {
    const actual = checkoutReducer(initialState, openModal());
    expect(actual.isModalOpen).toBe(true);
  });

  it('should handle closeModal', () => {
    const stateWithModal: CheckoutState = {
      ...initialState,
      isModalOpen: true,
    };
    const actual = checkoutReducer(stateWithModal, closeModal());
    expect(actual.isModalOpen).toBe(false);
  });

  it('should handle nextStep', () => {
    const actual = checkoutReducer(initialState, nextStep());
    expect(actual.currentStep).toBe(CHECKOUT_STEPS.PAYMENT_INFO);
  });

  it('should handle previousStep', () => {
    const stateAtStep2: CheckoutState = {
      ...initialState,
      currentStep: CHECKOUT_STEPS.PAYMENT_INFO,
    };
    const actual = checkoutReducer(stateAtStep2, previousStep());
    expect(actual.currentStep).toBe(CHECKOUT_STEPS.PRODUCT);
  });

  it('should handle resetCheckout', () => {
    const stateWithData: CheckoutState = {
      ...initialState,
      currentStep: CHECKOUT_STEPS.SUMMARY,
      quantity: 5,
      isModalOpen: true,
    };
    const actual = checkoutReducer(stateWithData, resetCheckout());
    expect(actual.currentStep).toBe(CHECKOUT_STEPS.PRODUCT);
    expect(actual.quantity).toBe(1);
    expect(actual.isModalOpen).toBe(false);
  });
});
