import {
  User,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ButtonInteraction,
  ChatInputCommandInteraction,
} from 'discord.js';
import { Challenge } from '../types';
import { apiService } from '../services/api.service';
import { createChallengeEmbed, createAnswerResultEmbed, createErrorEmbed } from '../utils/format';

export class ChallengeHandler {
  private activeChallenges: Map<string, { challengeId: string; userId: string; sentAt: number }> = new Map();

  async sendChallenge(discordUser: User, challenge: Challenge, backendUserId: string): Promise<void> {
    try {
      // Validate challenge has options
      if (!challenge.options || !Array.isArray(challenge.options) || challenge.options.length === 0) {
        console.error('Challenge has no options:', challenge);
        throw new Error('Challenge is missing answer options');
      }

      // Create the challenge embed (for DMs, no username needed)
      const embed = createChallengeEmbed(challenge);

      // Create answer buttons (4 options)
      const buttons = challenge.options.map((option, index) => {
        return new ButtonBuilder()
          .setCustomId(`answer_${challenge.id}_${index}`)
          .setLabel(`${index + 1}. ${option.slice(0, 75)}`) // Discord button label limit
          .setStyle(ButtonStyle.Primary);
      });

      // Create action rows (max 5 buttons per row)
      const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(buttons.slice(0, 2));
      const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(buttons.slice(2, 4));

      // Send DM to user
      const message = await discordUser.send({
        embeds: [embed],
        components: [row1, row2],
      });

      // Track active challenge
      this.activeChallenges.set(message.id, {
        challengeId: challenge.id,
        userId: backendUserId,
        sentAt: Date.now(),
      });

      console.log(`📤 Sent challenge ${challenge.id} to user ${discordUser.tag}`);
    } catch (error) {
      console.error(`Error sending challenge to user ${discordUser.id}:`, error);
      throw error;
    }
  }

  async sendChallengeInChannel(interaction: ChatInputCommandInteraction, challenge: Challenge, backendUserId: string): Promise<void> {
    try {
      // Validate challenge has options
      if (!challenge.options || !Array.isArray(challenge.options) || challenge.options.length === 0) {
        console.error('Challenge has no options:', challenge);
        throw new Error('Challenge is missing answer options');
      }

      // Create the challenge embed with username
      const embed = createChallengeEmbed(challenge, interaction.user.username);

      // Create answer buttons (4 options)
      const buttons = challenge.options.map((option, index) => {
        return new ButtonBuilder()
          .setCustomId(`answer_${challenge.id}_${index}_${interaction.user.id}`) // Add user ID to prevent others from clicking
          .setLabel(`${index + 1}. ${option.slice(0, 70)}`) // Slightly shorter to fit user ID
          .setStyle(ButtonStyle.Primary);
      });

      // Create action rows (max 5 buttons per row)
      const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(buttons.slice(0, 2));
      const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(buttons.slice(2, 4));

      // Send challenge - only visible to the user who requested it (ephemeral)
      const message = await interaction.editReply({
        embeds: [embed],
        components: [row1, row2],
      });

      // Track active challenge
      this.activeChallenges.set(message.id, {
        challengeId: challenge.id,
        userId: backendUserId,
        sentAt: Date.now(),
      });

      console.log(`📤 Sent challenge ${challenge.id} in channel for user ${interaction.user.tag}`);
    } catch (error) {
      console.error(`Error sending challenge in channel:`, error);
      throw error;
    }
  }

  async handleAnswerButton(interaction: ButtonInteraction): Promise<void> {
    try {
      // Parse button custom ID: answer_{challengeId}_{optionIndex}_{userId}
      const parts = interaction.customId.split('_');
      const challengeId = parts[1];
      const optionIndexStr = parts[2];
      const originalUserId = parts[3]; // User who requested the challenge

      // Check if this is the user who requested the challenge (they can still answer their own)
      // But we'll allow it for now to see who's answering
      const isOriginalUser = !originalUserId || originalUserId === interaction.user.id;

      const selectedOption = parseInt(optionIndexStr, 10);

      // Get active challenge data
      const challengeData = this.activeChallenges.get(interaction.message.id);
      if (!challengeData) {
        await interaction.reply({
          embeds: [createErrorEmbed('This challenge has expired or already been answered.')],
          ephemeral: true,
        });
        return;
      }

      // Calculate response time
      const responseTime = Date.now() - challengeData.sentAt;

      // Defer the reply to give us time to process
      await interaction.deferUpdate();

      // Submit answer to backend
      const result = await apiService.submitAnswer({
        userId: challengeData.userId,
        challengeId: challengeData.challengeId,
        selectedOption,
        responseTime,
      });

      // Get the original challenge for context
      const originalEmbed = interaction.message.embeds[0];
      let challenge: Partial<Challenge> | undefined;

      try {
        // Try to reconstruct challenge from embed (not perfect but works)
        const questionField = originalEmbed.fields?.find(f => f.name.includes('Question'));
        challenge = {
          id: challengeId,
          question: questionField?.value || '',
          options: [],
        };

        // Extract options from the buttons
        const allComponents = interaction.message.components.flatMap((row: any) => row.components || []);
        challenge.options = allComponents.map((button: any) => {
          const label = button.label || '';
          return label.slice(3); // Remove "1. " prefix
        });
      } catch (error) {
        console.error('Error reconstructing challenge:', error);
      }

      // Create result embed
      const resultEmbed = createAnswerResultEmbed(
        result.isCorrect,
        result.correctOption,
        selectedOption,
        result.explanation,
        challenge as Challenge | undefined
      );

      // Disable all buttons
      const disabledComponents = interaction.message.components.map(row => {
        const actionRow = ActionRowBuilder.from(row as any);
        actionRow.components.forEach((button: any) => {
          if (button.data && button.data.custom_id) {
            button.setDisabled(true);
            // Highlight the correct answer
            if (button.data.custom_id.endsWith(`_${result.correctOption}`)) {
              button.setStyle(ButtonStyle.Success);
            } else if (button.data.custom_id.endsWith(`_${selectedOption}`)) {
              button.setStyle(result.isCorrect ? ButtonStyle.Success : ButtonStyle.Danger);
            } else {
              button.setStyle(ButtonStyle.Secondary);
            }
          }
        });
        return actionRow;
      });

      // Edit original message with result - add who answered
      const resultWithUser = createAnswerResultEmbed(
        result.isCorrect,
        result.correctOption,
        selectedOption,
        result.explanation,
        challenge as Challenge | undefined
      );

      // Add username to result
      resultWithUser.setAuthor({ name: `${interaction.user.username} answered` });

      // Edit original message with result
      await interaction.editReply({
        embeds: [resultWithUser],
        components: disabledComponents as any,
      });

      // Remove from active challenges
      this.activeChallenges.delete(interaction.message.id);

      console.log(`✅ User answered challenge ${challengeId}: ${result.isCorrect ? 'correct' : 'incorrect'}`);

    } catch (error: any) {
      console.error('Error handling answer button:', error);

      try {
        await interaction.followUp({
          embeds: [createErrorEmbed(`Failed to submit answer: ${error.message}`)],
          ephemeral: true,
        });
      } catch (followUpError) {
        console.error('Error sending follow-up error message:', followUpError);
      }
    }
  }

  isAnswerButton(customId: string): boolean {
    return customId.startsWith('answer_');
  }
}
