type Row = { name: string; value: number };

export function BarChart({ rows, label }: { rows: Row[]; label: string }) {
  if (rows.length === 0) return <p className="m-0 text-muted">Nothing recorded for this range.</p>;
  const max = Math.max(1, ...rows.map((row) => Math.abs(row.value)));
  const height = rows.length * 32;
  return (
    <svg role="img" aria-label={label} viewBox={`0 0 360 ${height}`} className="w-full">
      {rows.map((row, index) => (
        <g key={row.name} transform={`translate(0 ${index * 32})`}>
          <text y="18" fill="var(--foreground)" fontSize="12">
            {row.name}
          </text>
          <rect x="130" y="6" height="14" rx="2" width={Math.max(2, (Math.abs(row.value) / max) * 220)} fill={index % 2 === 0 ? "var(--chart-primary)" : "var(--chart-secondary)"} />
        </g>
      ))}
    </svg>
  );
}

export function Donut({ rows, label }: { rows: Row[]; label: string }) {
  const usable = rows.filter((row) => row.value > 0);
  if (usable.length === 0) return <p className="m-0 text-muted">Nothing recorded for this range.</p>;
  const total = usable.reduce((sum, row) => sum + row.value, 0);
  const radius = 42;
  const circ = 2 * Math.PI * radius;
  const segments = usable.reduce<{ name: string; length: number; start: number }[]>((items, row) => {
    const start = items.reduce((sum, item) => sum + item.length, 0);
    const length = (row.value / total) * circ;
    return [...items, { name: row.name, length, start }];
  }, []);
  return (
    <svg role="img" aria-label={label} viewBox="0 0 220 140" className="w-full max-w-sm">
      <g transform="translate(70 70)">
        {segments.map((segment, index) => (
          <circle
            key={segment.name}
            r={radius}
            fill="none"
            stroke={index % 2 === 0 ? "var(--chart-primary)" : "var(--chart-secondary)"}
            strokeWidth="14"
            strokeDasharray={`${segment.length} ${circ - segment.length}`}
            strokeDashoffset={-segment.start}
            transform="rotate(-90)"
          />
        ))}
      </g>
      {usable.slice(0, 4).map((row, index) => (
        <text key={row.name} x="128" y={28 + index * 18} fill="var(--foreground)" fontSize="11">
          {row.name}
        </text>
      ))}
    </svg>
  );
}

export function LineChart({ rows, label }: { rows: { name: string; value: number }[]; label: string }) {
  if (rows.length === 0) return <p className="m-0 text-muted">Nothing recorded for this range.</p>;
  const width = 360;
  const height = 140;
  const min = Math.min(...rows.map((row) => row.value));
  const max = Math.max(...rows.map((row) => row.value));
  const span = Math.max(1, max - min);
  const points = rows.map((row, index) => {
    const x = rows.length === 1 ? width / 2 : (index / (rows.length - 1)) * (width - 24) + 12;
    const y = height - 24 - ((row.value - min) / span) * (height - 40);
    return `${x},${y}`;
  });
  return (
    <svg role="img" aria-label={label} viewBox={`0 0 ${width} ${height}`} className="w-full">
      <polyline fill="none" stroke="var(--chart-primary)" strokeWidth="1.6" points={points.join(" ")} />
      {rows.map((row, index) => (
        <text key={row.name} x={rows.length === 1 ? width / 2 : (index / (rows.length - 1)) * (width - 24) + 12} y={height - 4} textAnchor="middle" fill="var(--muted-foreground)" fontSize="10">
          {row.name.slice(2)}
        </text>
      ))}
    </svg>
  );
}
