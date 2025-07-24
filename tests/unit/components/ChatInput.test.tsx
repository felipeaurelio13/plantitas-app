import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ChatInput from '../../../src/components/Chat/ChatInput';

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('ChatInput Component', () => {
  let mockOnSendMessage: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnSendMessage = vi.fn();
  });

  it('should render chat input interface', () => {
    render(
      <TestWrapper>
        <ChatInput onSendMessage={mockOnSendMessage} isTyping={false} />
      </TestWrapper>
    );
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enviar/i })).toBeInTheDocument();
  });

  it('should handle message input', () => {
    render(
      <TestWrapper>
        <ChatInput onSendMessage={mockOnSendMessage} isTyping={false} />
      </TestWrapper>
    );
    const input = screen.getByRole('textbox');
    const message = 'Hola planta!';
    fireEvent.change(input, { target: { value: message } });
    expect(input).toHaveValue(message);
  });

  it('should send message when submit button is clicked', async () => {
    render(
      <TestWrapper>
        <ChatInput onSendMessage={mockOnSendMessage} isTyping={false} />
      </TestWrapper>
    );
    const input = screen.getByRole('textbox');
    const sendButton = screen.getByRole('button', { name: /enviar/i });
    fireEvent.change(input, { target: { value: 'Hola planta!' } });
    fireEvent.click(sendButton);
    expect(mockOnSendMessage).toHaveBeenCalledWith('Hola planta!');
  });

  it('should send message when Enter key is pressed', async () => {
    render(
      <TestWrapper>
        <ChatInput onSendMessage={mockOnSendMessage} isTyping={false} />
      </TestWrapper>
    );
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Hola planta!' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    expect(mockOnSendMessage).toHaveBeenCalledWith('Hola planta!');
  });

  it('should not send empty messages', () => {
    render(
      <TestWrapper>
        <ChatInput onSendMessage={mockOnSendMessage} isTyping={false} />
      </TestWrapper>
    );
    const sendButton = screen.getByRole('button', { name: /enviar/i });
    fireEvent.click(sendButton);
    expect(mockOnSendMessage).not.toHaveBeenCalled();
  });

  it('should not send whitespace-only messages', () => {
    render(
      <TestWrapper>
        <ChatInput onSendMessage={mockOnSendMessage} isTyping={false} />
      </TestWrapper>
    );
    const input = screen.getByRole('textbox');
    const sendButton = screen.getByRole('button', { name: /enviar/i });
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.click(sendButton);
    expect(mockOnSendMessage).not.toHaveBeenCalled();
  });

  it('should clear input after sending message', async () => {
    render(
      <TestWrapper>
        <ChatInput onSendMessage={mockOnSendMessage} isTyping={false} />
      </TestWrapper>
    );
    const input = screen.getByRole('textbox');
    const sendButton = screen.getByRole('button', { name: /enviar/i });
    fireEvent.change(input, { target: { value: 'Hola planta!' } });
    fireEvent.click(sendButton);
    await waitFor(() => {
      expect(input).toHaveValue('');
    });
  });

  it('should disable input and button when isTyping is true', () => {
    render(
      <TestWrapper>
        <ChatInput onSendMessage={mockOnSendMessage} isTyping={true} />
      </TestWrapper>
    );
    const input = screen.getByRole('textbox');
    const sendButton = screen.getByRole('button', { name: /enviar/i });
    expect(input).toBeDisabled();
    expect(sendButton).toBeDisabled();
  });

  it('should not send message when isTyping is true', () => {
    render(
      <TestWrapper>
        <ChatInput onSendMessage={mockOnSendMessage} isTyping={true} />
      </TestWrapper>
    );
    const input = screen.getByRole('textbox');
    const sendButton = screen.getByRole('button', { name: /enviar/i });
    fireEvent.change(input, { target: { value: 'Hola planta!' } });
    fireEvent.click(sendButton);
    expect(mockOnSendMessage).not.toHaveBeenCalled();
  });

  it('should handle message with emojis', () => {
    render(
      <TestWrapper>
        <ChatInput onSendMessage={mockOnSendMessage} isTyping={false} />
      </TestWrapper>
    );
    const input = screen.getByRole('textbox');
    const sendButton = screen.getByRole('button', { name: /enviar/i });
    fireEvent.change(input, { target: { value: 'Hola planta! 🌱' } });
    fireEvent.click(sendButton);
    expect(mockOnSendMessage).toHaveBeenCalledWith('Hola planta! 🌱');
  });

  it('should handle long messages', () => {
    const longMessage = 'A'.repeat(1000);
    render(
      <TestWrapper>
        <ChatInput onSendMessage={mockOnSendMessage} isTyping={false} />
      </TestWrapper>
    );
    const input = screen.getByRole('textbox');
    const sendButton = screen.getByRole('button', { name: /enviar/i });
    fireEvent.change(input, { target: { value: longMessage } });
    fireEvent.click(sendButton);
    expect(mockOnSendMessage).toHaveBeenCalledWith(longMessage);
  });

  it('should have proper accessibility attributes', () => {
    render(
      <TestWrapper>
        <ChatInput onSendMessage={mockOnSendMessage} isTyping={false} />
      </TestWrapper>
    );
    const input = screen.getByRole('textbox');
    const sendButton = screen.getByRole('button', { name: /enviar/i });
    expect(input).toHaveAttribute('placeholder');
    expect(sendButton).toHaveAttribute('aria-label');
  });

  it('should handle quick action buttons', () => {
    render(
      <TestWrapper>
        <ChatInput onSendMessage={mockOnSendMessage} isTyping={false} />
      </TestWrapper>
    );
    const quickAction = screen.getByText('¿Cómo te sientes hoy?');
    fireEvent.click(quickAction);
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('¿Cómo te sientes hoy?');
  });
}); 