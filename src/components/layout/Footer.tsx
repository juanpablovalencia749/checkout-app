import React from 'react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center">
          <p className="text-sm text-gray-600">
            © {currentYear} Checkout Store. All rights reserved.
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Secure payments powered by payment gateway
          </p>
        </div>
      </div>
    </footer>
  );
};
