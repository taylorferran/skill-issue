import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'es2022',
  platform: 'node',
  outDir: 'dist',
  clean: true,
  sourcemap: false,
  minify: false,
  bundle: true,
  splitting: false,
  treeshake: true,
  external: [
    'express',
    'dotenv',
    '@supabase/supabase-js',
    '@anthropic-ai/sdk',
    'node-cron',
    'expo-server-sdk',
    'zod'
  ],
});
