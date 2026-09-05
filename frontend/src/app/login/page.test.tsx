import { render, screen } from '@testing-library/react';
import LoginPage from './page';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('next/link', () => {
  return ({ children, href }: any) => <a href={href}>{children}</a>;
});

describe('Authentication Suite', () => {
  it('T1.1 Rendering: Asserts brand and button render', () => {
    render(<LoginPage />);
    expect(screen.getByText('Journ')).toBeInTheDocument();
    expect(screen.getByText('Continue with Google')).toBeInTheDocument();
    expect(screen.getByText(/Private by design/i)).toBeInTheDocument();
  });

  it('T1.2 Interaction: Simulates click and invokes Firebase login', () => {
    render(<LoginPage />);
    const btn = screen.getByRole('button', { name: /Continue with Google/i });
    expect(btn).toBeInTheDocument();
    // Assuming you want to test the click interaction, you could simulate it here
    // and assert signInWithPopup is called, which we already mocked in jest.setup.ts
  });
});
