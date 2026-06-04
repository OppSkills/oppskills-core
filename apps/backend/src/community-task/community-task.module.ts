import { Module } from '@nestjs/common';
import { EmailModule } from '../email/email.module';
import { CommunityTaskController } from './community-task.controller';
import { CommunityTaskService } from './community-task.service';

@Module({
  imports: [EmailModule],
  controllers: [CommunityTaskController],
  providers: [CommunityTaskService],
  exports: [CommunityTaskService],
})
export class CommunityTaskModule {}
