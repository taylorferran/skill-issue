export interface User {
  id: string;
  timezone: string;
  quietHoursStart?: number;
  quietHoursEnd?: number;
  maxChallengesPerDay: number;
  createdAt: string;
  discordUserId?: string;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  difficultyRange?: {
    min: number;
    max: number;
  };
  createdAt?: string;
  active?: boolean;
}

export interface UserSkill {
  id: string;
  userId: string;
  skillId: string;
  difficultyTarget: number;
  enrolledAt: string;
  skill?: Skill;
}

export interface Challenge {
  id: string;
  userId: string;
  skillId: string;
  question: string;
  options: string[];
  correctOption: number;
  difficulty: number;
  explanation?: string;
  createdAt: string;
  skill?: Skill;
}

export interface ChallengeHistory {
  id: string;
  userId: string;
  challengeId: string;
  selectedOption: number;
  isCorrect: boolean;
  confidence?: number;
  responseTime?: number;
  answeredAt: string;
  challenge?: Challenge;
}

export interface BotConfig {
  discordToken: string;
  discordClientId: string;
  backendApiUrl: string;
  backendApiKey: string;
  challengeCheckEnabled: boolean;
  challengeCheckCron: string;
  rateLimitMinutes: number;
  logLevel: string;
}

export interface UserMapping {
  discordUserId: string;
  backendUserId: string;
}
