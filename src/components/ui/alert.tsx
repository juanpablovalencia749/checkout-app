import * as React from 'react';
import { cn } from '../../lib/utils';
import { CircleX, Info, AlertTriangle, Check } from 'lucide-react';

export type AlertVariant = 'default' | 'destructive' | 'warning' | 'success';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: string;
  icon?: React.ReactNode;
}

const variantClasses: Record<AlertVariant, string> = {
  default: 'bg-gray-50 border border-gray-200 text-gray-800',
  destructive: 'bg-red-50 border border-red-200 text-red-800',
  warning: 'bg-yellow-50 border border-yellow-200 text-yellow-800',
  success: 'bg-green-50 border border-green-200 text-green-800',
};

const iconMap: Record<AlertVariant, React.ReactNode> = {
  default: <Info className="w-5 h-5" />,
  destructive: <CircleX className="w-5 h-5" />,
  warning: <AlertTriangle className="w-5 h-5" />,
  success: <Check className="w-5 h-5" />,
};

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  (
    { className, variant = 'default', title, icon, children, ...props },
    ref
  ) => (
    <div
      ref={ref}
      className={cn('rounded-lg p-4', variantClasses[variant], className)}
      {...props}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {icon || iconMap[variant]}
        </div>
        <div className="flex-1">
          {title && <h4 className="font-semibold mb-1">{title}</h4>}
          {children}
        </div>
      </div>
    </div>
  )
);
Alert.displayName = 'Alert';

export default Alert;
