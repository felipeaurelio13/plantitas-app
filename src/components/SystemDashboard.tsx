import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Badge } from './ui/Badge';
import { Progress } from './ui/Progress';
import { Button } from './ui/Button';
import { 
  Activity, 
  Database, 
  Wifi, 
  WifiOff, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Settings
} from 'lucide-react';
import performanceService from '../services/performanceService';
import firebaseRecoveryService from '../services/firebaseRecoveryService';
import cacheService from '../services/cacheService';
import useAuthStore from '../stores/useAuthStore';

interface SystemMetrics {
  firebase: {
    status: 'healthy' | 'degraded' | 'down';
    responseTime: number;
    errorRate: number;
  };
  performance: {
    lcp: number;
    fid: number;
    cls: number;
    overallScore: number;
  };
  cache: {
    hitRate: number;
    size: number;
    pendingSync: number;
  };
  network: {
    online: boolean;
    quality: 'excellent' | 'good' | 'poor' | 'offline';
  };
}

const SystemDashboard: React.FC<{ 
  className?: string;
  compact?: boolean;
  showAdvanced?: boolean;
}> = ({ className = '', compact = false, showAdvanced = false }) => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [alerts, setAlerts] = useState<Array<{ id: string; type: 'warning' | 'error'; message: string; timestamp: Date }>>([]);
  
  const { connection } = useAuthStore();

  // Gather system metrics
  const gatherMetrics = async (): Promise<SystemMetrics> => {
    const [performanceReport, healthStatus, circuitBreaker, cacheStats] = await Promise.all([
      performanceService.getPerformanceReport(),
      firebaseRecoveryService.getHealthStatus(),
      firebaseRecoveryService.getCircuitBreakerStatus(),
      cacheService.getCacheStats()
    ]);

    // Calculate Firebase status
    let firebaseStatus: SystemMetrics['firebase']['status'] = 'healthy';
    if (circuitBreaker.state === 'open' || !healthStatus.firebase) {
      firebaseStatus = 'down';
    } else if (healthStatus.consecutiveFailures > 0 || circuitBreaker.failureCount > 0) {
      firebaseStatus = 'degraded';
    }

    // Calculate performance score
    const perfScore = Math.round(
      (1 - Math.min(performanceReport.webVitals.lcp || 0, 4000) / 4000) * 100 * 0.4 +
      (1 - Math.min(performanceReport.webVitals.fid || 0, 100) / 100) * 100 * 0.3 +
      (1 - Math.min(performanceReport.webVitals.cls || 0, 0.25) / 0.25) * 100 * 0.3
    );

    // Calculate cache hit rate
    const totalOperations = cacheStats.plantsCount + cacheStats.messagesCount;
    const hitRate = totalOperations > 0 ? Math.min(totalOperations / (totalOperations + cacheStats.queueCount), 1) * 100 : 100;

    // Determine network quality
    let networkQuality: SystemMetrics['network']['quality'] = 'offline';
    if (connection.isOnline && connection.isConnectedToFirebase) {
      const avgResponseTime = performanceReport.averages.firebase || 1000;
      if (avgResponseTime < 500) networkQuality = 'excellent';
      else if (avgResponseTime < 1500) networkQuality = 'good';
      else networkQuality = 'poor';
    } else if (connection.isOnline) {
      networkQuality = 'poor';
    }

    return {
      firebase: {
        status: firebaseStatus,
        responseTime: performanceReport.averages.firebase || 0,
        errorRate: circuitBreaker.failureCount / Math.max(circuitBreaker.failureCount + circuitBreaker.successCount, 1) * 100
      },
      performance: {
        lcp: performanceReport.webVitals.lcp || 0,
        fid: performanceReport.webVitals.fid || 0,
        cls: performanceReport.webVitals.cls || 0,
        overallScore: perfScore
      },
      cache: {
        hitRate,
        size: cacheStats.totalSize,
        pendingSync: cacheStats.queueCount
      },
      network: {
        online: connection.isOnline,
        quality: networkQuality
      }
    };
  };

  // Check for alerts based on metrics
  const checkAlerts = (newMetrics: SystemMetrics) => {
    const newAlerts: typeof alerts = [];

    // Firebase alerts
    if (newMetrics.firebase.status === 'down') {
      newAlerts.push({
        id: 'firebase-down',
        type: 'error',
        message: 'Firebase está caído. Funcionando en modo offline.',
        timestamp: new Date()
      });
    } else if (newMetrics.firebase.status === 'degraded') {
      newAlerts.push({
        id: 'firebase-degraded',
        type: 'warning',
        message: 'Firebase experimentando problemas de rendimiento.',
        timestamp: new Date()
      });
    }

    // Performance alerts
    if (newMetrics.performance.overallScore < 50) {
      newAlerts.push({
        id: 'performance-poor',
        type: 'warning',
        message: 'Rendimiento de la aplicación degradado.',
        timestamp: new Date()
      });
    }

    // Cache alerts
    if (newMetrics.cache.pendingSync > 10) {
      newAlerts.push({
        id: 'sync-queue-full',
        type: 'warning',
        message: `${newMetrics.cache.pendingSync} operaciones pendientes de sincronización.`,
        timestamp: new Date()
      });
    }

    setAlerts(newAlerts);
  };

  // Refresh metrics
  const refreshMetrics = async () => {
    try {
      const newMetrics = await gatherMetrics();
      setMetrics(newMetrics);
      setLastUpdate(new Date());
      checkAlerts(newMetrics);
    } catch (error) {
      console.error('Error gathering system metrics:', error);
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    refreshMetrics();
    
    if (autoRefresh) {
      const interval = setInterval(refreshMetrics, 30000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Status badge component
  const StatusBadge: React.FC<{ status: string; label: string }> = ({ status, label }) => {
    const variant = status === 'healthy' || status === 'excellent' ? 'success' : 
                   status === 'degraded' || status === 'good' || status === 'poor' ? 'warning' : 'destructive';
    
    return <Badge variant={variant}>{label}</Badge>;
  };

  if (!metrics) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-6">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" />
          <span>Cargando métricas del sistema...</span>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className={`flex items-center space-x-4 ${className}`}>
        <div className="flex items-center space-x-2">
          {metrics.firebase.status === 'healthy' ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
          )}
          <span className="text-sm">Firebase</span>
        </div>
        
        <div className="flex items-center space-x-2">
          {metrics.network.online ? (
            <Wifi className="w-4 h-4 text-green-500" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-500" />
          )}
          <span className="text-sm">Red</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4" />
          <span className="text-sm">{metrics.performance.overallScore}%</span>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Firebase Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Firebase</CardTitle>
            <Database className={`h-4 w-4 ${metrics.firebase.status === 'healthy' ? 'text-green-500' : 'text-yellow-500'}`} />
          </CardHeader>
          <CardContent>
            <StatusBadge status={metrics.firebase.status} label={metrics.firebase.status.toUpperCase()} />
            <p className="text-xs text-muted-foreground mt-2">
              Respuesta: {Math.round(metrics.firebase.responseTime)}ms
            </p>
            <p className="text-xs text-muted-foreground">
              Errores: {metrics.firebase.errorRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        {/* Performance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rendimiento</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.performance.overallScore}%</div>
            <Progress value={metrics.performance.overallScore} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              LCP: {Math.round(metrics.performance.lcp)}ms
            </p>
          </CardContent>
        </Card>

        {/* Cache Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache</CardTitle>
            <Database className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(metrics.cache.hitRate)}%</div>
            <p className="text-xs text-muted-foreground">
              Tamaño: {(metrics.cache.size / 1024).toFixed(1)}KB
            </p>
            <p className="text-xs text-muted-foreground">
              Pendientes: {metrics.cache.pendingSync}
            </p>
          </CardContent>
        </Card>

        {/* Network Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Red</CardTitle>
            {metrics.network.online ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <StatusBadge 
              status={metrics.network.quality} 
              label={metrics.network.quality.toUpperCase()} 
            />
            <p className="text-xs text-muted-foreground mt-2">
              Estado: {metrics.network.online ? 'Conectado' : 'Desconectado'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2 text-yellow-500" />
              Alertas del Sistema ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.map(alert => (
              <div key={alert.id} className={`p-3 rounded-lg border ${
                alert.type === 'error' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'
              }`}>
                <div className="flex items-start space-x-2">
                  {alert.type === 'error' ? (
                    <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{alert.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {alert.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Advanced Tools */}
      {showAdvanced && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center">
              <Settings className="w-4 h-4 mr-2" />
              Herramientas de Diagnóstico
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => firebaseRecoveryService.forceRecoveryAttempt()}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Forzar Reconexión
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => cacheService.clearCache()}
              >
                <Database className="w-4 h-4 mr-2" />
                Limpiar Cache
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={refreshMetrics}
              >
                <Activity className="w-4 h-4 mr-2" />
                Actualizar Métricas
              </Button>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Última actualización: {lastUpdate.toLocaleTimeString()}
                </span>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <label className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={autoRefresh}
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                      className="rounded"
                    />
                    <span>Auto-actualizar</span>
                  </label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SystemDashboard;