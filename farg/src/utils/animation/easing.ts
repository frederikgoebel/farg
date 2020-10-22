export type EasingFunction = (t: number) => number;

const easing = {
  easeOutCubic: (t: number) => --t * t * t + 1
};

export function normalize(x: number, min: number, max: number) {
  return (x - min) / (max - min);
}

export function denormalize(x: number, min: number, max: number) {
  return min + (max - min) * x;
}

export const interpolate = (
  f: (x: number) => number,
  range: { from: number; to: number }
) => (x: number) => {
  const result = f(normalize(x, range.from, range.to));
  return denormalize(result, range.from, range.to);
};

export default easing;
