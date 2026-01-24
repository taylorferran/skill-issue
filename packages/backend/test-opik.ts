/**
 * Quick test script to verify Opik integration works
 * Run with: npx tsx test-opik.ts
 */

import dotenv from 'dotenv';
dotenv.config();

import { opikService, initOpik } from './src/lib/opik';

async function testOpik() {
  console.log('Testing Opik integration...\n');

  // Initialize
  initOpik();

  if (!opikService.isConfigured()) {
    console.log('⚠️  Opik not configured - traces will only log to console');
    console.log('Set OPIK_API_KEY in .env to enable real tracing\n');
  } else {
    console.log('✓ Opik configured and ready\n');
  }

  // Test 1: Simple trace
  console.log('Test 1: Creating a simple trace...');
  const traceId = await opikService.startTrace({
    name: 'test_trace',
    input: { message: 'Hello from test!' },
    tags: ['test', 'manual'],
  });

  await opikService.endTrace({
    traceId,
    output: { result: 'success' },
  });
  console.log(`✓ Trace created: ${traceId}\n`);

  // Test 2: LLM call tracking (simulated)
  console.log('Test 2: Tracking simulated LLM call...');
  await opikService.trackLLMCall({
    model: 'claude-haiku-4-5-20251001',
    prompt: 'What is 2+2?',
    response: 'The answer is 4.',
    promptTokens: 10,
    completionTokens: 5,
    durationMs: 250,
    success: true,
    metadata: { test: true },
  });
  console.log('✓ LLM call tracked with token usage and cost\n');

  // Test 3: Agent execution tracking
  console.log('Test 3: Tracking agent execution...');
  await opikService.trackAgentExecution({
    agentName: 'test_agent',
    input: { userId: 'test-user', skillId: 'test-skill' },
    output: { challengeId: 'test-challenge-123' },
    durationMs: 1500,
    success: true,
    metadata: { difficulty: 5 },
  });
  console.log('✓ Agent execution tracked\n');

  // Flush pending requests
  console.log('Flushing pending requests...');
  await opikService.flush();

  console.log('\n✅ All tests complete!');
  console.log('Check your Opik dashboard at https://www.comet.com to see the traces.');
}

testOpik().catch(console.error);
