import { EmbedBuilder } from 'discord.js';
import {
  createChallengeEmbed,
  createAnswerResultEmbed,
  createSkillsEmbed,
  createHistoryEmbed,
  createUserStatsEmbed,
  createErrorEmbed,
  createSuccessEmbed,
} from '../../src/utils/format';
import { Challenge, Skill, UserSkill, ChallengeHistory } from '../../src/types';

describe('Format Utils', () => {
  describe('createChallengeEmbed', () => {
    it('should create challenge embed with correct fields', () => {
      const challenge: Challenge = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: 'user123',
        skillId: 'skill456',
        question: 'What is 2 + 2?',
        options: ['1', '2', '3', '4'],
        correctOption: 3,
        difficulty: 5,
        createdAt: '2024-01-01T00:00:00Z',
        skill: {
          id: 'skill456',
          name: 'Math',
          description: 'Basic math skills',
          difficultyRange: { min: 1, max: 10 },
          createdAt: '2024-01-01T00:00:00Z',
        },
      };

      const embed = createChallengeEmbed(challenge);

      expect(embed).toBeInstanceOf(EmbedBuilder);
      expect(embed.data.title).toContain('Math');
      expect(embed.data.fields).toHaveLength(3);
      expect(embed.data.fields?.[0].name).toContain('Question');
      expect(embed.data.fields?.[0].value).toBe('What is 2 + 2?');
    });
  });

  describe('createAnswerResultEmbed', () => {
    it('should create correct answer embed with green color', () => {
      const embed = createAnswerResultEmbed(true, 2, 2, 'That is correct!');

      expect(embed).toBeInstanceOf(EmbedBuilder);
      expect(embed.data.color).toBe(0x57F287); // Green
      expect(embed.data.title).toContain('Correct');
    });

    it('should create incorrect answer embed with red color', () => {
      const embed = createAnswerResultEmbed(false, 2, 1, 'Try again!');

      expect(embed).toBeInstanceOf(EmbedBuilder);
      expect(embed.data.color).toBe(0xED4245); // Red
      expect(embed.data.title).toContain('Incorrect');
    });

    it('should include explanation when provided', () => {
      const embed = createAnswerResultEmbed(true, 2, 2, 'Because math!');

      const explanationField = embed.data.fields?.find(f => f.name.includes('Explanation'));
      expect(explanationField?.value).toBe('Because math!');
    });
  });

  describe('createSkillsEmbed', () => {
    it('should create skills list embed', () => {
      const skills: Skill[] = [
        {
          id: 'skill1',
          name: 'JavaScript',
          description: 'Learn JavaScript',
          difficultyRange: { min: 1, max: 10 },
          createdAt: '2024-01-01T00:00:00Z',
        },
        {
          id: 'skill2',
          name: 'Python',
          description: 'Learn Python',
          difficultyRange: { min: 1, max: 10 },
          createdAt: '2024-01-01T00:00:00Z',
        },
      ];

      const enrolledIds = new Set(['skill1']);
      const embed = createSkillsEmbed(skills, enrolledIds);

      expect(embed).toBeInstanceOf(EmbedBuilder);
      expect(embed.data.fields).toHaveLength(2);
      expect(embed.data.fields?.[0].name).toContain('Enrolled');
      expect(embed.data.fields?.[1].name).toContain('Not Enrolled');
    });
  });

  describe('createHistoryEmbed', () => {
    it('should create history embed with items', () => {
      const historyItems: ChallengeHistory[] = [
        {
          id: 'answer1',
          userId: 'user1',
          challengeId: 'challenge1',
          selectedOption: 2,
          isCorrect: true,
          answeredAt: '2024-01-01T00:00:00Z',
          challenge: {
            id: 'challenge1',
            userId: 'user1',
            skillId: 'skill1',
            question: 'Test question?',
            options: ['A', 'B', 'C', 'D'],
            correctOption: 2,
            difficulty: 5,
            createdAt: '2024-01-01T00:00:00Z',
            skill: {
              id: 'skill1',
              name: 'Math',
              description: 'Math skills',
              difficultyRange: { min: 1, max: 10 },
              createdAt: '2024-01-01T00:00:00Z',
            },
          },
        },
      ];

      const embed = createHistoryEmbed(historyItems, 0, 1);

      expect(embed).toBeInstanceOf(EmbedBuilder);
      expect(embed.data.fields).toHaveLength(1);
      expect(embed.data.fields?.[0].value).toContain('Correct');
    });

    it('should show empty message when no history', () => {
      const embed = createHistoryEmbed([], 0, 1);

      expect(embed.data.description).toContain('No challenge history');
    });
  });

  describe('createUserStatsEmbed', () => {
    it('should create stats embed with user skills', () => {
      const userSkills: UserSkill[] = [
        {
          id: 'us1',
          userId: 'user1',
          skillId: 'skill1',
          difficultyTarget: 5,
          enrolledAt: '2024-01-01T00:00:00Z',
          skill: {
            id: 'skill1',
            name: 'JavaScript',
            description: 'JS skills',
            difficultyRange: { min: 1, max: 10 },
            createdAt: '2024-01-01T00:00:00Z',
          },
        },
      ];

      const embed = createUserStatsEmbed(userSkills, 10, 0.85);

      expect(embed).toBeInstanceOf(EmbedBuilder);
      expect(embed.data.fields).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: '🎯 Total Challenges' }),
          expect.objectContaining({ name: '📈 Overall Accuracy' }),
        ])
      );
    });

    it('should show message when no skills enrolled', () => {
      const embed = createUserStatsEmbed([]);

      expect(embed.data.description).toContain('not enrolled in any skills');
    });
  });

  describe('createErrorEmbed', () => {
    it('should create error embed with red color', () => {
      const embed = createErrorEmbed('Something went wrong!');

      expect(embed).toBeInstanceOf(EmbedBuilder);
      expect(embed.data.color).toBe(0xED4245); // Red
      expect(embed.data.title).toContain('Error');
      expect(embed.data.description).toBe('Something went wrong!');
    });
  });

  describe('createSuccessEmbed', () => {
    it('should create success embed with green color', () => {
      const embed = createSuccessEmbed('Success', 'Operation completed!');

      expect(embed).toBeInstanceOf(EmbedBuilder);
      expect(embed.data.color).toBe(0x57F287); // Green
      expect(embed.data.title).toContain('Success');
      expect(embed.data.description).toBe('Operation completed!');
    });
  });
});
