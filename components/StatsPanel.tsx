import React, { useState } from 'react';
import { useWorkspaceStore } from '../store/useWorkspaceStore';
import { calculateStats } from '../lib/stats';
import { Card, CardContent } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { BarChart3, Calculator, Shuffle } from 'lucide-react';

interface StatsPanelProps {
  xMin: number | null;
  xMax: number | null;
}

export default function StatsPanel({ xMin, xMax }: StatsPanelProps) {
  const { datasets, applyMathOperation } = useWorkspaceStore();
  
  // Math operation form states
  const [selectedCurveKey, setSelectedCurveKey] = useState<string>('');
  const [mathAxis, setMathAxis] = useState<'x' | 'y'>('y');
  const [mathOp, setMathOp] = useState<'add' | 'subtract' | 'multiply'>('multiply');
  const [mathVal, setMathVal] = useState<string>('1.0');

  // Collect all visible curves
  const visibleCurves = datasets.flatMap((dataset) =>
    dataset.curves
      .filter((c) => c.visible)
      .map((c) => ({
        datasetId: dataset.id,
        filename: dataset.filename,
        curve: c,
      }))
  );

  // Collect all curves for the Math Operations select dropdown
  const allCurves = datasets.flatMap((dataset) =>
    dataset.curves.map((c) => ({
      datasetId: dataset.id,
      curveId: c.id,
      name: `${dataset.filename} - ${c.name}`,
    }))
  );

  // Set default selected curve in math form if empty
  if (allCurves.length > 0 && !selectedCurveKey) {
    setSelectedCurveKey(`${allCurves[0].datasetId}:${allCurves[0].curveId}`);
  }

  const handleApplyMath = () => {
    if (!selectedCurveKey) return;
    const [datasetId, curveId] = selectedCurveKey.split(':');
    const val = parseFloat(mathVal);
    if (isNaN(val)) return;

    applyMathOperation(datasetId, curveId, mathAxis, mathOp, val);
  };

  return (
    <div className="space-y-6">
      {/* 1. VIEWPORT STATISTICS */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 border-b border-zinc-800 pb-2">
          <BarChart3 className="w-4 h-4 text-indigo-400" />
          <h3 className="font-bold text-xs uppercase text-zinc-400 tracking-wider">
            Curve Statistics
          </h3>
        </div>

        {xMin !== null && xMax !== null ? (
          <div className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded border border-indigo-500/20 font-medium">
            Viewport active: X range [{xMin.toFixed(2)}, {xMax.toFixed(2)}]
          </div>
        ) : (
          <div className="text-[10px] bg-zinc-950 text-zinc-500 px-2 py-1 rounded border border-zinc-900 font-medium">
            Viewport active: Full range
          </div>
        )}

        {visibleCurves.length === 0 ? (
          <div className="text-xs text-zinc-500 italic py-2">
            No visible curves on the canvas.
          </div>
        ) : (
          <div className="space-y-4">
            {visibleCurves.map(({ datasetId, filename, curve }) => {
              // Calculate stats for original or smoothed
              const isSmoothed = curve.smoothType !== 'none' && curve.smoothedY && curve.showSmoothed;
              const yData = isSmoothed ? curve.smoothedY! : curve.y;
              
              const stats = calculateStats(curve.x, yData, xMin, xMax);

              if (!stats) return null;

              return (
                <Card key={curve.id} className="bg-zinc-950 border-zinc-850 shadow-sm">
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center gap-2 border-b border-zinc-900 pb-1.5">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: curve.style.color }}
                      />
                      <span className="text-xs font-bold text-zinc-200 truncate flex-1">
                        {curve.name}
                      </span>
                      <span className="text-[9px] text-zinc-500 uppercase font-mono">
                        {isSmoothed ? 'Smoothed' : 'Original'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px] font-medium text-zinc-400 font-mono">
                      <div className="flex justify-between border-b border-zinc-900/50 pb-0.5">
                        <span className="text-zinc-500">Mean:</span>
                        <span className="text-zinc-300">{stats.mean.toFixed(4)}</span>
                      </div>
                      <div className="flex justify-between border-b border-zinc-900/50 pb-0.5">
                        <span className="text-zinc-500">Std Dev:</span>
                        <span className="text-zinc-300">{stats.stdDev.toFixed(4)}</span>
                      </div>
                      <div className="flex justify-between border-b border-zinc-900/50 pb-0.5">
                        <span className="text-zinc-500">Min:</span>
                        <span className="text-zinc-300">{stats.min.toFixed(4)}</span>
                      </div>
                      <div className="flex justify-between border-b border-zinc-900/50 pb-0.5">
                        <span className="text-zinc-500">Max:</span>
                        <span className="text-zinc-300">{stats.max.toFixed(4)}</span>
                      </div>
                      <div className="col-span-2 flex justify-between pt-0.5">
                        <span className="text-zinc-500">Slope (Convergence):</span>
                        <span className={`font-semibold ${stats.slope && Math.abs(stats.slope) < 1e-4 ? 'text-emerald-400' : 'text-zinc-300'}`}>
                          {stats.slope !== null ? stats.slope.toExponential(4) : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. MATH OPERATIONS PERMANENT TRANSFORMS */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-1.5 border-b border-zinc-800 pb-2">
          <Calculator className="w-4 h-4 text-indigo-400" />
          <h3 className="font-bold text-xs uppercase text-zinc-400 tracking-wider">
            Math Operations
          </h3>
        </div>

        {allCurves.length === 0 ? (
          <div className="text-xs text-zinc-500 italic py-1">
            Upload files to perform math transformations.
          </div>
        ) : (
          <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-850 space-y-3.5">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase font-bold text-zinc-500">Select Curve</Label>
              <select
                value={selectedCurveKey}
                onChange={(e) => setSelectedCurveKey(e.target.value)}
                className="w-full text-xs bg-zinc-900 border border-zinc-800 text-zinc-200 rounded p-1.5 focus:outline-none"
              >
                {allCurves.map((c) => (
                  <option key={`${c.datasetId}:${c.curveId}`} value={`${c.datasetId}:${c.curveId}`}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-zinc-500">Axis</Label>
                <select
                  value={mathAxis}
                  onChange={(e) => setMathAxis(e.target.value as any)}
                  className="w-full text-xs bg-zinc-900 border border-zinc-800 text-zinc-200 rounded p-1.5 focus:outline-none"
                >
                  <option value="x">X Axis</option>
                  <option value="y">Y Axis</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-zinc-500">Operation</Label>
                <select
                  value={mathOp}
                  onChange={(e) => setMathOp(e.target.value as any)}
                  className="w-full text-xs bg-zinc-900 border border-zinc-800 text-zinc-200 rounded p-1.5 focus:outline-none"
                >
                  <option value="multiply">Multiply (*)</option>
                  <option value="add">Add (+)</option>
                  <option value="subtract">Subtract (-)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] uppercase font-bold text-zinc-500">Constant Value</Label>
              <Input
                type="number"
                step="any"
                value={mathVal}
                onChange={(e) => setMathVal(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-zinc-100 text-xs h-8"
              />
            </div>

            <Button
              size="sm"
              onClick={handleApplyMath}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs gap-1.5"
            >
              <Shuffle className="w-3.5 h-3.5" /> Apply Transform
            </Button>
            <span className="block text-[8px] text-zinc-500 italic text-center">
              Permanent operation: e.g. kJ/mol → kcal/mol (multiply by 0.239)
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
