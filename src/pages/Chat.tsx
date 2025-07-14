import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, Heart } from 'lucide-react';
import { usePlantStore, useAuthStore } from '../stores';
import { generatePlantResponse } from '../services/aiService';
import { formatDistanceToNow } from 'date-fns';

const Chat: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getPlantById, addChatMessageAsync } = usePlantStore();
  const user = useAuthStore((state) => state.user);
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const plant = id ? getPlantById(id) : null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [plant?.chatHistory]);

  if (!plant) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-600 dark:text-gray-400">Plant not found</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg"
        >
          Go Back
        </button>
      </div>
    );
  }

  const sendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = {
      sender: 'user' as const,
      content: message.trim(),
      timestamp: new Date(),
    };

    if (user) {
      await addChatMessageAsync(plant.id, userMessage, user.id);
    }
    setMessage('');
    setIsTyping(true);

    try {
      const response = await generatePlantResponse(plant, message.trim());
      
      setTimeout(async () => {
        const plantMessage = {
          sender: 'plant' as const,
          content: response.content,
          timestamp: new Date(),
          emotion: response.emotion,
        };
        
        if (user) {
          await addChatMessageAsync(plant.id, plantMessage, user.id);
        }
        setIsTyping(false);
      }, 1000 + Math.random() * 2000); // Simulate thinking time
    } catch (error) {
      console.error('Error generating plant response:', error);
      const errorMessage = {
        sender: 'plant' as const,
        content: "Sorry, I'm feeling a bit under the weather and can't chat right now. Maybe check on my care needs?",
        timestamp: new Date(),
        emotion: 'worried' as const,
      };
      
      setTimeout(async () => {
        if (user) {
          await addChatMessageAsync(plant.id, errorMessage, user.id);
        }
        setIsTyping(false);
      }, 1000);
    }
  };

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

  const getPlantMood = () => {
    const healthFactor = plant.healthScore / 100;
    const careFactor = plant.lastWatered 
      ? Math.max(0, 1 - (Date.now() - plant.lastWatered.getTime()) / (plant.careProfile.wateringFrequency * 24 * 60 * 60 * 1000))
      : 0;
    
    const mood = (healthFactor * 0.6) + (careFactor * 0.4);
    
    if (mood > 0.8) return 'thriving';
    if (mood > 0.6) return 'happy';
    if (mood > 0.4) return 'okay';
    return 'needs attention';
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="glass-effect border-b p-4 safe-area-top">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate(`/plant/${plant.id}`)}
            className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center ios-button"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div className="flex-1">
            <h1 className="font-semibold text-gray-900 dark:text-white">
              {plant.nickname || plant.name}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
              Feeling {getPlantMood()} • {plant.personality.communicationStyle}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="text-2xl">{getEmotionIcon()}</div>
            <div className="flex items-center space-x-1">
              <Heart className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {plant.healthScore}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {plant.chatHistory.length === 0 && (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🌱</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Start a conversation!
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Your {plant.species} is ready to chat. Ask about care, share your day, or just say hello!
            </p>
          </div>
        )}

        <AnimatePresence>
          {plant.chatHistory.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`chat-bubble ${msg.sender === 'user' ? 'chat-user' : 'chat-plant'}`}>
                {msg.sender === 'plant' && (
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-lg">{getEmotionIcon(msg.emotion)}</span>
                    <span className="text-xs opacity-75">
                      {plant.nickname || plant.name}
                    </span>
                  </div>
                )}
                <p className="text-sm">{msg.content}</p>
                <p className="text-xs opacity-75 mt-1">
                  {formatDistanceToNow(msg.timestamp, { addSuffix: true })}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="chat-bubble chat-plant">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-xs opacity-75">
                  {plant.nickname || plant.name} is typing...
                </span>
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="glass-effect border-t p-4 safe-area-bottom">
        <div className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder={`Message ${plant.nickname || plant.name}...`}
              className="w-full px-4 py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={isTyping}
            />
          </div>
          
          <button
            onClick={sendMessage}
            disabled={!message.trim() || isTyping}
            className="w-12 h-12 bg-primary-500 text-white rounded-full flex items-center justify-center ios-button disabled:opacity-50"
          >
            <Send size={20} />
          </button>
        </div>
        
        {/* Quick Actions */}
        <div className="flex items-center space-x-2 mt-3">
          <button
            onClick={() => setMessage("How are you feeling today?")}
            className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm ios-button"
          >
            How are you?
          </button>
          <button
            onClick={() => setMessage("Do you need water?")}
            className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm ios-button"
          >
            Need water?
          </button>
          <button
            onClick={() => setMessage("Tell me about your day")}
            className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm ios-button"
          >
            Your day?
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;