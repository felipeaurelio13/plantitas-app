import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  asChild?: boolean;
}

const buttonVariants = {
  primary: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
  secondary: 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 focus:ring-neutral-500 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700',
  outline: 'border border-neutral-300 bg-transparent text-neutral-700 hover:bg-neutral-100 focus:ring-neutral-500 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800',
  ghost: 'bg-transparent text-neutral-700 hover:bg-neutral-100 focus:ring-neutral-500 dark:text-neutral-300 dark:hover:bg-neutral-800',
  destructive: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
};

const buttonSizes = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-base',
  lg: 'h-12 px-6 text-lg',
  icon: 'h-10 w-10 p-0'
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  disabled,
  children,
  ...props
}, ref) => {
  const isDisabled = disabled || loading;

  return (
    <motion.div
      whileTap={!isDisabled ? { scale: 0.98 } : undefined}
      whileHover={!isDisabled ? { scale: 1.02 } : undefined}
      transition={{ duration: 0.1 }}
      className="inline-block"
    >
      <button
        ref={ref}
        className={cn(
          // Base styles
          'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-base focus-ring',
          'disabled:pointer-events-none disabled:opacity-50',
          // Size styles
          buttonSizes[size],
          // Variant styles
          buttonVariants[variant],
          // Full width
          fullWidth && 'w-full',
          // Custom className
          className
        )}
        disabled={isDisabled}
        {...props}
      >
      {loading && (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      
      {!loading && icon && iconPosition === 'left' && (
        <span className="flex-shrink-0">{icon}</span>
      )}
      
      {size !== 'icon' && children && (
        <span className={cn(
          'truncate',
          (icon || loading) && iconPosition === 'left' && 'ml-1',
          (icon) && iconPosition === 'right' && 'mr-1'
        )}>
          {children}
        </span>
      )}
      
             {!loading && icon && iconPosition === 'right' && (
         <span className="flex-shrink-0">{icon}</span>
       )}
      </button>
    </motion.div>
  );
});

Button.displayName = 'Button'; 