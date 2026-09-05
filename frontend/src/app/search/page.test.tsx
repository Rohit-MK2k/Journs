import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
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

  it('T4.1 Auto-Focus', async () => {
    render(<SearchOverlay />);
    const input = screen.getByPlaceholderText(/Ask or search anything/i);
    await waitFor(() => {
      expect(document.activeElement).toBe(input);
    });
  });

  it('T4.2 should execute the search API call with the correct query parameters and render the dynamic results', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch');
    fetchSpy.mockClear();
    const mockResults = [
      {
        id: '1', date: 'Sept 5, 2024', matchScore: 95, semanticChips: ['test chip'], snippet: 'This is a <mark>dynamic</mark> snippet', attachments: {}
      }
    ];
    fetchSpy.mockResolvedValueOnce({ ok: true, headers: { get: () => null }, json: async () => mockResults } as any);
    
    render(<SearchOverlay />);
    const input = screen.getByPlaceholderText(/Ask or search anything/i);
    
    await act(async () => {
      fireEvent.change(input, { target: { value: 'dynamic architecture' } });
      fireEvent.submit(input.closest('form')!);
    });
    
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/search?q=dynamic%20architecture',
      expect.any(Object)
    );
    
    expect(await screen.findByText(/95% Semantic Match/i)).toBeInTheDocument();
    expect(screen.getByText('test chip')).toBeInTheDocument();
    
    // Clear Input
    const clearBtn = input.parentElement?.querySelector('button[type="button"]');
    await act(async () => {
      fireEvent.click(clearBtn!);
    });
    
    expect(screen.getByText('Suggested Reflections')).toBeInTheDocument();
    fetchSpy.mockRestore();
  });

  it('T4.5 should display a loading indicator while the search API request is in flight', async () => {
    let resolveApi: (v: any) => void;
    const p = new Promise(resolve => { resolveApi = resolve; });
    const fetchSpy = jest.spyOn(global, 'fetch');
    fetchSpy.mockClear();
    fetchSpy.mockReturnValue(p as any);

    render(<SearchOverlay />);
    const input = screen.getByPlaceholderText(/Ask or search anything/i);
    
    await act(async () => {
      fireEvent.change(input, { target: { value: 'loading' } });
      fireEvent.submit(input.closest('form')!);
    });

    expect(await screen.findByTestId('search-loader')).toBeInTheDocument();
    expect(screen.getByText('Searching your mind...')).toBeInTheDocument();

    await act(async () => {
      resolveApi({ ok: true, headers: { get: () => null }, json: async () => [] });
    });
    fetchSpy.mockRestore();
  });

  it('T4.6 should display an empty state or fallback message if the search returns zero results', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch');
    fetchSpy.mockClear();
    fetchSpy.mockResolvedValueOnce({ ok: true, headers: { get: () => null }, json: async () => [] } as any);

    render(<SearchOverlay />);
    const input = screen.getByPlaceholderText(/Ask or search anything/i);
    
    await act(async () => {
      fireEvent.change(input, { target: { value: 'nonexistent' } });
      fireEvent.submit(input.closest('form')!);
    });

    expect(await screen.findByText(/No reflections found for "nonexistent"/i)).toBeInTheDocument();
    fetchSpy.mockRestore();
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
