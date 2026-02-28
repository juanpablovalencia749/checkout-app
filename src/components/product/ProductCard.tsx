import React, { useState } from 'react';
import { Package } from 'lucide-react';
import type { Product } from '../../types';
import { formatCurrency } from '../../lib/utils';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const [imageError, setImageError] = useState(false);
  const isOutOfStock = product.stock <= 0;

  const handleSelect = () => {
    if (!isOutOfStock) {
      onSelect(product);
    }
  };

  return (
    <article className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col h-full">
      
      {/* Product Image */}
      <div className="relative h-48 sm:h-56 bg-gray-100">
        {product.image && !imageError ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <Package className="h-16 w-16 text-gray-400" />
          </div>
        )}

        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-white font-semibold text-lg">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {product.name}
        </h3>

        <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-grow">
          {product.description}
        </p>

        <div className="flex items-center justify-between mb-4">
          <span className="text-2xl font-bold text-gray-900">
            {formatCurrency(product.price)}
          </span>

          <span
            className={`text-sm font-medium ${
              isOutOfStock ? 'text-red-600' : 'text-green-600'
            }`}
          >
            {isOutOfStock
              ? 'No stock'
              : `${product.stock} available`}
          </span>
        </div>

        <button
          onClick={handleSelect}
          disabled={isOutOfStock}
          aria-label={`Buy ${product.name}`}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            isOutOfStock
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 focus:ring-blue-500'
          }`}
        >
          {isOutOfStock ? 'Out of Stock' : 'Buy Now'}
        </button>
      </div>
    </article>
  );
};