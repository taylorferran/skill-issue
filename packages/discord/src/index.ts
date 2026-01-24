import {
  Client,
  GatewayIntentBits,
  Events,
  REST,
  Routes,
  Interaction,
} from 'discord.js';
import * as dotenv from 'dotenv';
import { config } from './config';
import { userService } from './services/user.service';
import { apiService } from './services/api.service';
import { ChallengeHandler } from './handlers/challenge.handler';
import { SchedulerService } from './services/scheduler.service';

// Import commands
import * as registerCommand from './commands/register';
import * as skillsCommand from './commands/skills';
import * as enrollCommand from './commands/enroll';
import * as challengeCommand from './commands/challenge';
import * as historyCommand from './commands/history';
import * as statusCommand from './commands/status';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'DISCORD_BOT_TOKEN',
  'DISCORD_CLIENT_ID',
  'BACKEND_API_URL',
  'BACKEND_API_KEY',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// Create Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
  ],
});

// Create handlers
const challengeHandler = new ChallengeHandler();
const schedulerService = new SchedulerService(client, challengeHandler);

// Set challenge handler in challenge command
challengeCommand.setChallengeHandler(challengeHandler);

// Collect all commands
const commands = [
  registerCommand.data,
  skillsCommand.data,
  enrollCommand.data,
  challengeCommand.data,
  historyCommand.data,
  statusCommand.data,
];

// Register slash commands
async function registerCommands(): Promise<void> {
  try {
    console.log('🔄 Registering slash commands...');

    const rest = new REST().setToken(config.discordToken);

    await rest.put(
      Routes.applicationCommands(config.discordClientId),
      { body: commands.map(cmd => cmd.toJSON()) }
    );

    console.log('✅ Successfully registered slash commands');
  } catch (error) {
    console.error('❌ Error registering commands:', error);
    throw error;
  }
}

// Bot ready event
client.once(Events.ClientReady, async (readyClient) => {
  console.log(`✅ Discord bot logged in as ${readyClient.user.tag}`);
  console.log(`🤖 Bot is serving ${readyClient.guilds.cache.size} server(s)`);

  try {
    // Initialize services
    console.log('🔄 Initializing services...');

    // Initialize user service (load mappings)
    await userService.initialize();

    // Check backend connection
    const backendHealthy = await apiService.healthCheck();
    if (backendHealthy) {
      console.log('✅ Backend API connection successful');
    } else {
      console.warn('⚠️  Backend API health check failed');
    }

    // Register slash commands
    await registerCommands();

    // Start challenge scheduler
    schedulerService.start();

    console.log('🚀 Bot is fully initialized and ready!');
  } catch (error) {
    console.error('❌ Error during initialization:', error);
  }
});

// Handle slash command interactions
client.on(Events.InteractionCreate, async (interaction: Interaction) => {
  try {
    // Handle slash commands
    if (interaction.isChatInputCommand()) {
      const { commandName } = interaction;

      switch (commandName) {
        case 'register':
          await registerCommand.execute(interaction);
          break;
        case 'skills':
          await skillsCommand.execute(interaction);
          break;
        case 'enroll':
          await enrollCommand.execute(interaction);
          break;
        case 'challenge':
          await challengeCommand.execute(interaction);
          break;
        case 'history':
          await historyCommand.execute(interaction);
          break;
        case 'status':
          await statusCommand.execute(interaction);
          break;
        default:
          console.warn(`Unknown command: ${commandName}`);
      }
    }

    // Handle modal submissions (for registration)
    else if (interaction.isModalSubmit()) {
      if (interaction.customId === 'register_modal') {
        await registerCommand.handleModalSubmit(interaction);
      }
    }

    // Handle button interactions (for challenge answers and pagination)
    else if (interaction.isButton()) {
      if (challengeHandler.isAnswerButton(interaction.customId)) {
        await challengeHandler.handleAnswerButton(interaction);
      }
      // History pagination is handled within the history command
    }
  } catch (error) {
    console.error('Error handling interaction:', error);

    // Try to send an error message to the user
    try {
      const errorMessage = { content: '❌ An error occurred while processing your request.', ephemeral: true };

      if (interaction.isRepliable()) {
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(errorMessage);
        } else {
          await interaction.reply(errorMessage);
        }
      }
    } catch (followUpError) {
      console.error('Error sending error message:', followUpError);
    }
  }
});

// Error handling
client.on(Events.Error, (error) => {
  console.error('❌ Discord client error:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled promise rejection:', error);
});

process.on('SIGINT', () => {
  console.log('\n👋 Shutting down Discord bot...');
  schedulerService.stop();
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down Discord bot...');
  schedulerService.stop();
  client.destroy();
  process.exit(0);
});

// Login to Discord
console.log('🔄 Logging in to Discord...');
client.login(config.discordToken);
