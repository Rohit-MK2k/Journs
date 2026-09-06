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
});
