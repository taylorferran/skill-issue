import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { apiService } from '../services/api.service';
import { userService } from '../services/user.service';
import { createSkillsEmbed, createErrorEmbed } from '../utils/format';

export const data = new SlashCommandBuilder()
  .setName('skills')
  .setDescription('List all available skills');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  try {
    await interaction.deferReply();

    // Get all skills
    const skills = await apiService.getSkills();

    console.log('[Skills Command] Fetched skills:', skills ? skills.length : 'undefined');

    if (!skills || skills.length === 0) {
      await interaction.editReply({
        embeds: [createErrorEmbed('No skills available at the moment.')],
      });
      return;
    }

    // Check if user is registered to show enrollment status
    let enrolledSkillIds = new Set<string>();
    const backendUserId = await userService.getBackendUserId(interaction.user.id);

    if (backendUserId) {
      try {
        const userSkills = await apiService.getUserSkills(backendUserId);
        enrolledSkillIds = new Set(userSkills.map(us => us.skillId));
      } catch (error) {
        console.error('Error fetching user skills:', error);
        // Continue without enrollment status
      }
    }

    // Create and send embed
    const embed = createSkillsEmbed(skills, enrolledSkillIds);
    await interaction.editReply({ embeds: [embed] });

  } catch (error: any) {
    console.error('Error in skills command:', error);

    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch skills';

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
