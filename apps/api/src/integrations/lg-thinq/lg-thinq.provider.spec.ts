import { ConfigService } from '@nestjs/config';
import { LgThinqProvider } from './lg-thinq.provider';

jest.mock('thinqconnect', () => ({
  ThinQApi: jest.fn().mockImplementation(() => ({
    asyncGetDeviceList: jest.fn(),
    asyncGetDeviceStatus: jest.fn(),
    asyncPostDeviceControl: jest.fn(),
  })),
}));

describe('LgThinqProvider', () => {
  it('uses the real LG alias as the display name for discovered devices', async () => {
    const provider = new LgThinqProvider({
      getOrThrow: jest.fn((key: string) => ({ LG_THINQ_PAT: 'pat', LG_THINQ_COUNTRY: 'BR', LG_THINQ_CLIENT_ID: 'client' }[key])),
    } as unknown as ConfigService);

    (provider as unknown as { api: { asyncGetDeviceList: jest.Mock } }).api.asyncGetDeviceList.mockResolvedValue({
      status: 200,
      body: [
        {
          deviceId: 'abc123',
          deviceInfo: {
            alias: 'Ar-condicionado - Quarto 4',
            modelName: 'RAC_056905_WW',
          },
        },
      ],
    });

    const result = await provider.listDevices();

    expect(result).toEqual([
      {
        id: 'abc123',
        name: 'Ar-condicionado - Quarto 4',
        type: 'AC',
      },
    ]);
  });
});
