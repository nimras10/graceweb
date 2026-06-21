import { Curve, Dataset } from '../store/useWorkspaceStore';

const DEFAULT_COLORS = [
  '#3b82f6', // blue
  '#a855f7', // purple
  '#10b981', // emerald
  '#f97316', // orange
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#eab308', // yellow
  '#ef4444', // red
];

export function parseXvg(fileText: string, filename: string): Omit<Dataset, 'id'> {
  const lines = fileText.split(/\r?\n/);
  
  let title = '';
  let xLabel = '';
  let yLabel = '';
  const legends: { [key: number]: string } = {};
  
  const rawData: number[][] = []; // Rows of numbers

  // Regex helper patterns
  const titleRegex = /@\s+title\s+"([^"]+)"/i;
  const subtitleRegex = /@\s+subtitle\s+"([^"]+)"/i;
  const xAxisLabelRegex = /@\s+xaxis\s+label\s+"([^"]+)"/i;
  const yAxisLabelRegex = /@\s+yaxis\s+label\s+"([^"]+)"/i;
  const legendRegex = /@\s+s(\d+)\s+legend\s+"([^"]+)"/i;

  let subtitle = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Ignore comments
    if (trimmed.startsWith('#')) {
      continue;
    }

    // Grace Metadata
    if (trimmed.startsWith('@')) {
      let match;
      if ((match = trimmed.match(titleRegex))) {
        title = match[1];
      } else if ((match = trimmed.match(subtitleRegex))) {
        subtitle = match[1];
      } else if ((match = trimmed.match(xAxisLabelRegex))) {
        xLabel = match[1];
      } else if ((match = trimmed.match(yAxisLabelRegex))) {
        yLabel = match[1];
      } else if ((match = trimmed.match(legendRegex))) {
        const index = parseInt(match[1], 10);
        legends[index] = match[2];
      }
      continue;
    }

    // Parse Data Row
    const parts = trimmed.split(/\s+/);
    const row = parts.map(p => parseFloat(p)).filter(n => !isNaN(n));
    if (row.length > 1) {
      rawData.push(row);
    }
  }

  // Format title if subtitle is present
  if (subtitle && title) {
    title = `${title} - ${subtitle}`;
  } else if (!title) {
    title = filename.replace(/\.xvg$/i, '');
  }

  if (rawData.length === 0) {
    throw new Error('No numeric data found in the .xvg file.');
  }

  // Determine number of curves from data columns (first is X, rest are Y)
  const numColumns = rawData[0].length;
  const numCurves = numColumns - 1;
  
  const curves: Curve[] = [];

  for (let cIdx = 0; cIdx < numCurves; cIdx++) {
    const x: number[] = [];
    const y: number[] = [];

    for (let rIdx = 0; rIdx < rawData.length; rIdx++) {
      x.push(rawData[rIdx][0]);
      y.push(rawData[rIdx][cIdx + 1]);
    }

    const name = legends[cIdx] || `Series ${cIdx + 1}`;
    const color = DEFAULT_COLORS[cIdx % DEFAULT_COLORS.length];

    curves.push({
      id: '', // Will be assigned by store
      name,
      x,
      y,
      originalX: [...x],
      originalY: [...y],
      smoothType: 'none',
      smoothWindow: 11,
      smoothOrder: 3,
      showSmoothed: false,
      smoothedY: null,
      visible: true,
      isHistogram: false,
      style: {
        color,
        width: 2,
        opacity: 100,
        dash: 'solid',
      },
    });
  }

  return {
    filename,
    title: title || filename,
    xLabel: xLabel || 'X Axis',
    yLabel: yLabel || 'Y Axis',
    curves,
  };
}
