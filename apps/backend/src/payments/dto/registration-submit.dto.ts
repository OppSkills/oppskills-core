import { IsArray, ValidateNested, IsString } from 'class-validator';
import { Type } from 'class-transformer';

class RegistrationAnswerDto {
  @IsString()
  fieldId: string;

  @IsString()
  value: string;
}

export class SubmitRegistrationDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RegistrationAnswerDto)
  answers: RegistrationAnswerDto[];
}
