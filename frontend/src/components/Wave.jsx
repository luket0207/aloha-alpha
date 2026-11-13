export function buildWavePath({ width, height, startY, curves, fillEdge = 'bottom' }) {
  const curvePath = curves.map(({ control1, control2, end }) => (
    `C${control1.x} ${control1.y} ${control2.x} ${control2.y} ${end.x} ${end.y}`
  )).join('');

  const closingPath = fillEdge === 'top'
    ? `L${width} 0H0Z`
    : `L${width} ${height}H0Z`;

  return `M0 ${startY}${curvePath}${closingPath}`;
}

export default function Wave({
  className,
  curves,
  fillEdge = 'bottom',
  height,
  startY,
  width,
}) {
  const path = buildWavePath({ curves, fillEdge, height, startY, width });

  return (
    <svg
      aria-hidden="true"
      className={className}
      focusable="false"
      preserveAspectRatio="none"
      viewBox={`0 0 ${width} ${height}`}
    >
      <path d={path} />
    </svg>
  );
}
