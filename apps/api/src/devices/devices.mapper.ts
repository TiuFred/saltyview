import type { Device as PrismaDevice } from '@prisma/client';
import type { DeviceDto } from '@casa/shared-types';

export function toDeviceDto(device: PrismaDevice): DeviceDto {
  return {
    id: device.id,
    name: device.name,
    type: device.type,
    provider: device.provider,
    externalId: device.externalId,
    linked: Boolean(device.externalId),
    online: device.online,
    state: (device.lastState as DeviceDto['state']) ?? null,
    updatedAt: device.updatedAt.toISOString(),
  };
}
