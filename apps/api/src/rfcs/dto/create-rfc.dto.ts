import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateRfcDto {
  @ApiProperty({ example: 'Biblioteca Cooperativa de Bairro', minLength: 5, maxLength: 200 })
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  @MinLength(5, { message: i18nValidationMessage('validation.MIN_LENGTH') })
  @MaxLength(200, { message: i18nValidationMessage('validation.MAX_LENGTH') })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  title!: string;

  @ApiProperty({ minLength: 5, maxLength: 280, description: 'Resumo curto exibido no feed.' })
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  @MinLength(5, { message: i18nValidationMessage('validation.MIN_LENGTH') })
  @MaxLength(280, { message: i18nValidationMessage('validation.MAX_LENGTH') })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  summary!: string;

  @ApiProperty({ minLength: 50, maxLength: 50000, description: 'Corpo em Markdown.' })
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @MinLength(50, { message: i18nValidationMessage('validation.MIN_LENGTH') })
  @MaxLength(50000, { message: i18nValidationMessage('validation.MAX_LENGTH') })
  body!: string;

  @ApiProperty({ description: 'ID do laboratório.', example: 'uuid' })
  @IsUUID()
  labId!: string;

  @ApiPropertyOptional({ enum: ['pt-BR', 'en'], description: 'Default: preferredLocale do autor.' })
  @IsOptional()
  @IsIn(['pt-BR', 'en'], { message: 'locale deve ser "pt-BR" ou "en".' })
  locale?: 'pt-BR' | 'en';

  @ApiPropertyOptional({
    description: 'Slug customizado. Default: gerado do título.',
    minLength: 5,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(100)
  slug?: string;

  @ApiPropertyOptional({ description: 'ID da RFC original (caso seja tradução).' })
  @IsOptional()
  @IsUUID()
  translationOfId?: string;
}
