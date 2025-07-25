import React from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Bot, User, Lightbulb, AlertTriangle, Eye, Target } from 'lucide-react';
import { cn } from '../../lib/utils';
import { GardenChatMessage } from '../../schemas';

interface GardenMessageBubbleProps {
  message: GardenChatMessage;
}

const GardenMessageBubble: React.FC<GardenMessageBubbleProps> = ({ message }) => {
  const isUser = message.sender === 'user';
  
  if (import.meta.env.DEV) {
    console.log('[DEBUG][GardenMessageBubble] message.context:', message.context);
  }

  // Icon for AI messages based on query type
  const getAIIcon = () => {
    if (!message.context?.queryType) return <Bot size={16} />;
    
    switch (message.context.queryType) {
      case 'health_analysis':
        return <AlertTriangle size={16} />;
      case 'care_comparison':
        return <Eye size={16} />;
      case 'disease_prevention':
        return <Target size={16} />;
      case 'growth_tracking':
        return <Lightbulb size={16} />;
      default:
        return <Bot size={16} />;
    }
  };

  // Get icon color based on context
  const getIconColor = () => {
    if (isUser) return 'text-primary-foreground/70';
    
    if (!message.context?.queryType) return 'text-green-500';
    
    switch (message.context.queryType) {
      case 'health_analysis':
        return 'text-red-500';
      case 'care_comparison':
        return 'text-blue-500';
      case 'disease_prevention':
        return 'text-orange-500';
      case 'growth_tracking':
        return 'text-purple-500';
      default:
        return 'text-green-500';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('flex items-end gap-2 max-w-[85%]', isUser ? 'justify-end ml-auto' : 'justify-start')}
    >
      {!isUser && (
        <motion.div 
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-full',
            'bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30'
          )}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className={getIconColor()}>
            {getAIIcon()}
          </div>
        </motion.div>
      )}
      
      <div className="flex-1">
        <div
          className={cn(
            'rounded-2xl px-4 py-3 break-words shadow-adaptive',
            isUser
              ? 'rounded-br-lg bg-primary-700 text-white drop-shadow-sm ml-8'
              : 'rounded-bl-lg bg-contrast-surface text-contrast-medium mr-8 border border-contrast',
            'rounded-[12px]'
          )}
        >
          {/* Message content */}
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </div>

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
          
          {/* Plants analyzed indicator for AI messages */}
          {!isUser && message.context?.plantsAnalyzed && message.context.plantsAnalyzed.length > 0 && (
            <motion.div 
              className="mt-2 flex items-center gap-1 text-xs opacity-70"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              transition={{ delay: 0.5 }}
            >
              <Eye size={12} />
              <span>Analizó {message.context.plantsAnalyzed.length} planta(s)</span>
            </motion.div>
          )}
          
          {/* Timestamp */}
          <div className={cn(
            "mt-2 text-xs",
            isUser ? "text-primary-foreground/70" : "text-muted-foreground/70",
            'text-[#888] text-[12px]'
          )}>
            {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true, locale: es })}
          </div>
        </div>
      </div>

      {isUser && (
        <motion.div 
          className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <User size={16} className="text-primary" />
        </motion.div>
      )}
    </motion.div>
  );
};

export default GardenMessageBubble; 