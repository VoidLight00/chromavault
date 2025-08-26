import { io, Socket } from 'socket.io-client';
import { EventEmitter } from 'events';

export interface RealtimeUser {
  id: string;
  username: string;
  avatar?: string;
  cursor?: {
    x: number;
    y: number;
    color: string;
  };
}

export interface CRDTOperation {
  id: string;
  type: 'add' | 'remove' | 'update' | 'move';
  path: string;
  value?: any;
  vectorClock: { [nodeId: string]: number };
  timestamp: number;
  nodeId: string;
  metadata?: any;
}

export interface RealtimeState {
  connected: boolean;
  authenticated: boolean;
  currentRoom?: string;
  activeUsers: RealtimeUser[];
  state: any;
  vectorClock: { [nodeId: string]: number };
}

export class WebSocketClient extends EventEmitter {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private currentRoom?: string;
  private authToken?: string;
  private state: RealtimeState = {
    connected: false,
    authenticated: false,
    activeUsers: [],
    state: {},
    vectorClock: {}
  };

  constructor(serverUrl: string = 'http://localhost:5000') {
    super();
    this.connect(serverUrl);
  }

  private connect(serverUrl: string): void {
    try {
      this.socket = io(serverUrl, {
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        timeout: 20000
      });

      this.setupEventHandlers();
    } catch (error) {
      console.error('Failed to connect to WebSocket server:', error);
      this.emit('error', error);
    }
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('WebSocket connected:', this.socket?.id);
      this.state.connected = true;
      this.reconnectAttempts = 0;
      this.emit('connected');

      // Re-authenticate if we have a token
      if (this.authToken) {
        this.authenticate(this.authToken);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.state.connected = false;
      this.state.authenticated = false;
      this.emit('disconnected', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.emit('connection_failed', error);
      } else {
        this.emit('reconnecting', this.reconnectAttempts);
      }
    });

    // Authentication events
    this.socket.on('authenticated', (data: { userId: string }) => {
      console.log('WebSocket authenticated for user:', data.userId);
      this.state.authenticated = true;
      this.emit('authenticated', data);
    });

    this.socket.on('auth_error', (error: string) => {
      console.error('WebSocket authentication error:', error);
      this.state.authenticated = false;
      this.emit('auth_error', error);
    });

    // Room events
    this.socket.on('room_state', (data: {
      roomId: string;
      state: any;
      vectorClock: { [nodeId: string]: number };
      users: RealtimeUser[];
      timestamp: number;
    }) => {
      this.state.state = data.state;
      this.state.vectorClock = data.vectorClock;
      this.state.activeUsers = data.users;
      this.emit('room_state', data);
    });

    this.socket.on('state_updated', (data: {
      roomId: string;
      state: any;
      operation: CRDTOperation;
      timestamp: number;
    }) => {
      this.state.state = data.state;
      this.emit('state_updated', data);
    });

    this.socket.on('user_joined', (data: {
      user: RealtimeUser;
      roomId: string;
      timestamp: number;
    }) => {
      const existingUserIndex = this.state.activeUsers.findIndex(u => u.id === data.user.id);
      if (existingUserIndex === -1) {
        this.state.activeUsers.push(data.user);
      } else {
        this.state.activeUsers[existingUserIndex] = data.user;
      }
      this.emit('user_joined', data);
    });

    this.socket.on('user_left', (data: {
      userId: string;
      roomId: string;
      timestamp: number;
    }) => {
      this.state.activeUsers = this.state.activeUsers.filter(u => u.id !== data.userId);
      this.emit('user_left', data);
    });

    this.socket.on('active_users', (data: {
      roomId: string;
      users: RealtimeUser[];
    }) => {
      this.state.activeUsers = data.users;
      this.emit('active_users', data);
    });

    // CRDT events
    this.socket.on('crdt_operation', (data: {
      roomId: string;
      operation: CRDTOperation;
      userId: string;
      timestamp: number;
    }) => {
      this.emit('crdt_operation', data);
    });

    this.socket.on('sync_operations', (data: {
      roomId: string;
      operations: CRDTOperation[];
      currentVectorClock: { [nodeId: string]: number };
      timestamp: number;
    }) => {
      this.state.vectorClock = data.currentVectorClock;
      this.emit('sync_operations', data);
    });

    this.socket.on('full_sync', (data: {
      roomId: string;
      state: any;
      vectorClock: { [nodeId: string]: number };
      timestamp: number;
    }) => {
      this.state.state = data.state;
      this.state.vectorClock = data.vectorClock;
      this.emit('full_sync', data);
    });

    // Cursor events
    this.socket.on('cursor_moved', (data: {
      userId: string;
      x: number;
      y: number;
      color: string;
      timestamp: number;
    }) => {
      const user = this.state.activeUsers.find(u => u.id === data.userId);
      if (user) {
        user.cursor = { x: data.x, y: data.y, color: data.color };
      }
      this.emit('cursor_moved', data);
    });

    // Typing indicators
    this.socket.on('user_typing', (data: {
      userId: string;
      typing: boolean;
    }) => {
      this.emit('user_typing', data);
    });

    // Comments and feedback
    this.socket.on('new_comment', (data: {
      roomId: string;
      comment: any;
      timestamp: number;
    }) => {
      this.emit('new_comment', data);
    });

    // Notifications
    this.socket.on('notification', (notification: any) => {
      this.emit('notification', notification);
    });

    // Error handling
    this.socket.on('error', (error: any) => {
      console.error('WebSocket error:', error);
      this.emit('error', error);
    });
  }

  // Public API methods
  public authenticate(token: string): void {
    this.authToken = token;
    if (this.socket?.connected) {
      this.socket.emit('authenticate', token);
    }
  }

  public joinRoom(roomId: string, roomType: 'palette' | 'user' = 'palette'): void {
    if (!this.socket?.connected || !this.state.authenticated) {
      throw new Error('WebSocket not connected or not authenticated');
    }

    this.currentRoom = roomId;
    this.socket.emit('join_room', { roomId, roomType });
  }

  public leaveRoom(): void {
    if (this.currentRoom && this.socket?.connected) {
      this.socket.emit('leave_room', this.currentRoom);
      this.currentRoom = undefined;
      this.state.activeUsers = [];
    }
  }

  public sendCRDTOperation(operation: Omit<CRDTOperation, 'id' | 'vectorClock' | 'timestamp' | 'nodeId'>): void {
    if (!this.currentRoom || !this.socket?.connected) {
      throw new Error('Not connected to a room');
    }

    this.socket.emit('crdt_operation', {
      roomId: this.currentRoom,
      operation
    });
  }

  public requestSync(vectorClock?: { [nodeId: string]: number }): void {
    if (!this.currentRoom || !this.socket?.connected) {
      throw new Error('Not connected to a room');
    }

    this.socket.emit('request_sync', {
      roomId: this.currentRoom,
      vectorClock
    });
  }

  public updateCursor(x: number, y: number): void {
    if (!this.currentRoom || !this.socket?.connected) {
      return; // Silently ignore cursor updates when not connected
    }

    this.socket.emit('cursor_move', {
      roomId: this.currentRoom,
      x,
      y
    });
  }

  public updatePalette(colors: any[], metadata?: any): void {
    if (!this.currentRoom || !this.socket?.connected) {
      throw new Error('Not connected to a room');
    }

    this.socket.emit('palette_update', {
      paletteId: this.currentRoom,
      colors,
      metadata
    });
  }

  public sendComment(comment: string, position?: { x: number; y: number }): void {
    if (!this.currentRoom || !this.socket?.connected) {
      throw new Error('Not connected to a room');
    }

    this.socket.emit('comment', {
      roomId: this.currentRoom,
      comment,
      position
    });
  }

  public startTyping(): void {
    if (this.currentRoom && this.socket?.connected) {
      this.socket.emit('typing_start', { roomId: this.currentRoom });
    }
  }

  public stopTyping(): void {
    if (this.currentRoom && this.socket?.connected) {
      this.socket.emit('typing_stop', { roomId: this.currentRoom });
    }
  }

  // State getters
  public getState(): RealtimeState {
    return { ...this.state };
  }

  public isConnected(): boolean {
    return this.state.connected;
  }

  public isAuthenticated(): boolean {
    return this.state.authenticated;
  }

  public getCurrentRoom(): string | undefined {
    return this.currentRoom;
  }

  public getActiveUsers(): RealtimeUser[] {
    return [...this.state.activeUsers];
  }

  // Cleanup
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.currentRoom = undefined;
    this.authToken = undefined;
    this.state = {
      connected: false,
      authenticated: false,
      activeUsers: [],
      state: {},
      vectorClock: {}
    };
    this.removeAllListeners();
  }
}