import React, { useState, useRef } from 'react';
import { Send, CornerDownLeft, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface GardenChatInputProps {
  onSendMessage: (content: string) => Promise<void>;
  isTyping: boolean;
  suggestedQuestions: string[];
  isLoading?: boolean;
}

const GardenChatInput: React.FC<GardenChatInputProps> = ({ 
  onSendMessage, 
  isTyping, 
  suggestedQuestions,
  isLoading = false
}) => {
  const [message, setMessage] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = async () => {
    if (isTyping) return;
    const value = inputRef.current?.value.trim();
    if (!value) return;
    setShowSuggestions(false);
    if (inputRef.current) inputRef.current.value = '';
    await onSendMessage(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = async (suggestion: string) => {
    setMessage('');
    setShowSuggestions(false);
    await onSendMessage(suggestion);
  };

  const handleFocus = () => {
    if (suggestedQuestions.length > 0 && !message) {
      setShowSuggestions(true);
    }
  };

  return (
    <footer className="sticky bottom-0 z-10 bg-background/80 backdrop-blur-sm border-t border-border">
      <div className="p-4 pb-safe-bottom space-y-3">
        {/* Suggested Questions */}
        <AnimatePresence>
          {showSuggestions && suggestedQuestions.length > 0 && !isLoading && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-2 mb-4"
            >
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Sparkles size={12} />
                <span>Preguntas sugeridas</span>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {suggestedQuestions.slice(0, 4).map((suggestion, index) => (
                  <motion.button
                    key={suggestion}
                    onClick={() => handleSuggestionClick(suggestion)}
                    disabled={isTyping}
                    className="px-3 py-1.5 text-xs bg-muted hover:bg-[#F0F0F0] active:bg-[#F0F0F0] rounded-full border border-border/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {suggestion}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Message Input */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Input
              type="text"
              ref={inputRef}
              onKeyDown={handleKeyDown}
              onFocus={handleFocus}
              placeholder="Pregúntame sobre tu jardín..."
              className="pr-12"
              disabled={isTyping || isLoading}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground">
              <CornerDownLeft size={16} />
            </div>
          </div>
          <Button
            aria-label="Enviar mensaje"
            onClick={handleSend}
            disabled={!message.trim() || isTyping || isLoading}
            size="icon"
            className="shrink-0"
          >
            {isTyping ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles size={20} />
              </motion.div>
            ) : (
              <Send size={20} />
            )}
          </Button>
        </div>

        {/* Loading indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center gap-2 text-xs text-muted-foreground"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles size={12} />
            </motion.div>
            <span>Analizando tu jardín...</span>
          </motion.div>
        )}
      </div>
    </footer>
  );
};

export default GardenChatInput; 