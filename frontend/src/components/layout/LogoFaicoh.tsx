interface Props {
  height?: number;
  textColor?: 'white' | 'dark';
}

export default function LogoFaicoh({ height = 36, textColor = 'white' }: Props) {
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src="/logo-faicoh.png"
      alt="FAICOH"
      style={{
        height,
        width: 'auto',
        filter: textColor === 'white'
          ? 'drop-shadow(1px 0 0 white) drop-shadow(-1px 0 0 white) drop-shadow(0 1px 0 white) drop-shadow(0 -1px 0 white)'
          : 'brightness(0)',
      }}
    />
  );
}
