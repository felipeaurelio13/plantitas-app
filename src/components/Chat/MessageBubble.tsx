import React from 'react';
import { ChatMessage } from '../../schemas';

interface MessageBubbleProps {
  message: ChatMessage;
  isUser: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isUser }) => {
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[80%] p-3 rounded-lg ${
        isUser 
          ? 'bg-blue-500 text-white' 
          : 'bg-gray-100 text-gray-800'
      }`}>
        <p>{message.content}</p>
        {message.emotion && (
          <span className="text-xs opacity-75">
            {message.emotion}
          </span>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
