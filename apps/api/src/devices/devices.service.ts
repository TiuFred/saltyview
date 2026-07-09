import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type {
  AssignDeviceTagsDto,
  CreateDeviceDto,
  DeviceCommand,
  DeviceDto,
  ProviderDeviceDto,
  UpdateDeviceIconDto,
  UpdateDeviceNameDto,
} from '@casa/shared-types';
import { ProviderCommandError } from '@casa/device-contracts';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { LogsService } from '../logs/logs.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { DeviceProviderRegistry } from './device-provider.registry';
import { toDeviceDto } from './devices.mapper';

const WITH_TAGS = { include: { tags: true, turnedOnByUser: true } } satisfies Prisma.DeviceDefaultArgs;

@Injectable()
export class DevicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly logs: LogsService,
    private readonly realtime: RealtimeGateway,
    private readonly providers: DeviceProviderRegistry,
  ) {}

  async list(): Promise<DeviceDto[]> {
    const devices = await this.prisma.device.findMany({
      orderBy: { createdAt: 'asc' },
      ...WITH_TAGS,
    });
    return devices.map(toDeviceDto);
  }

  async findOne(id: string): Promise<DeviceDto> {
    const device = await this.getDeviceOrThrow(id);
    return toDeviceDto(device);
  }

  async listAvailableLgDevices(): Promise<ProviderDeviceDto[]> {
    const provider = this.providers.get('LG_THINQ');
    const devices = await provider.listDevices?.();

    if (!devices || !Array.isArray(devices)) {
      throw new ServiceUnavailableException('Não foi possível listar os aparelhos LG ThinQ no momento.');
    }

    return devices;
  }

  async listAvailableSmartThingsDevices(): Promise<ProviderDeviceDto[]> {
    const provider = this.providers.get('SMARTTHINGS');
    const devices = await provider.listDevices?.();

    if (!devices || !Array.isArray(devices)) {
      throw new ServiceUnavailableException('Não foi possível listar os aparelhos SmartThings no momento.');
    }

    return devices;
  }

  async createDevice(input: CreateDeviceDto): Promise<DeviceDto> {
    const existing = await this.prisma.device.findFirst({
      where: { externalId: input.externalId ?? null, provider: input.provider },
    });

    if (existing) {
      throw new ConflictException('Já existe um dispositivo vinculado a esse aparelho externo.');
    }

    const created = await this.prisma.device.create({
      data: {
        name: input.name,
        type: input.type,
        provider: input.provider,
        externalId: input.externalId ?? null,
        online: false,
      },
      ...WITH_TAGS,
    });

    return toDeviceDto(created);
  }

  async updateName(id: string, input: UpdateDeviceNameDto): Promise<DeviceDto> {
    await this.getDeviceOrThrow(id);
    const updated = await this.prisma.device.update({
      where: { id },
      data: { name: input.name },
      ...WITH_TAGS,
    });

    return toDeviceDto(updated);
  }

  async updateIcon(id: string, input: UpdateDeviceIconDto): Promise<DeviceDto> {
    await this.getDeviceOrThrow(id);
    const updated = await this.prisma.device.update({
      where: { id },
      data: { icon: input.icon },
      ...WITH_TAGS,
    });

    return toDeviceDto(updated);
  }

  async setTags(id: string, input: AssignDeviceTagsDto): Promise<DeviceDto> {
    await this.getDeviceOrThrow(id);
    const updated = await this.prisma.device.update({
      where: { id },
      data: { tags: { set: input.tagIds.map((tagId) => ({ id: tagId })) } },
      ...WITH_TAGS,
    });

    return toDeviceDto(updated);
  }

  async removeDevice(id: string): Promise<void> {
    await this.getDeviceOrThrow(id);
    await this.prisma.device.delete({ where: { id } });
  }

  async sendCommand(
    id: string,
    command: DeviceCommand,
    userId: string,
  ): Promise<DeviceDto> {
    const device = await this.getDeviceOrThrow(id);

    if (!device.externalId) {
      throw new ConflictException(
        'Dispositivo ainda não foi vinculado (externalId ausente). Cadastre-o no app do fabricante primeiro.',
      );
    }

    const provider = this.providers.get(device.provider);

    try {
      await provider.sendCommand(device.externalId, command);
      const [state, online] = await Promise.all([
        provider.fetchState(device.externalId, device.type),
        provider.isOnline(device.externalId),
      ]);

      const updated = await this.prisma.device.update({
        where: { id },
        data: {
          lastState: state as unknown as Prisma.InputJsonValue,
          online,
          ...(command.type === 'power'
            ? { turnedOnByUserId: command.value === 'on' ? userId : null }
            : {}),
        },
        ...WITH_TAGS,
      });

      await this.redis.setJson(`device:${id}:state`, state);
      await this.logs.record(id, userId, command.type, {
        command,
        resultState: state,
      });

      const dto = toDeviceDto(updated);
      this.realtime.emitDeviceStateUpdated({
        deviceId: id,
        state: dto.state!,
        online: dto.online,
        updatedAt: dto.updatedAt,
      });

      return dto;
    } catch (error) {
      if (error instanceof ProviderCommandError) {
        throw new BadRequestException(error.message);
      }
      throw new ServiceUnavailableException(
        `Falha ao comunicar com o provider do dispositivo: ${(error as Error).message}`,
      );
    }
  }

  async refresh(id: string): Promise<DeviceDto> {
    const device = await this.getDeviceOrThrow(id);

    if (!device.externalId) {
      return toDeviceDto(device);
    }

    const provider = this.providers.get(device.provider);

    try {
      const [state, online] = await Promise.all([
        provider.fetchState(device.externalId, device.type),
        provider.isOnline(device.externalId),
      ]);

      const updated = await this.prisma.device.update({
        where: { id },
        data: { lastState: state as unknown as Prisma.InputJsonValue, online },
        ...WITH_TAGS,
      });

      await this.redis.setJson(`device:${id}:state`, state);

      const dto = toDeviceDto(updated);
      this.realtime.emitDeviceStateUpdated({
        deviceId: id,
        state: dto.state!,
        online: dto.online,
        updatedAt: dto.updatedAt,
      });

      return dto;
    } catch (error) {
      throw new ServiceUnavailableException(
        `Falha ao sincronizar dispositivo: ${(error as Error).message}`,
      );
    }
  }

  private async getDeviceOrThrow(id: string) {
    const device = await this.prisma.device.findUnique({ where: { id }, ...WITH_TAGS });
    if (!device) {
      throw new NotFoundException('Dispositivo não encontrado');
    }
    return device;
  }
}
