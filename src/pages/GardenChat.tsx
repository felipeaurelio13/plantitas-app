import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, RefreshCw, MessageCircle, Sprout } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGardenChat } from '../hooks/useGardenChat';
import { usePlantStore } from '../stores';
import { 
  GardenChatHeader, 
  GardenMessageBubble, 
  GardenChatInput 
} from '../components/GardenChat';
import TypingIndicator from '../components/Chat/TypingIndicator';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Card, CardContent } from '../components/ui/Card';
import { navigation } from '../lib/navigation';

const GardenChat: React.FC = () => {
  const navigate = useNavigate();
  const plants = usePlantStore((state) => state.plants);
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

  // Error state
  if (error && !gardenSummary) {
    return (
      <div className="flex flex-col h-screen bg-background text-foreground">
        <GardenChatHeader gardenSummary={gardenSummary} />
        
        <div className="flex-1 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md"
          >
            <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error de conexión</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            
            <Button onClick={refreshGardenData} variant="primary">
              <RefreshCw className="w-4 h-4 mr-2" />
              Reintentar
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Empty garden state
  if (gardenSummary?.totalPlants === 0) {
    return (
      <div className="flex flex-col h-screen bg-background text-foreground">
        <GardenChatHeader gardenSummary={gardenSummary} />
        
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            illustration="plants"
            title="Tu jardín está vacío"
            description="Agrega algunas plantas a tu jardín para poder chatear conmigo sobre su cuidado y salud."
            action={{
              label: "Agregar mi primera planta",
              onClick: () => navigate(navigation.toCamera())
            }}
          />
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

      {/* Quick access to plant chats - shown when no messages yet */}
      {messages.length === 0 && plants.length > 0 && (
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
          <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
            Chats individuales con tus plantas:
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {plants.slice(0, 4).map((plant) => (
              <Card
                key={plant.id}
                variant="glass"
                size="sm"
                interactive
                className="cursor-pointer hover:border-primary-300 dark:hover:border-primary-600"
                onClick={() => navigate(navigation.toPlantChat(plant.id))}
              >
                <CardContent className="p-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                      <Sprout className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {plant.nickname || plant.name}
                      </p>
                      <p className="text-xs text-neutral-500 truncate">
                        {plant.species}
                      </p>
                    </div>
                    <MessageCircle className="w-4 h-4 text-neutral-400" />
                  </div>
                </CardContent>
              </Card>
            ))}
            {plants.length > 4 && (
              <Card
                variant="outline"
                size="sm"
                interactive
                className="cursor-pointer"
                onClick={() => navigate(navigation.toDashboard())}
              >
                <CardContent className="p-3 flex items-center justify-center">
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">
                    +{plants.length - 4} más
                  </span>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: 'calc(88px + env(safe-area-inset-bottom))' }}>
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