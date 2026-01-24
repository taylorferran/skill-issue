import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { apiService } from '../services/api.service';
import { userService } from '../services/user.service';
import { createUserStatsEmbed, createErrorEmbed } from '../utils/format';

export const data = new SlashCommandBuilder()
  .setName('status')
  .setDescription('View your account status and progress');

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

    // Fetch user data
    const [, userSkills, history] = await Promise.all([
      apiService.getUser(backendUserId),
      apiService.getUserSkills(backendUserId),
      apiService.getChallengeHistory(backendUserId, 1000), // Get all history for stats
    ]);

    // Calculate statistics
    const totalChallenges = history.length;
    const correctAnswers = history.filter(h => h.isCorrect).length;
    const accuracy = totalChallenges > 0 ? correctAnswers / totalChallenges : 0;

    // Create and send embed
    const embed = createUserStatsEmbed(userSkills, totalChallenges, accuracy);

    await interaction.editReply({ embeds: [embed] });

  } catch (error: any) {
    console.error('Error in status command:', error);

    let errorMessage = 'Failed to fetch status';
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
