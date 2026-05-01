import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class UpdateCommentDto {
  @ApiProperty({ minLength: 1, maxLength: 5000 })
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @MinLength(1, { message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  @MaxLength(5000, { message: i18nValidationMessage('validation.MAX_LENGTH') })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  body!: string;
}
