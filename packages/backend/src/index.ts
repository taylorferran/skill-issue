import express from 'express';
import dotenv from 'dotenv';
import { initSupabase } from '@/lib/supabase';
import { initOpik } from '@/lib/opik';
import { schedulerService } from '@/services/scheduler.service';
import apiRoutes from '@/api/routes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// API Routes
app.use('/api', apiRoutes);

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    name: 'Skill Issue API',
    version: '0.1.0',
    status: 'running',
    agents: {
      1: 'Scheduling',
      2: 'Challenge Design',
      3: 'Skill State',
    },
  });
});


async function start() {
  try {
    console.log('Starting Skill Issue Backend...\n');

    console.log('Initializing Supabase...');
    initSupabase();
    console.log('Supabase initialized\n');

    console.log('Initializing Opik...');
    initOpik();
    console.log('Opik initialized\n');

    // Start scheduler
    console.log('Starting Scheduler...');
    // Run every 30 minutes
    // for testing '*/5 * * * *' for every 5 minutes
    const cronExpression = process.env.SCHEDULER_CRON || '*/30 * * * *';
    schedulerService.start(cronExpression);
    console.log(`Scheduler started (${cronExpression})\n`);

    // Start Express server
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
      console.log(`API available at http://localhost:${PORT}/api`);
      console.log(`Health check at http://localhost:${PORT}/api/health\n`);
      console.log('='.repeat(60));
      console.log('Ready to accept requests');
      console.log('='.repeat(60) + '\n');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('\nSIGTERM received, shutting down gracefully...');
  schedulerService.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  schedulerService.stop();
  process.exit(0);
});

// Start the application
start();
