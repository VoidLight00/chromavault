import { useEffect, useRef, useState, useCallback } from 'react';
import { WebSocketClient, RealtimeUser, CRDTOperation, RealtimeState } from '../lib/realtime/websocket-client';
import { useAuthStore } from '../lib/stores/auth-store';

export interface CollaborationOptions {
  serverUrl?: string;
  autoConnect?: boolean;
  enableCursors?: boolean;
  enableNotifications?: boolean;
}

export interface CollaborationHook {
  // Connection state
  isConnected: boolean;
  isAuthenticated: boolean;
  connectionError: string | null;
  
  // Room management
  currentRoom: string | undefined;
  joinRoom: (roomId: string, roomType?: 'palette' | 'user') => Promise<void>;
  leaveRoom: () => void;
  
  // Users and cursors
  activeUsers: RealtimeUser[];
  updateCursor: (x: number, y: number) => void;
  
  // CRDT operations
  sendOperation: (operation: Omit<CRDTOperation, 'id' | 'vectorClock' | 'timestamp' | 'nodeId'>) => void;
  currentState: any;
  vectorClock: { [nodeId: string]: number };
  
  // Palette collaboration
  updatePalette: (colors: any[], metadata?: any) => void;
  
  // Comments and communication
  sendComment: (comment: string, position?: { x: number; y: number }) => void;
  startTyping: () => void;
  stopTyping: () => void;
  typingUsers: Set<string>;
  
  // Notifications
  notifications: any[];
  clearNotification: (id: string) => void;
  
  // Manual sync
  requestSync: (vectorClock?: { [nodeId: string]: number }) => void;
  
  // Cleanup
  disconnect: () => void;
}

export function useCollaboration(options: CollaborationOptions = {}): CollaborationHook {
  const {
    serverUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:5000',
    autoConnect = true,
    enableCursors = true,
    enableNotifications = true
  } = options;

  const { user, token } = useAuthStore();
  const clientRef = useRef<WebSocketClient | null>(null);
  
  // State
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [currentRoom, setCurrentRoom] = useState<string | undefined>();
  const [activeUsers, setActiveUsers] = useState<RealtimeUser[]>([]);
  const [currentState, setCurrentState] = useState<any>({});
  const [vectorClock, setVectorClock] = useState<{ [nodeId: string]: number }>({});
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [notifications, setNotifications] = useState<any[]>([]);

  // Typing timeout ref
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize WebSocket client
  useEffect(() => {
    if (!autoConnect || !user || !token) return;

    try {
      clientRef.current = new WebSocketClient(serverUrl);
      
      // Connection events
      clientRef.current.on('connected', () => {
        setIsConnected(true);
        setConnectionError(null);
      });

      clientRef.current.on('disconnected', () => {
        setIsConnected(false);
        setIsAuthenticated(false);
      });

      clientRef.current.on('connection_failed', (error: any) => {
        setConnectionError(error.message || 'Connection failed');
      });

      clientRef.current.on('reconnecting', (attempt: number) => {
        setConnectionError(`Reconnecting... (attempt ${attempt})`);
      });

      // Authentication events
      clientRef.current.on('authenticated', () => {
        setIsAuthenticated(true);
        setConnectionError(null);
      });

      clientRef.current.on('auth_error', (error: string) => {
        setConnectionError(error);
      });

      // Room events
      clientRef.current.on('room_state', (data: {
        roomId: string;
        state: any;
        vectorClock: { [nodeId: string]: number };
        users: RealtimeUser[];
      }) => {
        setCurrentState(data.state);
        setVectorClock(data.vectorClock);
        setActiveUsers(data.users);
      });

      clientRef.current.on('state_updated', (data: {
        roomId: string;
        state: any;
        operation: CRDTOperation;
      }) => {
        setCurrentState(data.state);
      });

      clientRef.current.on('user_joined', (data: { user: RealtimeUser }) => {
        setActiveUsers(prev => {
          const existing = prev.find(u => u.id === data.user.id);
          if (existing) {
            return prev.map(u => u.id === data.user.id ? data.user : u);
          }
          return [...prev, data.user];
        });
      });

      clientRef.current.on('user_left', (data: { userId: string }) => {
        setActiveUsers(prev => prev.filter(u => u.id !== data.userId));
      });

      clientRef.current.on('active_users', (data: { users: RealtimeUser[] }) => {
        setActiveUsers(data.users);
      });

      // CRDT events
      clientRef.current.on('crdt_operation', (data: {
        operation: CRDTOperation;
        userId: string;
      }) => {
        // Handle incoming CRDT operations
        console.log('Received CRDT operation:', data.operation);
      });

      clientRef.current.on('sync_operations', (data: {
        operations: CRDTOperation[];
        currentVectorClock: { [nodeId: string]: number };
      }) => {
        setVectorClock(data.currentVectorClock);
        // Apply operations in order
        console.log('Received sync operations:', data.operations);
      });

      clientRef.current.on('full_sync', (data: {
        state: any;
        vectorClock: { [nodeId: string]: number };
      }) => {
        setCurrentState(data.state);
        setVectorClock(data.vectorClock);
      });

      // Cursor events
      if (enableCursors) {
        clientRef.current.on('cursor_moved', (data: {
          userId: string;
          x: number;
          y: number;
          color: string;
        }) => {
          setActiveUsers(prev => prev.map(u => 
            u.id === data.userId 
              ? { ...u, cursor: { x: data.x, y: data.y, color: data.color } }
              : u
          ));
        });
      }

      // Typing events
      clientRef.current.on('user_typing', (data: { userId: string; typing: boolean }) => {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          if (data.typing) {
            newSet.add(data.userId);
          } else {
            newSet.delete(data.userId);
          }
          return newSet;
        });
      });

      // Comment events
      clientRef.current.on('new_comment', (data: {
        comment: any;
      }) => {
        console.log('New comment received:', data.comment);
      });

      // Notification events
      if (enableNotifications) {
        clientRef.current.on('notification', (notification: any) => {
          setNotifications(prev => [notification, ...prev]);
        });
      }

      // Error events
      clientRef.current.on('error', (error: any) => {
        setConnectionError(error.message || 'WebSocket error');
      });

      // Authenticate
      clientRef.current.authenticate(token);

    } catch (error) {
      setConnectionError('Failed to initialize WebSocket client');
    }

    return () => {
      if (clientRef.current) {
        clientRef.current.disconnect();
        clientRef.current = null;
      }
    };
  }, [user, token, serverUrl, autoConnect, enableCursors, enableNotifications]);

  // Room management
  const joinRoom = useCallback(async (roomId: string, roomType: 'palette' | 'user' = 'palette'): Promise<void> => {
    if (!clientRef.current) {
      throw new Error('WebSocket client not initialized');
    }

    try {
      clientRef.current.joinRoom(roomId, roomType);
      setCurrentRoom(roomId);
    } catch (error) {
      throw new Error(`Failed to join room: ${error}`);
    }
  }, []);

  const leaveRoom = useCallback((): void => {
    if (clientRef.current) {
      clientRef.current.leaveRoom();
    }
    setCurrentRoom(undefined);
    setActiveUsers([]);
    setCurrentState({});
    setVectorClock({});
  }, []);

  // Cursor management
  const updateCursor = useCallback((x: number, y: number): void => {
    if (!enableCursors || !clientRef.current) return;
    
    try {
      clientRef.current.updateCursor(x, y);
    } catch (error) {
      console.warn('Failed to update cursor:', error);
    }
  }, [enableCursors]);

  // CRDT operations
  const sendOperation = useCallback((operation: Omit<CRDTOperation, 'id' | 'vectorClock' | 'timestamp' | 'nodeId'>): void => {
    if (!clientRef.current) {
      throw new Error('WebSocket client not initialized');
    }

    try {
      clientRef.current.sendCRDTOperation(operation);
    } catch (error) {
      throw new Error(`Failed to send operation: ${error}`);
    }
  }, []);

  // Palette updates
  const updatePalette = useCallback((colors: any[], metadata?: any): void => {
    if (!clientRef.current) {
      throw new Error('WebSocket client not initialized');
    }

    try {
      clientRef.current.updatePalette(colors, metadata);
    } catch (error) {
      throw new Error(`Failed to update palette: ${error}`);
    }
  }, []);

  // Comments
  const sendComment = useCallback((comment: string, position?: { x: number; y: number }): void => {
    if (!clientRef.current) {
      throw new Error('WebSocket client not initialized');
    }

    try {
      clientRef.current.sendComment(comment, position);
    } catch (error) {
      throw new Error(`Failed to send comment: ${error}`);
    }
  }, []);

  // Typing indicators
  const startTyping = useCallback((): void => {
    if (!clientRef.current) return;

    try {
      clientRef.current.startTyping();
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Auto-stop typing after 3 seconds
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping();
      }, 3000);
    } catch (error) {
      console.warn('Failed to start typing indicator:', error);
    }
  }, []);

  const stopTyping = useCallback((): void => {
    if (!clientRef.current) return;

    try {
      clientRef.current.stopTyping();
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    } catch (error) {
      console.warn('Failed to stop typing indicator:', error);
    }
  }, []);

  // Notifications
  const clearNotification = useCallback((id: string): void => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Manual sync
  const requestSync = useCallback((vectorClockParam?: { [nodeId: string]: number }): void => {
    if (!clientRef.current) return;

    try {
      clientRef.current.requestSync(vectorClockParam);
    } catch (error) {
      console.warn('Failed to request sync:', error);
    }
  }, []);

  // Disconnect
  const disconnect = useCallback((): void => {
    if (clientRef.current) {
      clientRef.current.disconnect();
      clientRef.current = null;
    }
    
    // Reset state
    setIsConnected(false);
    setIsAuthenticated(false);
    setConnectionError(null);
    setCurrentRoom(undefined);
    setActiveUsers([]);
    setCurrentState({});
    setVectorClock({});
    setTypingUsers(new Set());
    setNotifications([]);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      disconnect();
    };
  }, [disconnect]);

  return {
    // Connection state
    isConnected,
    isAuthenticated,
    connectionError,
    
    // Room management
    currentRoom,
    joinRoom,
    leaveRoom,
    
    // Users and cursors
    activeUsers,
    updateCursor,
    
    // CRDT operations
    sendOperation,
    currentState,
    vectorClock,
    
    // Palette collaboration
    updatePalette,
    
    // Comments and communication
    sendComment,
    startTyping,
    stopTyping,
    typingUsers,
    
    // Notifications
    notifications,
    clearNotification,
    
    // Manual sync
    requestSync,
    
    // Cleanup
    disconnect
  };
}