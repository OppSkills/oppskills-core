// apps/backend/src/modules/hackathon/hackathon.module.ts
import { Module } from '@nestjs/common';
import { HackathonService } from './hackathon.service';
import { HackathonController } from './hackathon.controller';

@Module({
  controllers: [HackathonController],
  providers: [HackathonService],
  exports: [HackathonService],
})
export class HackathonModule {}
