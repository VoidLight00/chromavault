'use client';

import { useEffect, useRef } from 'react';
import { RealtimeUser } from '../../lib/realtime/websocket-client';
import { useAuthStore } from '../../lib/stores/auth-store';

interface RealtimeCursorsProps {
  users: RealtimeUser[];
  onCursorMove?: (x: number, y: number) => void;
  containerRef?: React.RefObject<HTMLElement>;
  showUsernames?: boolean;
  className?: string;
}

interface CursorProps {
  user: RealtimeUser;
  showUsername?: boolean;
}

const Cursor: React.FC<CursorProps> = ({ user, showUsername = true }) => {
  if (!user.cursor) return null;

  const { x, y, color } = user.cursor;

  return (
    <div
      className="pointer-events-none absolute z-50 transition-all duration-75 ease-out"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: 'translate(-2px, -2px)'
      }}
    >
      {/* Cursor pointer */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        className="drop-shadow-sm"
      >
        <path
          d="M2 2L18 8L8 12L2 18L2 2Z"
          fill={color}
          stroke="white"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
      
      {/* Username label */}
      {showUsername && (
        <div
          className="ml-4 -mt-1 px-2 py-1 text-xs font-medium text-white rounded-md shadow-lg whitespace-nowrap"
          style={{ backgroundColor: color }}
        >
          {user.username}
        </div>
      )}
    </div>
  );
};

export const RealtimeCursors: React.FC<RealtimeCursorsProps> = ({
  users,
  onCursorMove,
  containerRef,
  showUsernames = true,
  className = ''
}) => {
  const { user: currentUser } = useAuthStore();
  const mouseMoveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCursorUpdateRef = useRef<{ x: number; y: number } | null>(null);

  // Handle mouse movement for current user
  useEffect(() => {
    const container = containerRef?.current;
    if (!container || !onCursorMove) return;

    const handleMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      // Throttle cursor updates to avoid overwhelming the server
      const now = Date.now();
      const lastUpdate = lastCursorUpdateRef.current;
      
      if (!lastUpdate || 
          Math.abs(x - lastUpdate.x) > 5 || 
          Math.abs(y - lastUpdate.y) > 5) {
        
        // Clear existing timeout
        if (mouseMoveTimeoutRef.current) {
          clearTimeout(mouseMoveTimeoutRef.current);
        }

        // Debounce the update
        mouseMoveTimeoutRef.current = setTimeout(() => {
          onCursorMove(x, y);
          lastCursorUpdateRef.current = { x, y };
        }, 16); // ~60fps
      }
    };

    const handleMouseLeave = () => {
      // Send cursor position outside the container
      if (onCursorMove) {
        onCursorMove(-100, -100); // Off-screen position
      }
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      
      if (mouseMoveTimeoutRef.current) {
        clearTimeout(mouseMoveTimeoutRef.current);
      }
    };
  }, [onCursorMove, containerRef]);

  // Filter out current user and users without valid cursor positions
  const otherUsers = users.filter(user => 
    user.id !== currentUser?.id && 
    user.cursor && 
    user.cursor.x >= 0 && 
    user.cursor.y >= 0
  );

  if (otherUsers.length === 0) {
    return null;
  }

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      {otherUsers.map(user => (
        <Cursor
          key={user.id}
          user={user}
          showUsername={showUsernames}
        />
      ))}
    </div>
  );
};

export default RealtimeCursors;