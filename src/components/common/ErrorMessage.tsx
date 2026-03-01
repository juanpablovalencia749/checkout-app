import React from 'react';
import { CircleX } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

// ui
import { Alert } from '../ui/alert';
import { Button } from '../ui/button';

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onRetry,
  className = '',
}) => {
  return (
    <Alert variant="destructive" className={className} icon={<CircleX className="h-5 w-5 text-red-500" />}>
      <p className="text-sm text-red-700 mb-2">{message}</p>
      {onRetry && (
        <Button variant="destructive" size="sm" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </Alert>
  );
};