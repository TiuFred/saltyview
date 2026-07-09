import { Module } from '@nestjs/common';
import { DevicesController } from './devices.controller';
import { DevicesService } from './devices.service';
import { DeviceProviderRegistry } from './device-provider.registry';
import { LogsModule } from '../logs/logs.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { SmartThingsModule } from '../integrations/smartthings/smartthings.module';
import { LgThinqModule } from '../integrations/lg-thinq/lg-thinq.module';

@Module({
  imports: [LogsModule, RealtimeModule, SmartThingsModule, LgThinqModule],
  controllers: [DevicesController],
  providers: [DevicesService, DeviceProviderRegistry],
})
export class DevicesModule {}
