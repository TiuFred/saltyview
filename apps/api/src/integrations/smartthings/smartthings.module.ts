import { Module } from '@nestjs/common';
import { SmartThingsProvider } from './smartthings.provider';

@Module({
  providers: [SmartThingsProvider],
  exports: [SmartThingsProvider],
})
export class SmartThingsModule {}
