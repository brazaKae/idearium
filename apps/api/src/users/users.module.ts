import { Module } from '@nestjs/common';
import { RfcsModule } from '../rfcs/rfcs.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [RfcsModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
