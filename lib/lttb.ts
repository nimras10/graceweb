/**
 * Largest-Triangle-Three-Buckets (LTTB) downsampling algorithm.
 * Downsamples data to a target size while preserving visual characteristics.
 */
export function lttb(x: number[], y: number[], threshold: number): { x: number[]; y: number[] } {
  const dataLength = x.length;
  if (threshold >= dataLength || threshold <= 0) {
    return { x: [...x], y: [...y] }; // No downsampling needed
  }

  const sampledX: number[] = new Array(threshold);
  const sampledY: number[] = new Array(threshold);

  // Always keep the first and last points
  sampledX[0] = x[0];
  sampledY[0] = y[0];
  sampledX[threshold - 1] = x[dataLength - 1];
  sampledY[threshold - 1] = y[dataLength - 1];

  // Bucket size. Leave room for the start and end data points.
  const bucketSize = (dataLength - 2) / (threshold - 2);

  let aIdx = 0; // Point A index (previous selected point)

  for (let i = 0; i < threshold - 2; i++) {
    // Calculate point range for current bucket
    const bucketStart = Math.floor((i + 0) * bucketSize) + 1;
    const bucketEnd = Math.floor((i + 1) * bucketSize) + 1;

    // Calculate range for next bucket (to calculate average point C)
    const nextBucketStart = Math.floor((i + 1) * bucketSize) + 1;
    const nextBucketEnd = Math.floor((i + 2) * bucketSize) + 1;

    // Calculate average point C of next bucket
    let avgCX = 0;
    let avgCY = 0;
    let nextBucketLength = 0;

    const limit = Math.min(nextBucketEnd, dataLength);
    for (let k = nextBucketStart; k < limit; k++) {
      avgCX += x[k];
      avgCY += y[k];
      nextBucketLength++;
    }

    if (nextBucketLength > 0) {
      avgCX /= nextBucketLength;
      avgCY /= nextBucketLength;
    } else {
      // Fallback to the last point
      avgCX = x[dataLength - 1];
      avgCY = y[dataLength - 1];
    }

    // Find the point in the current bucket that maximizes the triangle area
    let maxArea = -1;
    let maxAreaIdx = bucketStart;

    const ax = x[aIdx];
    const ay = y[aIdx];

    const currentBucketEnd = Math.min(bucketEnd, dataLength - 1);
    for (let j = bucketStart; j < currentBucketEnd; j++) {
      // Calculate triangle area formed by point A, point B (j), and average point C
      const area = Math.abs(
        (ax - avgCX) * (y[j] - ay) - (ax - x[j]) * (avgCY - ay)
      ) * 0.5;

      if (area > maxArea) {
        maxArea = area;
        maxAreaIdx = j;
      }
    }

    // Save selected point
    sampledX[i + 1] = x[maxAreaIdx];
    sampledY[i + 1] = y[maxAreaIdx];

    // This point becomes the next point A
    aIdx = maxAreaIdx;
  }

  return { x: sampledX, y: sampledY };
}
