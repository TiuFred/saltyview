import { Injectable } from '@nestjs/common';
import type { DeviceProviderType } from '@casa/shared-types';
import { DeviceProvider } from '@casa/device-contracts';
import { SmartThingsProvider } from '../integrations/smartthings/smartthings.provider';
import { LgThinqProvider } from '../integrations/lg-thinq/lg-thinq.provider';

@Injectable()
export class DeviceProviderRegistry {
  private readonly providers: Record<DeviceProviderType, DeviceProvider>;

  constructor(smartThings: SmartThingsProvider, lgThinq: LgThinqProvider) {
    this.providers = {
      SMARTTHINGS: smartThings,
      LG_THINQ: lgThinq,
    };
  }

  get(providerType: DeviceProviderType): DeviceProvider {
    return this.providers[providerType];
  }
}
