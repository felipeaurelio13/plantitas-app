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

  const handleSendMessage = async (message: string) => {
    await sendMessage(message);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header optimizado */}
      <GardenChatHeader 
        gardenSummary={gardenSummary} 
        onClearChat={clearMessages}
        onRefresh={refreshGardenData}
        isRefreshing={isLoading && messages.length > 0}
      />

      {/* Área de contenido principal */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <div className="min-h-full flex flex-col">
            
            {/* Acceso rápido a chats - solo al inicio */}
            {messages.length === 0 && plants.length > 0 && (
              <div className="px-4 py-4 border-b border-border bg-surface/50">
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">
                    Chats con tus plantas
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {plants.slice(0, 4).map((plant) => (
                      <Card
                        key={plant.id}
                        variant="default"
                        size="sm"
                        interactive
                        className="cursor-pointer hover:border-primary/50 transition-colors"
                        onClick={() => navigate(navigation.toPlantChat(plant.id))}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <Sprout className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate text-foreground">
                                {plant.nickname || plant.name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {plant.species}
                              </p>
                            </div>
                            <MessageCircle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {plants.length > 4 && (
                      <Card
                        variant="outline"
                        size="sm"
                        interactive
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => navigate(navigation.toDashboard())}
                      >
                        <CardContent className="p-3 flex items-center justify-center">
                          <span className="text-sm text-muted-foreground font-medium">
                            +{plants.length - 4} más
                          </span>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Área de mensajes */}
            <div className="flex-1 px-4 py-6">
              <AnimatePresence mode="wait">
                {messages.length === 0 ? (
                  <motion.div
                    key="empty-garden-chat"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="h-full flex items-center justify-center"
                  >
                                         {plants.length === 0 ? (
                       <div className="text-center space-y-4 max-w-md mx-auto">
                         <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                           <span className="text-3xl">🌱</span>
                         </div>
                         <div className="space-y-2">
                           <h3 className="text-lg font-semibold text-foreground">
                             ¡Comienza tu jardín!
                           </h3>
                           <p className="text-muted-foreground">
                             Agrega tu primera planta para comenzar a chatear con tu asistente IA.
                           </p>
                         </div>
                         <Button onClick={() => navigate(navigation.toCamera())} className="mt-4">
                           Agregar primera planta
                         </Button>
                       </div>
                     ) : (
                      <div className="text-center space-y-4 max-w-md mx-auto">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                          <Sprout className="w-8 h-8 text-primary" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-lg font-semibold text-foreground">
                            ¡Hola, jardinero! 🌱
                          </h3>
                          <p className="text-muted-foreground">
                            Soy tu asistente IA. Pregúntame sobre el cuidado de tus {plants.length} plantas, 
                            consejos de jardinería o cualquier duda que tengas.
                          </p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="garden-messages"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                                         <div className="space-y-4">
                       {messages.map((message) => (
                         <GardenMessageBubble key={message.id} message={message} />
                       ))}
                     </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Indicador de escritura */}
              <AnimatePresence>
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-4"
                  >
                                         <TypingIndicator />
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Ancla para scroll */}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>
      </div>

      {/* Input de chat con safe area */}
             <div className="border-t border-border bg-background/95 backdrop-blur-sm">
         <GardenChatInput
           onSendMessage={handleSendMessage}
           isTyping={isTyping}
           suggestedQuestions={suggestedQuestions}
           isLoading={isLoading}
         />
       </div>

      {/* Estadísticas de cache en desarrollo */}
      {process.env.NODE_ENV === 'development' && cacheStats && (
        <div className="fixed bottom-20 right-4 p-2 bg-muted/80 backdrop-blur-sm rounded-lg text-xs text-muted-foreground z-50">
          <div>Cache: {cacheStats.validEntries}/{cacheStats.userEntries} válidas</div>
          {cacheStats.expiredEntries > 0 && (
            <div>Expiradas: {cacheStats.expiredEntries}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default GardenChat; 