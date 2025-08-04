import { vi } from 'vitest';

export const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(() => ({
          data: [],
          error: null
        }))
      }))
    }))
  })),
  functions: {
    invoke: vi.fn(() => ({
      data: null,
      error: null
    }))
  },
  auth: {
    getSession: vi.fn(() => ({
      data: {
        session: {
          access_token: 'mock-jwt-token'
        }
      },
      error: null
    })),
    getUser: vi.fn(() => ({
      data: {
        user: {
          id: 'test-user-id',
          email: 'test@example.com'
        }
      },
      error: null
    })),
    signOut: vi.fn(() => ({
      error: null
    }))
  },
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn(() => ({
        data: { path: 'test-path' },
        error: null
      })),
      download: vi.fn(() => ({
        data: null,
        error: null
      })),
      remove: vi.fn(() => ({
        error: null
      }))
    }))
  }
};

// Mock environment variables for tests
vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');