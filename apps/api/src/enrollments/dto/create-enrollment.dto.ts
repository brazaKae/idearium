import { ApiPropertyOptional } from '@nestjs/swagger';
import { EnrollmentRole } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateEnrollmentDto {
  @ApiPropertyOptional({ enum: EnrollmentRole, default: EnrollmentRole.BUILDER })
  @IsOptional()
  @IsEnum(EnrollmentRole)
  role?: EnrollmentRole;

  @ApiPropertyOptional({
    maxLength: 500,
    description: 'Mensagem opcional do builder (ex.: "tenho experiência com X").',
  })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @MaxLength(500, { message: i18nValidationMessage('validation.MAX_LENGTH') })
  message?: string;
}
