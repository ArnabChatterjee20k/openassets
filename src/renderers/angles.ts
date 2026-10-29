/** Camera-facing rotations applied to 3D assets (x, y, z radians). */
export const ANGLES = {
  front: [0, 0, 0],
  iso: [0.22, -0.32, 0], // gentle three-quarter: shows depth without losing the silhouette
  side: [0.12, 0.62, 0],
} as const;
export type Angle = keyof typeof ANGLES;
