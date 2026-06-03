//===========================================================
//  
//  ChatMessage.tsx
//  Visual component for displaying a single chat message bubble.
//  
//============================================================
import React from 'react';
import { formatTimestamp } from './formatDate';

// ---------------------------------------------------------------------
//   Props for a single chat message.
// -------------------------------------------------------------------
interface ChatMessageProps {
  text: string;
  timestamp: string;
  isUser: boolean;
}

// ---------------------------------------------------------------------
//   Functional component to render a message bubble.
// -------------------------------------------------------------------
const ChatMessage: React.FC<ChatMessageProps> = ({ text, timestamp, isUser }) => {
  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} mb-4 px-4`}>
      <div className={`p-3 rounded-2xl max-w-[80%] ${
        isUser ? 'bg-blue-600 text-white' : 'bg-gray-200 text-black'
      }`}>
        <p className="text-sm leading-relaxed">{text}</p>
      </div>
      <span className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">
        {formatTimestamp(timestamp)}
      </span>
    </div>
  );
};

export default ChatMessage;