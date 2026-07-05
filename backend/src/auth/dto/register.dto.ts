import { IsEmail, IsString, MinLength, IsIn, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  nome: string;

  @IsIn(['construtora', 'parceiro', 'cliente'])
  role: 'construtora' | 'parceiro' | 'cliente';

  // Obrigatório apenas quando role = 'construtora'
  @IsOptional()
  @IsString()
  razao_social?: string;

  @IsOptional()
  @IsString()
  cnpj?: string;
}
