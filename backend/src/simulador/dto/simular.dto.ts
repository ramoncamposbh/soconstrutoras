import {
  IsNumber, IsOptional, IsString, IsBoolean, IsIn,
} from 'class-validator';

export class SimularDto {
  @IsNumber()
  renda_liquida!: number;

  @IsOptional()
  @IsNumber()
  renda_extra?: number;

  @IsNumber()
  entrada!: number;

  @IsOptional()
  @IsNumber()
  fgts?: number;

  @IsOptional()
  @IsBoolean()
  usa_fgts?: boolean;

  @IsIn(['CLT', 'SERVIDOR', 'AUTONOMO_COM_IR', 'AUTONOMO_SEM_IR'])
  vinculo!: 'CLT' | 'SERVIDOR' | 'AUTONOMO_COM_IR' | 'AUTONOMO_SEM_IR';

  @IsOptional()
  @IsNumber()
  tempo_emprego_meses?: number;

  @IsOptional()
  @IsNumber()
  score_serasa_estimado?: number;

  @IsOptional()
  @IsNumber()
  valor_imovel_desejado?: number;

  @IsOptional()
  @IsNumber()
  prazo_anos?: number;

  @IsOptional()
  @IsNumber()
  idade?: number;

  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  telefone?: string;
}
