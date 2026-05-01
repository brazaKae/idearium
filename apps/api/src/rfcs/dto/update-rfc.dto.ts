import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class UpdateRfcDto {
  @ApiPropertyOptional({ minLength: 5, maxLength: 200 })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @MinLength(5, { message: i18nValidationMessage('validation.MIN_LENGTH') })
  @MaxLength(200, { message: i18nValidationMessage('validation.MAX_LENGTH') })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  title?: string;

  @ApiPropertyOptional({ minLength: 5, maxLength: 280 })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @MinLength(5, { message: i18nValidationMessage('validation.MIN_LENGTH') })
  @MaxLength(280, { message: i18nValidationMessage('validation.MAX_LENGTH') })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  summary?: string;

  @ApiPropertyOptional({ minLength: 50, maxLength: 50000 })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @MinLength(50, { message: i18nValidationMessage('validation.MIN_LENGTH') })
  @MaxLength(50000, { message: i18nValidationMessage('validation.MAX_LENGTH') })
  body?: string;

  @ApiPropertyOptional({
    minLength: 5,
    maxLength: 100,
    description: 'Slug. Só editável enquanto RFC for DRAFT.',
  })
  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(100)
  slug?: string;
}
