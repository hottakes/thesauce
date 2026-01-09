import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';

// Create a fresh query client for each test
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

// Mock toast provider (simplified)
const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>{children}</>
);

interface AllProvidersProps {
  children: React.ReactNode;
}

const AllProviders: React.FC<AllProvidersProps> = ({ children }) => {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllProviders, ...options });

// Re-export everything from testing-library
export * from '@testing-library/react';

// Override render with custom render
export { customRender as render };

// Test data factories
export const createMockApplicant = (overrides = {}) => ({
  id: 'test-applicant-id',
  instagram_handle: '@testuser',
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  school: 'Test University',
  referral_code: 'ABC123',
  status: 'new',
  points: 50,
  waitlist_position: 45,
  ambassador_type: 'The Connector',
  is_19_plus: true,
  household_size: 3,
  personality_traits: ['Outgoing', 'Creative'],
  interests: ['Music', 'Sports'],
  scene_types: ['Nightlife', 'Campus'],
  content_uploaded: false,
  content_urls: null,
  pitch_type: null,
  pitch_url: null,
  user_id: null,
  instagram_followers: 1500,
  instagram_profile_pic: null,
  instagram_verified: false,
  created_at: new Date().toISOString(),
  approved_at: null,
  rejected_at: null,
  scene_custom: null,
  ...overrides,
});

export const createMockOpportunity = (overrides = {}) => ({
  id: 'test-opportunity-id',
  title: 'Test Opportunity',
  brand_name: 'Test Brand',
  opportunity_type: 'event',
  description: 'Test description',
  short_description: 'Short desc',
  location: 'Test City',
  compensation: '$100',
  start_date: new Date().toISOString(),
  end_date: new Date(Date.now() + 86400000).toISOString(),
  spots_total: 10,
  spots_filled: 3,
  status: 'active',
  is_featured: false,
  requirements: ['Be awesome'],
  schools: ['Test University'],
  brand_logo_url: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

export const createMockSchool = (overrides = {}) => ({
  id: 'test-school-id',
  name: 'Test University',
  is_active: true,
  spots_total: 100,
  spots_remaining: 50,
  sort_order: 1,
  created_at: new Date().toISOString(),
  ...overrides,
});

export const createMockChallenge = (overrides = {}) => ({
  id: 'test-challenge-id',
  title: 'Test Challenge',
  description: 'Complete this test challenge',
  points: 10,
  is_active: true,
  verification_type: 'auto',
  icon: 'star',
  external_url: null,
  sort_order: 1,
  created_at: new Date().toISOString(),
  ...overrides,
});
