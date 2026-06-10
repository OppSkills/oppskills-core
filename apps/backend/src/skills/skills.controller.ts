import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ClerkAuthGuard } from '../common/clerk-auth.guard';
import { SkillsService } from './skills.service';

@ApiTags('Skills')
@ApiBearerAuth('clerk-auth')
@Controller('skills')
@UseGuards(ClerkAuthGuard)
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @Get('search')
  @ApiOperation({
    summary:
      'Search skills by name (in-memory, no DB). Empty q returns top N by score.',
  })
  @ApiQuery({ name: 'q', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  search(@Query('q') q?: string, @Query('limit') limitStr?: string) {
    const limit = limitStr ? parseInt(limitStr, 10) : undefined;
    return this.skillsService.searchSkills(q, limit);
  }

  @Post('recommend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Return top N skills by platformScore (score-based only, no text analysis).',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  recommend(@Query('limit') limitStr?: string) {
    const limit = limitStr ? parseInt(limitStr, 10) : undefined;
    return this.skillsService.recommendSkills(limit);
  }
}
