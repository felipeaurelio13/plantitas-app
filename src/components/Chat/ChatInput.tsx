import React, { useState } from 'react';
import { Send, CornerDownLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isTyping: boolean;
}

const quickActions = [
  "¿Cómo te sientes hoy?",
  "¿Necesitas agua?",
  "Cuéntame un dato curioso sobre ti",
];

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isTyping }) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (!message.trim()) return;
    onSendMessage(message.trim());
    setMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <footer className="sticky bottom-0 z-10 bg-background/80 backdrop-blur-sm border-t border-border">
      <div className="p-4 pb-safe-bottom space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Input
              type="text"
              value={message}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe un mensaje..."
              className="pr-12"
              disabled={isTyping}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground">
              <CornerDownLeft size={16} />
            </div>
          </div>
          <Button
            aria-label="Enviar mensaje"
            onClick={handleSend}
            disabled={!message.trim() || isTyping}
            size="icon"
          >
            <Send size={20} />
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {quickActions.map((action) => (
            <Button
              key={action}
              onClick={() => setMessage(action)}
              disabled={isTyping}
              variant="secondary"
              size="sm"
            >
              {action}
            </Button>
          ))}
        </div>
      </div>
    </footer>
  );
};

export default ChatInput; 