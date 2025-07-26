import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, Leaf, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';

// Componente InputField memoizado para evitar re-renders
const InputField = React.memo<{
  type: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon: React.ReactNode;
  required?: boolean;
  autoComplete?: string;
  rightIcon?: React.ReactNode;
  onRightIconClick?: () => void;
  label: string;
  id: string;
  disabled?: boolean;
}>(({ 
  type, 
  value, 
  onChange, 
  placeholder, 
  icon, 
  required = false, 
  autoComplete, 
  rightIcon, 
  onRightIconClick, 
  label, 
  id,
  disabled = false
}) => {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  }, [onChange]);

  return (
    <div className="space-y-2">
      <label 
        htmlFor={id}
        className="block text-sm font-medium text-stone-700 dark:text-stone-300"
      >
        {label}
      </label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none">
          {icon}
        </div>
        <input
          id={id}
          type={type}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          className="
            w-full pl-10 pr-4 py-3.5 
            bg-white dark:bg-stone-800 
            border border-stone-200 dark:border-stone-700 
            rounded-xl 
            text-stone-900 dark:text-stone-100 
            placeholder-stone-500 dark:placeholder-stone-400
            focus:ring-2 focus:ring-nature-500 focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200
            text-base
            touch-target
          "
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          minLength={type === 'password' ? 6 : undefined}
        />
        {rightIcon && (
          <button
            type="button"
            onClick={onRightIconClick}
            disabled={disabled}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors touch-target disabled:opacity-50"
            aria-label={type === 'password' ? (type === 'password' ? 'Mostrar contraseña' : 'Ocultar contraseña') : undefined}
          >
            {rightIcon}
          </button>
        )}
      </div>
    </div>
  );
});

InputField.displayName = 'InputField';

const AuthPage: React.FC = () => {
  // Estados locales del formulario
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Store state
  const { signIn, signUp, isLoading, error, clearError, isDevelopmentMode } = useAuthStore();

  // Handlers memoizados para evitar re-renders
  const handleFieldChange = useCallback((field: keyof typeof formData) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleModeChange = useCallback((newMode: 'login' | 'signup') => {
    setMode(newMode);
    clearError();
    // Reset form fields when switching modes
    setFormData({
      email: formData.email, // Mantener email
      password: '',
      confirmPassword: '',
      fullName: ''
    });
    setShowPassword(false);
    setShowConfirmPassword(false);
  }, [clearError, formData.email]);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const toggleConfirmPasswordVisibility = useCallback(() => {
    setShowConfirmPassword(prev => !prev);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    const { email, password, confirmPassword, fullName } = formData;

    if (mode === 'login') {
      try {
        await signIn({ email, password });
        // El store maneja la navegación automáticamente
      } catch (error) {
        // Error ya manejado en el store
        console.log('Login error handled by store');
      }
    } else {
      if (password !== confirmPassword) {
        // Aquí podrías mostrar un error específico
        return;
      }
      try {
        await signUp({ email, password, fullName });
        // El store maneja la navegación automáticamente
      } catch (error) {
        // Error ya manejado en el store
        console.log('Signup error handled by store');
      }
    }
  }, [mode, formData, signIn, signUp, clearError]);

  // Limpiar errores solo al montar/desmontar
  useEffect(() => {
    return () => {
      clearError();
    };
  }, []); // Sin dependencias para evitar re-renders

  // Validación del formulario memoizada
  const isFormValid = useMemo(() => {
    const { email, password, confirmPassword, fullName } = formData;
    
    if (mode === 'login') {
      return email.length > 0 && password.length >= 6;
    } else {
      return email.length > 0 && 
             password.length >= 6 && 
             confirmPassword.length >= 6 && 
             password === confirmPassword &&
             fullName.length > 0;
    }
  }, [mode, formData]);

  // Campos del formulario memoizados
  const formFields = useMemo(() => {
    const fields = [
      {
        id: 'email',
        type: 'email',
        value: formData.email,
        onChange: handleFieldChange('email'),
        placeholder: 'tu@email.com',
        icon: <Mail size={20} />,
        label: 'Correo electrónico',
        autoComplete: 'email',
        required: true
      },
      {
        id: 'password',
        type: showPassword ? 'text' : 'password',
        value: formData.password,
        onChange: handleFieldChange('password'),
        placeholder: 'Tu contraseña',
        icon: <Lock size={20} />,
        label: 'Contraseña',
        autoComplete: mode === 'login' ? 'current-password' : 'new-password',
        required: true,
        rightIcon: showPassword ? <EyeOff size={20} /> : <Eye size={20} />,
        onRightIconClick: togglePasswordVisibility
      }
    ];

    if (mode === 'signup') {
      fields.unshift({
        id: 'fullName',
        type: 'text',
        value: formData.fullName,
        onChange: handleFieldChange('fullName'),
        placeholder: 'Tu nombre completo',
        icon: <User size={20} />,
        label: 'Nombre completo',
        autoComplete: 'name',
        required: true
      });

      fields.push({
        id: 'confirmPassword',
        type: showConfirmPassword ? 'text' : 'password',
        value: formData.confirmPassword,
        onChange: handleFieldChange('confirmPassword'),
        placeholder: 'Confirma tu contraseña',
        icon: <Lock size={20} />,
        label: 'Confirmar contraseña',
        autoComplete: 'new-password',
        required: true,
        rightIcon: showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />,
        onRightIconClick: toggleConfirmPasswordVisibility
      });
    }

    return fields;
  }, [mode, formData, showPassword, showConfirmPassword, handleFieldChange, togglePasswordVisibility, toggleConfirmPasswordVisibility]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-nature-50 via-stone-50 to-nature-100 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950 flex items-center justify-center p-4 container-adaptive">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.9, rotate: -5 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-nature-500 to-nature-600 rounded-2xl mb-6 shadow-lg shadow-nature-200/50 dark:shadow-nature-900/30"
          >
            <Leaf className="w-8 h-8 text-white" />
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="text-3xl font-bold bg-gradient-to-r from-nature-600 to-nature-700 bg-clip-text text-transparent mb-2"
          >
            Plantitas
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="text-stone-600 dark:text-stone-400"
          >
            {mode === 'login' 
              ? 'Bienvenido de vuelta a tu jardín' 
              : 'Únete a la comunidad de plantas'
            }
          </motion.p>

          {/* Development mode indicator */}
          {isDevelopmentMode && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.3 }}
              className="mt-4 inline-flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-700 dark:text-blue-300"
            >
              <CheckCircle className="w-4 h-4" />
              Modo demo activo
            </motion.div>
          )}
        </div>

        {/* Form Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="bg-white/90 dark:bg-stone-900/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-stone-200/50 dark:border-stone-700/50"
        >
          {/* Mode Switch */}
          <div className="flex bg-stone-100 dark:bg-stone-800 rounded-2xl p-1 mb-8">
            {(['login', 'signup'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => handleModeChange(tab)}
                disabled={isLoading}
                className={`
                  flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 touch-target
                  ${mode === tab
                    ? 'bg-white dark:bg-stone-700 text-nature-600 dark:text-nature-400 shadow-sm'
                    : 'text-stone-600 dark:text-stone-400 hover:text-nature-600 dark:hover:text-nature-400'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {tab === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
              </button>
            ))}
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="mb-6 p-4 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-700 rounded-xl flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-error-600 dark:text-error-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-error-700 dark:text-error-300">{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Form Fields */}
            {formFields.map((field, index) => (
              <motion.div
                key={field.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.3 }}
              >
                <InputField
                  {...field}
                  disabled={isLoading}
                />
              </motion.div>
            ))}

            {/* Demo Instructions */}
            {isDevelopmentMode && mode === 'login' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl"
              >
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                  🧪 Modo Demo - Cómo probar:
                </h4>
                <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
                  <li>• Email: cualquier email válido</li>
                  <li>• Contraseña: mínimo 6 caracteres</li>
                  <li>• Ejemplo: demo@plantitas.app / 123456</li>
                </ul>
              </motion.div>
            )}

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={!isFormValid || isLoading}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.3 }}
              className={`
                w-full py-4 px-6 rounded-xl font-semibold text-base transition-all duration-200 touch-target
                ${isFormValid && !isLoading
                  ? 'bg-gradient-to-r from-nature-500 to-nature-600 hover:from-nature-600 hover:to-nature-700 text-white shadow-lg shadow-nature-200/50 dark:shadow-nature-900/30 hover:shadow-xl hover:shadow-nature-300/50 dark:hover:shadow-nature-800/40'
                  : 'bg-stone-200 dark:bg-stone-700 text-stone-500 dark:text-stone-400 cursor-not-allowed'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
                focus:ring-2 focus:ring-nature-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-stone-900
              `}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  {mode === 'login' ? 'Iniciando sesión...' : 'Creando cuenta...'}
                </div>
              ) : (
                mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'
              )}
            </motion.button>
          </form>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AuthPage; 