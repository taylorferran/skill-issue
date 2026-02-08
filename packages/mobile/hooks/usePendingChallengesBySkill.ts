import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchPendingChallenges, skillsKeys } from '@/api/routes';
import { useUser } from '@/contexts/UserContext';
import type { Challenge } from '@/types/Quiz';

interface PendingChallengesBySkill {
  [skillId: string]: Challenge[];
}

interface UsePendingChallengesBySkillReturn {
  challengesBySkill: PendingChallengesBySkill;
  totalPending: number;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  getPendingCountForSkill: (skillId: string) => number;
}

/**
 * Hook to fetch pending challenges grouped by skill ID
 * 
 * This allows showing a badge count on each skill card indicating
 * how many pending challenges exist for that specific skill.
 */
export function usePendingChallengesBySkill(): UsePendingChallengesBySkillReturn {
  const { userId } = useUser();

  const {
    data: challenges = [],
    isLoading,
    isFetching,
    error,
  } = useQuery({
    queryKey: userId ? skillsKeys.pending(userId) : ['pending-challenges', 'no-user'],
    queryFn: () => (userId ? fetchPendingChallenges(userId) : Promise.resolve([])),
    enabled: !!userId,
  });

  // Group challenges by skillId
  const challengesBySkill = useMemo(() => {
    const grouped: PendingChallengesBySkill = {};
    
    for (const challenge of challenges) {
      if (!grouped[challenge.skillId]) {
        grouped[challenge.skillId] = [];
      }
      grouped[challenge.skillId].push(challenge);
    }
    
    return grouped;
  }, [challenges]);

  // Helper function to get count for a specific skill
  const getPendingCountForSkill = (skillId: string): number => {
    return challengesBySkill[skillId]?.length ?? 0;
  };

  return {
    challengesBySkill,
    totalPending: challenges.length,
    isLoading,
    isFetching,
    error: error instanceof Error ? error : null,
    getPendingCountForSkill,
  };
}
