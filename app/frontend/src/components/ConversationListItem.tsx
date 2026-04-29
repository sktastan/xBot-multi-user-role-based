//===========================================================
//  
//  ConversationListItem.tsx
//  Item component for the sidebar conversation history list.
//  
//============================================================
import React from 'react';
import { formatTimestamp } from './formatDate';

// ---------------------------------------------------------------------
//   Props for a conversation list item.
// -------------------------------------------------------------------
interface ConversationListItemProps {
  userMessage: string;
  createdAt: string;
  isActive: boolean;
  onClick: () => void;
}

// ---------------------------------------------------------------------
//   Individual entry in the conversation history list.
// -------------------------------------------------------------------
const ConversationListItem: React.FC<ConversationListItemProps> = ({ 
  userMessage, 
  createdAt, 
  isActive, 
  onClick 
}) => {
  return (
    <div 
      onClick={onClick}
      className={`p-3 cursor-pointer border-b border-gray-100 hover:bg-gray-50 transition-colors flex flex-col ${
        isActive ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'bg-white'
      }`}
    >
      <p className="text-sm text-gray-700 truncate font-medium mb-1">
        {userMessage}
      </p>
      <div className="flex justify-end">
        <span className="text-[10px] font-medium text-gray-400 uppercase tracking-tighter">
          {formatTimestamp(createdAt)}
        </span>
      </div>
    </div>
  );
};

export default ConversationListItem;