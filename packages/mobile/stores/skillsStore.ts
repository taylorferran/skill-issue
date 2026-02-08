import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { 
  GetUserSkillsResponse,
  GetSkillsResponse,
} from '@learning-platform/shared';

interface SkillsState {
  // Current user skills (enrolled) - UI state only (not for API caching)
  userSkills: GetUserSkillsResponse;
  setUserSkills: (skills: GetUserSkillsResponse) => void;
  
  // All available skills (catalog) - UI state only
  availableSkills: GetSkillsResponse;
  setAvailableSkills: (skills: GetSkillsResponse) => void;
  
  // Hydration state (for AsyncStorage sync)
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  
  // Clear all UI state (not API cache - that's handled by TanStack Query)
  clearCache: () => void;
}

export const useSkillsStore = create<SkillsState>()(
  persist(
    (set) => ({
      // State
      userSkills: [],
      availableSkills: [],
      hasHydrated: false,
      
      // Hydration state
      setHasHydrated: (value: boolean) => {
        set({ hasHydrated: value });
      },
      
      // User skills methods
      setUserSkills: (skills) => {
        set({ userSkills: skills });
      },
      
      setAvailableSkills: (skills) => {
        set({ availableSkills: skills });
      },
      
      clearCache: () => {
        set({
          userSkills: [],
          availableSkills: [],
        });
      },
    }),
    {
      name: 'skills-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: (state) => {
        // Called when AsyncStorage has finished loading
        console.log('[SkillsStore] ✅ AsyncStorage rehydrated');
        state?.setHasHydrated(true);
      },
    }
  )
);
