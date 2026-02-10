'use server';

import { z } from 'zod';
import { prisma } from '@/lib/db/client';
import type { ResolutionType, ResolutionStatus } from '@prisma/client';

/**
 * Validation schemas for resolution operations
 */
const CreateResolutionSchema = z.object({
  name: z.string().min(1, 'Resolution name is required'),
  type: z.enum(['HABIT_BUNDLE', 'MEASURABLE_OUTCOME', 'EXPLORATORY_TRACK']),
  purpose: z.string().optional(),
  constraints: z.string().optional(),
  successSignals: z.string().optional(),
  failureModes: z.string().optional(),
  nonGoals: z.string().optional(),
  // Type-specific fields
  targetDate: z.date().optional(), // Required for MEASURABLE_OUTCOME
  exitCriteria: z.string().optional(), // Optional for EXPLORATORY_TRACK
});

const UpdateResolutionSchema = CreateResolutionSchema.partial().extend({
  id: z.string(),
});

/**
 * Create a new resolution
 *
 * Validates type-specific requirements:
 * - MEASURABLE_OUTCOME requires targetDate
 * - Other types can have optional fields
 *
 * @param data - Resolution data
 * @returns The created resolution
 */
export async function createResolution(data: z.infer<typeof CreateResolutionSchema>) {
  try {
    // Validate input
    const validated = CreateResolutionSchema.parse(data);

    // Type-specific validation
    if (validated.type === 'MEASURABLE_OUTCOME' && !validated.targetDate) {
      throw new Error('Target date is required for MEASURABLE_OUTCOME resolutions');
    }

    // Create resolution
    const resolution = await prisma.resolution.create({
      data: {
        name: validated.name,
        type: validated.type as ResolutionType,
        purpose: validated.purpose,
        constraints: validated.constraints,
        successSignals: validated.successSignals,
        failureModes: validated.failureModes,
        nonGoals: validated.nonGoals,
        targetDate: validated.targetDate,
        exitCriteria: validated.exitCriteria,
        status: 'ACTIVE',
      },
    });

    return { success: true, data: resolution };
  } catch (error) {
    console.error('Error creating resolution:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create resolution',
    };
  }
}

/**
 * Update an existing resolution
 *
 * @param data - Updated resolution data (must include id)
 * @returns The updated resolution
 */
export async function updateResolution(data: z.infer<typeof UpdateResolutionSchema>) {
  try {
    // Validate input
    const validated = UpdateResolutionSchema.parse(data);
    const { id, ...updateData } = validated;

    // Check if resolution exists
    const existing = await prisma.resolution.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('Resolution not found');
    }

    // Type-specific validation
    const finalType = (updateData.type as ResolutionType) || existing.type;
    if (finalType === 'MEASURABLE_OUTCOME') {
      const finalTargetDate = updateData.targetDate || existing.targetDate;
      if (!finalTargetDate) {
        throw new Error('Target date is required for MEASURABLE_OUTCOME resolutions');
      }
    }

    // Update resolution
    const resolution = await prisma.resolution.update({
      where: { id },
      data: updateData,
    });

    return { success: true, data: resolution };
  } catch (error) {
    console.error('Error updating resolution:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update resolution',
    };
  }
}

/**
 * Archive a resolution
 *
 * Sets status to ARCHIVED instead of deleting (preserves data for audit trail)
 *
 * @param id - Resolution ID
 * @returns The archived resolution
 */
export async function archiveResolution(id: string) {
  try {
    const resolution = await prisma.resolution.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });

    return { success: true, data: resolution };
  } catch (error) {
    console.error('Error archiving resolution:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to archive resolution',
    };
  }
}

/**
 * Pause a resolution
 *
 * Sets status to PAUSED - useful for temporary breaks
 *
 * @param id - Resolution ID
 * @returns The paused resolution
 */
export async function pauseResolution(id: string) {
  try {
    const resolution = await prisma.resolution.update({
      where: { id },
      data: { status: 'PAUSED' },
    });

    return { success: true, data: resolution };
  } catch (error) {
    console.error('Error pausing resolution:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to pause resolution',
    };
  }
}

/**
 * Reactivate a paused or archived resolution
 *
 * @param id - Resolution ID
 * @returns The reactivated resolution
 */
export async function reactivateResolution(id: string) {
  try {
    const resolution = await prisma.resolution.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });

    return { success: true, data: resolution };
  } catch (error) {
    console.error('Error reactivating resolution:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reactivate resolution',
    };
  }
}

/**
 * Get all resolutions (with optional status filter)
 *
 * @param status - Optional status filter
 * @returns List of resolutions
 */
export async function getResolutions(status?: ResolutionStatus) {
  try {
    const resolutions = await prisma.resolution.findMany({
      where: status ? { status } : undefined,
      include: {
        currentPhase: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return { success: true, data: resolutions };
  } catch (error) {
    console.error('Error fetching resolutions:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch resolutions',
    };
  }
}

/**
 * Get a single resolution by ID
 *
 * @param id - Resolution ID
 * @returns The resolution with related data
 */
export async function getResolution(id: string) {
  try {
    const resolution = await prisma.resolution.findUnique({
      where: { id },
      include: {
        currentPhase: true,
        phases: {
          orderBy: {
            startDate: 'desc',
          },
        },
      },
    });

    if (!resolution) {
      throw new Error('Resolution not found');
    }

    return { success: true, data: resolution };
  } catch (error) {
    console.error('Error fetching resolution:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch resolution',
    };
  }
}
