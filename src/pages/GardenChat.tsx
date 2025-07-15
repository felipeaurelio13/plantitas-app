import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, RefreshCw, Sprout } from 'lucide-react';
import { useGardenChat } from '../hooks/useGardenChat';
import { 
  GardenChatHeader, 
  GardenMessageBubble, 
  GardenChatInput 
} from '../components/GardenChat';
import TypingIndicator from '../components/Chat/TypingIndicator';
import { Button } from '../components/ui/Button';

const GardenChat: React.FC = () => {
  const {
    messages,
    isLoading,
    isTyping,
    error,
    gardenSummary,
    suggestedQuestions,
    sendMessage,
    clearMessages,
    retryLastMessage,
    refreshGardenData,
    cacheStats,
  } = useGardenChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Loading state
  if (isLoading && messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center space-y-4"
        >
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Sprout className="w-12 h-12 text-green-500 mx-auto" />
            </motion.div>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="absolute inset-0 w-12 h-12 bg-green-500/20 rounded-full mx-auto"
            />
          </div>
          <div>
            <p className="text-lg font-medium">Analizando tu jardín...</p>
            <p className="text-sm text-muted-foreground mt-1">
              Preparando el contexto de todas tus plantas
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Error state
  if (error && messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center space-y-4 max-w-md"
        >
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <div>
            <p className="text-lg font-medium">Error al cargar el chat</p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
          <Button
            onClick={() => window.location.reload()}
            className="gap-2"
            variant="outline"
          >
            <RefreshCw size={16} />
            Intentar de nuevo
          </Button>
        </motion.div>
      </div>
    );
  }

  // Empty garden state
  if (gardenSummary?.totalPlants === 0) {
    return (
      <div className="flex flex-col h-screen bg-background text-foreground">
        <GardenChatHeader gardenSummary={gardenSummary} />
        
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Sprout className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              Tu jardín está vacío
            </h2>
            <p className="text-muted-foreground max-w-sm">
              Agrega algunas plantas a tu jardín para poder chatear conmigo sobre su cuidado y salud.
            </p>
          </motion.div>
          
          <Button
            onClick={() => window.location.href = '/camera'}
            className="mt-6"
          >
            Agregar mi primera planta
          </Button>
        </div>
      </div>
    );
  }

      return (
      <div className="flex flex-col h-screen bg-background text-foreground">
        <GardenChatHeader 
          gardenSummary={gardenSummary} 
          onClearChat={clearMessages}
          onRefresh={refreshGardenData}
          isRefreshing={isLoading && messages.length > 0}
        />

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4 max-w-4xl mx-auto">
          <AnimatePresence>
            {messages.map((message) => (
              <GardenMessageBubble key={message.id} message={message} />
            ))}
          </AnimatePresence>

          {/* Typing Indicator */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <TypingIndicator />
            </motion.div>
          )}

          {/* Error Message with Retry */}
          {error && messages.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center"
            >
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 max-w-sm">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-300 text-sm">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
                <Button
                  onClick={retryLastMessage}
                  size="sm"
                  variant="outline"
                  className="mt-2 w-full"
                >
                  <RefreshCw size={14} className="mr-1" />
                  Reintentar
                </Button>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Cache stats for development */}
        {process.env.NODE_ENV === 'development' && cacheStats && (
          <div className="fixed bottom-20 right-4 p-2 bg-muted/80 backdrop-blur-sm rounded-lg text-xs text-muted-foreground">
            <div>Cache: {cacheStats.validEntries}/{cacheStats.userEntries} válidas</div>
            {cacheStats.expiredEntries > 0 && (
              <div className="text-orange-500">{cacheStats.expiredEntries} expiradas</div>
            )}
          </div>
        )}
      </div>

      {/* Input Area */}
      <GardenChatInput
        onSendMessage={sendMessage}
        isTyping={isTyping}
        suggestedQuestions={suggestedQuestions}
        isLoading={isLoading}
      />
    </div>
  );
};

export default GardenChat; 