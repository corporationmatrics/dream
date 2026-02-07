'use client';

import { useErrorHandler, ErrorNotification } from '@/hooks/useErrorHandler';
import { createContext, useContext, ReactNode } from 'react';

interface ErrorNotificationContextType {
  notifications: ErrorNotification[];
  notify: (message: string, type?: 'error' | 'warning' | 'success', autoClose?: boolean) => string;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const ErrorNotificationContext = createContext<ErrorNotificationContextType | undefined>(undefined);

export function ErrorNotificationProvider({ children }: { children: ReactNode }) {
  const { notifications, addNotification, removeNotification, clearAll } = useErrorHandler();

  const value: ErrorNotificationContextType = {
    notifications,
    notify: addNotification,
    removeNotification,
    clearAll,
  };

  return (
    <ErrorNotificationContext.Provider value={value}>
      {children}
      <ErrorNotificationStack notifications={notifications} onRemove={removeNotification} />
    </ErrorNotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(ErrorNotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within ErrorNotificationProvider');
  }
  return context;
}

interface ErrorNotificationStackProps {
  notifications: ErrorNotification[];
  onRemove: (id: string) => void;
}

function ErrorNotificationStack({ notifications, onRemove }: ErrorNotificationStackProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-3">
      {notifications.map(notification => (
        <ErrorNotificationItem
          key={notification.id}
          notification={notification}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}

interface ErrorNotificationItemProps {
  notification: ErrorNotification;
  onRemove: (id: string) => void;
}

function ErrorNotificationItem({ notification, onRemove }: ErrorNotificationItemProps) {
  const typeConfig = {
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: '❌',
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      icon: '⚠️',
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: '✓',
    },
  };

  const config = typeConfig[notification.type];

  return (
    <div
      className={`${config.bg} border ${config.border} rounded-lg p-4 max-w-sm shadow-lg animate-in slide-in-from-right duration-200`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <span className="text-lg flex-shrink-0">{config.icon}</span>
        <div className="flex-1">
          <p className={`${config.text} text-sm font-medium`}>
            {notification.message}
          </p>
        </div>
        <button
          onClick={() => onRemove(notification.id)}
          className={`${config.text} hover:opacity-70 flex-shrink-0 text-lg`}
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </div>
  );
}
