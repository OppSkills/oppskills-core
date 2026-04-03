import { Module } from '@nestjs/common';
import { OpportunityController } from './opportunity.controller';
import { OpportunityService } from './opportunity.service';
import { EventModule } from '../event/event.module';
import { HackathonModule } from '../hackathon/hackathon.module';

@Module({
  imports: [EventModule, HackathonModule],
  controllers: [OpportunityController],
  providers: [OpportunityService],
  exports: [OpportunityService],
})
export class OpportunityModule {}
