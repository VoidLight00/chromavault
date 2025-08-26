'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'dots' | 'pulse' | 'bars' | 'circle';
  className?: string;
}

export function LoadingSpinner({ 
  size = 'md', 
  variant = 'default',
  className 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  if (variant === 'dots') {
    return (
      <div className={cn('flex items-center justify-center gap-1', className)}>
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className={cn(
              'bg-primary rounded-full animate-pulse',
              size === 'sm' ? 'w-1.5 h-1.5' : 
              size === 'md' ? 'w-2 h-2' : 
              size === 'lg' ? 'w-2.5 h-2.5' : 'w-3 h-3'
            )}
            style={{
              animationDelay: `${index * 0.2}s`,
              animationDuration: '1s'
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div className={cn('flex items-center justify-center', className)}>
        <div
          className={cn(
            'bg-primary rounded-full animate-ping',
            sizeClasses[size]
          )}
        />
      </div>
    );
  }

  if (variant === 'bars') {
    return (
      <div className={cn('flex items-center justify-center gap-0.5', className)}>
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className={cn(
              'bg-primary animate-pulse',
              size === 'sm' ? 'w-0.5 h-3' : 
              size === 'md' ? 'w-1 h-4' : 
              size === 'lg' ? 'w-1.5 h-6' : 'w-2 h-8'
            )}
            style={{
              animationDelay: `${index * 0.1}s`,
              animationDuration: '0.8s'
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'circle') {
    return (
      <div className={cn('flex items-center justify-center', className)}>
        <div className={cn(sizeClasses[size], 'relative')}>
          <div className="absolute inset-0 border-2 border-primary/20 rounded-full" />
          <div className="absolute inset-0 border-2 border-transparent border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // Default spinner
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <svg
        className={cn('animate-spin text-primary', sizeClasses[size])}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
}

// Loading Screen Component
interface LoadingScreenProps {
  message?: string;
  showLogo?: boolean;
  className?: string;
}

export function LoadingScreen({ 
  message = '로딩 중...',
  showLogo = true,
  className 
}: LoadingScreenProps) {
  return (
    <div className={cn(
      'min-h-screen flex flex-col items-center justify-center bg-background',
      className
    )}>
      {showLogo && (
        <div className="mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-4">
            <svg 
              className="w-10 h-10 text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h2a2 2 0 002-2V5z" 
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-center">ChromaVault</h1>
        </div>
      )}
      
      <LoadingSpinner size="lg" variant="circle" className="mb-6" />
      
      <p className="text-muted-foreground text-center">{message}</p>
      
      {/* Progress dots animation */}
      <div className="flex items-center gap-1 mt-4">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="w-2 h-2 bg-primary rounded-full animate-pulse"
            style={{
              animationDelay: `${index * 0.3}s`,
              animationDuration: '1.5s'
            }}
          />
        ))}
      </div>
    </div>
  );
}

// Inline Loading Component
interface InlineLoadingProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'dots' | 'pulse' | 'bars' | 'circle';
  className?: string;
}

export function InlineLoading({
  message = '로딩 중',
  size = 'sm',
  variant = 'default',
  className
}: InlineLoadingProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <LoadingSpinner size={size} variant={variant} />
      <span className="text-sm text-muted-foreground">{message}</span>
    </div>
  );
}

// Loading Overlay Component
interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  className?: string;
}

export function LoadingOverlay({
  isVisible,
  message = '처리 중...',
  className
}: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className={cn(
      'fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center',
      className
    )}>
      <div className="bg-card border rounded-lg p-6 shadow-lg">
        <LoadingSpinner size="lg" variant="circle" className="mb-4" />
        <p className="text-center text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}