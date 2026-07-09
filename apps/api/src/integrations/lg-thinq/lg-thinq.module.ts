import { Module } from '@nestjs/common';
import { LgThinqProvider } from './lg-thinq.provider';

@Module({
  providers: [LgThinqProvider],
  exports: [LgThinqProvider],
})
export class LgThinqModule {}
