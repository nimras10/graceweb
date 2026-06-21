export interface StatsResults {
  count: number;
  mean: number;
  stdDev: number;
  min: number;
  max: number;
  slope: number | null;
  intercept: number | null;
}

export function calculateStats(
  x: number[],
  y: number[],
  xMin?: number | null,
  xMax?: number | null
): StatsResults | null {
  const len = x.length;
  if (len === 0 || len !== y.length) return null;

  const minLimit = xMin !== undefined && xMin !== null ? xMin : -Infinity;
  const maxLimit = xMax !== undefined && xMax !== null ? xMax : Infinity;

  // Filter values in the current X-range
  const filteredX: number[] = [];
  const filteredY: number[] = [];

  for (let i = 0; i < len; i++) {
    if (x[i] >= minLimit && x[i] <= maxLimit) {
      filteredX.push(x[i]);
      filteredY.push(y[i]);
    }
  }

  const n = filteredX.length;
  if (n === 0) return null;

  // Basic stats
  let min = Infinity;
  let max = -Infinity;
  let sum = 0;

  for (let i = 0; i < n; i++) {
    const val = filteredY[i];
    if (val < min) min = val;
    if (val > max) max = val;
    sum += val;
  }

  const mean = sum / n;

  // Standard deviation
  let varianceSum = 0;
  for (let i = 0; i < n; i++) {
    varianceSum += Math.pow(filteredY[i] - mean, 2);
  }
  const stdDev = Math.sqrt(varianceSum / n);

  // Linear Regression (y = mx + c)
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (let i = 0; i < n; i++) {
    const xi = filteredX[i];
    const yi = filteredY[i];
    sumX += xi;
    sumY += yi;
    sumXY += xi * yi;
    sumXX += xi * xi;
  }

  const denominator = n * sumXX - sumX * sumX;
  let slope: number | null = null;
  let intercept: number | null = null;

  if (Math.abs(denominator) > 1e-12) {
    slope = (n * sumXY - sumX * sumY) / denominator;
    intercept = (sumY - slope * sumX) / n;
  }

  return {
    count: n,
    mean,
    stdDev,
    min,
    max,
    slope,
    intercept,
  };
}
