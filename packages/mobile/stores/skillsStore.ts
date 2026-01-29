import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { 
  GetUserSkillsResponse,
  GetSkillsResponse 
} from '@learning-platform/shared';

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
  
  // Cache duration (5 minutes)
  CACHE_DURATION: number;
  
  // Helpers
  shouldRefetchUserSkills: () => boolean;
  shouldRefetchAvailableSkills: () => boolean;
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
      CACHE_DURATION: 5 * 60 * 1000, // 5 minutes in milliseconds
      
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
      
      clearCache: () => {
        set({
          userSkills: [],
          availableSkills: [],
          lastFetchedUserSkills: null,
          lastFetchedAvailableSkills: null,
        });
      },
    }),
    {
      name: 'skills-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
