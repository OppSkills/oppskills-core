import {
  IsArray,
  IsString,
  IsNotEmpty,
  ValidateNested,
  IsOptional,
} from "class-validator";
import { Type } from "class-transformer";

class AnswerDto {
  @IsString()
  @IsNotEmpty()
  fieldId: string;

  @IsString()
  @IsNotEmpty()
  value: string;
}

export class SubmitRegistrationDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers: AnswerDto[];

  /** Free ticket tier within a paid hackathon (no payment row). */
  @IsOptional()
  @IsString()
  ticketTierId?: string;
}
