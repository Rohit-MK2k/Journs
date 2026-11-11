import { render, screen } from '@testing-library/react';
import AuthGuard from './AuthGuard';
import { useRouter } from 'next/navigation';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

let mockUser: any = null;
jest.mock('../lib/firebase', () => ({
  auth: {
    get currentUser() { return mockUser; }
  },
  googleProvider: {},
  app: {},
}));

describe('Suite 7: Protected Routes & Auth Guards', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('T7.1 Unauthenticated Redirect: Redirects to /login if no user', () => {
    mockUser = null; // No user logged in
    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    );

    // Expect router.push to be called to redirect
    // And protected content should not render
    expect(mockPush).toHaveBeenCalledWith('/login');
    // Note: Once implemented, this might test that 'Protected Content' is NOT in document
  });

  it('T7.2 Authenticated Access: Renders children if user exists', () => {
    mockUser = { uid: '123' }; // Logged in
    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
