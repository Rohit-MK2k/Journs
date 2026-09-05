import { render, screen, fireEvent } from '@testing-library/react';
import ChatCompanion from './page';

jest.mock('next/link', () => {
  return ({ children, href }: any) => <a href={href}>{children}</a>;
});

describe('AI Companion Suite', () => {
  it('T3.1 Mode Toggling', () => {
    render(<ChatCompanion />);
    expect(screen.getByPlaceholderText('Reflect with Journ...')).toBeInTheDocument();
    
    // Switch to voice
    const voiceBtn = screen.getByRole('button', { name: /Voice/i });
    fireEvent.click(voiceBtn);
    expect(screen.getByText('Companion is listening...')).toBeInTheDocument();
  });

  it('T3.2 Draft Editing Transition & T3.3 Draft Destination Logic', () => {
    render(<ChatCompanion />);
    
    // Click edit
    const editBtn = screen.getByRole('button', { name: /Edit Text/i });
    fireEvent.click(editBtn);
    
    expect(screen.getByText('Edit Drafted Note')).toBeInTheDocument();
    
    // Select new entry radio
    const newEntryRadio = screen.getByRole('radio', { name: /Create as New Separate Entry/i });
    fireEvent.click(newEntryRadio);
    expect(newEntryRadio).toBeChecked();
    
    // T3.4 Draft Discard/Save
    const saveBtn = screen.getByRole('button', { name: /Save as New Entry/i });
    fireEvent.click(saveBtn);
    
    // Should return to text mode
    expect(screen.getByPlaceholderText('Reflect with Journ...')).toBeInTheDocument();
  });
});
