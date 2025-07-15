import React from 'react';
import formatDistanceToNow from 'date-fns/formatDistanceToNow';
import { es } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { ChatMessage } from '../../schemas';
import { cn } from '../../lib/utils';

interface MessageBubbleProps {
  message: ChatMessage;
}

const getEmotionIcon = (emotion?: string) => {
    switch (emotion) {
      case 'happy':
      case 'excited':
        return '😊';
      case 'grateful':
        return '🥰';
      case 'worried':
        return '😟';
      case 'sad':
        return '😢';
      default:
        return '🌱';
    }
  };

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.sender === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('flex items-end gap-2', isUser ? 'justify-end' : 'justify-start')}
    >
      {!isUser && (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xl">
          {getEmotionIcon(message.emotion)}
        </div>
      )}
      <div
        className={cn(
          'max-w-xs rounded-2xl px-4 py-2 sm:max-w-sm md:max-w-md',
          isUser
            ? 'rounded-br-lg bg-primary text-primary-foreground'
            : 'rounded-bl-lg bg-muted text-muted-foreground'
        )}
      >
        <p className="text-sm">{message.content}</p>
        <p className={cn("mt-1 text-xs", isUser ? "text-primary-foreground/70" : "text-muted-foreground/70")}>
          {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true, locale: es })}
        </p>
      </div>
    </motion.div>
  );
};

export default MessageBubble; 