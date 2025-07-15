import React from 'react';
import { ChatMessage } from '../../schemas';
import MessageBubble from './MessageBubble';

interface MessageListProps {
  messages: ChatMessage[];
  plantNickname: string;
}

const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
    </div>
  );
};

export default MessageList; 