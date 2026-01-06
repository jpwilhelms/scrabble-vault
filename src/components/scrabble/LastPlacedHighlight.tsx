import { useMemo } from 'react';

interface LastPlacedHighlightProps {
  positions: Array<{ x: number; y: number }>;
}

export function LastPlacedHighlight({ positions }: LastPlacedHighlightProps) {
  const pathData = useMemo(() => {
    if (positions.length === 0) return null;

    // Work in percentage coordinates (0-100%)
    const cellSize = 100 / 15;

    // Create a set for fast lookup
    const posSet = new Set(positions.map(p => `${p.x},${p.y}`));

    // Find bounding edges - we need to draw a path around all connected tiles
    const edges: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];

    for (const pos of positions) {
      const { x, y } = pos;
      const left = x * cellSize;
      const top = y * cellSize;
      const right = left + cellSize;
      const bottom = top + cellSize;

      // Check each edge - only draw if neighbor is NOT in the set
      // Top edge
      if (!posSet.has(`${x},${y - 1}`)) {
        edges.push({ x1: left, y1: top, x2: right, y2: top });
      }
      // Bottom edge
      if (!posSet.has(`${x},${y + 1}`)) {
        edges.push({ x1: left, y1: bottom, x2: right, y2: bottom });
      }
      // Left edge
      if (!posSet.has(`${x - 1},${y}`)) {
        edges.push({ x1: left, y1: top, x2: left, y2: bottom });
      }
      // Right edge
      if (!posSet.has(`${x + 1},${y}`)) {
        edges.push({ x1: right, y1: top, x2: right, y2: bottom });
      }
    }

    return edges;
  }, [positions]);

  if (!pathData || pathData.length === 0) return null;

  return (
    <svg
      className="absolute inset-0 pointer-events-none z-10"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ width: '100%', height: '100%' }}
    >
      {pathData.map((edge, i) => (
        <line
          key={i}
          x1={edge.x1}
          y1={edge.y1}
          x2={edge.x2}
          y2={edge.y2}
          stroke="#22c55e"
          strokeWidth="0.4"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}
