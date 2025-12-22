import { IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for a single college item in bulk import.
 */
export class CollegeImportItemDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  country: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  website?: string;

  @IsString()
  @IsOptional()
  logo?: string;
}

/**
 * DTO for bulk importing colleges (array of items).
 */
export class CollegeBulkImportDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CollegeImportItemDto)
  colleges: CollegeImportItemDto[];
}

/**
 * Response DTO for college search results.
 */
export interface CollegeSearchResultDto {
  id: string;
  name: string;
  country: string;
  state: string;
  city: string;
  address: string;
  website?: string | null;
  logo?: string | null;
}
