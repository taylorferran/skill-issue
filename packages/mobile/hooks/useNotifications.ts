import { useState, useEffect, useCallback, useRef } from 'react';
import { useGetPendingChallenges } from '@/api-routes/getPendingChallenges';
import { useUser } from '@/contexts/UserContext';
import { notificationEventEmitter } from '@/utils/notificationEvents';
import type { Challenge } from '@/types/Quiz';

interface UseNotificationsReturn {
  challenges: Challenge[];
  unreadCount: number;
  isLoading: boolean;
  isFetching: boolean;
  refresh: () => Promise<void>;
  error: Error | null;
}

/**
 * Hook for managing notification challenges
 * 
 * Features:
 * - Fetches pending challenges on mount
 * - Refreshes on notification events (background refresh, no UI reset)
 * - Provides unread count with "9+" formatting for 10+
 * - Maintains existing data during background refreshes
 */
export function useNotifications(): UseNotificationsReturn {
  const { userId } = useUser();
  const { 
    execute: fetchPendingChallenges, 
    data, 
    isLoading, 
    isFetching,
    error 
  } = useGetPendingChallenges({ clearDataOnCall: false });
  
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const isInitialMount = useRef(true);

  // Calculate unread count (all pending challenges are unread)
  const unreadCount = challenges.length > 9 ? 10 : challenges.length;

  // Function to format count for display (9+)
  const getFormattedCount = (): string => {
    if (challenges.length > 9) return '9+';
    return String(challenges.length);
  };

  // Fetch challenges function
  const refresh = useCallback(async () => {
    if (!userId) return;
    
    try {
      console.log('[useNotifications] 🔄 Refreshing challenges...');
      await fetchPendingChallenges({ userId });
    } catch (err) {
      console.error('[useNotifications] ❌ Failed to refresh:', err);
    }
  }, [userId, fetchPendingChallenges]);

  // Initial fetch on mount
  useEffect(() => {
    if (userId && isInitialMount.current) {
      isInitialMount.current = false;
      refresh();
    }
  }, [userId, refresh]);

  // Update challenges when data changes (background refresh support)
  useEffect(() => {
    if (data) {
      setChallenges(data);
    }
  }, [data]);

  // Listen for notification events
  useEffect(() => {
    const unsubscribe = notificationEventEmitter.subscribe(() => {
      console.log('[useNotifications] 📨 Notification event received, refreshing...');
      refresh();
    });

    return unsubscribe;
  }, [refresh]);

  return {
    challenges,
    unreadCount,
    isLoading,
    isFetching,
    refresh,
    error,
    // Expose formatted count getter as a property
    formattedCount: getFormattedCount(),
  } as UseNotificationsReturn & { formattedCount: string };
}
