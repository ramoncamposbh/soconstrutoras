interface Props {
  height?: number;
  /** white = logo branco (para fundos escuros) | dark = preto | brand = verde #0E8F6E */
  textColor?: 'white' | 'dark' | 'brand';
}

// Filtro CSS que converte branco → verde marca #0E8F6E
// Calculado para a cor exata da marca FAICOH
const BRAND_FILTER =
  'brightness(0) saturate(100%) invert(44%) sepia(82%) saturate(400%) hue-rotate(118deg) brightness(90%) contrast(95%)';

export default function LogoFaicoh({ height = 36, textColor = 'white' }: Props) {
  let filter: string | undefined;
  if (textColor === 'dark')  filter = 'brightness(0)';
  if (textColor === 'brand') filter = BRAND_FILTER;

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src="/logo-faicoh.png"
      alt="FAICOH"
      style={{ height, width: 'auto', filter }}
    />
  );
}
