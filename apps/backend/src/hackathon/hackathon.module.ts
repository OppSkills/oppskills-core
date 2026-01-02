// apps/backend/src/modules/hackathon/hackathon.module.ts
import { Module } from '@nestjs/common';
import { TeamModule } from '../team/team.module';
import { HackathonService } from './hackathon.service';
import { HackathonController } from './hackathon.controller';
import { HackathonPublicController } from './hackathon-public.controller';

@Module({
  imports: [TeamModule],
  controllers: [HackathonPublicController, HackathonController],
  providers: [HackathonService],
  exports: [HackathonService],
})
export class HackathonModule {}
