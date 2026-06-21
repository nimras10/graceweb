import { create } from 'zustand';

export interface CurveStyle {
  color: string;
  width: number;
  opacity: number;
  dash: 'solid' | 'dash' | 'dot';
}

export interface Curve {
  id: string;
  name: string;
  x: number[];
  y: number[];
  
  // Math transforms applied (in-place or tracking)
  originalX: number[];
  originalY: number[];
  
  // Smoothing fields
  smoothType: 'none' | 'moving_average' | 'savitzky_golay';
  smoothWindow: number;
  smoothOrder: number;
  showSmoothed: boolean; // false = original, true = replace or show both depending on styling
  smoothedY: number[] | null;
  
  // View options
  visible: boolean;
  isHistogram: boolean;
  style: CurveStyle;
}

export interface Dataset {
  id: string;
  filename: string;
  title: string;
  xLabel: string;
  yLabel: string;
  curves: Curve[];
}

export interface Annotation {
  id: string;
  x: number;
  y: number;
  text: string;
}

export interface ThresholdLine {
  id: string;
  axis: 'x' | 'y';
  value: number;
  color: string;
  dash: 'solid' | 'dash' | 'dot';
}

export interface GlobalSettings {
  title: string;
  xLabel: string;
  yLabel: string;
  xMin: string; // Keep as string for input flexibility
  xMax: string;
  yMin: string;
  yMax: string;
}

interface WorkspaceState {
  datasets: Dataset[];
  globalSettings: GlobalSettings;
  annotations: Annotation[];
  thresholdLines: ThresholdLine[];
  annotationMode: boolean;
  
  // Actions
  addDataset: (dataset: Omit<Dataset, 'id'>) => void;
  removeDataset: (id: string) => void;
  toggleCurveVisibility: (datasetId: string, curveId: string) => void;
  updateCurveStyle: (datasetId: string, curveId: string, style: Partial<CurveStyle>) => void;
  updateGlobalSettings: (settings: Partial<GlobalSettings>) => void;
  applyMathOperation: (
    datasetId: string,
    curveId: string,
    axis: 'x' | 'y',
    op: 'add' | 'subtract' | 'multiply',
    val: number
  ) => void;
  applySmoothing: (
    datasetId: string,
    curveId: string,
    config: {
      type: 'none' | 'moving_average' | 'savitzky_golay';
      window: number;
      order: number;
      showSmoothed: boolean;
      smoothedY: number[] | null;
    }
  ) => void;
  toggleHistogram: (datasetId: string, curveId: string) => void;
  
  setAnnotationMode: (active: boolean) => void;
  addAnnotation: (x: number, y: number, text: string) => void;
  removeAnnotation: (id: string) => void;
  addThresholdLine: (line: Omit<ThresholdLine, 'id'>) => void;
  removeThresholdLine: (id: string) => void;
  
  resetWorkspace: () => void;
  loadWorkspace: (savedState: any) => void;
  
  // Theme state
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

const DEFAULT_SETTINGS: GlobalSettings = {
  title: '',
  xLabel: '',
  yLabel: '',
  xMin: '',
  xMax: '',
  yMin: '',
  yMax: '',
};

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  datasets: [],
  globalSettings: DEFAULT_SETTINGS,
  annotations: [],
  thresholdLines: [],
  annotationMode: false,
  theme: 'dark',

  addDataset: (newDataset) => set((state) => {
    const id = Math.random().toString(36).substring(2, 9);
    const datasetWithId: Dataset = {
      ...newDataset,
      id,
      curves: newDataset.curves.map((curve, idx) => ({
        ...curve,
        id: curve.id || `${id}-curve-${idx}`,
      })),
    };

    // If it's the first dataset, populate global defaults
    const isFirst = state.datasets.length === 0;
    const nextSettings = isFirst ? {
      title: datasetWithId.title || 'GraceWeb Plot',
      xLabel: datasetWithId.xLabel || 'X Axis',
      yLabel: datasetWithId.yLabel || 'Y Axis',
      xMin: '',
      xMax: '',
      yMin: '',
      yMax: '',
    } : state.globalSettings;

    return {
      datasets: [...state.datasets, datasetWithId],
      globalSettings: nextSettings,
    };
  }),

  removeDataset: (id) => set((state) => ({
    datasets: state.datasets.filter((d) => d.id !== id),
  })),

  toggleCurveVisibility: (datasetId, curveId) => set((state) => ({
    datasets: state.datasets.map((d) => {
      if (d.id !== datasetId) return d;
      return {
        ...d,
        curves: d.curves.map((c) =>
          c.id === curveId ? { ...c, visible: !c.visible } : c
        ),
      };
    }),
  })),

  updateCurveStyle: (datasetId, curveId, styleUpdate) => set((state) => ({
    datasets: state.datasets.map((d) => {
      if (d.id !== datasetId) return d;
      return {
        ...d,
        curves: d.curves.map((c) =>
          c.id === curveId ? { ...c, style: { ...c.style, ...styleUpdate } } : c
        ),
      };
    }),
  })),

  updateGlobalSettings: (settingsUpdate) => set((state) => ({
    globalSettings: { ...state.globalSettings, ...settingsUpdate },
  })),

  applyMathOperation: (datasetId, curveId, axis, op, val) => set((state) => ({
    datasets: state.datasets.map((d) => {
      if (d.id !== datasetId) return d;
      return {
        ...d,
        curves: d.curves.map((c) => {
          if (c.id !== curveId) return c;
          
          const transform = (arr: number[]) => arr.map(x => {
            if (op === 'add') return x + val;
            if (op === 'subtract') return x - val;
            if (op === 'multiply') return x * val;
            return x;
          });

          if (axis === 'x') {
            const nextX = transform(c.x);
            return { ...c, x: nextX };
          } else {
            const nextY = transform(c.y);
            const nextSmoothed = c.smoothedY ? transform(c.smoothedY) : null;
            return { ...c, y: nextY, smoothedY: nextSmoothed };
          }
        }),
      };
    }),
  })),

  applySmoothing: (datasetId, curveId, config) => set((state) => ({
    datasets: state.datasets.map((d) => {
      if (d.id !== datasetId) return d;
      return {
        ...d,
        curves: d.curves.map((c) => {
          if (c.id !== curveId) return c;
          return {
            ...c,
            smoothType: config.type,
            smoothWindow: config.window,
            smoothOrder: config.order,
            showSmoothed: config.showSmoothed,
            smoothedY: config.smoothedY,
          };
        }),
      };
    }),
  })),

  toggleHistogram: (datasetId, curveId) => set((state) => ({
    datasets: state.datasets.map((d) => {
      if (d.id !== datasetId) return d;
      return {
        ...d,
        curves: d.curves.map((c) =>
          c.id === curveId ? { ...c, isHistogram: !c.isHistogram } : c
        ),
      };
    }),
  })),

  setAnnotationMode: (active) => set({ annotationMode: active }),

  addAnnotation: (x, y, text) => set((state) => ({
    annotations: [...state.annotations, { id: Math.random().toString(36).substring(2, 9), x, y, text }],
    annotationMode: false, // Turn off mode immediately after adding
  })),

  removeAnnotation: (id) => set((state) => ({
    annotations: state.annotations.filter((a) => a.id !== id),
  })),

  addThresholdLine: (line) => set((state) => ({
    thresholdLines: [
      ...state.thresholdLines,
      { ...line, id: Math.random().toString(36).substring(2, 9) },
    ],
  })),

  removeThresholdLine: (id) => set((state) => ({
    thresholdLines: state.thresholdLines.filter((t) => t.id !== id),
  })),

  resetWorkspace: () => set({
    datasets: [],
    globalSettings: DEFAULT_SETTINGS,
    annotations: [],
    thresholdLines: [],
    annotationMode: false,
  }),

  loadWorkspace: (savedState) => set({
    datasets: savedState.datasets || [],
    globalSettings: savedState.globalSettings || DEFAULT_SETTINGS,
    annotations: savedState.annotations || [],
    thresholdLines: savedState.thresholdLines || [],
    annotationMode: false,
  }),

  toggleTheme: () => set((state) => {
    const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
    if (typeof window !== 'undefined') {
      document.documentElement.classList.toggle('dark', nextTheme === 'dark');
    }
    return { theme: nextTheme };
  }),
}));
