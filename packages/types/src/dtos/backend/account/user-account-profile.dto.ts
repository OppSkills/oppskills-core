import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { GenderValue, UserCategoryValue } from '../../../enums';

/** PATCH `/user-accounts/profile` — partial identity + onboarding-aligned enum fields */
export class UpdateProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ enum: GenderValue })
  @IsOptional()
  @IsEnum(GenderValue)
  gender?: GenderValue;

  @ApiPropertyOptional({ enum: UserCategoryValue })
  @IsOptional()
  @IsEnum(UserCategoryValue)
  userCategory?: UserCategoryValue;
}

/** PATCH `/user-accounts/education` */
export class UpdateEducationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  collegeId?: string | null;

  @ApiPropertyOptional({
    description: 'College display name when collegeId is not set (resolution path)',
  })
  @IsOptional()
  @IsString()
  collegeName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  course?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  courseSpecialization?: string;

  /** Maps to onboarding `collegeCurrentYear` in DB */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  startYear?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2100)
  @Type(() => Number)
  endYear?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rollNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cgpa?: string;
}
