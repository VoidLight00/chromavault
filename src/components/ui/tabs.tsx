'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
  disabled?: boolean;
  badge?: number;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Tabs({
  tabs,
  defaultTab,
  onChange,
  variant = 'default',
  size = 'md',
  className
}: TabsProps) {
  const [activeTab, setActiveTab] = React.useState(defaultTab || tabs[0]?.id);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onChange?.(tabId);
  };

  const activeTabContent = tabs.find(tab => tab.id === activeTab)?.content;

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const getTabClasses = (tab: Tab, isActive: boolean) => {
    const base = cn(
      'relative inline-flex items-center justify-center gap-2 font-medium transition-colors',
      sizeClasses[size],
      tab.disabled && 'opacity-50 cursor-not-allowed'
    );

    switch (variant) {
      case 'pills':
        return cn(
          base,
          'rounded-full',
          isActive 
            ? 'bg-primary text-primary-foreground' 
            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
        );
      
      case 'underline':
        return cn(
          base,
          'border-b-2 rounded-none',
          isActive 
            ? 'border-primary text-foreground' 
            : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
        );
      
      default:
        return cn(
          base,
          'border border-border rounded-lg',
          isActive 
            ? 'bg-background text-foreground shadow-sm' 
            : 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-accent'
        );
    }
  };

  return (
    <div className={cn('w-full', className)}>
      {/* Tab Headers */}
      <div className={cn(
        'flex items-center',
        variant === 'default' ? 'gap-1 p-1 bg-muted rounded-lg' :
        variant === 'pills' ? 'gap-2' :
        'gap-0 border-b border-border'
      )}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && handleTabChange(tab.id)}
              className={getTabClasses(tab, isActive)}
              disabled={tab.disabled}
              type="button"
            >
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className={cn(
                  'ml-1 px-1.5 py-0.5 rounded-full text-xs font-medium',
                  isActive 
                    ? 'bg-primary-foreground/20 text-primary-foreground' 
                    : 'bg-primary text-primary-foreground'
                )}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTabContent}
      </div>
    </div>
  );
}

// Individual Tab Components for more control
interface TabListProps {
  children: React.ReactNode;
  variant?: 'default' | 'pills' | 'underline';
  className?: string;
}

export function TabList({ children, variant = 'default', className }: TabListProps) {
  return (
    <div className={cn(
      'flex items-center',
      variant === 'default' ? 'gap-1 p-1 bg-muted rounded-lg' :
      variant === 'pills' ? 'gap-2' :
      'gap-0 border-b border-border',
      className
    )}>
      {children}
    </div>
  );
}

interface TabTriggerProps {
  isActive?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'pills' | 'underline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
}

export function TabTrigger({
  isActive = false,
  onClick,
  disabled = false,
  variant = 'default',
  size = 'md',
  children,
  className
}: TabTriggerProps) {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const getClasses = () => {
    const base = cn(
      'relative inline-flex items-center justify-center gap-2 font-medium transition-colors',
      sizeClasses[size],
      disabled && 'opacity-50 cursor-not-allowed',
      className
    );

    switch (variant) {
      case 'pills':
        return cn(
          base,
          'rounded-full',
          isActive 
            ? 'bg-primary text-primary-foreground' 
            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
        );
      
      case 'underline':
        return cn(
          base,
          'border-b-2 rounded-none',
          isActive 
            ? 'border-primary text-foreground' 
            : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
        );
      
      default:
        return cn(
          base,
          'border border-border rounded-lg',
          isActive 
            ? 'bg-background text-foreground shadow-sm' 
            : 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-accent'
        );
    }
  };

  return (
    <button
      onClick={!disabled ? onClick : undefined}
      className={getClasses()}
      disabled={disabled}
      type="button"
    >
      {children}
    </button>
  );
}

interface TabContentProps {
  children: React.ReactNode;
  className?: string;
}

export function TabContent({ children, className }: TabContentProps) {
  return (
    <div className={cn('mt-6', className)}>
      {children}
    </div>
  );
}