import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { getPlainTextLengthFromHtml } from './plain-text-length.util';

@ValidatorConstraint({ name: 'maxPlainTextLength', async: false })
export class MaxPlainTextLengthConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    if (typeof value !== 'string') return false;
    const max = args.constraints[0] as number;
    return getPlainTextLengthFromHtml(value) <= max;
  }

  defaultMessage(args: ValidationArguments): string {
    const max = args.constraints[0] as number;
    return `${args.property} must be shorter than or equal to ${max} characters`;
  }
}

export function MaxPlainTextLength(
  max: number,
  validationOptions?: ValidationOptions,
) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [max],
      validator: MaxPlainTextLengthConstraint,
    });
  };
}
