import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailListener } from './email.listener';
import { EmailController } from './email.controller';
import { HackathonModule } from '../hackathon/hackathon.module';
import { TeamModule } from '../team/team.module';

@Module({
  imports: [HackathonModule, TeamModule],
  controllers: [EmailController],
  providers: [EmailService, EmailListener],
  exports: [EmailService],
})
export class EmailModule { }

