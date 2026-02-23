/**
 * UserError marks an error as intentional and safe to surface to the client.
 *
 * Throw this for known, user-facing validation/business-rule failures
 * (e.g., "Phase not found", "End date must be after start date").
 * Unexpected infrastructure errors (Prisma, network) should remain plain
 * Error instances so that catch blocks can return a generic message instead.
 */
export class UserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserError';
  }
}
