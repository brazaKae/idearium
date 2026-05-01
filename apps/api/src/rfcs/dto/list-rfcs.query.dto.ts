import { ApiPropertyOptional } from '@nestjs/swagger';
import { RfcStatus } from '@prisma/client';
import { IsEnum, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class ListRfcsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Slug do laboratório.', example: 'educacao' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  lab?: string;

  @ApiPropertyOptional({
    enum: RfcStatus,
    description: 'Default: status públicos (IN_DISCUSSION, IN_BUILDING, PUBLISHED).',
  })
  @IsOptional()
  @IsEnum(RfcStatus)
  status?: RfcStatus;

  @ApiPropertyOptional({ enum: ['pt-BR', 'en'] })
  @IsOptional()
  @IsIn(['pt-BR', 'en'])
  locale?: 'pt-BR' | 'en';

  @ApiPropertyOptional({ enum: ['recent', 'popular'], default: 'recent' })
  @IsOptional()
  @IsIn(['recent', 'popular'])
  sort?: 'recent' | 'popular' = 'recent';
}
