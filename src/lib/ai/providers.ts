import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';

/**
 * Supported AI providers for journal analysis
 */
export type AIProvider = 'claude' | 'openai' | 'ollama';

/**
 * Get the AI model for the specified provider
 *
 * @param provider - The AI provider to use
 * @returns The configured AI model
 */
export function getAIModel(provider: AIProvider = 'claude') {
  switch (provider) {
    case 'claude':
      return anthropic('claude-sonnet-4-20250514');

    case 'openai':
      return openai('gpt-4o');

    case 'ollama':
      // For local LLM support - requires Ollama to be running
      // We'll skip this for now as it wasn't in the initial setup
      throw new Error('Ollama support not yet implemented. Use "claude" or "openai".');

    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
}

/**
 * Get the default AI provider from environment variables
 */
export function getDefaultProvider(): AIProvider {
  const provider = process.env.DEFAULT_AI_PROVIDER || 'claude';

  if (!['claude', 'openai', 'ollama'].includes(provider)) {
    console.warn(`Invalid DEFAULT_AI_PROVIDER: ${provider}. Falling back to "claude".`);
    return 'claude';
  }

  return provider as AIProvider;
}

/**
 * Validate that API keys are configured for the selected provider
 */
export function validateProviderConfig(provider: AIProvider): void {
  switch (provider) {
    case 'claude':
      if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error('ANTHROPIC_API_KEY environment variable is required for Claude provider');
      }
      break;

    case 'openai':
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY environment variable is required for OpenAI provider');
      }
      break;

    case 'ollama':
      // No API key required for local Ollama
      break;
  }
}
