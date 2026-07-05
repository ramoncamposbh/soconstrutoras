import { IsOptional, IsString, IsNumber, IsPositive, Min, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class BuscarEmpreendimentosDto {
  @IsOptional() @IsString()
  cidade?: string;

  @IsOptional() @IsString()
  estado?: string;

  @IsOptional() @IsIn(['apartamento', 'casa', 'terreno', 'comercial', 'studio', 'area_garden', 'cobertura'])
  tipo?: string;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  preco_min?: number;

  @IsOptional() @Type(() => Number) @IsNumber() @IsPositive()
  preco_max?: number;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  quartos_min?: number;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  vagas?: number;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  area_min?: number;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(1)
  limite?: number;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  pagina?: number;
}
