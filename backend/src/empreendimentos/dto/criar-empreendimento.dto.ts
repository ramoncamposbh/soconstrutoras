import { IsString, IsOptional, IsIn, IsNumber, IsPositive, Min, Max } from 'class-validator';

export class CriarEmpreendimentoDto {
  @IsString()
  nome: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsIn(['apartamento', 'casa', 'terreno', 'comercial', 'studio', 'area_garden', 'cobertura'])
  tipo: string;

  @IsOptional()
  @IsIn(['lancamento', 'em_obras', 'pronto', 'suspenso'])
  status?: string;

  @IsOptional()
  @IsString()
  endereco?: string;

  @IsOptional()
  @IsString()
  bairro?: string;

  @IsString()
  cidade: string;

  @IsString()
  estado: string;

  @IsOptional()
  @IsString()
  cep?: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  preco_min?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  preco_max?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  area_min?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  area_max?: number;

  @IsOptional()
  @IsNumber()
    @IsOptional()
  @IsNumber()
  @Min(0)
  quartos_min?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  quartos_max?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  vagas?: number;
}
