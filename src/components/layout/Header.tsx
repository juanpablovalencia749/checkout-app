import React from 'react';
import { ShoppingCart } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-50 border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo / Title */}
          <div className="flex items-center">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Checkout Store
            </h1>
          </div>

          {/* Cart Button */}
          <div className="flex items-center">
            <button
              className="relative p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              aria-label="Shopping cart"
            >
              <ShoppingCart className="h-6 w-6" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};