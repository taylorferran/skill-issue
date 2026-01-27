import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Skill Level Store
 * Manages user-submitted skill level ratings (1-10) with persistent storage
 */

interface SkillLevelState {
  // Maps skill name to rating (1-10)
  skillLevels: Record<string, number>;
  
  // Set or update a skill level rating
  setSkillLevel: (skillName: string, level: number) => void;
  
  // Check if a skill has been rated
  hasRatedSkill: (skillName: string) => boolean;
  
  // Get the rating for a specific skill
  getSkillLevel: (skillName: string) => number | null;
  
  // Clear all skill ratings (for testing/reset)
  clearAllRatings: () => void;
}

export const useSkillLevelStore = create<SkillLevelState>()(
  persist(
    (set, get) => ({
      skillLevels: {},
      
      setSkillLevel: (skillName: string, level: number) => {
        // Validate level is between 1-10
        if (level < 1 || level > 10) {
          console.warn(`Invalid skill level: ${level}. Must be between 1-10.`);
          return;
        }
        
        set((state) => ({
          skillLevels: {
            ...state.skillLevels,
            [skillName]: level,
          },
        }));
      },
      
      hasRatedSkill: (skillName: string) => {
        const { skillLevels } = get();
        return skillName in skillLevels;
      },
      
      getSkillLevel: (skillName: string) => {
        const { skillLevels } = get();
        return skillLevels[skillName] ?? null;
      },
      
      clearAllRatings: () => {
        set({ skillLevels: {} });
      },
    }),
    {
      name: 'skill-level-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
