// Global types for the application
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Customer {
  id?: string;
  email: string;
  fullName: string;
  phone: string;
}

export interface DeliveryInfo {
  address: string;
  city: string;
}

export interface CreditCard {
  number: string;
  exp_month: number;
  exp_year: number;
  cvv: string;
}

export interface Transaction {
  id: string;
  reference: string;
  productId: string;
  quantity: number;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'ERROR';
  customer: Customer;
  delivery?: DeliveryInfo;
  product?: Product;
  createdAt: string;
  updatedAt: string;
  wompiTransactionId?: string;
}

export interface TransactionCreatePayload {
  productId: string;
  quantity: number;
  customerEmail: string;
  customerFullName: string;
  customerPhone: string;
  amount: number;
}

export interface ProcessPaymentPayload {
  card: CreditCard;
  address: string;
  city: string;
}

export type CardBrand = 'visa' | 'mastercard' | 'unknown';

export interface CheckoutStep {
  step: number;
  completed: boolean;
}

export type CheckoutStepName = 
  | 'product' 
  | 'payment-info' 
  | 'summary' 
  | 'status' 
  | 'complete';
