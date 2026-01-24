import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ModalSubmitInteraction,
} from 'discord.js';
import { apiService } from '../services/api.service';
import { userService } from '../services/user.service';
import { createSuccessEmbed, createErrorEmbed } from '../utils/format';

export const data = new SlashCommandBuilder()
  .setName('register')
  .setDescription('Register as a new user to start learning');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  try {
    // Check if user is already registered
    const isRegistered = await userService.isUserRegistered(interaction.user.id);
    if (isRegistered) {
      await interaction.reply({
        embeds: [createErrorEmbed('You are already registered! Use `/status` to view your profile.')],
        ephemeral: true,
      });
      return;
    }

    // Create a modal for registration
    const modal = new ModalBuilder()
      .setCustomId('register_modal')
      .setTitle('User Registration');

    const timezoneInput = new TextInputBuilder()
      .setCustomId('timezone')
      .setLabel('Timezone (e.g., America/New_York, UTC)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('America/New_York')
      .setRequired(true);

    const quietHoursStartInput = new TextInputBuilder()
      .setCustomId('quiet_hours_start')
      .setLabel('Quiet Hours Start (0-23, optional)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('22')
      .setRequired(false);

    const quietHoursEndInput = new TextInputBuilder()
      .setCustomId('quiet_hours_end')
      .setLabel('Quiet Hours End (0-23, optional)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('7')
      .setRequired(false);

    const maxChallengesInput = new TextInputBuilder()
      .setCustomId('max_challenges')
      .setLabel('Max Challenges Per Day (default: 5)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('5')
      .setRequired(false);

    const row1 = new ActionRowBuilder<TextInputBuilder>().addComponents(timezoneInput);
    const row2 = new ActionRowBuilder<TextInputBuilder>().addComponents(quietHoursStartInput);
    const row3 = new ActionRowBuilder<TextInputBuilder>().addComponents(quietHoursEndInput);
    const row4 = new ActionRowBuilder<TextInputBuilder>().addComponents(maxChallengesInput);

    modal.addComponents(row1, row2, row3, row4);

    await interaction.showModal(modal);

  } catch (error: any) {
    console.error('Error in register command:', error);
    if (!interaction.replied) {
      await interaction.reply({
        embeds: [createErrorEmbed(`Registration failed: ${error.message}`)],
        ephemeral: true,
      });
    }
  }
}

export async function handleModalSubmit(interaction: ModalSubmitInteraction): Promise<void> {
  try {
    await interaction.deferReply({ ephemeral: true });

    // Get form values
    const timezone = interaction.fields.getTextInputValue('timezone');
    const quietHoursStartStr = interaction.fields.getTextInputValue('quiet_hours_start');
    const quietHoursEndStr = interaction.fields.getTextInputValue('quiet_hours_end');
    const maxChallengesStr = interaction.fields.getTextInputValue('max_challenges');

    // Parse optional values
    const quietHoursStart = quietHoursStartStr ? parseInt(quietHoursStartStr, 10) : undefined;
    const quietHoursEnd = quietHoursEndStr ? parseInt(quietHoursEndStr, 10) : undefined;
    const maxChallenges = maxChallengesStr ? parseInt(maxChallengesStr, 10) : 5;

    // Validate quiet hours
    if (quietHoursStart !== undefined && (quietHoursStart < 0 || quietHoursStart > 23)) {
      await interaction.editReply({
        embeds: [createErrorEmbed('Quiet hours start must be between 0 and 23')],
      });
      return;
    }

    if (quietHoursEnd !== undefined && (quietHoursEnd < 0 || quietHoursEnd > 23)) {
      await interaction.editReply({
        embeds: [createErrorEmbed('Quiet hours end must be between 0 and 23')],
      });
      return;
    }

    // Create user in backend
    const user = await apiService.createUser({
      timezone,
      quietHoursStart,
      quietHoursEnd,
      maxChallengesPerDay: maxChallenges,
      discordUserId: interaction.user.id,
    });

    // Store mapping
    await userService.createMapping(interaction.user.id, user.id);

    // Send success message
    const successMessage = [
      `Welcome, ${interaction.user.username}! 🎉`,
      '',
      `**User ID:** \`${user.id.slice(0, 8)}\``,
      `**Timezone:** ${user.timezone}`,
      `**Max Challenges/Day:** ${user.maxChallengesPerDay}`,
    ];

    if (user.quietHoursStart !== undefined && user.quietHoursEnd !== undefined) {
      successMessage.push(`**Quiet Hours:** ${user.quietHoursStart}:00 - ${user.quietHoursEnd}:00`);
    }

    successMessage.push('', 'Use `/skills` to see available skills and `/enroll` to start learning!');

    await interaction.editReply({
      embeds: [createSuccessEmbed('Registration Complete', successMessage.join('\n'))],
    });

    console.log(`✅ New user registered: ${interaction.user.tag} (${user.id})`);

  } catch (error: any) {
    console.error('Error handling register modal:', error);

    let errorMessage = 'Registration failed';
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    await interaction.editReply({
      embeds: [createErrorEmbed(errorMessage)],
    });
  }
}
