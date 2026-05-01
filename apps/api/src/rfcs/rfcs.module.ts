import { Module } from '@nestjs/common';
import { RfcsController } from './rfcs.controller';
import { RfcsService } from './rfcs.service';

@Module({
  controllers: [RfcsController],
  providers: [RfcsService],
  exports: [RfcsService],
})
export class RfcsModule {}
