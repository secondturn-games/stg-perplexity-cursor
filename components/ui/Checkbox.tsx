import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  children?: React.ReactNode;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, error, children, ...props }, ref) => {
    return (
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            type="checkbox"
            className={cn(
              'h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded',
              error && 'border-red-500 focus:ring-red-500',
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        {children && (
          <div className="ml-3 text-sm">
            <label htmlFor={props.id} className="font-medium text-gray-700">
              {children}
            </label>
            {error && (
              <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
          </div>
        )}
      </div>
    );
  }
);
Checkbox.displayName = 'Checkbox';

export { Checkbox };
