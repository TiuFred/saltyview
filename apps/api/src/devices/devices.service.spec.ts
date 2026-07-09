import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ProviderCommandError } from '@casa/device-contracts';
import { DevicesService } from './devices.service';

describe('DevicesService', () => {
  const linkedDevice = {
    id: 'device-tv',
    name: 'TV Samsung',
    type: 'TV',
    provider: 'SMARTTHINGS',
    externalId: 'external-1',
    roomId: null,
    lastState: null,
    online: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const unlinkedDevice = { ...linkedDevice, id: 'device-ac', externalId: null };

  const prisma = { device: { findMany: jest.fn(), findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn() } };
  const redis = { getJson: jest.fn(), setJson: jest.fn() };
  const logs = { record: jest.fn() };
  const realtime = { emitDeviceStateUpdated: jest.fn() };
  const provider = {
    providerType: 'SMARTTHINGS',
    fetchState: jest.fn(),
    sendCommand: jest.fn(),
    isOnline: jest.fn(),
    listDevices: jest.fn(),
  };
  const providers = { get: jest.fn(() => provider) };
  const config = { get: jest.fn((key: string, defaultValue?: string) => ({ SEED_ADMIN_EMAIL: 'admin@example.com' }[key] ?? defaultValue)) };

  let service: DevicesService;

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.device = { findMany: jest.fn(), findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn() };
    provider.fetchState = jest.fn();
    provider.sendCommand = jest.fn();
    provider.isOnline = jest.fn();
    provider.listDevices = jest.fn();
    providers.get = jest.fn(() => provider) as never;
    config.get = jest.fn((key: string, defaultValue?: string) => ({ SEED_ADMIN_EMAIL: 'admin@example.com' }[key] ?? defaultValue)) as never;
    service = new DevicesService(
      prisma as never,
      redis as never,
      logs as never,
      realtime as never,
      providers as never,
      config as never,
    );
  });

  describe('list', () => {
    it('maps prisma devices to DeviceDto', async () => {
      prisma.device.findMany.mockResolvedValueOnce([linkedDevice]);
      const result = await service.list();
      expect(result).toEqual([
        expect.objectContaining({ id: linkedDevice.id, linked: true }),
      ]);
    });
  });

  describe('listAvailableLgDevices', () => {
    it('returns discovered LG devices from the provider', async () => {
      provider.listDevices.mockResolvedValueOnce([
        { id: 'lg-1', name: 'Ar Quarto', type: 'AC' },
      ]);

      const result = await service.listAvailableLgDevices();

      expect(provider.listDevices).toHaveBeenCalled();
      expect(result).toEqual([{ id: 'lg-1', name: 'Ar Quarto', type: 'AC' }]);
    });

    it('throws ServiceUnavailableException when the provider cannot list devices', async () => {
      provider.listDevices.mockResolvedValueOnce(undefined);

      await expect(service.listAvailableLgDevices()).rejects.toThrow(ServiceUnavailableException);
    });
  });

  describe('listAvailableSmartThingsDevices', () => {
    it('returns discovered SmartThings devices from the provider', async () => {
      provider.listDevices.mockResolvedValueOnce([
        { id: 'st-1', name: 'TV Sala', type: 'TV' },
      ]);

      const result = await service.listAvailableSmartThingsDevices();

      expect(provider.listDevices).toHaveBeenCalled();
      expect(result).toEqual([{ id: 'st-1', name: 'TV Sala', type: 'TV' }]);
    });
  });

  describe('createDevice', () => {
    it('creates a linked device from a discovered LG device', async () => {
      prisma.device.findFirst.mockResolvedValueOnce(null);
      prisma.device.create.mockResolvedValueOnce({
        ...linkedDevice,
        id: 'device-lg',
        name: 'Ar Quarto',
        provider: 'LG_THINQ',
        externalId: 'lg-1',
        type: 'AC',
      });

      const result = await service.createDevice({
        name: 'Ar Quarto',
        type: 'AC',
        provider: 'LG_THINQ',
        externalId: 'lg-1',
      });

      expect(prisma.device.create).toHaveBeenCalledWith({
        data: {
          name: 'Ar Quarto',
          type: 'AC',
          provider: 'LG_THINQ',
          externalId: 'lg-1',
          online: false,
        },
      });
      expect(result.externalId).toBe('lg-1');
    });
  });

  describe('updateName', () => {
    it('renames a device when the user is the admin', async () => {
      prisma.device.findUnique.mockResolvedValueOnce(linkedDevice);
      prisma.device.update.mockResolvedValueOnce({ ...linkedDevice, name: 'TV Nova' });

      const result = await service.updateName('device-tv', { name: 'TV Nova' }, 'admin@example.com');

      expect(prisma.device.update).toHaveBeenCalledWith({
        where: { id: 'device-tv' },
        data: { name: 'TV Nova' },
      });
      expect(result.name).toBe('TV Nova');
    });

    it('rejects renames from non-admin users', async () => {
      await expect(service.updateName('device-tv', { name: 'TV Nova' }, 'user@example.com')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('sendCommand', () => {
    it('throws NotFoundException for an unknown device', async () => {
      prisma.device.findUnique.mockResolvedValueOnce(null);
      await expect(
        service.sendCommand(
          'missing',
          { type: 'power', value: 'on' },
          'user-1',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when the device has no externalId', async () => {
      prisma.device.findUnique.mockResolvedValueOnce(unlinkedDevice);
      await expect(
        service.sendCommand(
          unlinkedDevice.id,
          { type: 'power', value: 'on' },
          'user-1',
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('sends the command, persists state and emits a realtime event', async () => {
      prisma.device.findUnique.mockResolvedValueOnce(linkedDevice);
      provider.sendCommand.mockResolvedValueOnce(undefined);
      provider.fetchState.mockResolvedValueOnce({
        power: 'on',
        volume: null,
        muted: null,
        input: null,
        app: null,
      });
      provider.isOnline.mockResolvedValueOnce(true);
      prisma.device.update.mockResolvedValueOnce({
        ...linkedDevice,
        online: true,
        lastState: { power: 'on' },
      });

      const result = await service.sendCommand(
        linkedDevice.id,
        { type: 'power', value: 'on' },
        'user-1',
      );

      expect(provider.sendCommand).toHaveBeenCalledWith(
        linkedDevice.externalId,
        { type: 'power', value: 'on' },
      );
      expect(logs.record).toHaveBeenCalledWith(
        linkedDevice.id,
        'user-1',
        'power',
        expect.any(Object),
      );
      expect(realtime.emitDeviceStateUpdated).toHaveBeenCalled();
      expect(result.online).toBe(true);
    });

    it('translates ProviderCommandError into a BadRequestException', async () => {
      prisma.device.findUnique.mockResolvedValueOnce(linkedDevice);
      provider.sendCommand.mockRejectedValueOnce(
        new ProviderCommandError('SMARTTHINGS', 'comando inválido'),
      );

      await expect(
        service.sendCommand(
          linkedDevice.id,
          { type: 'power', value: 'on' },
          'user-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
