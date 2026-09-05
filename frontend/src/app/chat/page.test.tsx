import { render, screen, fireEvent, act } from '@testing-library/react';
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

  it('T3.2 Draft Editing Transition & T3.3 Draft Destination Logic', async () => {
    // Inject a draft via mock API
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ replyText: 'Here is a draft.', extractedDraft: 'This is the new extracted draft.' })
    });
    
    render(<ChatCompanion />);
    
    const input = screen.getByPlaceholderText('Reflect with Journ...');
    fireEvent.change(input, { target: { value: 'Trigger draft' } });
    
    await act(async () => {
      fireEvent.click(input.parentElement?.querySelector('button:last-child')!);
    });

    // Click edit
    const editBtn = await screen.findByRole('button', { name: /Edit Text/i });
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

  describe('Suite 9: API Chat Wiring', () => {
    it('T9.1 should disable the send button and show a typing indicator while awaiting the AI API response', async () => {
      let resolvePromise: (v: any) => void = () => {};
      global.fetch = jest.fn().mockReturnValue(new Promise(resolve => {
        resolvePromise = resolve;
      }));

      render(<ChatCompanion />);
      const input = screen.getByPlaceholderText('Reflect with Journ...');
      
      fireEvent.change(input, { target: { value: 'Hello AI' } });
      const sendBtn = input.parentElement?.querySelector('button:last-child');
      
      act(() => {
        fireEvent.click(sendBtn!);
      });
      
      expect(input).toBeDisabled();
      expect(sendBtn).toBeDisabled();
      expect(screen.getByTestId('typing-indicator')).toBeInTheDocument();
      
      await act(async () => {
        resolvePromise({
          ok: true,
          json: async () => ({ replyText: 'Hi' })
        });
      });
    });

    it('T9.2 should append the user message and real AI response to the chat view upon a successful API call', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ replyText: 'I am your AI companion.' })
      });
      
      render(<ChatCompanion />);
      const input = screen.getByPlaceholderText('Reflect with Journ...');
      
      fireEvent.change(input, { target: { value: 'Hello AI' } });
      const sendBtn = input.parentElement?.querySelector('button:last-child');
      
      await act(async () => {
        fireEvent.click(sendBtn!);
      });
      
      expect(screen.getByText('Hello AI')).toBeInTheDocument();
      expect(await screen.findByText('I am your AI companion.')).toBeInTheDocument();
    });

    it('T9.3 should render the Draft Confirmation Card if the API returns an extractedDraft string', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ replyText: 'Here is a draft.', extractedDraft: 'This is the new extracted draft.' })
      });
      
      render(<ChatCompanion />);
      const input = screen.getByPlaceholderText('Reflect with Journ...');
      
      fireEvent.change(input, { target: { value: 'Hello AI' } });
      const sendBtn = input.parentElement?.querySelector('button:last-child');
      
      await act(async () => {
        fireEvent.click(sendBtn!);
      });
      
      expect(await screen.findByText('Drafted Journal Note')).toBeInTheDocument();
      expect(screen.getByText('This is the new extracted draft.')).toBeInTheDocument();
    });
  });
});
