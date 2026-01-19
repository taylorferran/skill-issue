import { Ionicons } from "@expo/vector-icons";

export type Skill = {
  id: string;
  name: string;                    // Skill name (e.g., "UI/UX Design")
  level: number;                   // Random level 1-50
  category: string;                // Shortened description/category
  progress: number;                // Progress percentage 10-95
  icon: keyof typeof Ionicons.glyphMap;  // Icon name
  subtopics: number;               // Number of subtopics (from original)
  aiPowered: boolean;              // AI powered flag (from original)
  isPrimary: boolean;              // Primary skill flag (from original)
}

// Icon mappings for skill categories
export const SKILL_ICONS = {
  'rust': 'settings-outline',
  'javascript': 'logo-javascript', 
  'typescript': 'code-slash-outline',
  'python': 'server-outline',
  'design': 'brush-outline',
  'management': 'people-outline',
  'analytics': 'analytics-outline',
  'systems': 'hardware-chip-outline',
  'web': 'globe-outline',
  'mobile': 'phone-portrait-outline',
  'default': 'code-slash-outline',
} as const;

// Helper function to generate random level (1-50)
const generateRandomLevel = (): number => Math.floor(Math.random() * 50) + 1;

// Helper function to generate random progress (10-95)
const generateRandomProgress = (): number => Math.floor(Math.random() * 86) + 10;

// Skills mock data (transformed from languageMock)
export const skillsMock: Skill[] = [
  {
    id: "1",
    name: "Rust Programming",
    level: generateRandomLevel(),
    category: "Systems Programming & Memory Safety",
    progress: generateRandomProgress(),
    icon: "settings-outline",
    subtopics: 24,
    aiPowered: true,
    isPrimary: true,
  },
  {
    id: "2", 
    name: "JavaScript Development",
    level: generateRandomLevel(),
    category: "Web Development & Browser APIs",
    progress: generateRandomProgress(),
    icon: "logo-javascript",
    subtopics: 42,
    aiPowered: false,
    isPrimary: false,
  },
  {
    id: "3",
    name: "Python Programming", 
    level: generateRandomLevel(),
    category: "Data Science & AI Automation",
    progress: generateRandomProgress(),
    icon: "server-outline",
    subtopics: 38,
    aiPowered: true,
    isPrimary: false,
  },
  {
    id: "4",
    name: "TypeScript Development",
    level: generateRandomLevel(), 
    category: "Type-Safe JavaScript at Scale",
    progress: generateRandomProgress(),
    icon: "code-slash-outline", 
    subtopics: 31,
    aiPowered: false,
    isPrimary: false,
  }
];

// Stats calculation utilities
export const calculateTotalSkills = (): number => skillsMock.length;

export const getActivePath = (): string => {
  const primarySkill = skillsMock.find(skill => skill.isPrimary);
  return primarySkill ? primarySkill.name : "None";
};

// Get skill icon background color
export const getSkillIconColor = (skill: Skill): string => {
  const skillKey = skill.name.toLowerCase();
  
  if (skillKey.includes('rust')) return '#ce422b';
  if (skillKey.includes('javascript')) return '#f7df1e';
  if (skillKey.includes('typescript')) return '#3178c6';
  if (skillKey.includes('python')) return '#3776ab';
  if (skillKey.includes('design') || skillKey.includes('ui')) return '#3b82f6';
  if (skillKey.includes('management')) return '#10b981';
  if (skillKey.includes('data') || skillKey.includes('analytics')) return '#8b5cf6';
  
  return '#1e3648'; // Default primary color
};