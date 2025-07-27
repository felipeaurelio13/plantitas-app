import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Firebase environment variables
vi.stubEnv('VITE_FIREBASE_API_KEY', 'test-api-key');
vi.stubEnv('VITE_FIREBASE_AUTH_DOMAIN', 'test-project.firebaseapp.com');
vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'test-project');
vi.stubEnv('VITE_FIREBASE_STORAGE_BUCKET', 'test-project.appspot.com');
vi.stubEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', '123456789');
vi.stubEnv('VITE_FIREBASE_APP_ID', '1:123456789:web:abcdef123456');

// Mock global objects
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock console methods for cleaner test output
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning:') || 
       args[0].includes('validateDOMNesting') ||
       args[0].includes('React Router'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('componentWillReceiveProps') ||
       args[0].includes('componentWillUpdate'))
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Global test utilities
global.beforeEach = beforeEach;
global.afterEach = afterEach;
global.beforeAll = beforeAll;
global.afterAll = afterAll; 