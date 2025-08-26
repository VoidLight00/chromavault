'use client';

import { useState } from 'react';
import { RealtimeUser } from '../../lib/realtime/websocket-client';
import { useAuthStore } from '../../lib/stores/auth-store';
import { Users, ChevronDown, ChevronUp, Circle } from 'lucide-react';

interface ActiveUsersProps {
  users: RealtimeUser[];
  typingUsers?: Set<string>;
  maxVisible?: number;
  showAvatars?: boolean;
  showTyping?: boolean;
  className?: string;
}

interface UserAvatarProps {
  user: RealtimeUser;
  size?: 'sm' | 'md' | 'lg';
  showStatus?: boolean;
  isTyping?: boolean;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ 
  user, 
  size = 'md', 
  showStatus = true,
  isTyping = false 
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base'
  };

  const cursorColor = user.cursor?.color || '#6B7280';

  return (
    <div className="relative">
      {user.avatar ? (
        <img
          src={user.avatar}
          alt={user.username}
          className={`${sizeClasses[size]} rounded-full object-cover border-2 transition-all duration-200 ${
            isTyping ? 'animate-pulse border-blue-400' : 'border-white shadow-sm'
          }`}
          style={{ borderColor: showStatus ? cursorColor : undefined }}
        />
      ) : (
        <div
          className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-medium text-white transition-all duration-200 ${
            isTyping ? 'animate-pulse' : ''
          }`}
          style={{ backgroundColor: cursorColor }}
        >
          {user.username.charAt(0).toUpperCase()}
        </div>
      )}
      
      {/* Online status indicator */}
      {showStatus && (
        <div className="absolute -bottom-0.5 -right-0.5">
          <Circle
            className={`w-3 h-3 fill-green-400 text-green-400 ${
              isTyping ? 'fill-blue-400 text-blue-400' : ''
            }`}
          />
        </div>
      )}
    </div>
  );
};

export const ActiveUsers: React.FC<ActiveUsersProps> = ({
  users,
  typingUsers = new Set(),
  maxVisible = 5,
  showAvatars = true,
  showTyping = true,
  className = ''
}) => {
  const { user: currentUser } = useAuthStore();
  const [showAll, setShowAll] = useState(false);

  // Filter out current user
  const otherUsers = users.filter(user => user.id !== currentUser?.id);
  
  if (otherUsers.length === 0) {
    return null;
  }

  const visibleUsers = showAll ? otherUsers : otherUsers.slice(0, maxVisible);
  const hasMore = otherUsers.length > maxVisible;
  const typingUsersList = otherUsers.filter(user => typingUsers.has(user.id));

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-3 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">
            Active ({otherUsers.length})
          </span>
        </div>
        
        {hasMore && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            {showAll ? (
              <>
                Show less <ChevronUp className="w-3 h-3" />
              </>
            ) : (
              <>
                +{otherUsers.length - maxVisible} more <ChevronDown className="w-3 h-3" />
              </>
            )}
          </button>
        )}
      </div>

      {/* User list */}
      <div className="space-y-2">
        {showAvatars ? (
          // Avatar view
          <div className="flex flex-wrap gap-2">
            {visibleUsers.map(user => (
              <div key={user.id} className="group relative">
                <UserAvatar
                  user={user}
                  isTyping={typingUsers.has(user.id)}
                  showStatus={true}
                />
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                  {user.username}
                  {typingUsers.has(user.id) && (
                    <span className="text-blue-300"> (typing...)</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // List view
          <div className="space-y-1">
            {visibleUsers.map(user => (
              <div key={user.id} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-50 transition-colors">
                <UserAvatar
                  user={user}
                  size="sm"
                  isTyping={typingUsers.has(user.id)}
                />
                <span className="text-sm text-gray-700 flex-1 truncate">
                  {user.username}
                </span>
                {typingUsers.has(user.id) && (
                  <span className="text-xs text-blue-500">typing...</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Typing indicators */}
      {showTyping && typingUsersList.length > 0 && (
        <div className="mt-3 pt-2 border-t border-gray-100">
          <div className="text-xs text-gray-500">
            {typingUsersList.length === 1 ? (
              <span>
                <span className="font-medium text-gray-600">
                  {typingUsersList[0].username}
                </span>{' '}
                is typing...
              </span>
            ) : typingUsersList.length === 2 ? (
              <span>
                <span className="font-medium text-gray-600">
                  {typingUsersList[0].username}
                </span>{' '}
                and{' '}
                <span className="font-medium text-gray-600">
                  {typingUsersList[1].username}
                </span>{' '}
                are typing...
              </span>
            ) : (
              <span>
                <span className="font-medium text-gray-600">
                  {typingUsersList[0].username}
                </span>{' '}
                and {typingUsersList.length - 1} others are typing...
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveUsers;