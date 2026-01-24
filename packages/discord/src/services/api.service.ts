import axios, { AxiosInstance, AxiosError } from 'axios';
import { config } from '../config';
import { User, Skill, UserSkill, Challenge, ChallengeHistory } from '../types';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.backendApiUrl,
      headers: {
        'Authorization': `Bearer ${config.backendApiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response) {
          console.error(`API Error ${error.response.status}:`, error.response.data);
        } else if (error.request) {
          console.error('API Error: No response received', error.message);
        } else {
          console.error('API Error:', error.message);
        }
        throw error;
      }
    );
  }

  // User endpoints
  async createUser(data: {
    timezone: string;
    quietHoursStart?: number;
    quietHoursEnd?: number;
    maxChallengesPerDay?: number;
    discordUserId: string;
  }): Promise<User> {
    const response = await this.client.post<User>('/users', data);
    return response.data;
  }

  async getUser(userId: string): Promise<User> {
    const response = await this.client.get<User>(`/users/${userId}`);
    return response.data;
  }

  async updateUser(userId: string, data: Partial<User>): Promise<User> {
    const response = await this.client.put<User>(`/users/${userId}`, data);
    return response.data;
  }

  async getUserByDiscordId(discordUserId: string): Promise<User | null> {
    try {
      // This assumes the backend supports filtering by discordUserId
      // If not, we'll need to implement local mapping storage
      const response = await this.client.get<User[]>('/users', {
        params: { discordUserId }
      });
      return response.data[0] || null;
    } catch (error) {
      return null;
    }
  }

  // Skills endpoints
  async getSkills(): Promise<Skill[]> {
    try {
      const response = await this.client.get<Skill[]>('/skills');
      console.log('[API] Skills response:', response.data ? `${response.data.length} skills` : 'no data');
      return response.data;
    } catch (error) {
      console.error('[API] Error fetching skills:', error);
      throw error;
    }
  }

  async getSkill(skillId: string): Promise<Skill> {
    const response = await this.client.get<Skill>(`/skills/${skillId}`);
    return response.data;
  }

  // User skills endpoints
  async getUserSkills(userId: string): Promise<UserSkill[]> {
    const response = await this.client.get<any[]>(`/users/${userId}/skills`);

    // Transform API response to match our UserSkill type
    return response.data.map((item: any) => ({
      id: item.skillId, // Using skillId as the id
      userId: userId,
      skillId: item.skillId,
      difficultyTarget: item.difficultyTarget,
      enrolledAt: item.lastChallengedAt || new Date().toISOString(), // Fallback to now if not available
      skill: {
        id: item.skillId,
        name: item.skillName || 'Unknown Skill',
        description: item.skillDescription || '',
      },
    }));
  }

  async enrollUserInSkill(userId: string, data: {
    skillId: string;
    difficultyTarget: number;
  }): Promise<UserSkill> {
    const response = await this.client.post<UserSkill>(`/users/${userId}/skills`, data);
    return response.data;
  }

  async unenrollUserFromSkill(userId: string, skillId: string): Promise<void> {
    await this.client.delete(`/users/${userId}/skills/${skillId}`);
  }

  // Challenge endpoints
  async getPendingChallenges(userId: string): Promise<Challenge[]> {
    const response = await this.client.get<any[]>(`/users/${userId}/challenges/pending`);

    // Transform API response to match our Challenge type
    return response.data.map((item: any) => ({
      id: item.challengeId,
      userId: userId,
      skillId: item.skillId,
      question: item.question,
      options: item.options || [],
      correctOption: -1, // Not provided in pending challenges (intentionally hidden)
      difficulty: item.difficulty,
      createdAt: item.createdAt,
      skill: item.skillName ? {
        id: item.skillId,
        name: item.skillName,
        description: '',
      } : undefined,
    }));
  }

  async getChallengeHistory(userId: string, limit?: number): Promise<ChallengeHistory[]> {
    const response = await this.client.get<ChallengeHistory[]>(
      `/users/${userId}/challenges/history`,
      { params: { limit } }
    );
    return response.data;
  }

  async submitAnswer(data: {
    userId: string;
    challengeId: string;
    selectedOption: number;
    confidence?: number;
    responseTime?: number;
  }): Promise<{ isCorrect: boolean; correctOption: number; explanation?: string }> {
    const response = await this.client.post('/answer', data);
    return response.data;
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get('/health');
      return true;
    } catch {
      return false;
    }
  }
}

export const apiService = new ApiService();
