import React from 'react';
import { CircleX } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onRetry,
  className = '',
}) => {
  return (
    <div
      className={`bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm ${className}`}
    >
      <div className="flex items-start gap-3">
        
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          <CircleX className="h-5 w-5 text-red-500" />
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-red-800">
            Error
          </h3>

          <p className="mt-1 text-sm text-red-700">
            {message}
          </p>

          {onRetry && (
            <div className="mt-4">
              <button
                onClick={onRetry}
                className="bg-red-100 px-4 py-2 rounded-lg text-sm font-medium text-red-800 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};