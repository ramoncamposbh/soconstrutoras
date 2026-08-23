import { IsString, IsOptional, IsNumber, IsEnum, IsBoolean, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum TipoImovelUsado {
  APARTAMENTO = 'apartamento',
  CASA = 'casa',
  COBERTURA = 'cobertura',
  TERRENO = 'terreno',
  COMERCIAL = 'comercial',
}

export enum StatusImovelUsado {
  DISPONIVEL = 'disponivel',
  RESERVADO = 'reservado',
  VENDIDO = 'vendido',
}

export class CriarImovelUsadoDto {
  @IsString()
  titulo: string;

  @IsOptional() @IsString()
  descricao?: string;

  @IsOptional() @IsEnum(TipoImovelUsado)
  tipo?: TipoImovelUsado;

  @IsOptional() @IsString()
  endereco?: string;

  @IsOptional() @IsString()
  bairro?: string;

  @IsOptional() @IsString()
  cidade?: string;

  @IsOptional() @IsString()
  estado?: string;

  @IsOptional() @IsString()
  cep?: string;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  area?: number;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  quartos?: number;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  vagas?: number;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  preco?: number;

  @IsOptional() @IsEnum(StatusImovelUsado)
  status?: StatusImovelUsado;
}

export class AtualizarImovelUsadoDto extends CriarImovelUsadoDto {}

export class ConfigImovelUsadoAdminDto {
  @IsBoolean()
  habilitado: boolean;

  @Type(() => Number) @IsNumber() @Min(0)
  limite: number;
}
