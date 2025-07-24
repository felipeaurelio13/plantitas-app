import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';

const inputVariants = cva(
  'w-full transition-all duration-200 outline-none disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: [
          'bg-white border border-neutral-300',
          'dark:bg-neutral-900 dark:border-neutral-600',
          'focus:border-primary-500 dark:focus:border-primary-400',
          'focus:ring-2 focus:ring-primary-500/20'
        ],
        filled: [
          'bg-neutral-100 border border-transparent',
          'dark:bg-neutral-800 dark:border-transparent',
          'focus:bg-white focus:border-primary-500',
          'dark:focus:bg-neutral-900 dark:focus:border-primary-400',
          'focus:ring-2 focus:ring-primary-500/20'
        ],
        glass: [
          'glass border-neutral-200/50',
          'dark:border-neutral-700/50',
          'focus:border-primary-500/70 dark:focus:border-primary-400/70',
          'focus:ring-2 focus:ring-primary-500/20'
        ]
      },
      size: {
        sm: 'h-10 px-3 text-sm rounded-lg',
        default: 'h-12 px-4 text-base rounded-xl',
        lg: 'h-14 px-5 text-lg rounded-xl'
      },
      state: {
        default: '',
        error: 'border-error-500 focus:border-error-500 focus:ring-error-500/20',
        success: 'border-success-500 focus:border-success-500 focus:ring-success-500/20',
        warning: 'border-warning-500 focus:border-warning-500 focus:ring-warning-500/20'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      state: 'default'
    }
  }
);

export interface InputProps 
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  successMessage?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loading?: boolean;
  showPasswordToggle?: boolean;
  floatingLabel?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({
    className,
    variant,
    size,
    state,
    label,
    helperText,
    errorMessage,
    successMessage,
    leftIcon,
    rightIcon,
    loading = false,
    showPasswordToggle = false,
    floatingLabel = false,
    type,
    disabled,
    value,
    defaultValue,
    ...props
  }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [internalValue, setInternalValue] = useState(value || defaultValue || '');
    const internalRef = useRef<HTMLInputElement>(null);

    // Combine refs using callback
    const setRefs = useCallback((element: HTMLInputElement | null) => {
      // Set internal ref
      (internalRef as React.MutableRefObject<HTMLInputElement | null>).current = element;
      
      // Set forwarded ref
      if (typeof ref === 'function') {
        ref(element);
      } else if (ref) {
        ref.current = element;
      }
    }, [ref]);

    // Determine actual state based on props
    const actualState = errorMessage ? 'error' : successMessage ? 'success' : state;
    
    // Check if input has content for floating label
    const hasContent = Boolean(internalValue) || isFocused;
    
    // Determine input type for password toggle
    const inputType = showPasswordToggle ? (showPassword ? 'text' : 'password') : type;

    useEffect(() => {
      if (value !== undefined) {
        setInternalValue(value);
      }
    }, [value]);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      props.onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInternalValue(e.target.value);
      props.onChange?.(e);
    };

    const handleLabelClick = () => {
      internalRef.current?.focus();
    };

    return (
      <div className="w-full">
        <div className="relative">
          {/* Standard Label */}
          {label && !floatingLabel && (
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              {label}
            </label>
          )}

          {/* Input Container */}
          <div className="relative">
            {/* Left Icon */}
            {leftIcon && (
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 dark:text-neutral-400 pointer-events-none z-10">
                {leftIcon}
              </div>
            )}

            {/* Floating Label */}
            {label && floatingLabel && (
              <motion.label
                onClick={handleLabelClick}
                animate={{
                  scale: hasContent ? 0.85 : 1,
                  y: hasContent ? -24 : 0,
                  x: hasContent ? 4 : leftIcon ? 36 : 16,
                }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                className={cn(
                  'absolute left-0 top-1/2 -translate-y-1/2 text-neutral-500 dark:text-neutral-400 pointer-events-none z-10 origin-left',
                  hasContent && 'text-primary-600 dark:text-primary-400',
                  'cursor-text'
                )}
              >
                {label}
              </motion.label>
            )}

            {/* Input Field */}
            <input
              ref={setRefs}
              type={inputType}
              value={internalValue}
              disabled={disabled || loading}
              className={cn(
                inputVariants({ variant, size, state: actualState }),
                leftIcon && 'pl-10',
                (rightIcon || showPasswordToggle || loading) && 'pr-10',
                floatingLabel && hasContent && 'pt-6 pb-2',
                // Ajuste de padding vertical para tamaño default
                (!size || size === 'default') && 'py-[12px]',
                // Color de placeholder
                'placeholder-[#777]',
                className
              )}
              style={{ ...props.style }}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onChange={handleChange}
              {...props}
            />

            {/* Right Side Icons */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1">
              {/* Loading Spinner */}
              {loading && (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 text-neutral-500"
                >
                  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
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

              {/* State Icons */}
              {!loading && actualState === 'error' && (
                <AlertCircle className="w-4 h-4 text-error-500" />
              )}
              {!loading && actualState === 'success' && (
                <CheckCircle className="w-4 h-4 text-success-500" />
              )}

              {/* Password Toggle */}
              {showPasswordToggle && !loading && (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              )}

              {/* Custom Right Icon */}
              {rightIcon && !loading && (
                <div className="text-neutral-500 dark:text-neutral-400">
                  {rightIcon}
                </div>
              )}
            </div>
          </div>

          {/* Focus Ring Enhancement */}
          <AnimatePresence>
            {isFocused && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className={cn(
                  'absolute inset-0 rounded-xl pointer-events-none',
                  actualState === 'error' && 'ring-2 ring-error-500/20',
                  actualState === 'success' && 'ring-2 ring-success-500/20',
                  actualState === 'default' && 'ring-2 ring-primary-500/20'
                )}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Helper Text / Error / Success Messages */}
        <AnimatePresence mode="wait">
          {(helperText || errorMessage || successMessage) && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="mt-2 text-sm flex items-center space-x-1"
            >
              {errorMessage && (
                <>
                  <AlertCircle className="w-4 h-4 text-error-500 flex-shrink-0" />
                  <span className="text-error-600 dark:text-error-400">{errorMessage}</span>
                </>
              )}
              {successMessage && !errorMessage && (
                <>
                  <CheckCircle className="w-4 h-4 text-success-500 flex-shrink-0" />
                  <span className="text-success-600 dark:text-success-400">{successMessage}</span>
                </>
              )}
              {helperText && !errorMessage && !successMessage && (
                <span className="text-neutral-600 dark:text-neutral-400">{helperText}</span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input, inputVariants }; 