import { Point2D, Wall, WallOpening } from '../types/cad';

export function distance(p1: Point2D, p2: Point2D): number {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

export function formatMeters(meters: number): string {
  if (meters < 1 && meters >= 0.01) {
    return `${Math.round(meters * 100)} cm`;
  }
  return `${meters.toFixed(2)} m`;
}

export function formatAreaM2(sqMeters: number): string {
  return `${sqMeters.toFixed(1)} m²`;
}

export function snapToGridPoint(pt: Point2D, gridSize: number, enabled: boolean): Point2D {
  if (!enabled || gridSize <= 0) {
    return {
      x: Math.round(pt.x * 100) / 100,
      y: Math.round(pt.y * 100) / 100,
    };
  }
  const step = gridSize;
  return {
    x: Math.round(Math.round(pt.x / step) * step * 100) / 100,
    y: Math.round(Math.round(pt.y / step) * step * 100) / 100,
  };
}

/**
 * Returns 4 corners of a wall polygon with thickness around the central line start-end.
 */
export function getWallPolygon(wall: Wall): Point2D[] {
  const dx = wall.end.x - wall.start.x;
  const dy = wall.end.y - wall.start.y;
  const len = Math.hypot(dx, dy);
  if (len < 0.001) {
    return [
      { x: wall.start.x - 0.1, y: wall.start.y - 0.1 },
      { x: wall.start.x + 0.1, y: wall.start.y - 0.1 },
      { x: wall.start.x + 0.1, y: wall.start.y + 0.1 },
      { x: wall.start.x - 0.1, y: wall.start.y + 0.1 },
    ];
  }

  // Normal unit vector perpendicular to wall direction
  const nx = -dy / len;
  const ny = dx / len;
  const half = wall.thickness / 2;

  const c1 = { x: wall.start.x + nx * half, y: wall.start.y + ny * half };
  const c2 = { x: wall.end.x + nx * half, y: wall.end.y + ny * half };
  const c3 = { x: wall.end.x - nx * half, y: wall.end.y - ny * half };
  const c4 = { x: wall.start.x - nx * half, y: wall.start.y - ny * half };

  return [c1, c2, c3, c4];
}

/**
 * Distance from point P to segment AB
 */
export function distanceToSegment(p: Point2D, a: Point2D, b: Point2D): number {
  const l2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
  if (l2 === 0) return distance(p, a);
  let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  const proj = {
    x: a.x + t * (b.x - a.x),
    y: a.y + t * (b.y - a.y),
  };
  return distance(p, proj);
}

/**
 * Check if point is inside a rotated rectangle centered at centerPt
 */
export function isPointInRotatedRect(
  p: Point2D,
  center: Point2D,
  width: number,
  depth: number,
  rotationDeg: number
): boolean {
  const rad = (-rotationDeg * Math.PI) / 180;
  const dx = p.x - center.x;
  const dy = p.y - center.y;

  const rx = dx * Math.cos(rad) - dy * Math.sin(rad);
  const ry = dx * Math.sin(rad) + dy * Math.cos(rad);

  const halfW = width / 2;
  const halfD = depth / 2;

  return rx >= -halfW && rx <= halfW && ry >= -halfD && ry <= halfD;
}

/**
 * Calculate the world position of an opening along a wall
 */
export function getOpeningPosition(wall: Wall, opening: WallOpening): Point2D {
  const dx = wall.end.x - wall.start.x;
  const dy = wall.end.y - wall.start.y;
  const len = Math.hypot(dx, dy);
  if (len < 0.001) return wall.start;

  // offset can be distance in meters along the wall
  const t = Math.max(0, Math.min(len, opening.offset)) / len;
  return {
    x: wall.start.x + dx * t,
    y: wall.start.y + dy * t,
  };
}

/**
 * Calculate angle of wall in radians
 */
export function getWallAngleRad(wall: Wall): number {
  return Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x);
}
