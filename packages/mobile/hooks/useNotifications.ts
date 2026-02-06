import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchPendingChallenges, skillsKeys } from '@/api/routes';
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

  // Use TanStack Query for fetching pending challenges
  const { 
    data: challenges = [], 
    isLoading, 
    isFetching,
    error,
    refetch
  } = useQuery({
    queryKey: userId ? skillsKeys.pending(userId) : ['pending-challenges', 'no-user'],
    queryFn: () => userId ? fetchPendingChallenges(userId) : Promise.resolve([]),
    enabled: !!userId,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
  });

  // Calculate unread count (all pending challenges are unread)
  const unreadCount = challenges.length > 9 ? 10 : challenges.length;

  // Function to format count for display (9+)
  const getFormattedCount = (): string => {
    if (challenges.length > 9) return '9+';
    return String(challenges.length);
  };

  // Fetch challenges function - now uses refetch
  const refresh = useCallback(async () => {
    if (!userId) return;
    
    try {
      console.log('[useNotifications] 🔄 Refreshing challenges...');
      await refetch();
    } catch (err) {
      console.error('[useNotifications] ❌ Failed to refresh:', err);
    }
  }, [userId, refetch]);

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
    error: error instanceof Error ? error : null,
    // Expose formatted count getter as a property
    formattedCount: getFormattedCount(),
  } as UseNotificationsReturn & { formattedCount: string };
}
