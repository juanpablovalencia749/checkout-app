import api from '../../lib/api';
import type { Product } from '../../types';
import type {
  //  ProductsResponse,
   ProductResponse } from './types';

/**
 * Fetch all products
 */
export const fetchProducts = async (): Promise<Product[]> => {
  const response = await api.get<any>('/products');
  console.log("productsApi response response", response.data)
  return response.data;
};

/**
 * Fetch product by ID
 */
export const fetchProductById = async (productId: string): Promise<Product> => {
  const response = await api.get<ProductResponse>(`/products/${productId}`);
  return response.data.data;
};
