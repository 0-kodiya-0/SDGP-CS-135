import React from 'react';
import { Star, AlertCircle, Trash } from 'lucide-react';
import { ParsedEmail } from '../types/types.google.api';
import { formatEmailDate } from '../utils/utils.google.api';

interface EmailListItemProps {
  email: ParsedEmail;
  isSelected: boolean;
  onClick: () => void;
  onTrash: () => void;
  onToggleStarred: () => void;
  onToggleImportant: () => void;
}

const EmailListItem: React.FC<EmailListItemProps> = ({
  email,
  isSelected,
  onClick,
  onTrash,
  onToggleStarred,
  onToggleImportant
}) => {
  // Prevent event propagation for action buttons
  const handleActionClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  return (
    <div 
      className={`
        flex items-center px-2 py-2 border-b border-gray-200 hover:bg-gray-50 cursor-pointer
        ${isSelected ? 'bg-blue-50' : ''}
        ${email.isUnread ? 'font-semibold' : ''}
      `}
      onClick={onClick}
    >
      {/* Email action icons in a compact row */}
      <div className="flex items-center space-x-1 mr-2">
        <button 
          className="p-0.5 rounded-full hover:bg-gray-200"
          onClick={(e) => handleActionClick(e, onToggleStarred)}
          title={email.isStarred ? "Unstar" : "Star"}
        >
          <Star 
            className={`w-3.5 h-3.5 ${email.isStarred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} 
          />
        </button>
        
        <button 
          className="p-0.5 rounded-full hover:bg-gray-200"
          onClick={(e) => handleActionClick(e, onToggleImportant)}
          title={email.isImportant ? "Mark not important" : "Mark important"}
        >
          <AlertCircle 
            className={`w-3.5 h-3.5 ${email.isImportant ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} 
          />
        </button>
      </div>
      
      {/* Compact email content with two-line layout */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          {/* First line: Sender and date */}
          <div className="text-xs font-medium truncate mr-2">
            {email.from?.name || email.from?.email || 'Unknown Sender'}
          </div>
          <div className="text-xs text-gray-500 flex-shrink-0 whitespace-nowrap">
            {email.date ? formatEmailDate(email.date) : ''}
          </div>
        </div>
        
        {/* Second line: Subject and preview */}
        <div className="flex items-baseline">
          <div className="text-xs truncate mr-1.5 max-w-[30%]">
            <span className={email.isUnread ? 'font-medium' : ''}>
              {email.subject || 'No Subject'}
            </span>
          </div>
          <div className="text-xs text-gray-500 truncate">
            - {email.body?.text?.substring(0, 30) || email.snippet?.substring(0, 30) || ''}
          </div>
        </div>
      </div>
      
      {/* Delete action */}
      <button 
        className="ml-2 p-0.5 rounded-full hover:bg-gray-200 text-gray-400 hover:text-red-500"
        onClick={(e) => handleActionClick(e, onTrash)}
        title="Move to trash"
      >
        <Trash className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export default EmailListItem;