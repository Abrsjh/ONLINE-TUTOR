import { useState, useEffect, useCallback, useRef } from 'react';

interface OfflineAction {
  id: string;
  type: string;
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

interface UseOfflineReturn {
  isOnline: boolean;
  isOffline: boolean;
  queueAction: (type: string, data: any, maxRetries?: number) => string;
  removeAction: (id: string) => void;
  clearQueue: () => void;
  queueSize: number;
  isSyncing: boolean;
  lastSyncTime: number | null;
  syncQueue: () => Promise<void>;
}

const STORAGE_KEY = 'offline_queue';
const MAX_QUEUE_SIZE = 100;
const DEFAULT_MAX_RETRIES = 3;
const SYNC_RETRY_DELAY = 1000; // 1 second

export function useOffline(): UseOfflineReturn {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [queue, setQueue] = useState<OfflineAction[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout>();
  const isInitializedRef = useRef(false);

  // Load queue from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && !isInitializedRef.current) {
      try {
        const savedQueue = localStorage.getItem(STORAGE_KEY);
        if (savedQueue) {
          const parsedQueue = JSON.parse(savedQueue);
          setQueue(Array.isArray(parsedQueue) ? parsedQueue : []);
        }
        isInitializedRef.current = true;
      } catch (error) {
        console.error('Failed to load offline queue from localStorage:', error);
      }
    }
  }, []);

  // Save queue to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && isInitializedRef.current) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
      } catch (error) {
        console.error('Failed to save offline queue to localStorage:', error);
      }
    }
  }, [queue]);

  // Monitor network status
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOnline(true);
      // Trigger sync when coming back online
      if (queue.length > 0) {
        syncQueue();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      // Clear any pending sync timeout
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [queue.length]);

  // Generate unique ID for actions
  const generateId = useCallback(() => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Add action to offline queue
  const queueAction = useCallback((
    type: string,
    data: any,
    maxRetries: number = DEFAULT_MAX_RETRIES
  ): string => {
    const id = generateId();
    const action: OfflineAction = {
      id,
      type,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries,
    };

    setQueue(prevQueue => {
      // Prevent queue from growing too large
      const newQueue = [...prevQueue, action];
      if (newQueue.length > MAX_QUEUE_SIZE) {
        // Remove oldest actions
        return newQueue.slice(-MAX_QUEUE_SIZE);
      }
      return newQueue;
    });

    return id;
  }, [generateId]);

  // Remove action from queue
  const removeAction = useCallback((id: string) => {
    setQueue(prevQueue => prevQueue.filter(action => action.id !== id));
  }, []);

  // Clear entire queue
  const clearQueue = useCallback(() => {
    setQueue([]);
  }, []);

  // Process a single action
  const processAction = useCallback(async (action: OfflineAction): Promise<boolean> => {
    try {
      // Simulate API call based on action type
      // In a real implementation, this would dispatch to appropriate API functions
      switch (action.type) {
        case 'CREATE_SESSION':
          // await createSession(action.data);
          console.log('Processing CREATE_SESSION:', action.data);
          break;
        case 'UPDATE_PROFILE':
          // await updateProfile(action.data);
          console.log('Processing UPDATE_PROFILE:', action.data);
          break;
        case 'SUBMIT_ASSIGNMENT':
          // await submitAssignment(action.data);
          console.log('Processing SUBMIT_ASSIGNMENT:', action.data);
          break;
        case 'SEND_MESSAGE':
          // await sendMessage(action.data);
          console.log('Processing SEND_MESSAGE:', action.data);
          break;
        case 'MAKE_PAYMENT':
          // await processPayment(action.data);
          console.log('Processing MAKE_PAYMENT:', action.data);
          break;
        default:
          console.warn('Unknown action type:', action.type);
          return false;
      }

      // Simulate network delay and potential failure
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Simulate random failures for testing
      if (Math.random() < 0.1) {
        throw new Error('Simulated network error');
      }

      return true;
    } catch (error) {
      console.error(`Failed to process action ${action.id}:`, error);
      return false;
    }
  }, []);

  // Sync all queued actions
  const syncQueue = useCallback(async () => {
    if (!isOnline || isSyncing || queue.length === 0) {
      return;
    }

    setIsSyncing(true);

    try {
      const actionsToProcess = [...queue];
      const failedActions: OfflineAction[] = [];

      for (const action of actionsToProcess) {
        const success = await processAction(action);

        if (success) {
          // Remove successful action from queue
          setQueue(prevQueue => prevQueue.filter(a => a.id !== action.id));
        } else {
          // Increment retry count
          const updatedAction = {
            ...action,
            retryCount: action.retryCount + 1,
          };

          if (updatedAction.retryCount >= updatedAction.maxRetries) {
            // Remove action that has exceeded max retries
            setQueue(prevQueue => prevQueue.filter(a => a.id !== action.id));
            console.warn(`Action ${action.id} exceeded max retries and was removed`);
          } else {
            // Keep action for retry
            failedActions.push(updatedAction);
          }
        }
      }

      // Update queue with failed actions that still have retries left
      if (failedActions.length > 0) {
        setQueue(prevQueue => {
          const remainingActions = prevQueue.filter(
            action => !actionsToProcess.some(processed => processed.id === action.id)
          );
          return [...remainingActions, ...failedActions];
        });

        // Schedule retry
        syncTimeoutRef.current = setTimeout(() => {
          syncQueue();
        }, SYNC_RETRY_DELAY);
      }

      setLastSyncTime(Date.now());
    } catch (error) {
      console.error('Failed to sync offline queue:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, queue, processAction]);

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline && queue.length > 0 && !isSyncing) {
      const timeoutId = setTimeout(() => {
        syncQueue();
      }, 500); // Small delay to ensure connection is stable

      return () => clearTimeout(timeoutId);
    }
  }, [isOnline, queue.length, isSyncing, syncQueue]);

  return {
    isOnline,
    isOffline: !isOnline,
    queueAction,
    removeAction,
    clearQueue,
    queueSize: queue.length,
    isSyncing,
    lastSyncTime,
    syncQueue,
  };
}

// Helper hook for specific action types
export function useOfflineActions() {
  const offline = useOffline();

  const queueSessionCreation = useCallback((sessionData: any) => {
    return offline.queueAction('CREATE_SESSION', sessionData);
  }, [offline]);

  const queueProfileUpdate = useCallback((profileData: any) => {
    return offline.queueAction('UPDATE_PROFILE', profileData);
  }, [offline]);

  const queueAssignmentSubmission = useCallback((assignmentData: any) => {
    return offline.queueAction('SUBMIT_ASSIGNMENT', assignmentData, 5); // Higher retry count for important actions
  }, [offline]);

  const queueMessage = useCallback((messageData: any) => {
    return offline.queueAction('SEND_MESSAGE', messageData);
  }, [offline]);

  const queuePayment = useCallback((paymentData: any) => {
    return offline.queueAction('MAKE_PAYMENT', paymentData, 1); // Lower retry count for payments
  }, [offline]);

  return {
    ...offline,
    queueSessionCreation,
    queueProfileUpdate,
    queueAssignmentSubmission,
    queueMessage,
    queuePayment,
  };
}