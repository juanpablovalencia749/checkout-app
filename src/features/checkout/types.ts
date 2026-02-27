import type { Product, Customer, DeliveryInfo, CreditCard } from '../../types';

export interface CheckoutState {
  currentStep: number;
  selectedProduct: Product | null;
  quantity: number;
  customerInfo: Partial<Customer>;
  deliveryInfo: Partial<DeliveryInfo>;
  cardInfo: Partial<CreditCard>;
  transactionId: string | null;
  isModalOpen: boolean;
  isBackdropOpen: boolean;
}
