'use server';

import { z } from 'zod';
import { prisma } from '@/lib/db/client';

/**
 * Validation schemas for phase operations
 */
const CreatePhaseSchema = z.object({
  resolutionId: z.string(),
  name: z.string().min(1, 'Phase name is required'),
  description: z.string().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  expectedFrequency: z.string().optional(), // e.g., "daily", "3x/week"
  intensityLevel: z.number().min(1).max(5).optional(), // 1-5 scale
});

const UpdatePhaseSchema = CreatePhaseSchema.partial().extend({
  id: z.string(),
});

/**
 * Create a new phase for a resolution
 *
 * @param data - Phase data
 * @returns The created phase
 */
export async function createPhase(data: z.infer<typeof CreatePhaseSchema>) {
  try {
    // Validate input
    const validated = CreatePhaseSchema.parse(data);

    // Validate date range
    if (validated.endDate && validated.endDate < validated.startDate) {
      throw new Error('End date must be after start date');
    }

    // Create phase
    const phase = await prisma.resolutionPhase.create({
      data: {
        resolutionId: validated.resolutionId,
        name: validated.name,
        description: validated.description,
        startDate: validated.startDate,
        endDate: validated.endDate,
        expectedFrequency: validated.expectedFrequency,
        intensityLevel: validated.intensityLevel,
      },
    });

    return { success: true, data: phase };
  } catch (error) {
    console.error('Error creating phase:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create phase',
    };
  }
}

/**
 * Update an existing phase
 *
 * @param data - Updated phase data (must include id)
 * @returns The updated phase
 */
export async function updatePhase(data: z.infer<typeof UpdatePhaseSchema>) {
  try {
    // Validate input
    const validated = UpdatePhaseSchema.parse(data);
    const { id, ...updateData } = validated;

    // Check if phase exists
    const existing = await prisma.resolutionPhase.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('Phase not found');
    }

    // Validate date range if dates are being updated
    const finalStartDate = updateData.startDate || existing.startDate;
    const finalEndDate = updateData.endDate !== undefined ? updateData.endDate : existing.endDate;

    if (finalEndDate && finalEndDate < finalStartDate) {
      throw new Error('End date must be after start date');
    }

    // Update phase
    const phase = await prisma.resolutionPhase.update({
      where: { id },
      data: updateData,
    });

    return { success: true, data: phase };
  } catch (error) {
    console.error('Error updating phase:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update phase',
    };
  }
}

/**
 * Activate a phase for a resolution
 *
 * Sets the phase as the current phase for the resolution
 *
 * @param resolutionId - Resolution ID
 * @param phaseId - Phase ID to activate
 * @returns The updated resolution
 */
export async function activatePhase(resolutionId: string, phaseId: string) {
  try {
    // Verify phase belongs to resolution
    const phase = await prisma.resolutionPhase.findUnique({
      where: { id: phaseId },
    });

    if (!phase) {
      throw new Error('Phase not found');
    }

    if (phase.resolutionId !== resolutionId) {
      throw new Error('Phase does not belong to this resolution');
    }

    // Activate phase
    const resolution = await prisma.resolution.update({
      where: { id: resolutionId },
      data: { currentPhaseId: phaseId },
      include: {
        currentPhase: true,
      },
    });

    return { success: true, data: resolution };
  } catch (error) {
    console.error('Error activating phase:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to activate phase',
    };
  }
}

/**
 * Deactivate the current phase for a resolution
 *
 * Clears the current phase (useful when phase ends or transitioning)
 *
 * @param resolutionId - Resolution ID
 * @returns The updated resolution
 */
export async function deactivatePhase(resolutionId: string) {
  try {
    const resolution = await prisma.resolution.update({
      where: { id: resolutionId },
      data: { currentPhaseId: null },
      include: {
        currentPhase: true,
      },
    });

    return { success: true, data: resolution };
  } catch (error) {
    console.error('Error deactivating phase:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to deactivate phase',
    };
  }
}

/**
 * Get all active phases across all resolutions
 *
 * Useful for dashboard overview of current phases
 *
 * @returns List of resolutions with active phases
 */
export async function getActivePhases() {
  try {
    const resolutions = await prisma.resolution.findMany({
      where: {
        status: 'ACTIVE',
        currentPhaseId: {
          not: null,
        },
      },
      include: {
        currentPhase: true,
      },
    });

    return { success: true, data: resolutions };
  } catch (error) {
    console.error('Error fetching active phases:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch active phases',
    };
  }
}

/**
 * Get all phases for a resolution
 *
 * @param resolutionId - Resolution ID
 * @returns List of phases
 */
export async function getPhases(resolutionId: string) {
  try {
    const phases = await prisma.resolutionPhase.findMany({
      where: { resolutionId },
      orderBy: {
        startDate: 'desc',
      },
    });

    return { success: true, data: phases };
  } catch (error) {
    console.error('Error fetching phases:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch phases',
    };
  }
}

/**
 * Delete a phase
 *
 * Note: If this is the current phase, it will be deactivated first
 *
 * @param id - Phase ID
 * @returns Success status
 */
export async function deletePhase(id: string) {
  try {
    // Check if phase is currently active
    const phase = await prisma.resolutionPhase.findUnique({
      where: { id },
      include: {
        activeResolutions: true,
      },
    });

    if (!phase) {
      throw new Error('Phase not found');
    }

    // Atomically deactivate resolutions and delete the phase
    await prisma.$transaction([
      ...(phase.activeResolutions.length > 0
        ? [prisma.resolution.updateMany({
            where: { currentPhaseId: id },
            data: { currentPhaseId: null },
          })]
        : []),
      prisma.resolutionPhase.delete({
        where: { id },
      }),
    ]);

    return { success: true };
  } catch (error) {
    console.error('Error deleting phase:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete phase',
    };
  }
}
