import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
  Max,
  ValidateIf,
  IsNotEmpty,
} from "class-validator";

export enum DiscountType {
  PERCENT = "PERCENT",
  FIXED = "FIXED",
}

export class CreateDiscountCodeDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsEnum(DiscountType)
  type: DiscountType;

  @IsNumber()
  @Min(0.01, { message: "Discount value must be positive" })
  @ValidateIf((o) => o.type === DiscountType.PERCENT)
  @Max(100, { message: "Percentage discount cannot exceed 100%" })
  value: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxRedemptions?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxPerUser?: number;
}

export class UpdateDiscountCodeDto {
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxRedemptions?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxPerUser?: number;
}
