import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ChatInput } from '../../../src/components/Chat/ChatInput';

// Mock de hooks y servicios
vi.mock('../../../src/hooks/useChat', () => ({
  useChat: () => ({
    sendMessage: vi.fn(),
    isSending: false,
    error: null
  })
}));

vi.mock('../../../src/stores/useAuthStore', () => ({
  useAuthStore: () => ({
    user: { id: 'test-user', email: 'test@example.com' },
    isAuthenticated: true
  })
}));

vi.mock('../../../src/components/ui/Toast', () => ({
  useToast: () => ({
    addToast: vi.fn()
  })
}));

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
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render chat input interface', () => {
    render(
      <TestWrapper>
        <ChatInput plantId="test-plant-1" />
      </TestWrapper>
    );

    // Verificar elementos de la interfaz de chat
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enviar/i })).toBeInTheDocument();
  });

  it('should handle message input', () => {
    render(
      <TestWrapper>
        <ChatInput plantId="test-plant-1" />
      </TestWrapper>
    );

    const input = screen.getByRole('textbox');
    const message = 'Hola planta!';
    
    fireEvent.change(input, { target: { value: message } });
    
    expect(input).toHaveValue(message);
  });

  it('should send message when submit button is clicked', async () => {
    const mockSendMessage = vi.fn();
    
    vi.mocked(require('../../../src/hooks/useChat').useChat).mockReturnValue({
      sendMessage: mockSendMessage,
      isSending: false,
      error: null
    });

    render(
      <TestWrapper>
        <ChatInput plantId="test-plant-1" />
      </TestWrapper>
    );

    const input = screen.getByRole('textbox');
    const sendButton = screen.getByRole('button', { name: /enviar/i });
    
    fireEvent.change(input, { target: { value: 'Hola planta!' } });
    fireEvent.click(sendButton);

    expect(mockSendMessage).toHaveBeenCalledWith('Hola planta!');
  });

  it('should send message when Enter key is pressed', async () => {
    const mockSendMessage = vi.fn();
    
    vi.mocked(require('../../../src/hooks/useChat').useChat).mockReturnValue({
      sendMessage: mockSendMessage,
      isSending: false,
      error: null
    });

    render(
      <TestWrapper>
        <ChatInput plantId="test-plant-1" />
      </TestWrapper>
    );

    const input = screen.getByRole('textbox');
    
    fireEvent.change(input, { target: { value: 'Hola planta!' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(mockSendMessage).toHaveBeenCalledWith('Hola planta!');
  });

  it('should not send empty messages', () => {
    const mockSendMessage = vi.fn();
    
    vi.mocked(require('../../../src/hooks/useChat').useChat).mockReturnValue({
      sendMessage: mockSendMessage,
      isSending: false,
      error: null
    });

    render(
      <TestWrapper>
        <ChatInput plantId="test-plant-1" />
      </TestWrapper>
    );

    const sendButton = screen.getByRole('button', { name: /enviar/i });
    fireEvent.click(sendButton);

    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  it('should not send whitespace-only messages', () => {
    const mockSendMessage = vi.fn();
    
    vi.mocked(require('../../../src/hooks/useChat').useChat).mockReturnValue({
      sendMessage: mockSendMessage,
      isSending: false,
      error: null
    });

    render(
      <TestWrapper>
        <ChatInput plantId="test-plant-1" />
      </TestWrapper>
    );

    const input = screen.getByRole('textbox');
    const sendButton = screen.getByRole('button', { name: /enviar/i });
    
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.click(sendButton);

    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  it('should clear input after sending message', async () => {
    const mockSendMessage = vi.fn();
    
    vi.mocked(require('../../../src/hooks/useChat').useChat).mockReturnValue({
      sendMessage: mockSendMessage,
      isSending: false,
      error: null
    });

    render(
      <TestWrapper>
        <ChatInput plantId="test-plant-1" />
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

  it('should disable input when sending', () => {
    vi.mocked(require('../../../src/hooks/useChat').useChat).mockReturnValue({
      sendMessage: vi.fn(),
      isSending: true,
      error: null
    });

    render(
      <TestWrapper>
        <ChatInput plantId="test-plant-1" />
      </TestWrapper>
    );

    const input = screen.getByRole('textbox');
    const sendButton = screen.getByRole('button', { name: /enviar/i });

    expect(input).toBeDisabled();
    expect(sendButton).toBeDisabled();
  });

  it('should show loading state when sending', () => {
    vi.mocked(require('../../../src/hooks/useChat').useChat).mockReturnValue({
      sendMessage: vi.fn(),
      isSending: true,
      error: null
    });

    render(
      <TestWrapper>
        <ChatInput plantId="test-plant-1" />
      </TestWrapper>
    );

    expect(screen.getByText(/enviando/i)).toBeInTheDocument();
  });

  it('should handle error state', () => {
    vi.mocked(require('../../../src/hooks/useChat').useChat).mockReturnValue({
      sendMessage: vi.fn(),
      isSending: false,
      error: new Error('Failed to send message')
    });

    render(
      <TestWrapper>
        <ChatInput plantId="test-plant-1" />
      </TestWrapper>
    );

    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });

  it('should handle message with emojis', () => {
    const mockSendMessage = vi.fn();
    
    vi.mocked(require('../../../src/hooks/useChat').useChat).mockReturnValue({
      sendMessage: mockSendMessage,
      isSending: false,
      error: null
    });

    render(
      <TestWrapper>
        <ChatInput plantId="test-plant-1" />
      </TestWrapper>
    );

    const input = screen.getByRole('textbox');
    const sendButton = screen.getByRole('button', { name: /enviar/i });
    
    fireEvent.change(input, { target: { value: 'Hola planta! 🌱' } });
    fireEvent.click(sendButton);

    expect(mockSendMessage).toHaveBeenCalledWith('Hola planta! 🌱');
  });

  it('should handle long messages', () => {
    const mockSendMessage = vi.fn();
    const longMessage = 'A'.repeat(1000);
    
    vi.mocked(require('../../../src/hooks/useChat').useChat).mockReturnValue({
      sendMessage: mockSendMessage,
      isSending: false,
      error: null
    });

    render(
      <TestWrapper>
        <ChatInput plantId="test-plant-1" />
      </TestWrapper>
    );

    const input = screen.getByRole('textbox');
    const sendButton = screen.getByRole('button', { name: /enviar/i });
    
    fireEvent.change(input, { target: { value: longMessage } });
    fireEvent.click(sendButton);

    expect(mockSendMessage).toHaveBeenCalledWith(longMessage);
  });

  it('should have proper accessibility attributes', () => {
    render(
      <TestWrapper>
        <ChatInput plantId="test-plant-1" />
      </TestWrapper>
    );

    const input = screen.getByRole('textbox');
    const sendButton = screen.getByRole('button', { name: /enviar/i });

    expect(input).toHaveAttribute('aria-label');
    expect(input).toHaveAttribute('placeholder');
    expect(sendButton).toHaveAttribute('aria-label');
  });

  it('should handle keyboard shortcuts', () => {
    const mockSendMessage = vi.fn();
    
    vi.mocked(require('../../../src/hooks/useChat').useChat).mockReturnValue({
      sendMessage: mockSendMessage,
      isSending: false,
      error: null
    });

    render(
      <TestWrapper>
        <ChatInput plantId="test-plant-1" />
      </TestWrapper>
    );

    const input = screen.getByRole('textbox');
    
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', ctrlKey: true });

    expect(mockSendMessage).toHaveBeenCalledWith('Test message');
  });

  it('should handle paste events', () => {
    render(
      <TestWrapper>
        <ChatInput plantId="test-plant-1" />
      </TestWrapper>
    );

    const input = screen.getByRole('textbox');
    const pastedText = 'Texto pegado desde el portapapeles';
    
    fireEvent.paste(input, {
      clipboardData: {
        getData: () => pastedText
      }
    });

    expect(input).toHaveValue(pastedText);
  });
}); 