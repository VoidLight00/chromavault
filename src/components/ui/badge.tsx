'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
}

const badgeVariants = {
  default: 'bg-primary text-primary-foreground border-primary',
  secondary: 'bg-secondary text-secondary-foreground border-secondary',
  destructive: 'bg-destructive text-destructive-foreground border-destructive',
  outline: 'bg-transparent text-foreground border-border',
  success: 'bg-green-500 text-white border-green-500 dark:bg-green-600 dark:border-green-600',
  warning: 'bg-yellow-500 text-white border-yellow-500 dark:bg-yellow-600 dark:border-yellow-600',
  info: 'bg-blue-500 text-white border-blue-500 dark:bg-blue-600 dark:border-blue-600',
};

const badgeSizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-sm',
};

export function Badge({
  variant = 'default',
  size = 'md',
  children,
  className
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium transition-colors',
        badgeVariants[variant],
        badgeSizes[size],
        className
      )}
    >
      {children}
    </span>
  );
}