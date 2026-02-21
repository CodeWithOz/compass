'use server';

import { z } from 'zod';
import { prisma } from '@/lib/db/client';
import type { AIProviderType } from '@prisma/client';

/**
 * Validation schema for updating user settings
 */
const UpdateSettingsSchema = z.object({
  // AI Configuration
  aiProvider: z.enum(['CLAUDE', 'OPENAI', 'GEMINI']).optional(),
  anthropicApiKey: z.string().optional(),
  openaiApiKey: z.string().optional(),
  geminiApiKey: z.string().optional(),

  // System Preferences
  experimentalPhases: z.boolean().optional(),
  hardMode: z.boolean().optional(),
  reflectiveReminders: z.boolean().optional(),
});

/**
 * Get user settings
 * Creates default settings if they don't exist
 */
export async function getSettings() {
  try {
    let settings = await prisma.userSettings.findUnique({
      where: { userId: 'default' },
    });

    // Create default settings if they don't exist
    if (!settings) {
      settings = await prisma.userSettings.create({
        data: {
          userId: 'default',
          aiProvider: 'CLAUDE',
          experimentalPhases: true,
          hardMode: false,
          reflectiveReminders: true,
        },
      });
    }

    return { success: true, data: settings };
  } catch (error) {
    console.error('Error fetching settings:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch settings',
    };
  }
}

/**
 * Update user settings
 */
export async function updateSettings(data: z.infer<typeof UpdateSettingsSchema>) {
  try {
    // Validate input
    const validated = UpdateSettingsSchema.parse(data);

    // Update settings (upsert in case they don't exist)
    const settings = await prisma.userSettings.upsert({
      where: { userId: 'default' },
      update: validated,
      create: {
        userId: 'default',
        aiProvider: validated.aiProvider || 'CLAUDE',
        anthropicApiKey: validated.anthropicApiKey,
        openaiApiKey: validated.openaiApiKey,
        geminiApiKey: validated.geminiApiKey,
        experimentalPhases: validated.experimentalPhases ?? true,
        hardMode: validated.hardMode ?? false,
        reflectiveReminders: validated.reflectiveReminders ?? true,
      },
    });

    return { success: true, data: settings };
  } catch (error) {
    console.error('Error updating settings:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update settings',
    };
  }
}

/**
 * Get the API key for a specific provider from settings or env vars
 * Falls back to environment variables if not set in user settings
 */
export async function getProviderApiKey(provider: AIProviderType): Promise<string | null> {
  const { data: settings } = await getSettings();

  if (!settings) {
    // Fall back to environment variables
    switch (provider) {
      case 'CLAUDE':
        return process.env.ANTHROPIC_API_KEY || null;
      case 'OPENAI':
        return process.env.OPENAI_API_KEY || null;
      case 'GEMINI':
        return process.env.GOOGLE_API_KEY || null;
    }
  }

  // Check settings first, then fall back to env vars
  switch (provider) {
    case 'CLAUDE':
      return settings.anthropicApiKey || process.env.ANTHROPIC_API_KEY || null;
    case 'OPENAI':
      return settings.openaiApiKey || process.env.OPENAI_API_KEY || null;
    case 'GEMINI':
      return settings.geminiApiKey || process.env.GOOGLE_API_KEY || null;
  }
}

/**
 * Get the current AI provider from settings or env vars
 */
export async function getCurrentProvider(): Promise<AIProviderType> {
  const { data: settings } = await getSettings();

  if (settings?.aiProvider) {
    return settings.aiProvider;
  }

  // Fall back to environment variable
  const envProvider = process.env.DEFAULT_AI_PROVIDER?.toUpperCase();
  if (envProvider === 'CLAUDE' || envProvider === 'OPENAI' || envProvider === 'GEMINI') {
    return envProvider as AIProviderType;
  }

  return 'CLAUDE';
}
