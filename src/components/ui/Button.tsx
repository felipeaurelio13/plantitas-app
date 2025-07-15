import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'w-full px-4 py-3 rounded-xl font-medium ios-button inline-flex items-center justify-center transition-colors',
  {
    variants: {
      variant: {
        primary: 'bg-primary-500 text-white hover:bg-primary-600',
        secondary: 'bg-gray-600 text-white hover:bg-gray-700',
        ghost: 'bg-transparent text-white hover:bg-white/10',
        outline: 'border border-border bg-transparent hover:bg-accent hover:text-accent-foreground',
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
      },
      size: {
        default: 'h-11 px-4 py-2',
        sm: 'h-11 rounded-md px-3', // Adjusted for 44px touch target
        lg: 'h-12 rounded-md px-8',
        icon: 'h-11 w-11', // Adjusted for 44px touch target
      }
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
);

export interface ButtonProps extends HTMLMotionProps<'button'>, VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <motion.button
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.1, ease: 'easeInOut' }}
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants }; 