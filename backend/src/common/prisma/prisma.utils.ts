import { Prisma } from '@prisma/client';

export function isUniqueConstraintError(
  error: unknown,
  constraintOrField?: string,
): error is Prisma.PrismaClientKnownRequestError {
  if (
    !(error instanceof Prisma.PrismaClientKnownRequestError) ||
    error.code !== 'P2002'
  ) {
    return false;
  }
  if (!constraintOrField) return true;
  const target = error.meta?.target;
  const targets = Array.isArray(target) ? target : [target];
  return targets.some((t) => String(t).includes(constraintOrField));
}
