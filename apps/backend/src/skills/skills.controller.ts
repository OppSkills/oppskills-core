import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ClerkAuthGuard } from '../common/clerk-auth.guard';
import { SkillsService } from './skills.service';

export class RecommendSkillsDto {
  text: string;
}

@ApiTags('Skills')
@ApiBearerAuth('clerk-auth')
@Controller('skills')
@UseGuards(ClerkAuthGuard)
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @Get('search')
  @ApiOperation({ summary: 'Search skills by name (cached in-memory)' })
  @ApiQuery({ name: 'q', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  search(@Query('q') q?: string, @Query('limit') limitStr?: string) {
    const limit = limitStr ? parseInt(limitStr, 10) : undefined;
    return this.skillsService.searchSkills(q, limit);
  }

  @Post('recommend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Recommend skills based on caption/text content' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  recommend(
    @Body() body: RecommendSkillsDto,
    @Query('limit') limitStr?: string,
  ) {
    const limit = limitStr ? parseInt(limitStr, 10) : undefined;
    return this.skillsService.recommendSkills(body.text, limit);
  }
}
