import { Ionicons } from "@expo/vector-icons";

export type Skill = {
  id: string;
  name: string;
  level: number;
  category: string;
  progress: number;
  icon: keyof typeof Ionicons.glyphMap;
  subtopics: number;
  aiPowered: boolean;
  isPrimary: boolean;
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

// Current Skills - Skills the user is already learning
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

// Available Skills - New skills that can be added
export const availableSkillsMock: Skill[] = [
  {
    id: "5",
    name: "UI/UX Design",
    level: 1,
    category: "User Interface & Experience Design",
    progress: 0,
    icon: "brush-outline",
    subtopics: 28,
    aiPowered: true,
    isPrimary: false,
  },
  {
    id: "6",
    name: "React Native",
    level: 1,
    category: "Cross-Platform Mobile Development",
    progress: 0,
    icon: "phone-portrait-outline",
    subtopics: 35,
    aiPowered: false,
    isPrimary: false,
  },
  {
    id: "7",
    name: "Data Analytics",
    level: 1,
    category: "Statistical Analysis & Visualization",
    progress: 0,
    icon: "analytics-outline",
    subtopics: 26,
    aiPowered: true,
    isPrimary: false,
  },
  {
    id: "8",
    name: "Project Management",
    level: 1,
    category: "Agile & Team Leadership",
    progress: 0,
    icon: "people-outline",
    subtopics: 22,
    aiPowered: false,
    isPrimary: false,
  },
  {
    id: "9",
    name: "Systems Architecture",
    level: 1,
    category: "Distributed Systems & Scalability",
    progress: 0,
    icon: "hardware-chip-outline",
    subtopics: 30,
    aiPowered: true,
    isPrimary: false,
  },
  {
    id: "10",
    name: "Web Development",
    level: 1,
    category: "Full-Stack Web Applications",
    progress: 0,
    icon: "globe-outline",
    subtopics: 40,
    aiPowered: false,
    isPrimary: false,
  },
  {
    id: "11",
    name: "DevOps Engineering",
    level: 1,
    category: "CI/CD & Infrastructure Automation",
    progress: 0,
    icon: "git-branch-outline",
    subtopics: 33,
    aiPowered: true,
    isPrimary: false,
  },
  {
    id: "12",
    name: "Machine Learning",
    level: 1,
    category: "AI Models & Deep Learning",
    progress: 0,
    icon: "hardware-chip-outline",
    subtopics: 45,
    aiPowered: true,
    isPrimary: false,
  },
  {
    id: "13",
    name: "Cybersecurity",
    level: 1,
    category: "Network Security & Ethical Hacking",
    progress: 0,
    icon: "shield-checkmark-outline",
    subtopics: 37,
    aiPowered: false,
    isPrimary: false,
  },
  {
    id: "14",
    name: "Cloud Computing",
    level: 1,
    category: "AWS, Azure & Cloud Architecture",
    progress: 0,
    icon: "cloud-outline",
    subtopics: 29,
    aiPowered: true,
    isPrimary: false,
  },
  {
    id: "15",
    name: "Mobile iOS",
    level: 1,
    category: "Swift & iOS App Development",
    progress: 0,
    icon: "logo-apple",
    subtopics: 32,
    aiPowered: false,
    isPrimary: false,
  },
  {
    id: "16",
    name: "Mobile Android",
    level: 1,
    category: "Kotlin & Android Development",
    progress: 0,
    icon: "logo-android",
    subtopics: 34,
    aiPowered: false,
    isPrimary: false,
  },
];

// Stats calculation utilities
export const calculateTotalSkills = (): number => skillsMock.length;

export const getActivePath = (): string => {
  const primarySkill = skillsMock.find(skill => skill.isPrimary);
  return primarySkill ? primarySkill.name : "None";
};

