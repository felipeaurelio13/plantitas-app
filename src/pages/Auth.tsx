import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, Leaf, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';

const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Use the store for state and actions
  const { signIn, signUp, isLoading, error, clearError, isDevelopmentMode } = useAuthStore();

  const handleModeChange = (newMode: 'login' | 'signup') => {
    setMode(newMode);
    clearError(); // Clear errors when switching modes
    // Reset form fields when switching modes
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  };
  
  // Clear errors when the component unmounts or mode changes
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [mode, clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (mode === 'login') {
      try {
        await signIn({ email, password });
      } catch (error) {
        // Error is handled in the store
      }
    } else {
      if (password !== confirmPassword) {
        // This should be handled by zod schema validation, but adding client-side check for better UX
        return;
      }
      try {
        await signUp({ email, password, confirmPassword, fullName });
      } catch (error) {
        // Error is handled in the store
      }
    }
  };

  // Input component with better styling
  const InputField: React.FC<{
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
  }> = ({ 
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
    id
  }) => (
    <div className="space-y-2">
      <label 
        htmlFor={id}
        className="block text-sm font-medium text-stone-700 dark:text-stone-300"
      >
        {label}
      </label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
          {icon}
        </div>
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="
            w-full pl-10 pr-4 py-3.5 
            bg-white dark:bg-stone-800 
            border border-stone-200 dark:border-stone-700 
            rounded-xl 
            text-stone-900 dark:text-stone-100 
            placeholder-stone-500 dark:placeholder-stone-400
            focus:ring-2 focus:ring-nature-500 focus:border-transparent
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
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors touch-target"
            aria-label={type === 'password' ? (showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña') : undefined}
          >
            {rightIcon}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-nature-50 via-stone-50 to-nature-100 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950 flex items-center justify-center p-4">
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

        {/* Auth Form */}
        <motion.div
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="bg-white/90 dark:bg-stone-900/90 backdrop-blur-xl rounded-3xl shadow-xl shadow-stone-200/20 dark:shadow-stone-950/40 p-8 border border-white/20 dark:border-stone-800/50"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence mode="wait">
              {mode === 'signup' && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                >
                  <InputField
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={setFullName}
                    placeholder="Tu nombre completo"
                    icon={<User className="w-5 h-5" />}
                    required={mode === 'signup'}
                    autoComplete="name"
                    label="Nombre completo"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <InputField
              id="email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="tu@email.com"
              icon={<Mail className="w-5 h-5" />}
              required
              autoComplete="email"
              label="Email"
            />

            <InputField
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              icon={<Lock className="w-5 h-5" />}
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              rightIcon={showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              onRightIconClick={() => setShowPassword(!showPassword)}
              label="Contraseña"
            />

            <AnimatePresence mode="wait">
              {mode === 'signup' && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                >
                  <InputField
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    placeholder="••••••••"
                    icon={<Lock className="w-5 h-5" />}
                    required={mode === 'signup'}
                    autoComplete="new-password"
                    rightIcon={showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    onRightIconClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    label="Confirmar contraseña"
                  />
                  
                  {mode === 'signup' && password && (
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs text-stone-500 dark:text-stone-400 mt-1"
                    >
                      Mínimo 6 caracteres
                    </motion.p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"
                >
                  <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={isLoading}
              whileTap={{ scale: 0.98 }}
              whileHover={{ scale: 1.01 }}
              className="
                w-full bg-gradient-to-r from-nature-500 to-nature-600 
                hover:from-nature-600 hover:to-nature-700 
                disabled:from-stone-300 disabled:to-stone-300
                dark:disabled:from-stone-700 dark:disabled:to-stone-700
                text-white font-medium py-4 px-6 rounded-xl 
                transition-all duration-200 
                focus:ring-2 focus:ring-nature-500 focus:ring-offset-2 focus:ring-offset-white
                dark:focus:ring-offset-stone-900
                shadow-lg hover:shadow-xl
                touch-target
                disabled:cursor-not-allowed disabled:transform-none
              "
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Procesando...</span>
                </div>
              ) : (
                mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'
              )}
            </motion.button>
          </form>

          {/* Mode Switch */}
          <div className="mt-8 text-center">
            <p className="text-stone-600 dark:text-stone-400 text-sm">
              {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
              {' '}
              <button
                onClick={() => handleModeChange(mode === 'login' ? 'signup' : 'login')}
                className="text-nature-600 dark:text-nature-400 hover:text-nature-700 dark:hover:text-nature-300 font-medium transition-colors underline-offset-4 hover:underline focus:underline focus:outline-none"
              >
                {mode === 'login' ? 'Regístrate aquí' : 'Inicia sesión aquí'}
              </button>
            </p>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="text-center mt-8"
        >
          <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed max-w-sm mx-auto">
            Al continuar, aceptas nuestros{' '}
            <span className="text-nature-600 dark:text-nature-400">Términos de Servicio</span>
            {' '}y{' '}
            <span className="text-nature-600 dark:text-nature-400">Política de Privacidad</span>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AuthPage; 