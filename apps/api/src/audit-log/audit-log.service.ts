import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Cross-cutting accountability trail for admin actions that touch money or
// verification status — refunds, payouts, tutor approval, issue handling,
// account deletion. Global module so any service can inject it without
// needing to import AuditLogModule explicitly everywhere.
@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  record(
    adminId: string,
    action: string,
    targetType: string,
    targetId: string,
  ) {
    return this.prisma.auditLog.create({
      data: { adminId, action, targetType, targetId },
    });
  }

  list() {
    return this.prisma.auditLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 200,
      include: { admin: { select: { id: true, name: true } } },
    });
  }
}
