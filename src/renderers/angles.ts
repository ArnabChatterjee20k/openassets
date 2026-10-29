/** Camera-facing rotations applied to 3D assets (x, y, z radians). */
export const ANGLES = {
  front: [0, 0, 0],
  iso: [0.35, -0.6, 0],
  side: [0.15, 0.9, 0],
} as const;
export type Angle = keyof typeof ANGLES;
