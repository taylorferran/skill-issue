import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage key for assessed skills
const ASSESSED_SKILLS_KEY = '@skill_issue_assessed_skills';

/**
 * Structure for storing assessed skill data
 */
interface AssessedSkill {
  completed: boolean;
  timestamp: number;
  difficultyLevel?: number; // Optional: store the level they selected
}

/**
 * Map of skillId -> AssessedSkill data
 */
type AssessedSkillsMap = Record<string, AssessedSkill>;

/**
 * Mark a skill as assessed (user has completed the difficulty rating)
 * 
 * @param skillId - The skill ID to mark as assessed
 * @param difficultyLevel - Optional difficulty level the user selected
 */
export async function markSkillAssessed(
  skillId: string,
  difficultyLevel?: number
): Promise<void> {
  try {
    console.log('[assessmentStorage] 📝 Marking skill as assessed:', {
      skillId,
      difficultyLevel
    });
    
    // Load existing data
    const existingData = await getAssessedSkills();
    
    // Add/update this skill
    const updatedData: AssessedSkillsMap = {
      ...existingData,
      [skillId]: {
        completed: true,
        timestamp: Date.now(),
        difficultyLevel,
      },
    };
    
    // Save back to storage
    await AsyncStorage.setItem(ASSESSED_SKILLS_KEY, JSON.stringify(updatedData));
    
    console.log('[assessmentStorage] ✅ Skill marked as assessed');
  } catch (error) {
    console.error('[assessmentStorage] ❌ Failed to mark skill as assessed:', error);
    throw error;
  }
}

/**
 * Check if a user has completed the assessment for a skill
 * 
 * @param skillId - The skill ID to check
 * @returns true if user has assessed this skill, false otherwise
 */
export async function hasAssessedSkill(skillId: string): Promise<boolean> {
  try {
    const assessedSkills = await getAssessedSkills();
    const skillData = assessedSkills[skillId];
    
    const hasAssessed = skillData?.completed ?? false;
    
    console.log('[assessmentStorage] 🔍 Checking if skill assessed:', {
      skillId,
      hasAssessed,
      timestamp: skillData?.timestamp
    });
    
    return hasAssessed;
  } catch (error) {
    console.error('[assessmentStorage] ❌ Failed to check assessed skill:', error);
    // On error, return false (safer to show assessment than hide it)
    return false;
  }
}

/**
 * Get all assessed skills data
 * 
 * @returns Map of skillId -> AssessedSkill data
 */
export async function getAssessedSkills(): Promise<AssessedSkillsMap> {
  try {
    const dataJson = await AsyncStorage.getItem(ASSESSED_SKILLS_KEY);
    
    if (!dataJson) {
      return {};
    }
    
    return JSON.parse(dataJson) as AssessedSkillsMap;
  } catch (error) {
    console.error('[assessmentStorage] ❌ Failed to load assessed skills:', error);
    return {};
  }
}

/**
 * Clear all assessed skills data (used on sign out)
 */
export async function clearAssessedSkills(): Promise<void> {
  try {
    console.log('[assessmentStorage] 🗑️ Clearing all assessed skills...');
    await AsyncStorage.removeItem(ASSESSED_SKILLS_KEY);
    console.log('[assessmentStorage] ✅ Assessed skills cleared');
  } catch (error) {
    console.error('[assessmentStorage] ❌ Failed to clear assessed skills:', error);
    throw error;
  }
}

/**
 * Remove assessment data for a specific skill
 * (useful if user wants to re-assess)
 * 
 * @param skillId - The skill ID to remove
 */
export async function removeSkillAssessment(skillId: string): Promise<void> {
  try {
    console.log('[assessmentStorage] 🗑️ Removing assessment for skill:', skillId);
    
    const existingData = await getAssessedSkills();
    const { [skillId]: removed, ...remaining } = existingData;
    
    await AsyncStorage.setItem(ASSESSED_SKILLS_KEY, JSON.stringify(remaining));
    
    console.log('[assessmentStorage] ✅ Skill assessment removed');
  } catch (error) {
    console.error('[assessmentStorage] ❌ Failed to remove skill assessment:', error);
    throw error;
  }
}
