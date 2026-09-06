import { render, screen, fireEvent } from '@testing-library/react';
import AccountSettings from './page';

jest.mock('next/link', () => {
  return ({ children, href }: any) => <a href={href}>{children}</a>;
});

describe('Account & Settings Suite', () => {
  it('T5.1 Theme Selector & T5.2 Habit Memory Toggle', () => {
    render(<AccountSettings />);
    
    const darkBtn = screen.getByRole('button', { name: /Dark \(Charcoal\)/i });
    fireEvent.click(darkBtn);
    expect(darkBtn.className).toContain('bg-surface'); 
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    const lightBtn = screen.getByRole('button', { name: /Light \(Warm Paper\)/i });
    fireEvent.click(lightBtn);
    expect(localStorage.getItem('theme')).toBe('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    
    // Checkbox mapping to the custom toggle
    const toggleInput = screen.getByLabelText(/Include past entries/i) as HTMLInputElement;
    expect(toggleInput).toBeChecked();
    
    fireEvent.click(toggleInput);
    expect(toggleInput).not.toBeChecked();
  });

  it('T5.3 Danger Zone Safeguard', () => {
    render(<AccountSettings />);
    
    const deleteInput = screen.getByPlaceholderText('DELETE');
    const deleteBtn = screen.getByRole('button', { name: /Permanently Wipe All Data/i });
    
    expect(deleteBtn).toBeDisabled();
    
    fireEvent.change(deleteInput, { target: { value: 'DELET' } });
    expect(deleteBtn).toBeDisabled();
    
    fireEvent.change(deleteInput, { target: { value: 'DELETE' } });
    expect(deleteBtn).not.toBeDisabled();
    
    fireEvent.change(deleteInput, { target: { value: 'DELETEd' } });
    expect(deleteBtn).toBeDisabled();
  });

  it('T5.4 Habit Memory Display Area renders read-only memory profile with writing habits', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => null },
      json: async () => ({
        uid: 'mock-user',
        topics: ['Engineering', 'Mindfulness'],
        frequency: 'daily',
        tone: 'reflective',
        writingHabits: {
          structure: 'Bulleted thoughts',
          depth: 'Concise (~150 words)',
          timing: 'Late night',
          vocabulary: 'Casual and expressive',
        },
        updatedAt: '2026-09-06T10:00:00.000Z',
      }),
    });

    render(<AccountSettings />);

    expect(await screen.findByText('Current Habit Profile')).toBeInTheDocument();
    expect(await screen.findByText('Engineering')).toBeInTheDocument();
    expect(screen.getByText('Mindfulness')).toBeInTheDocument();
    expect(screen.getByTestId('habit-tone')).toHaveTextContent('reflective');
    expect(screen.getByTestId('habit-frequency')).toHaveTextContent('daily');
    expect(screen.getByTestId('habit-structure')).toHaveTextContent('Bulleted thoughts');
    expect(screen.getByTestId('habit-depth')).toHaveTextContent('Concise (~150 words)');
    expect(screen.getByTestId('habit-timing')).toHaveTextContent('Late night');
    expect(screen.getByTestId('habit-vocabulary')).toHaveTextContent('Casual and expressive');
  });
});
