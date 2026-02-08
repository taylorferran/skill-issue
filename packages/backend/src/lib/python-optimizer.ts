/**
 * Python Optimizer Integration
 *
 * Wrapper to call Python optimization scripts from TypeScript.
 * Executes the optimize_challenge_prompt.py script and parses results.
 */

import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

export interface OptimizationResult {
  optimizedPrompt: string;
  baselineScore: number;
  bestScore: number;
  improvementPercent: number;
  refinements: number;
  method: string;
  opikPromptId?: string;
  opikCommitHash?: string;
  metrics?: Record<string, number>;
}

export interface OptimizationParams {
  skillId: string;
  level: number;
  refinements?: number;
  optimizerType?: 'evolutionary' | 'hrpo' | 'metaprompt';
  reset?: boolean;
}

/**
 * Run Python optimization script
 */
export async function runOptimization(params: OptimizationParams): Promise<OptimizationResult> {
  const {
    skillId,
    level,
    refinements = 5,
    optimizerType = 'evolutionary',
    reset = false,
  } = params;

  // Path to optimization directory
  const optimizationDir = path.join(__dirname, '../../../../optimization');

  // Verify Python script exists
  const scriptPath = path.join(optimizationDir, 'optimize_challenge_prompt.py');
  if (!fs.existsSync(scriptPath)) {
    throw new Error(`Python optimization script not found: ${scriptPath}`);
  }

  console.log(`[PythonOptimizer] Running optimization: ${skillId} level ${level}`);
  console.log(`[PythonOptimizer] Script: ${scriptPath}`);

  // Build command arguments
  const args = [
    'optimize_challenge_prompt.py',
    '--skill', skillId,
    '--level', String(level),
    '--refinements', String(refinements),
    '--optimizer', optimizerType,
    '--skip-experiment', // Skip comparison experiment for automation
  ];

  if (reset) {
    args.push('--reset');
  }

  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python3', args, {
      cwd: optimizationDir,
      env: {
        ...process.env,
        // Ensure Python can access environment variables
        PYTHONUNBUFFERED: '1',
      },
    });

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
      const chunk = data.toString();
      stdout += chunk;
      // Stream output for debugging
      console.log(`[PythonOptimizer] ${chunk.trim()}`);
    });

    pythonProcess.stderr.on('data', (data) => {
      const chunk = data.toString();
      stderr += chunk;
      console.error(`[PythonOptimizer] ERROR: ${chunk.trim()}`);
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(
          `Python optimization failed with exit code ${code}\n` +
          `stderr: ${stderr}\n` +
          `stdout: ${stdout.substring(0, 1000)}`
        ));
        return;
      }

      try {
        // Parse result from optimized_prompts.json
        const result = parseOptimizationResult(optimizationDir, skillId, level);
        console.log(`[PythonOptimizer] Success: ${result.baselineScore} → ${result.bestScore} (+${result.improvementPercent.toFixed(1)}%)`);
        resolve(result);
      } catch (error) {
        reject(new Error(
          `Failed to parse optimization result: ${error instanceof Error ? error.message : String(error)}\n` +
          `stdout: ${stdout.substring(0, 1000)}`
        ));
      }
    });

    pythonProcess.on('error', (error) => {
      reject(new Error(
        `Failed to spawn Python process: ${error.message}\n` +
        'Ensure Python 3 is installed and optimization dependencies are installed:\n' +
        'cd optimization && pip install -r requirements.txt'
      ));
    });
  });
}

/**
 * Parse optimization result from optimized_prompts.json
 */
function parseOptimizationResult(
  optimizationDir: string,
  skillId: string,
  level: number
): OptimizationResult {
  const jsonPath = path.join(optimizationDir, 'prompts', 'optimized_prompts.json');

  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Optimized prompts file not found: ${jsonPath}`);
  }

  const fileContent = fs.readFileSync(jsonPath, 'utf-8');
  const data = JSON.parse(fileContent);

  const skillPrompts = data.prompts?.[skillId];
  if (!skillPrompts) {
    throw new Error(`No prompts found for skill ${skillId} in optimized_prompts.json`);
  }

  const levelData = skillPrompts[String(level)];
  if (!levelData) {
    throw new Error(`No prompt found for skill ${skillId} level ${level} in optimized_prompts.json`);
  }

  // Extract data
  const optimizedPrompt = levelData.prompt;
  const baselineScore = levelData.baseline_score;
  const bestScore = levelData.best_score;
  const improvement = levelData.improvement || (bestScore - baselineScore);
  const improvementPercent = levelData.improvement_percent || (
    baselineScore > 0 ? ((bestScore - baselineScore) / baselineScore * 100) : 0
  );
  const refinements = levelData.refinements || 0;

  if (!optimizedPrompt || typeof baselineScore !== 'number' || typeof bestScore !== 'number') {
    throw new Error(`Invalid optimization result format for skill ${skillId} level ${level}`);
  }

  return {
    optimizedPrompt,
    baselineScore,
    bestScore,
    improvementPercent,
    refinements,
    method: 'evolutionary', // Default, could parse from metadata
  };
}

/**
 * Check if Python environment is properly configured
 */
export async function checkPythonEnvironment(): Promise<{
  pythonAvailable: boolean;
  scriptsAvailable: boolean;
  error?: string;
}> {
  try {
    // Check Python version
    const pythonCheck = await new Promise<boolean>((resolve) => {
      const proc = spawn('python3', ['--version']);
      proc.on('close', (code) => resolve(code === 0));
      proc.on('error', () => resolve(false));
    });

    if (!pythonCheck) {
      return {
        pythonAvailable: false,
        scriptsAvailable: false,
        error: 'Python 3 not found in PATH',
      };
    }

    // Check if optimization script exists
    const optimizationDir = path.join(__dirname, '../../../../optimization');
    const scriptPath = path.join(optimizationDir, 'optimize_challenge_prompt.py');
    const scriptsAvailable = fs.existsSync(scriptPath);

    if (!scriptsAvailable) {
      return {
        pythonAvailable: true,
        scriptsAvailable: false,
        error: `Optimization script not found at ${scriptPath}`,
      };
    }

    return {
      pythonAvailable: true,
      scriptsAvailable: true,
    };
  } catch (error) {
    return {
      pythonAvailable: false,
      scriptsAvailable: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
