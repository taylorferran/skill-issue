import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { apiService } from '../services/api.service';
import { userService } from '../services/user.service';
import { createErrorEmbed } from '../utils/format';
import { ChallengeHandler } from '../handlers/challenge.handler';

export const data = new SlashCommandBuilder()
  .setName('challenge')
  .setDescription('Get your next pending challenge');

let challengeHandler: ChallengeHandler;

export function setChallengeHandler(handler: ChallengeHandler): void {
  challengeHandler = handler;
}

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  try {
    await interaction.deferReply(); // Public reply - everyone can see

    // Check if user is registered
    const backendUserId = await userService.getBackendUserId(interaction.user.id);
    if (!backendUserId) {
      await interaction.editReply({
        embeds: [createErrorEmbed('You need to register first! Use `/register` to create your account.')],
      });
      return;
    }

    // Get pending challenges
    const pendingChallenges = await apiService.getPendingChallenges(backendUserId);

    if (pendingChallenges.length === 0) {
      await interaction.editReply({
        embeds: [createErrorEmbed('No pending challenges at the moment. Make sure you are enrolled in at least one skill using `/enroll`.')],
      });
      return;
    }

    // Send the first pending challenge in the channel (not DM)
    const challenge = pendingChallenges[0];

    // Send challenge directly in the channel
    await challengeHandler.sendChallengeInChannel(interaction, challenge, backendUserId);

    // Note: interaction is already replied to by sendChallengeInChannel

    console.log(`📤 Manually sent challenge to user ${interaction.user.tag}`);

  } catch (error: any) {
    console.error('Error in challenge command:', error);

    let errorMessage = 'Failed to fetch challenge';
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
