import React from 'react';
import MessageBubble from './MessageBubble';
import { ChatMessage } from '../../schemas';

interface MessageListProps {
  messages: ChatMessage[];
  plantNickname?: string;
}

const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <MessageBubble 
          key={message.id} 
          message={message} 
          isUser={message.sender === 'user'} 
        />
      ))}
    </div>
  );
};

export default MessageList;
