import { IsUUID, IsIn, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class VincularParceiroDto {
  @IsUUID()
  parceiro_id: string;

  @IsIn(['sequencial', 'percentual'])
  modo_distribuicao: 'sequencial' | 'percentual';

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  percentual?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  ordem?: number;
}
