import React from 'react';
import formatDistanceToNow from 'date-fns/formatDistanceToNow';
import { es } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { ChatMessage } from '../../schemas';
import { cn } from '../../lib/utils';
import { toastService } from '../../services/toastService';

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

  const handleFeedback = (useful: boolean) => {
    toastService.success('¡Gracias por tu feedback!', useful ? 'Nos alegra que la respuesta te haya sido útil.' : 'Trabajaremos para mejorar las respuestas.');
    if (import.meta.env.DEV) {
      console.log('[Feedback][Chat IA Planta]', {
        messageId: message.id,
        content: message.content,
        useful
      });
    }
  };

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
          'max-w-xs rounded-2xl px-4 py-2 sm:max-w-sm md:max-w-md shadow-adaptive',
          isUser
            ? 'rounded-br-lg bg-primary-700 text-white drop-shadow-sm'
            : 'rounded-bl-lg bg-contrast-surface text-contrast-medium border border-contrast',
          'rounded-[12px]'
        )}
      >
        <p className="text-sm">{message.content}</p>
        {/* Insights (tips, warnings, etc.) */}
        {message.context?.insights && message.context.insights.length > 0 && (
          <div className="mt-3 space-y-2">
            <div className="font-semibold text-xs text-green-700 dark:text-green-300">Recomendaciones y observaciones:</div>
            <ul className="space-y-1">
              {message.context.insights.map((insight, idx) => (
                <li key={idx} className="text-xs bg-green-50 dark:bg-green-900/20 rounded-lg p-2 border border-green-200 dark:border-green-800">
                  <div className="font-medium">
                    {insight.type === 'warning' && '⚠️ '}
                    {insight.type === 'tip' && '💡 '}
                    {insight.type === 'recommendation' && '🌱 '}
                    {insight.type === 'observation' && '🔎 '}
                    {insight.title}
                  </div>
                  <div>{insight.description}</div>
                  {insight.affectedPlants && insight.affectedPlants.length > 0 && (
                    <div className="mt-1 text-[11px] text-green-800 dark:text-green-200">
                      Plantas: {insight.affectedPlants.join(', ')}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        {/* Suggested Actions */}
        {message.context?.suggestedActions && message.context.suggestedActions.length > 0 && (
          <div className="mt-3 space-y-2">
            <div className="font-semibold text-xs text-blue-700 dark:text-blue-300">Acciones sugeridas:</div>
            <ul className="space-y-1">
              {message.context.suggestedActions.map((action, idx) => (
                <li key={idx} className="text-xs bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 border border-blue-200 dark:border-blue-800">
                  <div className="font-medium">{action.action}</div>
                  {action.priority && (
                    <div className="text-[11px] text-blue-800 dark:text-blue-200">Prioridad: {action.priority}</div>
                  )}
                  {action.plantIds && action.plantIds.length > 0 && (
                    <div className="text-[11px] text-blue-800 dark:text-blue-200">Plantas: {action.plantIds.join(', ')}</div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        <p className={cn("mt-1 text-xs", isUser ? "text-white/80" : "text-contrast-soft", 'text-[#888] text-[12px]')}>
          {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true, locale: es })}
        </p>
        {/* Feedback IA */}
        {!isUser && (
          <div className="flex gap-2 mt-2">
            <button
              aria-label="Respuesta útil"
              className="text-green-600 hover:text-green-800 text-lg focus:outline-none"
              onClick={() => handleFeedback(true)}
            >
              👍
            </button>
            <button
              aria-label="Respuesta no útil"
              className="text-red-500 hover:text-red-700 text-lg focus:outline-none"
              onClick={() => handleFeedback(false)}
            >
              👎
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MessageBubble; 