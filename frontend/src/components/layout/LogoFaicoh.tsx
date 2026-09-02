interface Props {
  height?: number;
  /** white = logo branco (para fundos escuros) | dark = logo colorido (para fundos claros) */
  textColor?: 'white' | 'dark';
}

export default function LogoFaicoh({ height = 36, textColor = 'white' }: Props) {
  const src = textColor === 'dark' ? '/logo-faicoh-dark.png' : '/logo-faicoh.png';

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={src}
      alt="FAICOH"
      style={{ height, width: 'auto' }}
    />
  );
}
