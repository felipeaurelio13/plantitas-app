import React, { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useChat } from '../hooks/useChat';
import { usePlantDetail } from '../hooks/usePlantDetail'; // Import the hook
import ChatHeader from '../components/Chat/ChatHeader';
import MessageList from '../components/Chat/MessageList';
import ChatInput from '../components/Chat/ChatInput';
import TypingIndicator from '../components/Chat/TypingIndicator';
import EmptyChat from '../components/Chat/EmptyChat';
import { AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const Chat: React.FC = () => {
  const { plantId } = useParams<{ plantId: string }>();
  
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
      <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground">
        <Loader2 className="w-12 h-12 animate-spin text-green-500" />
        <p className="mt-4 text-lg">Cargando chat...</p>
      </div>
    );
  }

  if (error) {
    return (
       <div className="flex flex-col items-center justify-center h-screen bg-background text-red-500">
        <p className="mb-4">Error: {error}</p>
        <button onClick={() => window.history.back()} className="btn btn-primary">
          Volver
        </button>
      </div>
    );
  }

  if (!plant) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground">
        <p className="mb-4">Planta no encontrada.</p>
        <button onClick={() => window.history.back()} className="btn btn-primary">
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <ChatHeader plant={plant} />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {plant.chatHistory.length === 0 ? (
            <EmptyChat plantName={plant.nickname || plant.name} />
          ) : (
            <MessageList
              messages={plant.chatHistory}
              plantNickname={plant.nickname || plant.name}
            />
          )}
        </AnimatePresence>
        
        {isTyping && <TypingIndicator />}
        
        <div ref={messagesEndRef} />
      </div>

      <ChatInput
        onSendMessage={handleSendMessage}
        isTyping={isTyping}
      />
    </div>
  );
};

export default Chat;