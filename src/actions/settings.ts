'use server';

import { z } from 'zod';
import { prisma } from '@/lib/db/client';
import { getSettings as getSettingsInternal } from '@/lib/settings';

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
  return getSettingsInternal();
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
      error: 'Failed to update settings',
    };
  }
}
