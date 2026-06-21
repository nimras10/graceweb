/**
 * Moving average filter.
 * For a window size W (odd), averages the surrounding values.
 */
export function movingAverage(y: number[], windowSize: number): number[] {
  const result: number[] = [];
  const len = y.length;
  const half = Math.floor(windowSize / 2);

  for (let i = 0; i < len; i++) {
    let sum = 0;
    let count = 0;
    const start = Math.max(0, i - half);
    const end = Math.min(len - 1, i + half);

    for (let j = start; j <= end; j++) {
      sum += y[j];
      count++;
    }
    result.push(sum / count);
  }

  return result;
}

/**
 * Savitzky-Golay filter.
 * Fits a polynomial of degree `order` over a window of size `windowSize` (odd).
 * Uses reflection padding to handle boundary conditions.
 */
export function savitzkyGolay(y: number[], windowSize: number, order: number): number[] {
  const len = y.length;
  if (windowSize % 2 === 0) {
    windowSize += 1; // Must be odd
  }
  if (order >= windowSize) {
    order = windowSize - 1; // Order must be less than window size
  }

  const half = Math.floor(windowSize / 2);
  const coeffs = computeSGCoefficients(windowSize, order);

  const result: number[] = [];

  // Pad the array using reflection:
  // e.g. padding of size `half` at start and end.
  const getPadded = (idx: number): number => {
    if (idx < 0) {
      return y[-idx]; // Reflect at start
    }
    if (idx >= len) {
      return y[2 * len - 2 - idx]; // Reflect at end
    }
    return y[idx];
  };

  for (let i = 0; i < len; i++) {
    let smoothedVal = 0;
    for (let w = -half; w <= half; w++) {
      const coeff = coeffs[w + half];
      smoothedVal += coeff * getPadded(i + w);
    }
    result.push(smoothedVal);
  }

  return result;
}

/**
 * Computes the Savitzky-Golay filter coefficients for the central point.
 * This is equivalent to finding the first row of (X^T * X)^(-1) * X^T.
 */
function computeSGCoefficients(windowSize: number, order: number): number[] {
  const half = Math.floor(windowSize / 2);
  
  // Construct the design matrix X: size W x (order + 1)
  // X[i][j] = i^j, where i ranges from -half to +half
  const X: number[][] = [];
  for (let i = -half; i <= half; i++) {
    const row: number[] = [];
    for (let j = 0; j <= order; j++) {
      row.push(Math.pow(i, j));
    }
    X.push(row);
  }

  // Compute X^T (transpose of X): size (order + 1) x W
  const XT: number[][] = [];
  for (let j = 0; j <= order; j++) {
    const row: number[] = [];
    for (let i = 0; i < windowSize; i++) {
      row.push(X[i][j]);
    }
    XT.push(row);
  }

  // Compute A = XT * X: size (order + 1) x (order + 1)
  const A: number[][] = [];
  const n = order + 1;
  for (let i = 0; i < n; i++) {
    const row: number[] = [];
    for (let j = 0; j < n; j++) {
      let sum = 0;
      for (let k = 0; k < windowSize; k++) {
        sum += XT[i][k] * X[k][j];
      }
      row.push(sum);
    }
    A.push(row);
  }

  // Invert A using Gaussian elimination with pivoting
  const invA = invertMatrix(A);
  if (!invA) {
    // Fallback: return simple moving average coefficients if inversion fails
    return new Array(windowSize).fill(1 / windowSize);
  }

  // We want the coefficients that compute the smoothed value (order = 0 coefficient, i.e., index 0).
  // Coeffs = (invA * XT)_0,k
  // Coeffs[k] = Sum_{j=0}^{order} invA[0][j] * XT[j][k]
  const coeffs: number[] = [];
  for (let k = 0; k < windowSize; k++) {
    let sum = 0;
    for (let j = 0; j <= order; j++) {
      sum += invA[0][j] * XT[j][k];
    }
    coeffs.push(sum);
  }

  return coeffs;
}

/**
 * Inverts a small square matrix using Gauss-Jordan elimination.
 */
function invertMatrix(matrix: number[][]): number[][] | null {
  const n = matrix.length;
  // Initialize identity matrix
  const inv: number[][] = [];
  const matCopy: number[][] = [];
  for (let i = 0; i < n; i++) {
    inv.push(new Array(n).fill(0).map((_, j) => (i === j ? 1 : 0)));
    matCopy.push([...matrix[i]]);
  }

  for (let i = 0; i < n; i++) {
    // Find pivot
    let pivotRow = i;
    for (let j = i + 1; j < n; j++) {
      if (Math.abs(matCopy[j][i]) > Math.abs(matCopy[pivotRow][i])) {
        pivotRow = j;
      }
    }

    // Swap rows
    if (pivotRow !== i) {
      const tempMat = matCopy[i];
      matCopy[i] = matCopy[pivotRow];
      matCopy[pivotRow] = tempMat;

      const tempInv = inv[i];
      inv[i] = inv[pivotRow];
      inv[pivotRow] = tempInv;
    }

    const pivot = matCopy[i][i];
    if (Math.abs(pivot) < 1e-10) {
      return null; // Singular matrix
    }

    // Normalize pivot row
    for (let j = 0; j < n; j++) {
      matCopy[i][j] /= pivot;
      inv[i][j] /= pivot;
    }

    // Eliminate other rows
    for (let k = 0; k < n; k++) {
      if (k === i) continue;
      const factor = matCopy[k][i];
      for (let j = 0; j < n; j++) {
        matCopy[k][j] -= factor * matCopy[i][j];
        inv[k][j] -= factor * inv[i][j];
      }
    }
  }

  return inv;
}
