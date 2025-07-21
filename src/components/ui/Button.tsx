import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'touch-target inline-flex items-center justify-center font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: [
          'bg-primary-500 text-white',
          'hover:bg-primary-600',
          'active:bg-primary-700',
          'focus-visible:ring-primary-500/30',
          'shadow-md hover:shadow-lg',
          'disabled:bg-neutral-300 disabled:text-neutral-500'
        ],
        secondary: [
          'bg-neutral-100 text-neutral-900',
          'hover:bg-neutral-200',
          'active:bg-neutral-300',
          'focus-visible:ring-neutral-500/30',
          'dark:bg-neutral-800 dark:text-neutral-100',
          'dark:hover:bg-neutral-700',
          'dark:active:bg-neutral-600',
          'shadow-sm hover:shadow-md'
        ],
        outline: [
          'border-2 border-primary-200 bg-transparent text-primary-700',
          'hover:bg-primary-50 hover:border-primary-300',
          'active:bg-primary-100',
          'focus-visible:ring-primary-500/30',
          'dark:border-primary-700 dark:text-primary-300',
          'dark:hover:bg-primary-950 dark:hover:border-primary-600'
        ],
        ghost: [
          'bg-transparent text-neutral-700',
          'hover:bg-neutral-100',
          'active:bg-neutral-200',
          'focus-visible:ring-neutral-500/30',
          'dark:text-neutral-300',
          'dark:hover:bg-neutral-800',
          'dark:active:bg-neutral-700'
        ],
        destructive: [
          'bg-error-500 text-white',
          'hover:bg-error-600',
          'active:bg-error-700',
          'focus-visible:ring-error-500/30',
          'shadow-md hover:shadow-lg'
        ],
        success: [
          'bg-success-500 text-white',
          'hover:bg-success-600',
          'active:bg-success-700',
          'focus-visible:ring-success-500/30',
          'shadow-md hover:shadow-lg'
        ],
        glass: [
          'glass text-neutral-900',
          'hover:backdrop-blur-xl',
          'active:scale-[0.98]',
          'focus-visible:ring-primary-500/30',
          'dark:text-neutral-100'
        ]
      },
      size: {
        xs: 'h-8 px-3 text-xs rounded-md',
        sm: 'h-10 px-4 text-sm rounded-lg',
        default: 'h-11 px-6 text-base rounded-xl',
        lg: 'h-12 px-8 text-lg rounded-xl',
        xl: 'h-14 px-10 text-xl rounded-2xl',
        icon: 'h-11 w-11 rounded-xl',
        'icon-sm': 'h-10 w-10 rounded-lg',
        'icon-lg': 'h-12 w-12 rounded-xl'
      },
      fullWidth: {
        true: 'w-full',
        false: 'w-auto'
      }
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
      fullWidth: false
    },
  }
);

export interface ButtonProps extends HTMLMotionProps<'button'>, VariantProps<typeof buttonVariants> {
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    fullWidth,
    loading = false,
    leftIcon,
    rightIcon,
    children,
    disabled,
    ...props 
  }, ref) => {
    const isDisabled = disabled || loading;

    return (
      <motion.button
        whileTap={isDisabled ? undefined : { scale: 0.96 }}
        whileHover={isDisabled ? undefined : { scale: 1.02 }}
        transition={{ 
          duration: 0.15, 
          ease: [0.4, 0, 0.2, 1] 
        }}
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        disabled={isDisabled}
        ref={ref}
        {...props}
      >
        {loading && (
          <motion.div
            className="mr-2"
            animate={{ rotate: 360 }}
            transition={{ 
              duration: 1, 
              repeat: Infinity, 
              ease: "linear" 
            }}
          >
            <svg 
              className="w-4 h-4" 
              viewBox="0 0 24 24" 
              fill="none"
            >
              <circle 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="32"
                strokeDashoffset="32"
                opacity="0.3"
              />
              <circle 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="8"
                strokeDashoffset="8"
              />
            </svg>
          </motion.div>
        )}
        
        {leftIcon && !loading && (
          <span className="mr-2 -ml-1">
            {leftIcon}
          </span>
        )}
        
        <span className={cn(
          "flex items-center justify-center",
          loading && "opacity-70"
        )}>
          {typeof children === 'string' || typeof children === 'number' || React.isValidElement(children) ? children : null}
        </span>
        
        {rightIcon && (
          <span className="ml-2 -mr-1">
            {rightIcon}
          </span>
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants }; 