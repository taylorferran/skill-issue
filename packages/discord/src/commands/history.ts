import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ComponentType,
} from 'discord.js';
import { apiService } from '../services/api.service';
import { userService } from '../services/user.service';
import { createHistoryEmbed, createErrorEmbed } from '../utils/format';
import { ChallengeHistory } from '../types';

export const data = new SlashCommandBuilder()
  .setName('history')
  .setDescription('View your challenge history')
  .addIntegerOption(option =>
    option
      .setName('limit')
      .setDescription('Number of challenges to show (default: 10, max: 50)')
      .setMinValue(1)
      .setMaxValue(50)
      .setRequired(false)
  );

const ITEMS_PER_PAGE = 5;

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
    const limit = interaction.options.getInteger('limit') || 10;

    // Fetch history
    const history = await apiService.getChallengeHistory(backendUserId, limit);

    if (history.length === 0) {
      await interaction.editReply({
        embeds: [createErrorEmbed('No challenge history found. Complete some challenges to build your history!')],
      });
      return;
    }

    // Calculate pagination
    const totalPages = Math.ceil(history.length / ITEMS_PER_PAGE);
    let currentPage = 0;

    // Create pagination buttons
    const createButtons = (page: number) => {
      const prevButton = new ButtonBuilder()
        .setCustomId('prev_page')
        .setLabel('◀️ Previous')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(page === 0);

      const nextButton = new ButtonBuilder()
        .setCustomId('next_page')
        .setLabel('Next ▶️')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(page === totalPages - 1);

      return new ActionRowBuilder<ButtonBuilder>().addComponents(prevButton, nextButton);
    };

    // Get items for current page
    const getPageItems = (page: number): ChallengeHistory[] => {
      const start = page * ITEMS_PER_PAGE;
      const end = start + ITEMS_PER_PAGE;
      return history.slice(start, end);
    };

    // Send initial page
    const embed = createHistoryEmbed(getPageItems(currentPage), currentPage, totalPages);
    const components = totalPages > 1 ? [createButtons(currentPage)] : [];

    const message = await interaction.editReply({
      embeds: [embed],
      components,
    });

    if (totalPages <= 1) {
      return;
    }

    // Create collector for pagination
    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 300000, // 5 minutes
    });

    collector.on('collect', async (buttonInteraction) => {
      if (buttonInteraction.user.id !== interaction.user.id) {
        await buttonInteraction.reply({
          content: 'These buttons are not for you!',
          ephemeral: true,
        });
        return;
      }

      if (buttonInteraction.customId === 'prev_page') {
        currentPage = Math.max(0, currentPage - 1);
      } else if (buttonInteraction.customId === 'next_page') {
        currentPage = Math.min(totalPages - 1, currentPage + 1);
      }

      const newEmbed = createHistoryEmbed(getPageItems(currentPage), currentPage, totalPages);
      const newComponents = [createButtons(currentPage)];

      await buttonInteraction.update({
        embeds: [newEmbed],
        components: newComponents,
      });
    });

    collector.on('end', async () => {
      // Disable buttons after timeout
      const disabledRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('prev_page')
          .setLabel('◀️ Previous')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId('next_page')
          .setLabel('Next ▶️')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(true)
      );

      try {
        await interaction.editReply({ components: [disabledRow] });
      } catch (error) {
        // Message may have been deleted
      }
    });

  } catch (error: any) {
    console.error('Error in history command:', error);

    let errorMessage = 'Failed to fetch history';
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
