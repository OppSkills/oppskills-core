import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  HttpException,
  HttpStatus,
  Logger,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { CollegesService } from './colleges.service';
import { ClerkAuthGuard } from '../common/clerk-auth.guard';
import type { CollegeBulkImportDto, CollegeImportItemDto } from '@oppskills/types';

@ApiTags('Colleges')
@Controller('colleges')
export class CollegesController {
  private readonly logger: Logger = new Logger(CollegesController.name);

  constructor(private readonly collegesService: CollegesService) {}

  /**
   * Search colleges by name for combobox autocomplete.
   */
  @Get('/search')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth('clerk-auth')
  @ApiOperation({
    summary: 'Search colleges by name',
    description:
      'Search for colleges by name (partial, case-insensitive match). Returns up to 15 results for combobox.',
  })
  @ApiQuery({
    name: 'q',
    required: true,
    description: 'Search query (college name pattern)',
    type: 'string',
    example: 'IIT',
  })
  @ApiResponse({
    status: 200,
    description: 'List of matching colleges',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          country: { type: 'string' },
          state: { type: 'string' },
          city: { type: 'string' },
          address: { type: 'string' },
          website: { type: 'string', nullable: true },
          logo: { type: 'string', nullable: true },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async searchColleges(@Query('q') query: string) {
    const safeQuery = typeof query === 'string' ? query : '';
    return this.collegesService.searchColleges(safeQuery);
  }

  /**
   * Bulk import colleges (dev-only, no auth).
   * Blocked in production for security.
   */
  @Post('/bulk-import')
  @ApiOperation({
    summary: 'Bulk import colleges (dev-only)',
    description:
      'Import multiple colleges at once. This endpoint is ONLY available in non-production environments.',
  })
  @ApiBody({
    description: 'Array of college objects to import. Optional fields (state, city, address) will default to empty string if not provided.',
    schema: {
      type: 'object',
      properties: {
        colleges: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              country: { type: 'string' },
              state: { type: 'string', nullable: true },
              city: { type: 'string', nullable: true },
              address: { type: 'string', nullable: true },
              website: { type: 'string', nullable: true },
              logo: { type: 'string', nullable: true },
            },
            required: ['id', 'name', 'country'],
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Import results',
    schema: {
      type: 'object',
      properties: {
        imported: { type: 'number' },
        failed: { type: 'number' },
        errors: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - This endpoint is blocked in production',
  })
  @ApiQuery({
    name: 'batchSize',
    required: false,
    description: 'Number of records per batch (default: 500)',
    type: 'number',
    example: 500,
  })
  async bulkImportColleges(
    @Body() body: CollegeBulkImportDto,
    @Query('batchSize') batchSizeParam?: string,
  ) {
    // Block in production
    if (process.env.NODE_ENV === 'production') {
      this.logger.error(
        'Attempted to access bulk-import endpoint in production',
      );
      throw new HttpException(
        'This endpoint is not available in production',
        HttpStatus.FORBIDDEN,
      );
    }

    if (!body.colleges || !Array.isArray(body.colleges)) {
      throw new HttpException(
        'Invalid request body: colleges array is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const batchSize = batchSizeParam ? parseInt(batchSizeParam, 10) : 500;
    if (batchSize < 1 || batchSize > 1000) {
      throw new HttpException(
        'batchSize must be between 1 and 1000',
        HttpStatus.BAD_REQUEST,
      );
    }

    this.logger.log(`Bulk importing ${body.colleges.length} colleges with batch size ${batchSize}`);
    const result = await this.collegesService.bulkImportColleges(body.colleges, batchSize);
    return result;
  }

  /**
   * Bulk import colleges from an uploaded JSON file (dev-only, no auth).
   * Optimized for very large files (100k+ records).
   */
  @Post('/bulk-import-file')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Bulk import colleges from JSON file (dev-only)',
    description:
      'Upload a JSON file containing an array of college objects. Optimized for large files (100k+ records). The file should contain a JSON array of college objects.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'JSON file containing array of colleges',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'JSON file with array of colleges',
        },
      },
    },
  })
  @ApiQuery({
    name: 'batchSize',
    required: false,
    description: 'Number of records per batch (default: 500)',
    type: 'number',
    example: 500,
  })
  @ApiResponse({
    status: 201,
    description: 'Import results',
    schema: {
      type: 'object',
      properties: {
        imported: { type: 'number' },
        failed: { type: 'number' },
        totalBatches: { type: 'number' },
        errors: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid file or JSON format',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - This endpoint is blocked in production',
  })
  async bulkImportCollegesFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 100 * 1024 * 1024 }), // 100MB max
        ],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
    @Query('batchSize') batchSizeParam?: string,
  ) {
    // Block in production
    if (process.env.NODE_ENV === 'production') {
      this.logger.error(
        'Attempted to access bulk-import-file endpoint in production',
      );
      throw new HttpException(
        'This endpoint is not available in production',
        HttpStatus.FORBIDDEN,
      );
    }

    const batchSize = batchSizeParam ? parseInt(batchSizeParam, 10) : 500;
    if (batchSize < 1 || batchSize > 1000) {
      throw new HttpException(
        'batchSize must be between 1 and 1000',
        HttpStatus.BAD_REQUEST,
      );
    }

    this.logger.log(`Received file: ${file.originalname} (${file.size} bytes)`);

    // Parse JSON from file buffer
    let colleges: CollegeImportItemDto[];
    try {
      const content = file.buffer.toString('utf-8');
      const parsed = JSON.parse(content);
      
      // Handle both array and { colleges: [...] } format
      if (Array.isArray(parsed)) {
        colleges = parsed;
      } else if (parsed && Array.isArray(parsed.colleges)) {
        colleges = parsed.colleges;
      } else {
        throw new Error('JSON must be an array or { "colleges": [...] }');
      }
    } catch (error) {
      throw new HttpException(
        `Invalid JSON file: ${error instanceof Error ? error.message : 'Parse error'}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    this.logger.log(`Parsed ${colleges.length} colleges from file, starting import with batch size ${batchSize}`);
    const result = await this.collegesService.bulkImportColleges(colleges, batchSize);
    return result;
  }
}
