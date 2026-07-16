import { IsString, IsOptional, IsNumber, IsBoolean, IsIn, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CriarUnidadeDto {
  @IsIn(['apartamento', 'cobertura', 'garden', 'duplex', 'studio', 'loft', 'comercial'])
  tipo: string;

  @IsOptional() @IsString()
  nome?: string;

  @IsOptional() @IsNumber() @Min(0) @Type(() => Number)
  metragem_privativa?: number;

  @IsOptional() @IsNumber() @Min(0) @Type(() => Number)
  metragem_total?: number;

  @IsOptional() @IsNumber() @Min(0) @Type(() => Number)
  quartos?: number;

  @IsOptional() @IsNumber() @Min(0) @Type(() => Number)
  suites?: number;

  @IsOptional() @IsNumber() @Min(0) @Type(() => Number)
  vagas?: number;

  @IsOptional() @IsNumber() @Min(0) @Type(() => Number)
  preco?: number;

  @IsOptional() @IsString()
  descricao?: string;

  @IsOptional() @IsBoolean()
  disponivel?: boolean;

  @IsOptional() @IsNumber() @Min(0) @Type(() => Number)
  ordem?: number;
}
