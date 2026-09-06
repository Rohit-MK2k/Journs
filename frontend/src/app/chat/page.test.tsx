import { render, screen, fireEvent, act } from '@testing-library/react';
import ChatCompanion from './page';

jest.mock('next/link', () => {
  return ({ children, href }: any) => <a href={href}>{children}</a>;
});

describe('AI Companion Suite', () => {
  it('T3.1 Voice Mode is not present in UI', () => {
    render(<ChatCompanion />);
    expect(screen.getByPlaceholderText('Reflect with Journ...')).toBeInTheDocument();
    
    // Voice mode buttons or references should not be present in the UI
    expect(screen.queryByRole('button', { name: /Voice/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/Voice/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Companion is listening...')).not.toBeInTheDocument();
  });

  it('T3.2 Draft Editing Transition & T3.3 Draft Destination Logic', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => null },
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
          headers: { get: () => null },
          json: async () => ({ replyText: 'Hi' })
        });
      });
    });

    it('T9.2 should append the user message and real AI response to the chat view upon a successful API call', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        headers: { get: () => null },
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
        headers: { get: () => null },
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

    it('T9.4 Chat Stream Rendering should incrementally append chunks to the chat bubble', async () => {
      // Mock TextDecoder in JSDOM environment
      (global as any).TextDecoder = class { decode(arr: any) { return Buffer.from(arr).toString('utf-8'); } };

      let readCount = 0;
      const chunks = [
        'data: {"replyText": "Hello "}\n\n',
        'data: {"replyText": "World!"}\n\n',
        'data: [DONE]\n\n'
      ];
      
      const mockReader = {
        read: jest.fn().mockImplementation(() => {
          if (readCount < chunks.length) {
            const val = chunks[readCount++];
            return Promise.resolve({ done: false, value: Buffer.from(val, 'utf-8') });
          }
          return Promise.resolve({ done: true });
        })
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        headers: { get: (n: string) => n.toLowerCase() === 'content-type' ? 'text/event-stream' : null },
        body: { getReader: () => mockReader }
      });
      
      render(<ChatCompanion />);
      const input = screen.getByPlaceholderText('Reflect with Journ...');
      
      fireEvent.change(input, { target: { value: 'Stream test' } });
      const sendBtn = input.parentElement?.querySelector('button:last-child');
      
      await act(async () => {
        fireEvent.click(sendBtn!);
      });
      
      expect(await screen.findByText('Hello World!')).toBeInTheDocument();
      expect(mockReader.read).toHaveBeenCalledTimes(4); // 3 chunks + 1 done
    });
  });
});
