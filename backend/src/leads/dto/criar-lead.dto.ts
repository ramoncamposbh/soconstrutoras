import { IsString, IsEmail, IsOptional, IsPhoneNumber } from 'class-validator';

export class CriarLeadDto {
  @IsString()
  nome: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  telefone: string;

  @IsOptional()
  @IsString()
  mensagem?: string;

  @IsOptional()
  @IsString()
  utm_source?: string;

  @IsOptional()
  @IsString()
  utm_medium?: string;

  @IsOptional()
  @IsString()
  utm_campaign?: string;
}
