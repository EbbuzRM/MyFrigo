// Mock per il client Supabase nei test
const mockSupabase = {
  auth: {
    getSession: jest.fn().mockResolvedValue({
      data: {
        session: {
          user: { id: 'test-user-id', email: 'test@example.com' },
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token'
        }
      },
      error: null
    }),
    refreshSession: jest.fn().mockResolvedValue({
      data: {
        session: {
          user: { id: 'test-user-id', email: 'test@example.com' },
          access_token: 'mock-new-access-token',
          refresh_token: 'mock-refresh-token'
        }
      },
      error: null
    })
  }
};

module.exports = {
  supabase: mockSupabase,
  refreshAuthSession: jest.fn().mockResolvedValue(mockSupabase.auth.getSession()),
  forceRefreshToken: jest.fn().mockResolvedValue(mockSupabase.auth.refreshSession())
};