'use client';

import React, { useMemo, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWorkspaceStore, Curve } from '../store/useWorkspaceStore';
import { lttb } from '../lib/lttb';
import { Button } from './ui/button';
import { Maximize2 } from 'lucide-react';

// Dynamically load Plotly and the React wrapper client-side only
const Plot = dynamic(
  async () => {
    const PlotlyLib = (await import('plotly.js-dist-min')).default;
    const createPlotlyComponent = (await import('react-plotly.js/factory')).default;
    return createPlotlyComponent(PlotlyLib);
  },
  { ssr: false }
) as any;

interface PlotCanvasProps {
  onViewportChange: (range: { xMin: number | null; xMax: number | null }) => void;
}

export default function PlotCanvas({ onViewportChange }: PlotCanvasProps) {
  const {
    datasets,
    globalSettings,
    annotations,
    thresholdLines,
    annotationMode,
    addAnnotation,
    toggleCurveVisibility,
    theme,
  } = useWorkspaceStore();

  const [revision, setRevision] = useState(0);

  // Re-render layout on reset view, global settings, or theme change
  useEffect(() => {
    setRevision(prev => prev + 1);
  }, [globalSettings, annotations, thresholdLines, theme]);

  // Convert curves to Plotly traces
  const traces = useMemo(() => {
    const list: any[] = [];

    datasets.forEach((dataset) => {
      dataset.curves.forEach((curve) => {
        if (!curve.visible) return;

        // Determine if it is a histogram
        if (curve.isHistogram) {
          list.push({
            name: `${curve.name} (Hist)`,
            x: curve.y,
            type: 'histogram',
            marker: {
              color: curve.style.color,
              opacity: curve.style.opacity / 100,
            },
            hoverinfo: 'x+y',
            customdata: { datasetId: dataset.id, curveId: curve.id },
          });
          return;
        }

        // Downsample logic for line charts
        let renderX = curve.x;
        let renderY = curve.y;

        if (curve.x.length > 5000) {
          const downsampled = lttb(curve.x, curve.y, 3000);
          renderX = downsampled.x;
          renderY = downsampled.y;
        }

        const mapDash = (dash: string) => {
          if (dash === 'dash') return 'dash';
          if (dash === 'dot') return 'dot';
          return 'solid';
        };

        // If we are showing both original and smoothed
        const hasSmoothing = curve.smoothType !== 'none' && curve.smoothedY;
        
        if (hasSmoothing && !curve.showSmoothed) {
          // Just show original
          list.push({
            name: curve.name,
            x: renderX,
            y: renderY,
            type: 'scatter',
            mode: 'lines',
            line: {
              color: curve.style.color,
              width: curve.style.width,
              dash: mapDash(curve.style.dash),
            },
            opacity: curve.style.opacity / 100,
            hovertemplate: `<b>${curve.name}</b><br>` +
              `${globalSettings.xLabel || 'X'}: %{x:.3f}<br>` +
              `${globalSettings.yLabel || 'Y'}: %{y:.3f}<extra></extra>`,
            customdata: { datasetId: dataset.id, curveId: curve.id },
          });
        } else if (hasSmoothing && curve.showSmoothed) {
          // Determine smoothed rendering Y values
          let smoothRenderY = curve.smoothedY!;
          let smoothRenderX = curve.x;

          if (curve.x.length > 5000) {
            const downsampledSmooth = lttb(curve.x, curve.smoothedY!, 3000);
            smoothRenderX = downsampledSmooth.x;
            smoothRenderY = downsampledSmooth.y;
          }

          // Show smoothed curve
          list.push({
            name: `${curve.name} (Smoothed)`,
            x: smoothRenderX,
            y: smoothRenderY,
            type: 'scatter',
            mode: 'lines',
            line: {
              color: curve.style.color,
              width: curve.style.width + 1, // Slightly bolder for smoothed
              dash: 'solid',
            },
            opacity: curve.style.opacity / 100,
            hovertemplate: `<b>${curve.name} (Smoothed)</b><br>` +
              `${globalSettings.xLabel || 'X'}: %{x:.3f}<br>` +
              `${globalSettings.yLabel || 'Y'}: %{y:.3f}<extra></extra>`,
            customdata: { datasetId: dataset.id, curveId: curve.id },
          });

          // Draw faint original overlay too
          list.push({
            name: `${curve.name} (Original)`,
            x: renderX,
            y: renderY,
            type: 'scatter',
            mode: 'lines',
            line: {
              color: curve.style.color,
              width: Math.max(1, curve.style.width - 0.5),
              dash: 'dashdot',
            },
            opacity: Math.max(0.1, (curve.style.opacity / 100) * 0.35), // Faded
            hovertemplate: `<b>${curve.name} (Original)</b><br>` +
              `${globalSettings.xLabel || 'X'}: %{x:.3f}<br>` +
              `${globalSettings.yLabel || 'Y'}: %{y:.3f}<extra></extra>`,
            customdata: { datasetId: dataset.id, curveId: curve.id },
          });
        } else {
          // Default: no smoothing
          list.push({
            name: curve.name,
            x: renderX,
            y: renderY,
            type: 'scatter',
            mode: 'lines',
            line: {
              color: curve.style.color,
              width: curve.style.width,
              dash: mapDash(curve.style.dash),
            },
            opacity: curve.style.opacity / 100,
            hovertemplate: `<b>${curve.name}</b><br>` +
              `${globalSettings.xLabel || 'X'}: %{x:.3f}<br>` +
              `${globalSettings.yLabel || 'Y'}: %{y:.3f}<extra></extra>`,
            customdata: { datasetId: dataset.id, curveId: curve.id },
          });
        }
      });
    });

    return list;
  }, [datasets, globalSettings]);

  // Convert store threshold lines into Plotly shapes
  const shapes = useMemo(() => {
    return thresholdLines.map((line) => {
      const isX = line.axis === 'x';
      return {
        type: 'line',
        xref: isX ? 'x' : 'paper',
        yref: isX ? 'paper' : 'y',
        x0: isX ? line.value : 0,
        x1: isX ? line.value : 1,
        y0: isX ? 0 : line.value,
        y1: isX ? 1 : line.value,
        line: {
          color: line.color,
          width: 2,
          dash: line.dash === 'dash' ? 'dash' : line.dash === 'dot' ? 'dot' : 'solid',
        },
      };
    });
  }, [thresholdLines]);

  // Convert store annotations to Plotly annotations layout config
  const plotlyAnnotations = useMemo(() => {
    const isDark = theme === 'dark';
    return annotations.map((ann) => ({
      x: ann.x,
      y: ann.y,
      xref: 'x',
      yref: 'y',
      text: ann.text,
      showarrow: true,
      arrowhead: 2,
      ax: 0,
      ay: -40,
      font: {
        color: isDark ? '#f4f4f5' : '#09090b',
        size: 12,
      },
      bordercolor: isDark ? '#22202b' : '#e4e4e7',
      borderpad: 4,
      bgcolor: isDark ? '#131218' : '#ffffff',
      opacity: 0.9,
    }));
  }, [annotations, theme]);

  // Plotly layout configuration
  const layout = useMemo(() => {
    const isDark = theme === 'dark';
    const lay: any = {
      title: {
        text: globalSettings.title || 'GraceWeb Plot',
        font: { 
          color: isDark ? '#f4f4f5' : '#09090b', 
          family: 'sans-serif', 
          size: 16 
        },
      },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: isDark ? 'rgba(20,19,25,0.4)' : 'rgba(244,244,245,0.4)',
      xaxis: {
        title: {
          text: globalSettings.xLabel || 'X Axis',
          font: { color: isDark ? '#8f8c9f' : '#71717a', size: 13 },
        },
        gridcolor: isDark ? '#22202b' : '#e4e4e7',
        zerolinecolor: isDark ? '#2c2938' : '#d4d4d8',
        tickfont: { color: isDark ? '#8f8c9f' : '#71717a' },
      },
      yaxis: {
        title: {
          text: globalSettings.yLabel || 'Y Axis',
          font: { color: isDark ? '#8f8c9f' : '#71717a', size: 13 },
        },
        gridcolor: isDark ? '#22202b' : '#e4e4e7',
        zerolinecolor: isDark ? '#2c2938' : '#d4d4d8',
        tickfont: { color: isDark ? '#8f8c9f' : '#71717a' },
      },
      legend: {
        font: { color: isDark ? '#f4f4f5' : '#09090b', size: 11 },
        bgcolor: isDark ? 'rgba(19,18,24,0.9)' : 'rgba(255,255,255,0.9)',
        bordercolor: isDark ? '#22202b' : '#e4e4e7',
        borderwidth: 1,
      },
      hovermode: 'closest',
      margin: { l: 60, r: 30, t: 50, b: 50 },
      shapes,
      annotations: plotlyAnnotations,
    };

    // Min/Max overrides
    if (globalSettings.xMin) lay.xaxis.range = [parseFloat(globalSettings.xMin), lay.xaxis.range?.[1] ?? 10];
    if (globalSettings.xMax) lay.xaxis.range = [lay.xaxis.range?.[0] ?? 0, parseFloat(globalSettings.xMax)];
    if (globalSettings.yMin) lay.yaxis.range = [parseFloat(globalSettings.yMin), lay.yaxis.range?.[1] ?? 10];
    if (globalSettings.yMax) lay.yaxis.range = [lay.yaxis.range?.[0] ?? 0, parseFloat(globalSettings.yMax)];

    return lay;
  }, [globalSettings, shapes, plotlyAnnotations, theme]);

  // Handle Relayout (zoom & pan actions)
  const handleRelayout = (eventData: any) => {
    let xMin: number | null = null;
    let xMax: number | null = null;

    if (eventData['xaxis.range[0]'] !== undefined) {
      xMin = eventData['xaxis.range[0]'];
      xMax = eventData['xaxis.range[1]'];
    } else if (eventData['xaxis.range'] !== undefined) {
      xMin = eventData['xaxis.range'][0];
      xMax = eventData['xaxis.range'][1];
    }

    onViewportChange({ xMin, xMax });
  };

  // Add Annotation on click
  const handlePlotClick = (eventData: any) => {
    if (!annotationMode) return;

    const point = eventData.points?.[0];
    if (!point) return;

    const clickX = point.x;
    const clickY = point.y;

    const labelText = prompt(`Enter label for annotation at (${clickX.toFixed(3)}, ${clickY.toFixed(3)}):`);
    if (labelText && labelText.trim()) {
      addAnnotation(clickX, clickY, labelText.trim());
    }
  };

  // Double click reset view
  const handleResetView = () => {
    setRevision(prev => prev + 1);
    onViewportChange({ xMin: null, xMax: null });
  };

  // Double-clicking a legend item hides all other curves (isolates)
  // Single-clicking toggles that curve in our Zustand store
  const handleLegendClick = (eventData: any) => {
    const trace = eventData.data[eventData.curveNumber];
    if (trace.customdata) {
      const { datasetId, curveId } = trace.customdata;
      toggleCurveVisibility(datasetId, curveId);
    }
    return false; // Prevent Plotly's default toggling behavior
  };

  const handleLegendDoubleClick = (eventData: any) => {
    const activeTrace = eventData.data[eventData.curveNumber];
    if (activeTrace.customdata) {
      const { datasetId: targetDatasetId, curveId: targetCurveId } = activeTrace.customdata;
      
      // Isolate this specific curve in state
      datasets.forEach((d) => {
        d.curves.forEach((c) => {
          const isTarget = d.id === targetDatasetId && c.id === targetCurveId;
          const storeState = useWorkspaceStore.getState();
          if (c.visible !== isTarget) {
            storeState.toggleCurveVisibility(d.id, c.id);
          }
        });
      });
    }
    return false; // Prevent Plotly default isolation behavior
  };

  return (
    <div className="w-full h-full relative flex flex-col">
      <div className="absolute top-2 right-2 z-10">
        <Button
          variant="outline"
          size="sm"
          onClick={handleResetView}
          className="bg-zinc-900/80 border-zinc-800 hover:bg-zinc-800 text-xs gap-1.5"
        >
          <Maximize2 className="w-3.5 h-3.5" /> Reset View
        </Button>
      </div>

      <div className="flex-1 w-full min-h-[400px]">
        <Plot
          data={traces}
          layout={layout}
          revision={revision}
          config={{
            responsive: true,
            scrollZoom: true,
            displaylogo: false,
            modeBarButtonsToRemove: ['select2d', 'lasso2d', 'toggleSpikelines'],
          }}
          className="w-full h-full"
          style={{ width: '100%', height: '100%' }}
          onRelayout={handleRelayout}
          onClick={handlePlotClick}
          onLegendClick={handleLegendClick}
          onLegendDoubleClick={handleLegendDoubleClick}
        />
      </div>

      {annotationMode && (
        <div className="absolute inset-0 bg-indigo-500/5 border border-indigo-400/20 pointer-events-none rounded-xl flex items-center justify-center">
          <div className="bg-zinc-950/90 text-indigo-300 border border-indigo-500/20 px-4 py-2 rounded-lg text-xs shadow-xl animate-pulse">
            Annotation Mode Active &bull; Click anywhere on a data point to place a label
          </div>
        </div>
      )}
    </div>
  );
}
