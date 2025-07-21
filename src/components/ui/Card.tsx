import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const cardVariants = cva(
  'overflow-hidden transition-all duration-300',
  {
    variants: {
      variant: {
        default: [
          'bg-white/90 border border-neutral-200',
          'dark:bg-neutral-900/90 dark:border-neutral-700',
          'shadow-md hover:shadow-lg'
        ],
        glass: [
          'glass',
          'hover:shadow-glass-lg',
          'border-neutral-200/50 dark:border-neutral-700/50'
        ],
        elevated: [
          'bg-white border border-neutral-100',
          'dark:bg-neutral-800 dark:border-neutral-700',
          'shadow-lg hover:shadow-xl'
        ],
        outline: [
          'bg-transparent border-2 border-neutral-200',
          'dark:border-neutral-700',
          'hover:border-primary-300 dark:hover:border-primary-600'
        ],
        ghost: [
          'bg-transparent border-none',
          'hover:bg-neutral-50 dark:hover:bg-neutral-900/50'
        ]
      },
      size: {
        sm: 'p-4',
        default: 'p-6',
        lg: 'p-8',
        xl: 'p-10'
      },
      radius: {
        none: 'rounded-none',
        sm: 'rounded-lg',
        default: 'rounded-xl',
        lg: 'rounded-2xl',
        full: 'rounded-3xl'
      },
      interactive: {
        true: 'cursor-pointer',
        false: ''
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      radius: 'default',
      interactive: false
    },
  }
);

export interface CardProps extends HTMLMotionProps<'div'>, VariantProps<typeof cardVariants> {
  hover?: boolean;
  loading?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ 
    className, 
    variant, 
    size, 
    radius,
    interactive,
    hover = false,
    loading = false,
    children,
    ...props 
  }, ref) => {
    return (
      <motion.div
        whileHover={interactive && !loading ? { 
          scale: hover ? 1.02 : 1.01,
          y: hover ? -4 : -2
        } : undefined}
        whileTap={interactive && !loading ? { scale: 0.98 } : undefined}
        transition={{ 
          duration: 0.2, 
          ease: [0.4, 0, 0.2, 1] 
        }}
        className={cn(
          cardVariants({ variant, size, radius, interactive }),
          loading && 'animate-pulse',
          className
        )}
        ref={ref}
        {...props}
      >
        {loading ? (
          <div className="space-y-4">
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded animate-shimmer"></div>
            <div className="space-y-2">
              <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded animate-shimmer"></div>
              <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-4/5 animate-shimmer"></div>
            </div>
          </div>
        ) : (
          children
        )}
      </motion.div>
    );
  }
);

Card.displayName = 'Card';

// Subcomponentes para mejor composición
const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 pb-4', className)}
      {...props}
    />
  )
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-xl font-semibold leading-tight text-neutral-900 dark:text-neutral-100', className)}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed', className)}
      {...props}
    />
  )
);
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div 
      ref={ref} 
      className={cn('', className)} 
      {...props} 
    />
  )
);
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center pt-4 mt-4 border-t border-neutral-200 dark:border-neutral-700', className)}
      {...props}
    />
  )
);
CardFooter.displayName = 'CardFooter';

export { 
  Card, 
  CardHeader, 
  CardFooter, 
  CardTitle, 
  CardDescription, 
  CardContent,
  cardVariants 
}; 