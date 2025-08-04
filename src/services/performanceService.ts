class PerformanceService {
  async initialize(): Promise<void> {
    console.log('✅ Performance service initialized (stub)');
  }

  measureOperation<T>(_name: string, operation: () => Promise<T>): Promise<T> {
    return operation();
  }

  measureFirebaseOperation<T>(_name: string, operation: () => Promise<T>): Promise<T> {
    return operation();
  }

  destroy(): void {
    // Stub implementation
  }
}

const performanceService = new PerformanceService();
export default performanceService;
