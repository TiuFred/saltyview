import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import type { AuthTokensDto, DeviceDto } from '@casa/shared-types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { RedisService } from '../src/redis/redis.service';
import { SmartThingsProvider } from '../src/integrations/smartthings/smartthings.provider';
import { LgThinqProvider } from '../src/integrations/lg-thinq/lg-thinq.provider';
import { RealtimeGateway } from '../src/realtime/realtime.gateway';

describe('App (e2e)', () => {
  let app: INestApplication<App>;

  const user = {
    id: 'user-1',
    name: 'Admin',
    email: 'admin@example.com',
    passwordHash: bcrypt.hashSync('super-secret', 10),
  };

  const linkedDevice = {
    id: 'device-tv',
    name: 'TV Samsung',
    type: 'TV',
    provider: 'SMARTTHINGS',
    externalId: 'st-external-id',
    roomId: null,
    lastState: null,
    online: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const unlinkedDevice = {
    ...linkedDevice,
    id: 'device-ac',
    provider: 'LG_THINQ',
    externalId: null,
  };

  const prismaMock = {
    user: { findUnique: jest.fn() },
    device: { findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    deviceLog: { create: jest.fn(), findMany: jest.fn() },
  };

  const redisMock = { getJson: jest.fn(), setJson: jest.fn() };
  const smartThingsMock = {
    providerType: 'SMARTTHINGS',
    fetchState: jest.fn(),
    sendCommand: jest.fn(),
    isOnline: jest.fn(),
  };
  const lgThinqMock = {
    providerType: 'LG_THINQ',
    fetchState: jest.fn(),
    sendCommand: jest.fn(),
    isOnline: jest.fn(),
  };
  const realtimeMock = { emitDeviceStateUpdated: jest.fn() };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .overrideProvider(RedisService)
      .useValue(redisMock)
      .overrideProvider(SmartThingsProvider)
      .useValue(smartThingsMock)
      .overrideProvider(LgThinqProvider)
      .useValue(lgThinqMock)
      .overrideProvider(RealtimeGateway)
      .useValue(realtimeMock)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  async function login() {
    prismaMock.user.findUnique.mockResolvedValueOnce(user);
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: user.email, password: 'super-secret' })
      .expect(200);
    return (response.body as AuthTokensDto).accessToken;
  }

  it('GET /health returns ok', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({ status: 'ok' });
  });

  it('POST /auth/login rejects invalid credentials', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(user);
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: user.email, password: 'wrong-password' })
      .expect(401);
  });

  it('POST /auth/login accepts valid credentials and GET /auth/me returns the profile', async () => {
    const token = await login();
    prismaMock.user.findUnique.mockResolvedValueOnce(user);

    const me = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(me.body).toMatchObject({ id: user.id, email: user.email });
  });

  it('GET /devices requires authentication', async () => {
    await request(app.getHttpServer()).get('/devices').expect(401);
  });

  it('GET /devices lists devices for an authenticated user', async () => {
    const token = await login();
    prismaMock.device.findMany.mockResolvedValueOnce([
      linkedDevice,
      unlinkedDevice,
    ]);

    const response = await request(app.getHttpServer())
      .get('/devices')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const devices = response.body as DeviceDto[];
    expect(devices).toHaveLength(2);
    expect(devices[1].linked).toBe(false);
  });

  it('POST /devices/:id/commands returns 409 when the device is not linked', async () => {
    const token = await login();
    prismaMock.device.findUnique.mockResolvedValueOnce(unlinkedDevice);

    await request(app.getHttpServer())
      .post(`/devices/${unlinkedDevice.id}/commands`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'power', value: 'on' })
      .expect(409);
  });

  it('POST /devices/:id/commands sends the command and returns the updated device', async () => {
    const token = await login();
    prismaMock.device.findUnique.mockResolvedValueOnce(linkedDevice);
    smartThingsMock.sendCommand.mockResolvedValueOnce(undefined);
    smartThingsMock.fetchState.mockResolvedValueOnce({
      power: 'on',
      volume: null,
      muted: null,
      input: null,
      app: null,
    });
    smartThingsMock.isOnline.mockResolvedValueOnce(true);
    prismaMock.device.update.mockResolvedValueOnce({
      ...linkedDevice,
      online: true,
      lastState: { power: 'on' },
    });

    const response = await request(app.getHttpServer())
      .post(`/devices/${linkedDevice.id}/commands`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'power', value: 'on' })
      .expect(201);

    expect(smartThingsMock.sendCommand).toHaveBeenCalledWith(
      linkedDevice.externalId,
      { type: 'power', value: 'on' },
    );
    expect(prismaMock.deviceLog.create).toHaveBeenCalled();
    expect(realtimeMock.emitDeviceStateUpdated).toHaveBeenCalled();
    expect((response.body as DeviceDto).online).toBe(true);
  });
});
