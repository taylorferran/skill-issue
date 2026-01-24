import axios from 'axios';
import { apiService } from '../../src/services/api.service';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ApiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock axios.create to return a mock client
    const mockClient: any = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      interceptors: {
        response: {
          use: jest.fn(),
        },
      },
    };

    mockedAxios.create = jest.fn().mockReturnValue(mockClient);
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const mockUser = {
        id: 'user123',
        timezone: 'UTC',
        maxChallengesPerDay: 5,
        discordUserId: 'discord123',
        createdAt: '2024-01-01T00:00:00Z',
      };

      const mockClient = mockedAxios.create();
      (mockClient.post as jest.Mock).mockResolvedValue({ data: mockUser });

      const result = await apiService.createUser({
        timezone: 'UTC',
        maxChallengesPerDay: 5,
        discordUserId: 'discord123',
      });

      expect(mockClient.post).toHaveBeenCalledWith('/users', expect.objectContaining({
        timezone: 'UTC',
        maxChallengesPerDay: 5,
        discordUserId: 'discord123',
      }));
      expect(result).toEqual(mockUser);
    });
  });

  describe('getUser', () => {
    it('should retrieve user by ID', async () => {
      const mockUser = {
        id: 'user123',
        timezone: 'UTC',
        maxChallengesPerDay: 5,
        createdAt: '2024-01-01T00:00:00Z',
      };

      const mockClient = mockedAxios.create();
      (mockClient.get as jest.Mock).mockResolvedValue({ data: mockUser });

      const result = await apiService.getUser('user123');

      expect(mockClient.get).toHaveBeenCalledWith('/users/user123');
      expect(result).toEqual(mockUser);
    });
  });

  describe('getSkills', () => {
    it('should retrieve all skills', async () => {
      const mockSkills = [
        {
          id: 'skill1',
          name: 'JavaScript',
          description: 'Learn JS',
          difficultyRange: { min: 1, max: 10 },
          createdAt: '2024-01-01T00:00:00Z',
        },
      ];

      const mockClient = mockedAxios.create();
      (mockClient.get as jest.Mock).mockResolvedValue({ data: mockSkills });

      const result = await apiService.getSkills();

      expect(mockClient.get).toHaveBeenCalledWith('/skills');
      expect(result).toEqual(mockSkills);
    });
  });

  describe('enrollUserInSkill', () => {
    it('should enroll user in skill', async () => {
      const mockEnrollment = {
        id: 'enrollment1',
        userId: 'user123',
        skillId: 'skill456',
        difficultyTarget: 5,
        enrolledAt: '2024-01-01T00:00:00Z',
      };

      const mockClient = mockedAxios.create();
      (mockClient.post as jest.Mock).mockResolvedValue({ data: mockEnrollment });

      const result = await apiService.enrollUserInSkill('user123', {
        skillId: 'skill456',
        difficultyTarget: 5,
      });

      expect(mockClient.post).toHaveBeenCalledWith('/users/user123/skills', {
        skillId: 'skill456',
        difficultyTarget: 5,
      });
      expect(result).toEqual(mockEnrollment);
    });
  });

  describe('getPendingChallenges', () => {
    it('should retrieve pending challenges for user', async () => {
      const mockChallenges = [
        {
          id: 'challenge1',
          userId: 'user123',
          skillId: 'skill456',
          question: 'Test question?',
          options: ['A', 'B', 'C', 'D'],
          correctAnswerIndex: 2,
          difficulty: 5,
          generatedAt: '2024-01-01T00:00:00Z',
        },
      ];

      const mockClient = mockedAxios.create();
      (mockClient.get as jest.Mock).mockResolvedValue({ data: mockChallenges });

      const result = await apiService.getPendingChallenges('user123');

      expect(mockClient.get).toHaveBeenCalledWith('/users/user123/challenges/pending');
      expect(result).toEqual(mockChallenges);
    });
  });

  describe('submitAnswer', () => {
    it('should submit answer and return result', async () => {
      const mockResult = {
        isCorrect: true,
        correctOption: 2,
        explanation: 'Great job!',
      };

      const mockClient = mockedAxios.create();
      (mockClient.post as jest.Mock).mockResolvedValue({ data: mockResult });

      const result = await apiService.submitAnswer({
        userId: 'user123',
        challengeId: 'challenge456',
        selectedOption: 2,
        responseTime: 5000,
        confidence: 4,
      });

      expect(mockClient.post).toHaveBeenCalledWith('/answer', expect.objectContaining({
        userId: 'user123',
        challengeId: 'challenge456',
        selectedOption: 2,
      }));
      expect(result).toEqual(mockResult);
    });
  });

  describe('getChallengeHistory', () => {
    it('should retrieve challenge history with optional limit', async () => {
      const mockHistory = [
        {
          id: 'answer1',
          userId: 'user123',
          challengeId: 'challenge1',
          selectedOption: 2,
          isCorrect: true,
          answeredAt: '2024-01-01T00:00:00Z',
        },
      ];

      const mockClient = mockedAxios.create();
      (mockClient.get as jest.Mock).mockResolvedValue({ data: mockHistory });

      const result = await apiService.getChallengeHistory('user123', 10);

      expect(mockClient.get).toHaveBeenCalledWith(
        '/users/user123/challenges/history',
        { params: { limit: 10 } }
      );
      expect(result).toEqual(mockHistory);
    });
  });

  describe('healthCheck', () => {
    it('should return true when API is healthy', async () => {
      const mockClient = mockedAxios.create();
      (mockClient.get as jest.Mock).mockResolvedValue({ data: { status: 'ok' } });

      const result = await apiService.healthCheck();

      expect(result).toBe(true);
    });

    it('should return false when API is unhealthy', async () => {
      const mockClient = mockedAxios.create();
      (mockClient.get as jest.Mock).mockRejectedValue(new Error('API error'));

      const result = await apiService.healthCheck();

      expect(result).toBe(false);
    });
  });
});
