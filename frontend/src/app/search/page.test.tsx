import { render, screen, fireEvent, act } from '@testing-library/react';
import SearchOverlay from './page';
import { useRouter } from 'next/navigation';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('next/link', () => {
  return ({ children, href }: any) => <a href={href}>{children}</a>;
});

describe('Semantic Search Suite', () => {
  let mockPush: jest.Mock;
  
  beforeEach(() => {
    mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    jest.useFakeTimers();
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });

  it('T4.1 Auto-Focus', () => {
    render(<SearchOverlay />);
    const input = screen.getByPlaceholderText(/Ask or search anything/i);
    expect(document.activeElement).toBe(input);
  });

  it('T4.2 Search Submission & T4.3 Clear Input', () => {
    render(<SearchOverlay />);
    const input = screen.getByPlaceholderText(/Ask or search anything/i);
    
    act(() => {
      fireEvent.change(input, { target: { value: 'architecture' } });
      fireEvent.submit(input.closest('form')!);
    });
    
    expect(screen.getByText(/98% Semantic Match/i)).toBeInTheDocument();
    
    const clearBtn = input.parentElement?.querySelector('button[type="button"]');
    act(() => {
      fireEvent.click(clearBtn!);
    });
    
    expect(screen.getByText('Suggested Reflections')).toBeInTheDocument();
  });

  it('T4.4 Escape Key Transition', () => {
    render(<SearchOverlay />);
    
    act(() => {
      fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
    });
    
    expect(screen.getByText(/Returning to Search/i)).toBeInTheDocument();
    
    act(() => {
      jest.advanceTimersByTime(300);
    });
    
    expect(mockPush).toHaveBeenCalledWith('/');
  });
});
