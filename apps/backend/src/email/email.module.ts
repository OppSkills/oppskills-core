import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailListener } from './email.listener';
import { EmailController } from './email.controller';

@Module({
  controllers: [EmailController],
  providers: [EmailService, EmailListener],
  exports: [EmailService],
})
export class EmailModule { }

