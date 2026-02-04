import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { 
  GetUserSkillsResponse,
  GetSkillsResponse,
  GetChallengeHistoryResponse 
} from '@learning-platform/shared';
import type { Challenge } from '@/types/Quiz';

// Per-skill assessment cache structure
interface SkillAssessmentCache {
  pendingChallenges: Challenge[];
  challengeHistory: GetChallengeHistoryResponse;
  lastFetchedPending: number;
  lastFetchedHistory: number;
}

interface SkillsState {
  // Current user skills (enrolled)
  userSkills: GetUserSkillsResponse;
  setUserSkills: (skills: GetUserSkillsResponse) => void;
  
  // All available skills (catalog)
  availableSkills: GetSkillsResponse;
  setAvailableSkills: (skills: GetSkillsResponse) => void;
  
  // Last fetch timestamps (for cache invalidation)
  lastFetchedUserSkills: number | null;
  lastFetchedAvailableSkills: number | null;
  
  // Per-skill assessment cache
  skillAssessmentCache: Record<string, SkillAssessmentCache>;
  
  // Cache duration (5 minutes)
  CACHE_DURATION: number;
  
  // Assessment cache duration (2 minutes - shorter for more freshness)
  ASSESSMENT_CACHE_DURATION: number;
  
  // Helpers
  shouldRefetchUserSkills: () => boolean;
  shouldRefetchAvailableSkills: () => boolean;
  
  // Assessment cache helpers
  getCachedPendingChallenges: (skillId: string) => Challenge[] | null;
  getCachedChallengeHistory: (skillId: string) => GetChallengeHistoryResponse | null;
  shouldRefetchPendingChallenges: (skillId: string) => boolean;
  shouldRefetchChallengeHistory: (skillId: string) => boolean;
  setSkillPendingChallenges: (skillId: string, challenges: Challenge[]) => void;
  setSkillChallengeHistory: (skillId: string, history: GetChallengeHistoryResponse) => void;
  clearSkillAssessmentCache: (skillId?: string) => void;
  clearCache: () => void;
}

export const useSkillsStore = create<SkillsState>()(
  persist(
    (set, get) => ({
      // State
      userSkills: [],
      availableSkills: [],
      lastFetchedUserSkills: null,
      lastFetchedAvailableSkills: null,
      skillAssessmentCache: {},
      CACHE_DURATION: 5 * 60 * 1000, // 5 minutes in milliseconds
      ASSESSMENT_CACHE_DURATION: 2 * 60 * 1000, // 2 minutes in milliseconds
      
      // Actions
      setUserSkills: (skills) => {
        set({ 
          userSkills: skills,
          lastFetchedUserSkills: Date.now() 
        });
      },
      
      setAvailableSkills: (skills) => {
        set({ 
          availableSkills: skills,
          lastFetchedAvailableSkills: Date.now() 
        });
      },
      
      // Check if cache is stale
      shouldRefetchUserSkills: () => {
        const { lastFetchedUserSkills, CACHE_DURATION } = get();
        if (!lastFetchedUserSkills) return true;
        return Date.now() - lastFetchedUserSkills > CACHE_DURATION;
      },
      
      shouldRefetchAvailableSkills: () => {
        const { lastFetchedAvailableSkills, CACHE_DURATION } = get();
        if (!lastFetchedAvailableSkills) return true;
        return Date.now() - lastFetchedAvailableSkills > CACHE_DURATION;
      },
      
      // Assessment cache helpers
      getCachedPendingChallenges: (skillId: string) => {
        const { skillAssessmentCache } = get();
        const cache = skillAssessmentCache[skillId];
        return cache ? cache.pendingChallenges : null;
      },
      
      getCachedChallengeHistory: (skillId: string) => {
        const { skillAssessmentCache } = get();
        const cache = skillAssessmentCache[skillId];
        return cache ? cache.challengeHistory : null;
      },
      
      shouldRefetchPendingChallenges: (skillId: string) => {
        const { skillAssessmentCache, ASSESSMENT_CACHE_DURATION } = get();
        const cache = skillAssessmentCache[skillId];
        if (!cache || !cache.pendingChallenges) return true;
        return Date.now() - cache.lastFetchedPending > ASSESSMENT_CACHE_DURATION;
      },
      
      shouldRefetchChallengeHistory: (skillId: string) => {
        const { skillAssessmentCache, ASSESSMENT_CACHE_DURATION } = get();
        const cache = skillAssessmentCache[skillId];
        if (!cache || !cache.challengeHistory) return true;
        return Date.now() - cache.lastFetchedHistory > ASSESSMENT_CACHE_DURATION;
      },
      
      setSkillPendingChallenges: (skillId: string, challenges: Challenge[]) => {
        set((state) => ({
          skillAssessmentCache: {
            ...state.skillAssessmentCache,
            [skillId]: {
              ...state.skillAssessmentCache[skillId],
              pendingChallenges: challenges,
              lastFetchedPending: Date.now(),
            }
          }
        }));
      },
      
      setSkillChallengeHistory: (skillId: string, history: GetChallengeHistoryResponse) => {
        set((state) => ({
          skillAssessmentCache: {
            ...state.skillAssessmentCache,
            [skillId]: {
              ...state.skillAssessmentCache[skillId],
              challengeHistory: history,
              lastFetchedHistory: Date.now(),
            }
          }
        }));
      },
      
      clearSkillAssessmentCache: (skillId?: string) => {
        if (skillId) {
          set((state) => {
            const newCache = { ...state.skillAssessmentCache };
            delete newCache[skillId];
            return { skillAssessmentCache: newCache };
          });
        } else {
          set({ skillAssessmentCache: {} });
        }
      },
      
      clearCache: () => {
        set({
          userSkills: [],
          availableSkills: [],
          lastFetchedUserSkills: null,
          lastFetchedAvailableSkills: null,
          skillAssessmentCache: {},
        });
      },
    }),
    {
      name: 'skills-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
