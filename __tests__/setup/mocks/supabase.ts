import { vi } from 'vitest';

// Mock Supabase auth responses
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  created_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
};

export const mockSession = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  token_type: 'bearer',
  user: mockUser,
};

// Mock Supabase client
export const createMockSupabaseClient = () => {
  const mockFrom = vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    then: vi.fn((resolve) => resolve({ data: [], error: null })),
  }));

  const mockRpc = vi.fn().mockResolvedValue({ data: false, error: null });

  const mockAuth = {
    getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    signInWithPassword: vi.fn().mockResolvedValue({ data: { user: mockUser, session: mockSession }, error: null }),
    signUp: vi.fn().mockResolvedValue({ data: { user: mockUser, session: mockSession }, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    onAuthStateChange: vi.fn().mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    }),
    updateUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
  };

  const mockStorage = {
    from: vi.fn(() => ({
      upload: vi.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://test.supabase.co/storage/test' } }),
      remove: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  };

  return {
    from: mockFrom,
    rpc: mockRpc,
    auth: mockAuth,
    storage: mockStorage,
  };
};

// Mock the supabase client module
export const mockSupabase = createMockSupabaseClient();

// Helper to set auth state
export const setMockAuthState = (isAuthenticated: boolean, isAdmin = false) => {
  if (isAuthenticated) {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: mockSession }, error: null });
    mockSupabase.rpc.mockResolvedValue({ data: isAdmin, error: null });
  } else {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    mockSupabase.rpc.mockResolvedValue({ data: false, error: null });
  }
};

// Reset all mocks
export const resetSupabaseMocks = () => {
  Object.values(mockSupabase.auth).forEach((mock) => {
    if (typeof mock === 'function' && 'mockClear' in mock) {
      mock.mockClear();
    }
  });
  mockSupabase.from.mockClear();
  mockSupabase.rpc.mockClear();
};
