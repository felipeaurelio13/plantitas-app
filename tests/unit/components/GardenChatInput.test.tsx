import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GardenChatInput } from '../../../src/components/GardenChat/GardenChatInput';

// Mock de hooks y servicios
vi.mock('../../../src/hooks/useGardenChat', () => ({
  useGardenChat: () => ({
    sendMessage: vi.fn(),
    getHealthSummary: vi.fn(),
    getSuggestedQuestions: vi.fn(),
    isLoading: false,
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

describe('GardenChatInput Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render garden chat input interface', () => {
    render(
      <TestWrapper>
        <GardenChatInput />
      </TestWrapper>
    );

    // Verificar elementos de la interfaz de chat del jardín
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enviar/i })).toBeInTheDocument();
    expect(screen.getByText(/jardín/i)).toBeInTheDocument();
  });

  it('should handle message input', () => {
    render(
      <TestWrapper>
        <GardenChatInput />
      </TestWrapper>
    );

    const input = screen.getByRole('textbox');
    const message = '¿Cómo están todas mis plantas?';
    
    fireEvent.change(input, { target: { value: message } });
    
    expect(input).toHaveValue(message);
  });

  it('should send garden message when submit button is clicked', async () => {
    const mockSendMessage = vi.fn();
    
    vi.mocked(require('../../../src/hooks/useGardenChat').useGardenChat).mockReturnValue({
      sendMessage: mockSendMessage,
      getHealthSummary: vi.fn(),
      getSuggestedQuestions: vi.fn(),
      isLoading: false,
      error: null
    });

    render(
      <TestWrapper>
        <GardenChatInput />
      </TestWrapper>
    );

    const input = screen.getByRole('textbox');
    const sendButton = screen.getByRole('button', { name: /enviar/i });
    
    fireEvent.change(input, { target: { value: '¿Cómo están todas mis plantas?' } });
    fireEvent.click(sendButton);

    expect(mockSendMessage).toHaveBeenCalledWith('¿Cómo están todas mis plantas?');
  });

  it('should send garden message when Enter key is pressed', async () => {
    const mockSendMessage = vi.fn();
    
    vi.mocked(require('../../../src/hooks/useGardenChat').useGardenChat).mockReturnValue({
      sendMessage: mockSendMessage,
      getHealthSummary: vi.fn(),
      getSuggestedQuestions: vi.fn(),
      isLoading: false,
      error: null
    });

    render(
      <TestWrapper>
        <GardenChatInput />
      </TestWrapper>
    );

    const input = screen.getByRole('textbox');
    
    fireEvent.change(input, { target: { value: '¿Cómo están todas mis plantas?' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(mockSendMessage).toHaveBeenCalledWith('¿Cómo están todas mis plantas?');
  });

  it('should not send empty garden messages', () => {
    const mockSendMessage = vi.fn();
    
    vi.mocked(require('../../../src/hooks/useGardenChat').useGardenChat).mockReturnValue({
      sendMessage: mockSendMessage,
      getHealthSummary: vi.fn(),
      getSuggestedQuestions: vi.fn(),
      isLoading: false,
      error: null
    });

    render(
      <TestWrapper>
        <GardenChatInput />
      </TestWrapper>
    );

    const sendButton = screen.getByRole('button', { name: /enviar/i });
    fireEvent.click(sendButton);

    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  it('should not send whitespace-only garden messages', () => {
    const mockSendMessage = vi.fn();
    
    vi.mocked(require('../../../src/hooks/useGardenChat').useGardenChat).mockReturnValue({
      sendMessage: mockSendMessage,
      getHealthSummary: vi.fn(),
      getSuggestedQuestions: vi.fn(),
      isLoading: false,
      error: null
    });

    render(
      <TestWrapper>
        <GardenChatInput />
      </TestWrapper>
    );

    const input = screen.getByRole('textbox');
    const sendButton = screen.getByRole('button', { name: /enviar/i });
    
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.click(sendButton);

    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  it('should clear input after sending garden message', async () => {
    const mockSendMessage = vi.fn();
    
    vi.mocked(require('../../../src/hooks/useGardenChat').useGardenChat).mockReturnValue({
      sendMessage: mockSendMessage,
      getHealthSummary: vi.fn(),
      getSuggestedQuestions: vi.fn(),
      isLoading: false,
      error: null
    });

    render(
      <TestWrapper>
        <GardenChatInput />
      </TestWrapper>
    );

    const input = screen.getByRole('textbox');
    const sendButton = screen.getByRole('button', { name: /enviar/i });
    
    fireEvent.change(input, { target: { value: '¿Cómo están todas mis plantas?' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(input).toHaveValue('');
    });
  });

  it('should disable input when sending garden message', () => {
    vi.mocked(require('../../../src/hooks/useGardenChat').useGardenChat).mockReturnValue({
      sendMessage: vi.fn(),
      getHealthSummary: vi.fn(),
      getSuggestedQuestions: vi.fn(),
      isLoading: true,
      error: null
    });

    render(
      <TestWrapper>
        <GardenChatInput />
      </TestWrapper>
    );

    const input = screen.getByRole('textbox');
    const sendButton = screen.getByRole('button', { name: /enviar/i });

    expect(input).toBeDisabled();
    expect(sendButton).toBeDisabled();
  });

  it('should show loading state when sending garden message', () => {
    vi.mocked(require('../../../src/hooks/useGardenChat').useGardenChat).mockReturnValue({
      sendMessage: vi.fn(),
      getHealthSummary: vi.fn(),
      getSuggestedQuestions: vi.fn(),
      isLoading: true,
      error: null
    });

    render(
      <TestWrapper>
        <GardenChatInput />
      </TestWrapper>
    );

    expect(screen.getByText(/enviando/i)).toBeInTheDocument();
  });

  it('should handle garden chat error state', () => {
    vi.mocked(require('../../../src/hooks/useGardenChat').useGardenChat).mockReturnValue({
      sendMessage: vi.fn(),
      getHealthSummary: vi.fn(),
      getSuggestedQuestions: vi.fn(),
      isLoading: false,
      error: new Error('Failed to send garden message')
    });

    render(
      <TestWrapper>
        <GardenChatInput />
      </TestWrapper>
    );

    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });

  it('should display garden-specific placeholder', () => {
    render(
      <TestWrapper>
        <GardenChatInput />
      </TestWrapper>
    );

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('placeholder');
    expect(input.getAttribute('placeholder')).toContain('jardín');
  });

  it('should handle garden message with emojis', () => {
    const mockSendMessage = vi.fn();
    
    vi.mocked(require('../../../src/hooks/useGardenChat').useGardenChat).mockReturnValue({
      sendMessage: mockSendMessage,
      getHealthSummary: vi.fn(),
      getSuggestedQuestions: vi.fn(),
      isLoading: false,
      error: null
    });

    render(
      <TestWrapper>
        <GardenChatInput />
      </TestWrapper>
    );

    const input = screen.getByRole('textbox');
    const sendButton = screen.getByRole('button', { name: /enviar/i });
    
    fireEvent.change(input, { target: { value: '¿Cómo están mis plantas? 🌱🌿' } });
    fireEvent.click(sendButton);

    expect(mockSendMessage).toHaveBeenCalledWith('¿Cómo están mis plantas? 🌱🌿');
  });

  it('should handle long garden messages', () => {
    const mockSendMessage = vi.fn();
    const longMessage = 'A'.repeat(1000);
    
    vi.mocked(require('../../../src/hooks/useGardenChat').useGardenChat).mockReturnValue({
      sendMessage: mockSendMessage,
      getHealthSummary: vi.fn(),
      getSuggestedQuestions: vi.fn(),
      isLoading: false,
      error: null
    });

    render(
      <TestWrapper>
        <GardenChatInput />
      </TestWrapper>
    );

    const input = screen.getByRole('textbox');
    const sendButton = screen.getByRole('button', { name: /enviar/i });
    
    fireEvent.change(input, { target: { value: longMessage } });
    fireEvent.click(sendButton);

    expect(mockSendMessage).toHaveBeenCalledWith(longMessage);
  });

  it('should have proper accessibility attributes for garden chat', () => {
    render(
      <TestWrapper>
        <GardenChatInput />
      </TestWrapper>
    );

    const input = screen.getByRole('textbox');
    const sendButton = screen.getByRole('button', { name: /enviar/i });

    expect(input).toHaveAttribute('aria-label');
    expect(input).toHaveAttribute('placeholder');
    expect(sendButton).toHaveAttribute('aria-label');
  });

  it('should handle keyboard shortcuts for garden chat', () => {
    const mockSendMessage = vi.fn();
    
    vi.mocked(require('../../../src/hooks/useGardenChat').useGardenChat).mockReturnValue({
      sendMessage: mockSendMessage,
      getHealthSummary: vi.fn(),
      getSuggestedQuestions: vi.fn(),
      isLoading: false,
      error: null
    });

    render(
      <TestWrapper>
        <GardenChatInput />
      </TestWrapper>
    );

    const input = screen.getByRole('textbox');
    
    fireEvent.change(input, { target: { value: 'Test garden message' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', ctrlKey: true });

    expect(mockSendMessage).toHaveBeenCalledWith('Test garden message');
  });

  it('should handle paste events in garden chat', () => {
    render(
      <TestWrapper>
        <GardenChatInput />
      </TestWrapper>
    );

    const input = screen.getByRole('textbox');
    const pastedText = 'Texto pegado desde el portapapeles para el jardín';
    
    fireEvent.paste(input, {
      clipboardData: {
        getData: () => pastedText
      }
    });

    expect(input).toHaveValue(pastedText);
  });

  it('should display garden chat instructions', () => {
    render(
      <TestWrapper>
        <GardenChatInput />
      </TestWrapper>
    );

    expect(screen.getByText(/pregunta sobre tu jardín/i)).toBeInTheDocument();
    expect(screen.getByText(/obtén consejos generales/i)).toBeInTheDocument();
  });
}); 