'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, X, Smartphone } from 'lucide-react';
import { usePWA } from '@/hooks/use-pwa';
import { cn } from '@/lib/utils';

interface InstallBannerProps {
  className?: string;
}

export function InstallBanner({ className }: InstallBannerProps) {
  const { isInstallable, install, isSupported } = usePWA();
  const [isDismissed, setIsDismissed] = React.useState(false);

  React.useEffect(() => {
    const dismissed = localStorage.getItem('pwa-banner-dismissed');
    setIsDismissed(dismissed === 'true');
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('pwa-banner-dismissed', 'true');
  };

  const handleInstall = async () => {
    await install();
    setIsDismissed(true);
  };

  if (!isSupported || !isInstallable || isDismissed) {
    return null;
  }

  return (
    <div className={cn(
      'fixed bottom-4 left-4 right-4 z-50 bg-card border rounded-lg shadow-lg p-4',
      'animate-in slide-in-from-bottom-2 duration-300',
      'md:left-auto md:right-4 md:w-80',
      className
    )}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
          <Smartphone size={20} className="text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm mb-1">
            ChromaVault 앱 설치
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            홈 화면에 추가하여 더 빠르고 편리하게 사용하세요
          </p>
          
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleInstall}
              className="h-8 px-3 text-xs"
            >
              <Download size={14} className="mr-1" />
              설치
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-8 px-2 text-xs"
            >
              <X size={14} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}