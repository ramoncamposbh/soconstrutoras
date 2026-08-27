interface Props {
  height?: number;
  textColor?: 'white' | 'dark';
}

export default function LogoFaicoh({ height = 36, textColor = 'white' }: Props) {
  const color = textColor === 'white' ? '#ffffff' : '#0B1D2A';
  const iconH = height;
  const fontSize = Math.round(height * 0.72);

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: Math.round(height * 0.3) }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-icon.png"
        alt=""
        style={{ height: iconH, width: 'auto' }}
      />
      <span style={{
        fontFamily: 'system-ui, sans-serif',
        fontWeight: 800,
        fontSize,
        letterSpacing: '0.08em',
        color,
        lineHeight: 1,
        userSelect: 'none',
      }}>
        FAICOH
      </span>
    </div>
  );
}
