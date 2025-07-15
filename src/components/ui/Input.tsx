import React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?: 'default' | 'filled' | 'underline';
  size?: 'sm' | 'md' | 'lg';
  error?: boolean;
  helperText?: string;
  label?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const inputVariants = {
  default: 'border border-default bg-surface focus:border-green-500 focus:ring-1 focus:ring-green-500',
  filled: 'bg-neutral-100 border-0 focus:bg-white focus:ring-2 focus:ring-green-500 dark:bg-neutral-800 dark:focus:bg-neutral-700',
  underline: 'border-0 border-b-2 border-default bg-transparent focus:border-green-500 rounded-none'
};

const inputSizes = {
  sm: 'h-10 px-3 text-sm',
  md: 'h-11 px-4 text-base',
  lg: 'h-12 px-4 text-lg'
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  className,
  variant = 'default',
  size = 'md',
  error = false,
  helperText,
  label,
  icon,
  iconPosition = 'left',
  ...props
}, ref) => {
  const inputId = React.useId();
  const helperTextId = React.useId();

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="mb-2 block text-sm font-medium text-primary"
        >
          {label}
        </label>
      )}
      
      <div className="relative">
        {icon && iconPosition === 'left' && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            {icon}
          </div>
        )}
        
        <input
          ref={ref}
          id={inputId}
          className={cn(
            // Base styles
            'w-full rounded-lg transition-base focus-ring placeholder:text-neutral-400',
            'disabled:cursor-not-allowed disabled:opacity-50',
            // Size styles
            inputSizes[size],
            // Variant styles
            inputVariants[variant],
            // Icon spacing
            icon && iconPosition === 'left' && 'pl-10',
            icon && iconPosition === 'right' && 'pr-10',
            // Error styles
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
            // Custom className
            className
          )}
          aria-describedby={helperText ? helperTextId : undefined}
          aria-invalid={error}
          {...props}
        />
        
        {icon && iconPosition === 'right' && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">
            {icon}
          </div>
        )}
      </div>
      
      {helperText && (
        <p
          id={helperTextId}
          className={cn(
            'mt-1 text-xs',
            error ? 'text-red-600' : 'text-muted'
          )}
        >
          {helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input'; 