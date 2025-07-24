import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('Error caught by boundary:', error, errorInfo);
    }

    // In production, you would send this to an error reporting service
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    // Redirige correctamente respetando el basename de la app
    window.location.href = import.meta.env.BASE_URL || '/plantitas-app/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <div className="glass-effect rounded-2xl p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                <AlertTriangle size={32} className="text-red-500" />
              </div>
              
              <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                ¡Oops! Algo salió mal
              </h1>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Ha ocurrido un error inesperado. No te preocupes, tus plantas están seguras.
              </p>

              {import.meta.env.DEV && this.state.error && (
                <details className="mb-6 text-left">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                    Detalles técnicos
                  </summary>
                  <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs font-mono text-gray-700 dark:text-gray-300 overflow-auto max-h-32">
                    <div className="mb-2">
                      <strong>Error:</strong> {this.state.error.message}
                    </div>
                    <div>
                      <strong>Stack:</strong>
                      <pre className="whitespace-pre-wrap">{this.state.error.stack}</pre>
                    </div>
                  </div>
                </details>
              )}
              
              <div className="space-y-3">
                <button
                  onClick={this.handleReload}
                  className="w-full px-4 py-3 bg-primary-500 text-white rounded-xl font-medium ios-button flex items-center justify-center space-x-2"
                >
                  <RefreshCw size={18} />
                  <span>Recargar Página</span>
                </button>
                
                <button
                  onClick={this.handleGoHome}
                  className="w-full px-4 py-3 bg-gray-600 text-white rounded-xl font-medium ios-button flex items-center justify-center space-x-2"
                >
                  <Home size={18} />
                  <span>Ir al Inicio</span>
                </button>
              </div>
              
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-4">
                Si el problema persiste, intenta limpiar el caché del navegador.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;