import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { 
  GetUserSkillsResponse,
  GetSkillsResponse,
  GetChallengeHistoryResponse 
} from '@learning-platform/shared';

// Generic cache entry structure
interface CacheEntry {
  data: any;
  timestamp: number;
}

interface SkillsState {
  // Current user skills (enrolled) - last known data
  userSkills: GetUserSkillsResponse;
  setUserSkills: (skills: GetUserSkillsResponse) => void;
  
  // All available skills (catalog) - last known data
  availableSkills: GetSkillsResponse;
  setAvailableSkills: (skills: GetSkillsResponse) => void;
  
  // Generic cache storage for all API responses
  apiCache: Record<string, CacheEntry>;
  
  // Hydration state (for AsyncStorage sync)
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  
  // Generic cache methods (required by buildCachedApiHook)
  getCacheData: (key: string) => any | null;
  setCacheData: (key: string, data: any) => void;
  clearCacheData: (key?: string) => void;
  
  // Legacy methods for backward compatibility during migration
  getCachedPendingChallenges: (skillId: string) => Challenge[] | null;
  getCachedChallengeHistory: (skillId: string) => GetChallengeHistoryResponse | null;
  setSkillPendingChallenges: (skillId: string, challenges: Challenge[]) => void;
  setSkillChallengeHistory: (skillId: string, history: GetChallengeHistoryResponse) => void;
  clearSkillAssessmentCache: (skillId?: string) => void;
  
  // Legacy clear all
  clearCache: () => void;
}

export const useSkillsStore = create<SkillsState>()(
  persist(
    (set, get) => ({
      // State
      userSkills: [],
      availableSkills: [],
      apiCache: {},
      hasHydrated: false,
      
      // Hydration state
      setHasHydrated: (value: boolean) => {
        set({ hasHydrated: value });
      },
      
      // Generic cache methods (new system)
      getCacheData: (key: string) => {
        const { apiCache } = get();
        const entry = apiCache[key];
        return entry ? entry.data : null;
      },
      
      setCacheData: (key: string, data: any) => {
        set((state) => ({
          apiCache: {
            ...state.apiCache,
            [key]: {
              data,
              timestamp: Date.now(),
            }
          }
        }));
      },
      
      clearCacheData: (key?: string) => {
        if (key) {
          set((state) => {
            const newCache = { ...state.apiCache };
            delete newCache[key];
            return { apiCache: newCache };
          });
        } else {
          set({ apiCache: {} });
        }
      },
      
      // Legacy user skills methods
      setUserSkills: (skills) => {
        set({ userSkills: skills });
      },
      
      setAvailableSkills: (skills) => {
        set({ availableSkills: skills });
      },
      
      // Legacy assessment cache methods (using new generic cache)
      getCachedPendingChallenges: (skillId: string) => {
        return get().getCacheData(`pendingChallenges:${skillId}`);
      },
      
      getCachedChallengeHistory: (skillId: string) => {
        return get().getCacheData(`challengeHistory:${skillId}`);
      },
      
      setSkillPendingChallenges: (skillId: string, challenges: Challenge[]) => {
        get().setCacheData(`pendingChallenges:${skillId}`, challenges);
      },
      
      setSkillChallengeHistory: (skillId: string, history: GetChallengeHistoryResponse) => {
        get().setCacheData(`challengeHistory:${skillId}`, history);
      },
      
      clearSkillAssessmentCache: (skillId?: string) => {
        if (skillId) {
          get().clearCacheData(`pendingChallenges:${skillId}`);
          get().clearCacheData(`challengeHistory:${skillId}`);
        } else {
          // Clear all skill-related caches
          const { apiCache } = get();
          Object.keys(apiCache).forEach(key => {
            if (key.startsWith('pendingChallenges:') || key.startsWith('challengeHistory:')) {
              get().clearCacheData(key);
            }
          });
        }
      },
      
      clearCache: () => {
        set({
          userSkills: [],
          availableSkills: [],
          apiCache: {},
        });
      },
    }),
    {
      name: 'skills-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: (state) => {
        // Called when AsyncStorage has finished loading
        // Set hasHydrated to true so hooks know cache is ready
        console.log('[SkillsStore] ✅ AsyncStorage rehydrated');
        state?.setHasHydrated(true);
      },
    }
  )
);
