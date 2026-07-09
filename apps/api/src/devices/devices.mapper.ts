import type { Prisma } from '@prisma/client';
import type { DeviceDto } from '@casa/shared-types';

type DeviceWithTags = Prisma.DeviceGetPayload<{ include: { tags: true } }>;

export function toDeviceDto(device: DeviceWithTags): DeviceDto {
  return {
    id: device.id,
    name: device.name,
    type: device.type,
    provider: device.provider,
    externalId: device.externalId,
    linked: Boolean(device.externalId),
    online: device.online,
    state: (device.lastState as DeviceDto['state']) ?? null,
    icon: device.icon,
    tags: device.tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      createdAt: tag.createdAt.toISOString(),
    })),
    updatedAt: device.updatedAt.toISOString(),
  };
}
