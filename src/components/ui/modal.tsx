'use client';

import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-full mx-4'
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className
}: ModalProps) {
  const modalRef = React.useRef<HTMLDivElement>(null);

  // Handle escape key
  React.useEffect(() => {
    if (!closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, closeOnEscape]);

  // Handle body scroll lock
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle overlay click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in-0 duration-200"
        onClick={handleOverlayClick}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className={cn(
          'relative w-full bg-background border rounded-lg shadow-lg animate-in fade-in-0 zoom-in-95 duration-200',
          sizeClasses[size],
          className
        )}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex-1 min-w-0">
              {title && (
                <h2 className="text-lg font-semibold truncate">{title}</h2>
              )}
              {description && (
                <p className="text-sm text-muted-foreground mt-1">{description}</p>
              )}
            </div>
            
            {showCloseButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="ml-4 flex-shrink-0"
              >
                <X size={16} />
              </Button>
            )}
          </div>
        )}

        {/* Content */}
        <div className={cn(
          'p-6',
          !(title || showCloseButton) && 'pt-6'
        )}>
          {children}
        </div>
      </div>
    </div>
  );
}

// Confirmation Modal
interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = '확인',
  cancelText = '취소',
  variant = 'default',
  isLoading = false
}: ConfirmModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      closeOnOverlayClick={!isLoading}
      closeOnEscape={!isLoading}
    >
      <div className="space-y-4">
        <p className="text-muted-foreground">{message}</p>
        
        <div className="flex items-center gap-3 justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          
          <Button
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? '처리 중...' : confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// Alert Modal
interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  confirmText?: string;
}

export function AlertModal({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  confirmText = '확인'
}: AlertModalProps) {
  const typeIcons = {
    info: '💡',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  };

  const typeColors = {
    info: 'text-blue-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600'
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
    >
      <div className="text-center space-y-4">
        <div className="text-4xl">{typeIcons[type]}</div>
        
        <div>
          <h3 className={cn('text-lg font-semibold', typeColors[type])}>
            {title}
          </h3>
          <p className="text-muted-foreground mt-2">{message}</p>
        </div>
        
        <Button onClick={onClose} className="w-full">
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
}

// Form Modal
interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  submitText?: string;
  cancelText?: string;
  isSubmitting?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function FormModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  description,
  children,
  submitText = '저장',
  cancelText = '취소',
  isSubmitting = false,
  size = 'md'
}: FormModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      size={size}
      closeOnOverlayClick={!isSubmitting}
      closeOnEscape={!isSubmitting}
    >
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="space-y-4">
          {children}
        </div>
        
        <div className="flex items-center gap-3 justify-end pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            {cancelText}
          </Button>
          
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? '저장 중...' : submitText}
          </Button>
        </div>
      </form>
    </Modal>
  );
}