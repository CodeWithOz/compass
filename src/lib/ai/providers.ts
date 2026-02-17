import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import type { AIProviderType } from '@prisma/client';

/**
 * Supported AI providers for journal analysis
 */
export type AIProvider = 'claude' | 'openai' | 'gemini';

/**
 * Get the AI model for the specified provider
 *
 * Uses factory functions (createAnthropic, etc.) to support custom API keys.
 *
 * @param provider - The AI provider to use
 * @param apiKey - Optional custom API key (overrides env vars)
 * @returns The configured AI model
 */
export function getAIModel(provider: AIProvider = 'claude', apiKey?: string) {
  switch (provider) {
    case 'claude': {
      const anthropic = createAnthropic(apiKey ? { apiKey } : {});
      return anthropic('claude-sonnet-4-5-20250929');
    }

    case 'openai': {
      const openai = createOpenAI(apiKey ? { apiKey } : {});
      return openai('gpt-5.2');
    }

    case 'gemini': {
      const google = createGoogleGenerativeAI(apiKey ? { apiKey } : {});
      return google('gemini-3-pro-preview');
    }

    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
}

/**
 * Get the default AI provider from environment variables or user settings
 */
export function getDefaultProvider(): AIProvider {
  const provider = process.env.DEFAULT_AI_PROVIDER || 'claude';

  if (!['claude', 'openai', 'gemini'].includes(provider)) {
    console.warn(`Invalid DEFAULT_AI_PROVIDER: ${provider}. Falling back to "claude".`);
    return 'claude';
  }

  return provider as AIProvider;
}

/**
 * Validate that API keys are configured for the selected provider
 * Can check either environment variables or provided API key
 */
export function validateProviderConfig(provider: AIProvider, apiKey?: string): void {
  switch (provider) {
    case 'claude':
      if (!apiKey && !process.env.ANTHROPIC_API_KEY) {
        throw new Error('ANTHROPIC_API_KEY is required for Claude provider');
      }
      break;

    case 'openai':
      if (!apiKey && !process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is required for OpenAI provider');
      }
      break;

    case 'gemini':
      if (!apiKey && !process.env.GOOGLE_API_KEY) {
        throw new Error('GOOGLE_API_KEY is required for Gemini provider');
      }
      break;
  }
}

/**
 * Convert AIProviderType enum to AIProvider string
 */
export function providerTypeToProvider(type: AIProviderType): AIProvider {
  return type.toLowerCase() as AIProvider;
}

/**
 * Convert AIProvider string to AIProviderType enum
 */
export function providerToProviderType(provider: AIProvider): AIProviderType {
  return provider.toUpperCase() as AIProviderType;
}
