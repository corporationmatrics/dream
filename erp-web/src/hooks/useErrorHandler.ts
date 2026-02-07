/**
 * Custom hook for global error handling with notifications
 */

import { useCallback, useState } from 'react';
import { logger } from '@/utils/logger';

export interface ErrorNotification {
  id: string;
  message: string;
  type: 'error' | 'warning' | 'success';
  timestamp: number;
  autoClose?: boolean;
}

/**
 * Hook for managing error notifications with auto-dismiss
 */
export function useErrorHandler() {
  const [notifications, setNotifications] = useState<ErrorNotification[]>([]);

  const addNotification = useCallback((
    message: string,
    type: 'error' | 'warning' | 'success' = 'error',
    autoClose = true,
    duration = 5000
  ) => {
    const id = `${Date.now()}-${Math.random()}`;
    const notification: ErrorNotification = {
      id,
      message,
      type,
      timestamp: Date.now(),
      autoClose,
    };

    setNotifications(prev => [...prev, notification]);

    if (autoClose) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }

    // Log the notification
    if (type === 'error') {
      logger.error(message);
    } else if (type === 'warning') {
      logger.warn(message);
    } else {
      logger.info(message);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
  };
}

/**
 * Hook for handling async operations with loading and error states
 */
export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  immediate = true
) {
  const [state, setState] = useState<{
    status: 'idle' | 'pending' | 'success' | 'error';
    data: T | null;
    error: string | null;
  }>({
    status: 'idle',
    data: null,
    error: null,
  });

  const execute = useCallback(async () => {
    setState({ status: 'pending', data: null, error: null });
    try {
      const response = await asyncFunction();
      setState({ status: 'success', data: response, error: null });
      return response;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      setState({ status: 'error', data: null, error: message });
      logger.error('Async operation failed', error instanceof Error ? error : { error });
      throw error;
    }
  }, [asyncFunction]);

  // useEffect is not needed here as it's not an async component
  // Use execute() manually when needed

  return { ...state, execute };
}
