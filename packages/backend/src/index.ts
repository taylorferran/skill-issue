import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initSupabase, getSupabase } from '@/lib/supabase';
import { initOpik, opikService } from '@/lib/opik';
import { schedulerService } from '@/services/scheduler.service';
import { datasetGenerator } from '@/lib/dataset-generator';
import { startPromptOptimizationScheduler } from '@/schedulers/prompt-optimization-scheduler';
import apiRoutes from '@/api/routes';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Log all requests for debugging
app.use((req, _res, next) => {
  console.log(`[Request] ${req.method} ${req.url}`);
  console.log(`[Request] Headers:`, JSON.stringify(req.headers, null, 2));
  next();
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Remove trailing slashes
app.use((req, _res, next) => {
  if (req.path !== '/' && req.path.endsWith('/')) {
    const newPath = req.path.slice(0, -1);
    console.log(`[Redirect] ${req.path} -> ${newPath}`);
    return _res.redirect(301, newPath + (req.url.slice(req.path.length) || ''));
  }
  next();
});

// CORS middleware
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
  next();
});

// Handle OPTIONS preflight requests
app.options('*', (_req, res) => {
  res.status(200).end();
});

// Serve static files (admin dashboard)
const publicPath = path.join(__dirname, '..', 'public');
app.use('/admin', express.static(publicPath));

// API Routes
app.use('/api', apiRoutes);

// Log registered routes for debugging
console.log('\n[Server] Route registration details:');
console.log(`  apiRoutes type: ${typeof apiRoutes}`);
console.log(`  apiRoutes.stack length: ${apiRoutes.stack?.length || 'undefined'}`);
if (apiRoutes.stack) {
  console.log('\n[Server] Registered API routes:');
  let routeCount = 0;
  apiRoutes.stack.forEach((r: any, index: number) => {
    if (r.route) {
      const methods = Object.keys(r.route.methods).join(', ').toUpperCase();
      console.log(`  [${index}] ${methods} /api${r.route.path}`);
      routeCount++;
    } else if (r.name === 'router') {
      console.log(`  [${index}] [Middleware: ${r.name}]`);
    } else if (r.handle?.name) {
      console.log(`  [${index}] [Middleware: ${r.handle.name}]`);
    } else {
      console.log(`  [${index}] [Unknown: ${r.name || 'anonymous'}]`);
    }
  });
  console.log(`\n[Server] Total routes registered: ${routeCount}`);
} else {
  console.error('[Server] ERROR: apiRoutes.stack is undefined - routes may not be registered!');
}

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

// 404 handler for debugging
app.use((req, res) => {
  console.log(`[404] ${req.method} ${req.path} - Route not found`);
  console.log(`[404] Headers:`, req.headers);
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
    availableRoutes: [
      'GET /api/health',
      'POST /api/users',
      'GET /api/users/:userId',
      'GET /api/skills',
      'POST /api/answer',
    ],
  });
});


/**
 * Check all skills and generate datasets for any that are missing.
 * Runs in background to not block server startup.
 */
async function ensureDatasetsExist(): Promise<void> {
  console.log('[Startup] Checking for skills without datasets...');

  try {
    const supabase = getSupabase();
    const { data: skills, error } = await supabase
      .from('skills')
      .select('id, name, description')
      .eq('active', true);

    if (error || !skills) {
      console.error('[Startup] Failed to fetch skills:', error);
      return;
    }

    if (skills.length === 0) {
      console.log('[Startup] No active skills found');
      return;
    }

    const result = await datasetGenerator.ensureAllSkillsHaveDatasets(skills as any[]);

    if (result.generated.length > 0) {
      console.log(`[Startup] Generated datasets for: ${result.generated.join(', ')}`);
    }
    if (result.skipped.length > 0) {
      console.log(`[Startup] Existing datasets for: ${result.skipped.join(', ')}`);
    }
  } catch (err) {
    console.error('[Startup] Dataset check failed:', err);
  }
}

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

    // Start prompt optimization scheduler
    console.log('Starting Prompt Optimization Scheduler...');
    await startPromptOptimizationScheduler();
    console.log('Prompt Optimization Scheduler initialized\n');

    // Check for missing datasets in background (don't block startup)
    // Disabled for manual testing - uncomment to re-enable auto-generation
    // ensureDatasetsExist().catch(err => {
    //   console.error('[Startup] Background dataset check failed:', err);
    // });

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
process.on('SIGTERM', async () => {
  console.log('\nSIGTERM received, shutting down gracefully...');
  schedulerService.stop();
  await opikService.flush();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  schedulerService.stop();
  await opikService.flush();
  process.exit(0);
});

// Start the application
start();
