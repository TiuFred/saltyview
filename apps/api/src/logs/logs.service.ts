import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LogsService {
  constructor(private readonly prisma: PrismaService) {}

  record(
    deviceId: string,
    userId: string,
    action: string,
    payload: Record<string, unknown>,
  ) {
    return this.prisma.deviceLog.create({
      data: {
        deviceId,
        userId,
        action,
        payload: payload as Prisma.InputJsonValue,
      },
    });
  }

  listByDevice(deviceId: string, take = 50) {
    return this.prisma.deviceLog.findMany({
      where: { deviceId },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }
}
