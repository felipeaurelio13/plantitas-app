import { vi } from 'vitest';

// Encadenamiento para supabase.from
function createFromMock() {
  const mock = {
    select: vi.fn(() => mock),
    eq: vi.fn(() => mock),
    order: vi.fn(() => mock),
    insert: vi.fn(() => mock),
    update: vi.fn(() => mock),
    delete: vi.fn(() => mock),
    single: vi.fn(() => mock),
    in: vi.fn(() => mock),
    limit: vi.fn(() => mock),
    // Métodos para devolver datos
    mockReturnValue: (val: any) => {
      mock.select.mockReturnValue(val);
      mock.eq.mockReturnValue(val);
      mock.order.mockReturnValue(val);
      mock.insert.mockReturnValue(val);
      mock.update.mockReturnValue(val);
      mock.delete.mockReturnValue(val);
      mock.single.mockReturnValue(val);
      mock.in.mockReturnValue(val);
      mock.limit.mockReturnValue(val);
    }
  };
  return mock;
}

export const supabaseMock = {
  from: vi.fn(() => createFromMock()),
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn(),
      getPublicUrl: vi.fn(),
      remove: vi.fn()
    }))
  },
  functions: { invoke: vi.fn() },
  auth: {
    getSession: vi.fn(() => Promise.resolve({
      data: { session: { access_token: 'test-token' } },
      error: null,
    })),
  },
};

export const gardenCacheMock = {
  getGardenContext: vi.fn(),
  setGardenContext: vi.fn(),
  getGardenSummary: vi.fn(),
  setGardenSummary: vi.fn(),
  invalidateCache: vi.fn(),
}; 