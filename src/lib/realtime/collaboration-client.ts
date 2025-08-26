import { io, Socket } from 'socket.io-client';
import { EventEmitter } from 'events';

export interface UserPresence {
  userId: string;
  username: string;
  color: string;
  cursor?: { x: number; y: number };
  selectedColor?: string;
  status: 'active' | 'idle' | 'away';
  lastSeen: Date;
}

export interface PaletteOperation {
  type: 'ADD_COLOR' | 'UPDATE_COLOR' | 'REMOVE_COLOR' | 'UPDATE_METADATA';
  data: any;
  timestamp: number;
  userId: string;
}

export interface CollaborationState {
  palette: any;
  users: UserPresence[];
  pendingOperations: PaletteOperation[];
  localVersion: number;
  serverVersion: number;
}

export class CollaborationClient extends EventEmitter {
  private socket: Socket | null = null;
  private state: CollaborationState;
  private currentPaletteId: string | null = null;
  private userId: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private operationQueue: PaletteOperation[] = [];
  private cursorUpdateThrottle: NodeJS.Timeout | null = null;

  constructor(userId: string, token: string) {
    super();
    this.userId = userId;
    this.state = {
      palette: null,
      users: [],
      pendingOperations: [],
      localVersion: 0,
      serverVersion: 0
    };

    this.connect(token);
  }

  private connect(token: string) {
    const serverUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
    
    this.socket = io(serverUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('Connected to collaboration server');
      this.reconnectAttempts = 0;
      this.emit('connected');
      
      // Rejoin palette if previously connected
      if (this.currentPaletteId) {
        this.joinPalette(this.currentPaletteId);
      }

      // Process queued operations
      this.processOperationQueue();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected:', reason);
      this.emit('disconnected', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.emit('connection_failed');
      }
    });

    // Palette events
    this.socket.on('palette:state', (data) => {
      this.state.palette = data.palette;
      this.state.users = data.users;
      this.state.serverVersion = data.version || 0;
      this.emit('palette_loaded', data);
    });

    this.socket.on('palette:updated', (data: PaletteOperation) => {
      this.handleRemoteOperation(data);
    });

    // User presence events
    this.socket.on('user:joined', (data) => {
      this.state.users = data.users;
      this.emit('user_joined', data.user);
    });

    this.socket.on('user:left', (data) => {
      this.state.users = data.users;
      this.emit('user_left', data.userId);
    });

    this.socket.on('cursor:update', (data) => {
      this.emit('cursor_moved', data);
    });

    this.socket.on('color:selected', (data) => {
      this.emit('color_selected', data);
    });

    this.socket.on('user:typing', (data) => {
      this.emit('user_typing', data);
    });

    this.socket.on('user:stopped-typing', (data) => {
      this.emit('user_stopped_typing', data);
    });

    // Comment events
    this.socket.on('comment:added', (comment) => {
      this.emit('comment_added', comment);
    });

    // Notification events
    this.socket.on('notification', (notification) => {
      this.emit('notification', notification);
    });

    // Error handling
    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this.emit('error', error);
    });
  }

  public joinPalette(paletteId: string) {
    if (!this.socket?.connected) {
      console.warn('Socket not connected, queueing join request');
      return;
    }

    this.currentPaletteId = paletteId;
    this.socket.emit('join:palette', { paletteId });
  }

  public leavePalette() {
    if (this.currentPaletteId && this.socket?.connected) {
      // Socket.io will handle leaving the room on disconnect
      this.currentPaletteId = null;
      this.state = {
        palette: null,
        users: [],
        pendingOperations: [],
        localVersion: 0,
        serverVersion: 0
      };
    }
  }

  public updateCursor(x: number, y: number) {
    if (!this.socket?.connected || !this.currentPaletteId) return;

    // Throttle cursor updates to reduce network traffic
    if (this.cursorUpdateThrottle) {
      clearTimeout(this.cursorUpdateThrottle);
    }

    this.cursorUpdateThrottle = setTimeout(() => {
      this.socket!.emit('cursor:move', {
        x,
        y,
        paletteId: this.currentPaletteId
      });
    }, 50); // Send cursor updates at most every 50ms
  }

  public selectColor(color: string) {
    if (!this.socket?.connected || !this.currentPaletteId) return;

    this.socket.emit('color:select', {
      color,
      paletteId: this.currentPaletteId
    });
  }

  public applyOperation(operation: Omit<PaletteOperation, 'timestamp' | 'userId'>) {
    const fullOperation: PaletteOperation = {
      ...operation,
      timestamp: Date.now(),
      userId: this.userId
    };

    // Apply locally first (optimistic update)
    this.applyLocalOperation(fullOperation);

    // Send to server
    if (this.socket?.connected && this.currentPaletteId) {
      this.socket.emit('palette:update', {
        paletteId: this.currentPaletteId,
        operation: fullOperation,
        timestamp: fullOperation.timestamp
      });
    } else {
      // Queue operation if disconnected
      this.operationQueue.push(fullOperation);
    }
  }

  private applyLocalOperation(operation: PaletteOperation) {
    // Apply operation to local state
    switch (operation.type) {
      case 'ADD_COLOR':
        if (this.state.palette) {
          this.state.palette.colors = [
            ...this.state.palette.colors,
            operation.data
          ];
        }
        break;
      case 'UPDATE_COLOR':
        if (this.state.palette) {
          this.state.palette.colors = this.state.palette.colors.map((c: any) =>
            c.id === operation.data.id ? { ...c, ...operation.data } : c
          );
        }
        break;
      case 'REMOVE_COLOR':
        if (this.state.palette) {
          this.state.palette.colors = this.state.palette.colors.filter(
            (c: any) => c.id !== operation.data.id
          );
        }
        break;
      case 'UPDATE_METADATA':
        if (this.state.palette) {
          this.state.palette = { ...this.state.palette, ...operation.data };
        }
        break;
    }

    this.state.localVersion++;
    this.state.pendingOperations.push(operation);
    this.emit('state_changed', this.state);
  }

  private handleRemoteOperation(operation: PaletteOperation) {
    // Check if this is our own operation echoed back
    const isPending = this.state.pendingOperations.some(
      op => op.timestamp === operation.timestamp && op.userId === operation.userId
    );

    if (isPending) {
      // Remove from pending operations
      this.state.pendingOperations = this.state.pendingOperations.filter(
        op => !(op.timestamp === operation.timestamp && op.userId === operation.userId)
      );
    } else {
      // Apply remote operation
      this.applyLocalOperation(operation);
    }

    this.state.serverVersion++;
    this.emit('state_changed', this.state);
  }

  private processOperationQueue() {
    if (!this.socket?.connected || !this.currentPaletteId) return;

    while (this.operationQueue.length > 0) {
      const operation = this.operationQueue.shift()!;
      this.socket.emit('palette:update', {
        paletteId: this.currentPaletteId,
        operation,
        timestamp: operation.timestamp
      });
    }
  }

  public addComment(text: string, colorId?: string) {
    if (!this.socket?.connected || !this.currentPaletteId) return;

    this.socket.emit('comment:add', {
      paletteId: this.currentPaletteId,
      colorId,
      text
    });
  }

  public mentionUser(userId: string, message: string) {
    if (!this.socket?.connected || !this.currentPaletteId) return;

    this.socket.emit('mention:user', {
      userId,
      paletteId: this.currentPaletteId,
      message
    });
  }

  public startTyping() {
    if (!this.socket?.connected || !this.currentPaletteId) return;

    this.socket.emit('typing:start', {
      paletteId: this.currentPaletteId
    });
  }

  public stopTyping() {
    if (!this.socket?.connected || !this.currentPaletteId) return;

    this.socket.emit('typing:stop', {
      paletteId: this.currentPaletteId
    });
  }

  public getState(): CollaborationState {
    return { ...this.state };
  }

  public getUsers(): UserPresence[] {
    return [...this.state.users];
  }

  public isConnected(): boolean {
    return this.socket?.connected || false;
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

// Singleton instance management
let collaborationInstance: CollaborationClient | null = null;

export function initializeCollaboration(userId: string, token: string): CollaborationClient {
  if (!collaborationInstance) {
    collaborationInstance = new CollaborationClient(userId, token);
  }
  return collaborationInstance;
}

export function getCollaborationClient(): CollaborationClient | null {
  return collaborationInstance;
}

export function cleanupCollaboration() {
  if (collaborationInstance) {
    collaborationInstance.disconnect();
    collaborationInstance = null;
  }
}