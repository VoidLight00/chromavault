'use client';

import React from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { usePWA } from '@/hooks/use-pwa';
import { cn } from '@/lib/utils';

interface OfflineIndicatorProps {
  className?: string;
}

export function OfflineIndicator({ className }: OfflineIndicatorProps) {
  const { isOffline } = usePWA();
  const [showNotification, setShowNotification] = React.useState(false);

  React.useEffect(() => {
    if (isOffline) {
      setShowNotification(true);
    } else {
      // Show "back online" notification briefly
      const timer = setTimeout(() => {
        setShowNotification(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isOffline]);

  if (!showNotification) return null;

  return (
    <div className={cn(
      'fixed top-20 left-4 right-4 z-50',
      'animate-in slide-in-from-top-2 duration-300',
      'md:left-auto md:right-4 md:w-80',
      className
    )}>
      <div className={cn(
        'rounded-lg p-4 shadow-lg border',
        isOffline 
          ? 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-200'
          : 'bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-200'
      )}>
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            {isOffline ? (
              <WifiOff size={20} />
            ) : (
              <Wifi size={20} />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm">
              {isOffline ? '오프라인 모드' : '다시 온라인'}
            </h3>
            <p className="text-xs mt-1 opacity-90">
              {isOffline 
                ? '인터넷 연결을 확인해주세요. 일부 기능은 제한될 수 있습니다.'
                : '인터넷 연결이 복구되었습니다.'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}