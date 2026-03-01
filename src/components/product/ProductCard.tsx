// src/components/product/ProductCard.tsx
import React, { useState } from 'react';
import { Package } from 'lucide-react';
import type { Product } from '../../types';
import { formatCurrency } from '../../lib/utils';

// ui
import { Button } from '../ui/button';
import { Card } from '../ui/card';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product, quantity: number) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const [imageError, setImageError] = useState(false);
  const isOutOfStock = product.stock <= 0;
  const [quantity, setQuantity] = useState<number>(1);

  const handleSelect = () => {
    console.log("Selected product:", product, "Quantity:", quantity);
    
    if (!isOutOfStock) {
      onSelect(product, quantity);
    }
  };

  const increment = () => {
    setQuantity((q) => Math.min(q + 1, Math.max(1, product.stock)));
  };

  const decrement = () => {
    setQuantity((q) => Math.max(1, q - 1));
  };

  return (
    <Card className="hover:shadow-xl transition-all duration-300 flex flex-col h-full">
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
            {isOutOfStock ? 'No stock' : `${product.stock} available`}
          </span>
        </div>

        {/* Quantity selector */}
        <div className="flex items-center gap-3 mb-3">
          <Button
            onClick={decrement}
            disabled={quantity <= 1}
            variant="outline"
            size="icon"
            aria-label="Decrease quantity"
          >
            −
          </Button>
          <div className="px-3 py-1 rounded-md border w-16 text-center">
            {quantity}
          </div>
          <Button
            onClick={increment}
            disabled={quantity >= product.stock}
            variant="outline"
            size="icon"
            aria-label="Increase quantity"
          >
            +
          </Button>
        </div>

        <Button
          onClick={handleSelect}
          disabled={isOutOfStock}
          aria-label={`Buy ${product.name}`}
          className="w-full"
          size="lg"
          variant={isOutOfStock ? 'secondary' : 'default'}
        >
          {isOutOfStock ? 'Out of Stock' : 'Buy Now'}
        </Button>
      </div>
    </Card>
  )}
