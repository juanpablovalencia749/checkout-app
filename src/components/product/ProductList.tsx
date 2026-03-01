// src/components/product/ProductList.tsx
import React from 'react';
import { Loader2, PackageSearch } from 'lucide-react';
import { ProductCard } from './ProductCard';
import { ErrorMessage } from '../common/ErrorMessage';
import type { Product } from '../../types';

interface ProductListProps {
  products: Product[];
  loading: boolean;
  error: string | null;
  onSelectProduct: (product: Product, quantity: number) => void;
  onRetry?: () => void;
}

export const ProductList: React.FC<ProductListProps> = ({
  products,
  loading,
  error,
  onSelectProduct,
  onRetry,
}) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-gray-600 text-sm">Loading products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-12">
        <ErrorMessage message={error} onRetry={onRetry} />
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16">
        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-6">
          <PackageSearch className="w-10 h-10 text-gray-400" />
        </div>

        <h3 className="text-lg font-semibold text-gray-900">
          No products available
        </h3>

        <p className="mt-2 text-sm text-gray-500 max-w-sm">
          We couldn't find any products right now.  
          Please check back later.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onSelect={onSelectProduct}
        />
      ))}
    </div>
  );
};
