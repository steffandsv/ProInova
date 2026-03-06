import { prisma as globalPrisma } from "./prisma";

export async function logAudit(
  params: {
    userId?: string | null;
    action: string;
    entityType: string;
    entityId: string;
    before?: unknown;
    after?: unknown;
    ip?: string | null;
  },
  tx?: any
): Promise<void> {
  const db = tx || globalPrisma;
  try {
    await db.auditLog.create({
      data: {
        userId: params.userId || null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        beforeJson: params.before ? JSON.parse(JSON.stringify(params.before)) : undefined,
        afterJson: params.after ? JSON.parse(JSON.stringify(params.after)) : undefined,
        ip: params.ip || null,
      },
    });
  } catch (err) {
    // Audit logging should never crash the main flow
    console.error("[AuditLog] Failed to write audit log:", err);
  }
}
