'use client';

import React from 'react';
import * as Toast from '@radix-ui/react-toast';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/lib/stores/ui-store';

const toastIcons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

const toastStyles = {
  success: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-200',
  error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-200',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-200',
  info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { toast, hideToast } = useUIStore();

  return (
    <Toast.Provider swipeDirection="right" duration={5000}>
      {children}
      
      {toast && (
        <Toast.Root
          className={cn(
            'fixed top-4 right-4 z-50 flex items-center gap-3 p-4 border rounded-lg shadow-lg',
            'radix-state-open:animate-slide-in-from-top',
            'radix-state-closed:animate-slide-out-to-top',
            toastStyles[toast.type]
          )}
          open={!!toast}
          onOpenChange={(open) => !open && hideToast()}
        >
          <Toast.Description asChild>
            <div className="flex items-center gap-3">
              {(() => {
                const Icon = toastIcons[toast.type];
                return <Icon size={20} />;
              })()}
              <span className="font-medium">{toast.message}</span>
            </div>
          </Toast.Description>
          
          <Toast.Close asChild>
            <button className="ml-2 opacity-70 hover:opacity-100 transition-opacity">
              <X size={16} />
            </button>
          </Toast.Close>
        </Toast.Root>
      )}
      
      <Toast.Viewport className="fixed top-0 right-0 z-50 p-4" />
    </Toast.Provider>
  );
}