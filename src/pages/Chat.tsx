import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChat } from '../hooks/useChat';
import { usePlantDetail } from '../hooks/usePlantDetail'; // Import the hook
import ChatHeader from '../components/Chat/ChatHeader';
import MessageList from '../components/Chat/MessageList';
import ChatInput from '../components/Chat/ChatInput';
import TypingIndicator from '../components/Chat/TypingIndicator';
import EmptyChat from '../components/Chat/EmptyChat';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';

const Chat: React.FC = () => {
  const { plantId } = useParams<{ plantId: string }>();
  const navigate = useNavigate();
  
  // Use usePlantDetail to ensure the plant data is loaded.
  const { loading: isLoadingDetail, error } = usePlantDetail(plantId);

  const {
    plant,
    isTyping,
    handleSendMessage,
  } = useChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [plant?.chatHistory, isTyping]);
  
  if (isLoadingDetail) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">Preparando chat</h2>
            <p className="text-muted-foreground">Conectando con tu planta...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4 max-w-md"
        >
          <AlertCircle className="w-16 h-16 text-destructive mx-auto" />
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">Error de conexión</h2>
            <p className="text-muted-foreground">{error}</p>
          </div>
          <Button onClick={() => navigate(-1)} className="mt-4">
            Volver
          </Button>
        </motion.div>
      </div>
    );
  }

  if (!plant) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4 max-w-md"
        >
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
            <span className="text-2xl">🌱</span>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">Planta no encontrada</h2>
            <p className="text-muted-foreground">No pudimos encontrar la información de esta planta.</p>
          </div>
          <Button onClick={() => navigate(-1)} className="mt-4">
            Volver al jardín
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header sticky */}
      <ChatHeader plant={plant} />

      {/* Área de mensajes con scroll optimizado */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <div className="min-h-full flex flex-col">
            {/* Contenido de mensajes */}
            <div className="flex-1 px-4 py-6 space-y-4">
              <AnimatePresence mode="wait">
                {plant.chatHistory.length === 0 ? (
                  <motion.div
                    key="empty-chat"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="h-full flex items-center justify-center"
                  >
                    <EmptyChat plantName={plant.nickname || plant.name} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="message-list"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    <MessageList
                      messages={plant.chatHistory}
                      plantNickname={plant.nickname || plant.name}
                    />
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
                  >
                    <TypingIndicator />
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Ancla para scroll automático */}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>
      </div>

      {/* Input de chat con safe area */}
      <div className="border-t border-border bg-background/95 backdrop-blur-sm">
        <ChatInput
          onSendMessage={handleSendMessage}
          isTyping={isTyping}
        />
      </div>
    </div>
  );
};

export default Chat;