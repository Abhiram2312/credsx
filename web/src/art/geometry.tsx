type Props = { className?: string };

export function Contours({ className }: Props) {
  return (
    <svg className={className} viewBox="0 0 420 280" fill="none" aria-hidden>
      <g className="art-draw" stroke="var(--art-primary)" strokeWidth="0.8" opacity="0.55">
        <path d="M40 70c40-28 78-8 96 18 20 30 8 62-22 74-34 14-70-6-78-34-8-28 18-46 4-58" />
        <path d="M70 96c22-16 46-2 54 16 8 18 2 36-16 42-20 8-40-4-44-20-4-16 12-30 6-38" />
        <path d="M250 40c36-22 84 4 96 36 14 36-8 70-40 78-36 8-64-18-62-46 2-24 22-46 6-68" />
        <path d="M286 78c16-8 34 2 36 16 2 12-8 22-20 22-12 0-22-10-16-22 4-8 10-12 0-16" />
      </g>
      <path className="art-draw" d="M120 180c50-40 120-10 150 30 28 36 10 78-36 90-52 14-100-20-108-62-8-40 30-58-6-58" stroke="var(--art-secondary)" strokeWidth="1.6" />
    </svg>
  );
}

export function Ridge({ className }: Props) {
  return (
    <svg className={className} viewBox="0 0 640 80" fill="none" aria-hidden>
      <path d="M0 48c40-16 70 10 110 8 46-2 60-28 100-26 48 2 70 24 120 18 40-4 70-22 110-16 36 6 50 18 90 10" stroke="var(--art-primary)" strokeWidth="0.8" opacity="0.45" />
      <path className="art-draw" d="M0 58c50-8 80 14 130 10 40-4 70-20 110-12 50 10 80 8 130-4 40-10 70 6 140 2" stroke="var(--art-secondary)" strokeWidth="1.5" />
    </svg>
  );
}

export function Mesh({ className }: Props) {
  const lines = [18, 32, 48, 66, 86, 108];
  return (
    <svg className={className} viewBox="0 0 640 160" fill="none" aria-hidden>
      {lines.map((y, index) => (
        <path
          key={y}
          d={`M0 ${y + 20} C 80 ${y - index * 4}, 140 ${y + 18}, 220 ${y} S 360 ${y - 16}, 460 ${y + 8} S 580 ${y + 20}, 640 ${y}`}
          stroke="var(--art-primary)"
          strokeWidth="0.6"
          opacity={0.25 + index * 0.08}
        />
      ))}
      <path d="M80 20 L120 140 M220 8 L250 150 M360 16 L390 146 M500 12 L540 150" stroke="var(--art-secondary)" strokeWidth="0.6" opacity="0.45" />
    </svg>
  );
}
