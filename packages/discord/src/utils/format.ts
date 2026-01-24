import { EmbedBuilder } from 'discord.js';
import { Challenge, ChallengeHistory, Skill, UserSkill } from '../types';

export function createChallengeEmbed(challenge: Challenge, username?: string): EmbedBuilder {
  const difficultyStars = '⭐'.repeat(Math.min(challenge.difficulty || 1, 5));

  const title = username
    ? `${challenge.skill?.name || 'Challenge'} - ${username}`
    : `${challenge.skill?.name || 'Challenge'}`;

  const embed = new EmbedBuilder()
    .setColor('#5865F2')
    .setTitle(title)
    .setDescription('**New Challenge!**')
    .addFields(
      { name: '❓ Question', value: challenge.question || 'No question available' },
      { name: '📊 Difficulty', value: difficultyStars + ` (${challenge.difficulty || 1}/10)`, inline: true }
    )
    .setFooter({ text: 'Click a button to answer!' })
    .setTimestamp();

  return embed;
}

export function createAnswerResultEmbed(
  isCorrect: boolean,
  correctOption: number,
  selectedOption: number,
  explanation?: string,
  challenge?: Challenge
): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(isCorrect ? '#57F287' : '#ED4245')
    .setTitle(isCorrect ? '✅ Correct!' : '❌ Incorrect')
    .addFields(
      {
        name: '📝 Your Answer',
        value: challenge?.options[selectedOption] || `Option ${selectedOption + 1}`,
        inline: true
      },
      {
        name: '✓ Correct Answer',
        value: challenge?.options[correctOption] || `Option ${correctOption + 1}`,
        inline: true
      }
    );

  if (explanation) {
    embed.addFields({ name: '💡 Explanation', value: explanation });
  }

  embed.setTimestamp();

  return embed;
}

export function createSkillsEmbed(skills: Skill[], enrolledSkillIds: Set<string>): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor('#5865F2')
    .setTitle('📚 Available Skills')
    .setDescription('Here are all available skills. Use `/enroll <skill-name>` to enroll!')
    .setTimestamp();

  // Handle undefined or null skills array
  if (!skills || !Array.isArray(skills)) {
    embed.setDescription('⚠️ Unable to load skills. Please try again later.');
    return embed;
  }

  for (const skill of skills.slice(0, 25)) { // Discord limits to 25 fields
    const isEnrolled = enrolledSkillIds.has(skill.id);
    const status = isEnrolled ? '✅ Enrolled' : '⭕ Not Enrolled';

    let value = skill.description || 'No description available';
    if (skill.difficultyRange?.min && skill.difficultyRange?.max) {
      value += `\n*Difficulty: ${skill.difficultyRange.min}-${skill.difficultyRange.max}*`;
    }

    embed.addFields({
      name: `${skill.name} ${status}`,
      value,
      inline: false
    });
  }

  return embed;
}

export function createHistoryEmbed(
  historyItems: ChallengeHistory[],
  page: number,
  totalPages: number
): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor('#5865F2')
    .setTitle('📜 Challenge History')
    .setDescription(`Page ${page + 1} of ${totalPages}`)
    .setTimestamp();

  if (historyItems.length === 0) {
    embed.setDescription('No challenge history found. Complete some challenges to see your history!');
    return embed;
  }

  for (const item of historyItems) {
    const status = item.isCorrect ? '✅' : '❌';
    const question = item.challenge?.question || 'Unknown question';
    const skillName = item.challenge?.skill?.name || 'Unknown skill';

    const fieldValue = [
      `**Question:** ${question.slice(0, 100)}${question.length > 100 ? '...' : ''}`,
      `**Skill:** ${skillName}`,
      `**Result:** ${status} ${item.isCorrect ? 'Correct' : 'Incorrect'}`,
      `**Answered:** ${new Date(item.answeredAt).toLocaleString()}`,
    ];

    if (item.responseTime) {
      fieldValue.push(`**Response Time:** ${Math.round(item.responseTime / 1000)}s`);
    }

    embed.addFields({
      name: `Challenge #${item.id.slice(0, 8)}`,
      value: fieldValue.join('\n'),
      inline: false
    });
  }

  return embed;
}

export function createUserStatsEmbed(
  userSkills: UserSkill[],
  totalChallenges?: number,
  accuracy?: number
): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor('#5865F2')
    .setTitle('📊 Your Status')
    .setTimestamp();

  if (userSkills.length === 0) {
    embed.setDescription('You are not enrolled in any skills yet. Use `/skills` to see available skills!');
    return embed;
  }

  embed.setDescription(`You are enrolled in ${userSkills.length} skill(s)`);

  if (totalChallenges !== undefined) {
    embed.addFields({
      name: '🎯 Total Challenges',
      value: totalChallenges.toString(),
      inline: true
    });
  }

  if (accuracy !== undefined) {
    embed.addFields({
      name: '📈 Overall Accuracy',
      value: `${(accuracy * 100).toFixed(1)}%`,
      inline: true
    });
  }

  for (const userSkill of userSkills.slice(0, 10)) {
    const enrolledDate = userSkill.enrolledAt ? new Date(userSkill.enrolledAt).toLocaleDateString() : 'Unknown';

    embed.addFields({
      name: `📘 ${userSkill.skill?.name || 'Unknown Skill'}`,
      value: `**Difficulty Target:** ${userSkill.difficultyTarget}/10\n**Enrolled:** ${enrolledDate}`,
      inline: true
    });
  }

  return embed;
}

export function createErrorEmbed(message: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor('#ED4245')
    .setTitle('❌ Error')
    .setDescription(message)
    .setTimestamp();
}

export function createSuccessEmbed(title: string, message: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor('#57F287')
    .setTitle(`✅ ${title}`)
    .setDescription(message)
    .setTimestamp();
}
