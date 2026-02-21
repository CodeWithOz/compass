import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

/**
 * Health check endpoint
 *
 * Used by Coolify and monitoring services to verify the application is running
 * Checks database connectivity
 */
export async function GET() {
  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json(
      {
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: 'connected',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Health check failed:', error);

    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: 'database unavailable',
      },
      { status: 503 }
    );
  }
}
