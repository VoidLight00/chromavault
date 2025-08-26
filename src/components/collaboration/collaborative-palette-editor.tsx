'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useCollaboration } from '../../hooks/use-collaboration';
import { RealtimeCursors } from './realtime-cursors';
import { ActiveUsers } from './active-users';
import { NotificationCenter } from './notification-center';
import { ColorSwatch } from '../color/color-swatch';
import { Button } from '../ui/button';
import { Palette, Users, MessageSquare, Save, Share, Wifi, WifiOff } from 'lucide-react';

interface Color {
  id: string;
  hex: string;
  name?: string;
  position?: { x: number; y: number };
}

interface CollaborativePaletteEditorProps {
  paletteId: string;
  initialColors?: Color[];
  onColorsChange?: (colors: Color[]) => void;
  onSave?: (colors: Color[]) => Promise<void>;
  readOnly?: boolean;
  className?: string;
}

export const CollaborativePaletteEditor: React.FC<CollaborativePaletteEditorProps> = ({
  paletteId,
  initialColors = [],
  onColorsChange,
  onSave,
  readOnly = false,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [localColors, setLocalColors] = useState<Color[]>(initialColors);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const collaboration = useCollaboration({
    enableCursors: true,
    enableNotifications: true
  });

  // Join palette room on mount
  useEffect(() => {
    if (collaboration.isAuthenticated && paletteId) {
      collaboration.joinRoom(paletteId, 'palette');
    }

    return () => {
      collaboration.leaveRoom();
    };
  }, [collaboration.isAuthenticated, paletteId]);

  // Handle remote state updates
  useEffect(() => {
    if (collaboration.currentState?.palette?.colors) {
      const remoteColors = collaboration.currentState.palette.colors;
      setLocalColors(remoteColors);
      onColorsChange?.(remoteColors);
    }
  }, [collaboration.currentState, onColorsChange]);

  // Sync local changes to collaboration
  const syncColorsToCollaboration = useCallback((colors: Color[]) => {
    if (!readOnly && collaboration.isConnected) {
      collaboration.sendOperation({
        type: 'update',
        path: 'palette.colors',
        value: colors,
        metadata: {
          paletteId,
          timestamp: Date.now()
        }
      });
    }
  }, [collaboration, paletteId, readOnly]);

  // Handle color updates
  const updateColor = useCallback((colorId: string, updates: Partial<Color>) => {
    setLocalColors(prev => {
      const newColors = prev.map(color => 
        color.id === colorId ? { ...color, ...updates } : color
      );
      
      // Sync to collaboration
      syncColorsToCollaboration(newColors);
      onColorsChange?.(newColors);
      
      return newColors;
    });
  }, [syncColorsToCollaboration, onColorsChange]);

  // Add new color
  const addColor = useCallback((hex: string, position?: { x: number; y: number }) => {
    const newColor: Color = {
      id: `color-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      hex,
      name: hex,
      position
    };

    setLocalColors(prev => {
      const newColors = [...prev, newColor];
      syncColorsToCollaboration(newColors);
      onColorsChange?.(newColors);
      return newColors;
    });
  }, [syncColorsToCollaboration, onColorsChange]);

  // Remove color
  const removeColor = useCallback((colorId: string) => {
    setLocalColors(prev => {
      const newColors = prev.filter(color => color.id !== colorId);
      syncColorsToCollaboration(newColors);
      onColorsChange?.(newColors);
      return newColors;
    });
  }, [syncColorsToCollaboration, onColorsChange]);

  // Save palette
  const handleSave = async () => {
    if (!onSave || isSaving) return;

    setIsSaving(true);
    try {
      await onSave(localColors);
      
      // Notify collaborators
      collaboration.sendOperation({
        type: 'update',
        path: 'palette.metadata.lastSaved',
        value: Date.now(),
        metadata: {
          action: 'save',
          paletteId
        }
      });
    } catch (error) {
      console.error('Failed to save palette:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle container clicks for adding colors
  const handleContainerClick = useCallback((event: React.MouseEvent) => {
    if (readOnly || selectedColor) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Only add color if clicking on empty space
    const target = event.target as HTMLElement;
    if (target === containerRef.current) {
      // Generate a random color for demo purposes
      const randomHex = `#${Math.floor(Math.random()*16777215).toString(16)}`;
      addColor(randomHex, { x, y });
    }
  }, [readOnly, selectedColor, addColor]);

  return (
    <div className={`relative bg-white rounded-xl shadow-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Palette className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            Collaborative Palette
          </h2>
          
          {/* Connection status */}
          <div className="flex items-center gap-1">
            {collaboration.isConnected ? (
              <>
                <Wifi className="w-4 h-4 text-green-500" />
                <span className="text-xs text-green-600">Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-red-500" />
                <span className="text-xs text-red-600">Disconnected</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Active users toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1"
          >
            <Users className="w-4 h-4" />
            <span>{collaboration.activeUsers.length}</span>
          </Button>

          {/* Comments toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1"
          >
            <MessageSquare className="w-4 h-4" />
          </Button>

          {/* Save button */}
          {onSave && !readOnly && (
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          )}

          {/* Share button */}
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
          >
            <Share className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main editing area */}
      <div className="relative">
        <div
          ref={containerRef}
          className="relative min-h-96 p-6 cursor-crosshair"
          onClick={handleContainerClick}
        >
          {/* Color swatches */}
          <div className="flex flex-wrap gap-4">
            {localColors.map(color => (
              <div key={color.id} className="relative group">
                <ColorSwatch
                  color={color.hex}
                  size="lg"
                  onClick={() => setSelectedColor(selectedColor === color.id ? null : color.id)}
                  className={`cursor-pointer transition-all duration-200 hover:scale-105 ${
                    selectedColor === color.id ? 'ring-4 ring-indigo-300' : ''
                  }`}
                />
                
                {/* Color info */}
                <div className="mt-2 text-center">
                  <div className="text-sm font-mono text-gray-600">
                    {color.hex}
                  </div>
                  {color.name && color.name !== color.hex && (
                    <div className="text-xs text-gray-500 truncate max-w-20">
                      {color.name}
                    </div>
                  )}
                </div>

                {/* Remove button (visible on hover) */}
                {!readOnly && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeColor(color.id);
                    }}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Empty state */}
          {localColors.length === 0 && (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <Palette className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">Start building your palette</p>
                <p className="text-sm">
                  {readOnly ? 'No colors in this palette yet' : 'Click anywhere to add colors'}
                </p>
              </div>
            </div>
          )}

          {/* Real-time cursors */}
          <RealtimeCursors
            users={collaboration.activeUsers}
            onCursorMove={collaboration.updateCursor}
            containerRef={containerRef}
            showUsernames={true}
          />
        </div>

        {/* Side panels */}
        {showComments && (
          <div className="absolute top-0 right-0 w-80 h-full bg-gray-50 border-l border-gray-200 p-4">
            <ActiveUsers
              users={collaboration.activeUsers}
              typingUsers={collaboration.typingUsers}
              showAvatars={true}
              showTyping={true}
              className="mb-4"
            />
            
            {/* Comments section would go here */}
            <div className="text-sm text-gray-500 text-center mt-8">
              Comments feature coming soon...
            </div>
          </div>
        )}
      </div>

      {/* Notifications */}
      <NotificationCenter
        notifications={collaboration.notifications}
        onClearNotification={collaboration.clearNotification}
        show={showNotifications}
        onToggle={() => setShowNotifications(!showNotifications)}
      />

      {/* Connection error */}
      {collaboration.connectionError && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-300 text-red-800 px-4 py-2 rounded-md text-sm">
          {collaboration.connectionError}
        </div>
      )}
    </div>
  );
};

export default CollaborativePaletteEditor;