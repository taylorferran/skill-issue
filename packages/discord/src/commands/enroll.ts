import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { apiService } from '../services/api.service';
import { userService } from '../services/user.service';
import { createSuccessEmbed, createErrorEmbed } from '../utils/format';

export const data = new SlashCommandBuilder()
  .setName('enroll')
  .setDescription('Enroll in a skill')
  .addStringOption(option =>
    option
      .setName('skill')
      .setDescription('The name of the skill to enroll in')
      .setRequired(true)
  )
  .addIntegerOption(option =>
    option
      .setName('difficulty')
      .setDescription('Your target difficulty level (1-10)')
      .setMinValue(1)
      .setMaxValue(10)
      .setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  try {
    await interaction.deferReply();

    // Check if user is registered
    const backendUserId = await userService.getBackendUserId(interaction.user.id);
    if (!backendUserId) {
      await interaction.editReply({
        embeds: [createErrorEmbed('You need to register first! Use `/register` to create your account.')],
      });
      return;
    }

    // Get parameters
    const skillName = interaction.options.getString('skill', true);
    const difficulty = interaction.options.getInteger('difficulty') || 2;

    // Find skill by name (case-insensitive partial match)
    const allSkills = await apiService.getSkills();
    const matchingSkill = allSkills.find(s =>
      s.name.toLowerCase().includes(skillName.toLowerCase())
    );

    if (!matchingSkill) {
      await interaction.editReply({
        embeds: [createErrorEmbed(`Could not find a skill matching "${skillName}". Use \`/skills\` to see all available skills.`)],
      });
      return;
    }

    // Check if already enrolled
    const userSkills = await apiService.getUserSkills(backendUserId);
    const alreadyEnrolled = userSkills.some(us => us.skillId === matchingSkill.id);

    if (alreadyEnrolled) {
      await interaction.editReply({
        embeds: [createErrorEmbed(`You are already enrolled in "${matchingSkill.name}". Use \`/unenroll\` to unenroll first.`)],
      });
      return;
    }

    // Enroll user
    await apiService.enrollUserInSkill(backendUserId, {
      skillId: matchingSkill.id,
      difficultyTarget: difficulty,
    });

    // Send success message
    const successMessage = [
      `Successfully enrolled in **${matchingSkill.name}**!`,
      '',
      `**Description:** ${matchingSkill.description}`,
      `**Target Difficulty:** ${difficulty}/10`,
      '',
      'You will start receiving challenges soon! 🎯',
    ].join('\n');

    await interaction.editReply({
      embeds: [createSuccessEmbed('Enrollment Successful', successMessage)],
    });

    console.log(`✅ User ${interaction.user.tag} enrolled in skill ${matchingSkill.name}`);

  } catch (error: any) {
    console.error('Error in enroll command:', error);

    let errorMessage = 'Enrollment failed';
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    if (interaction.deferred) {
      await interaction.editReply({
        embeds: [createErrorEmbed(errorMessage)],
      });
    } else {
      await interaction.reply({
        embeds: [createErrorEmbed(errorMessage)],
        ephemeral: true,
      });
    }
  }
}
