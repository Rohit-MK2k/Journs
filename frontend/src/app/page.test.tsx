import { render, screen, fireEvent, act } from '@testing-library/react';
import MainDashboard from './page';

jest.mock('next/link', () => {
  return ({ children, href }: any) => <a href={href}>{children}</a>;
});

describe('Main Dashboard Suite', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });

  it('T2.1 Editor Autosave Debounce', () => {
    render(<MainDashboard />);
    const textarea = screen.getByPlaceholderText("What's on your mind today?");
    
    act(() => {
      fireEvent.change(textarea, { target: { value: 'Testing autosave' } });
    });
    
    expect(screen.getByText('Saving...')).toBeInTheDocument();
    
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByText('Saved')).toBeInTheDocument();
    
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(screen.queryByText('Saved')).not.toBeInTheDocument();
  });

  it('T2.2 Timeline Rendering', () => {
    render(<MainDashboard />);
    expect(screen.getByText('Recent Entries')).toBeInTheDocument();
    expect(screen.getByText('YESTERDAY')).toBeInTheDocument();
  });

  it('T2.3 Expanded Entry State & T2.4 Return to Timeline', () => {
    render(<MainDashboard />);
    
    // Click timeline card
    const card = screen.getByText('YESTERDAY').closest('button');
    act(() => {
      fireEvent.click(card!);
    });
    
    expect(screen.getByText('Tuesday, September 3, 2024')).toBeInTheDocument();
    expect(screen.queryByText('Recent Entries')).not.toBeInTheDocument();
    
    // Return to timeline
    const backBtn = screen.getByRole('button', { name: /Timeline/i });
    act(() => {
      fireEvent.click(backBtn);
    });
    
    expect(screen.getByText('Recent Entries')).toBeInTheDocument();
  });
});
