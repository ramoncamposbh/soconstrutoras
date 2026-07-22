export class SimularDto {
  renda_liquida!: number;
  renda_extra?: number;
  entrada!: number;
  fgts?: number;
  usa_fgts?: boolean;
  vinculo!: 'CLT' | 'SERVIDOR' | 'AUTONOMO_COM_IR' | 'AUTONOMO_SEM_IR';
  tempo_emprego_meses?: number;
  score_serasa_estimado?: number;
  valor_imovel_desejado?: number;
  prazo_anos?: number;
  nome?: string;
  email?: string;
  telefone?: string;
}
