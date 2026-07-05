import { IsString, IsEmail, IsIn, IsOptional, IsBoolean } from 'class-validator';

export class AdicionarParceiroDto {
  @IsIn(['imobiliaria', 'corretor'])
  tipo: 'imobiliaria' | 'corretor';

  @IsString()
  nome: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  telefone?: string;

  @IsOptional()
  @IsString()
  creci?: string;

  @IsOptional()
  @IsBoolean()
  is_house_de_vendas?: boolean;
}
