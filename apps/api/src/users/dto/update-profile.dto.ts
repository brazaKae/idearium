import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class UpdateProfileDto {
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @MaxLength(100, { message: i18nValidationMessage('validation.MAX_LENGTH') })
  fullName?: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @MaxLength(500, { message: i18nValidationMessage('validation.MAX_LENGTH') })
  bio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({}, { message: 'avatarUrl deve ser uma URL válida.' })
  @MaxLength(500, { message: i18nValidationMessage('validation.MAX_LENGTH') })
  avatarUrl?: string;

  @ApiPropertyOptional({ enum: ['pt-BR', 'en'] })
  @IsOptional()
  @IsIn(['pt-BR', 'en'], { message: 'preferredLocale deve ser "pt-BR" ou "en".' })
  preferredLocale?: 'pt-BR' | 'en';
}
