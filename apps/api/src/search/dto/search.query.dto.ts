import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class SearchQueryDto {
  @ApiPropertyOptional({
    description: 'Termo de busca (texto livre).',
    minLength: 2,
    maxLength: 200,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  q!: string;

  @ApiPropertyOptional({ description: 'Slug do laboratório.' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  lab?: string;

  @ApiPropertyOptional({
    enum: ['pt-BR', 'en'],
    default: 'pt-BR',
    description:
      'Idioma do índice FTS. Cross-language não é suportado no MVP — busque por idioma específico.',
  })
  @IsOptional()
  @IsIn(['pt-BR', 'en'])
  locale?: 'pt-BR' | 'en';

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: 50, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number = 20;
}
