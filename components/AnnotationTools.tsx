import React, { useState } from 'react';
import { useWorkspaceStore } from '../store/useWorkspaceStore';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Tag, Trash2, GitCommit, ListPlus, ToggleLeft, ToggleRight } from 'lucide-react';

export default function AnnotationTools() {
  const {
    annotations,
    thresholdLines,
    annotationMode,
    setAnnotationMode,
    removeAnnotation,
    addThresholdLine,
    removeThresholdLine,
  } = useWorkspaceStore();

  // Threshold form local state
  const [lineAxis, setLineAxis] = useState<'x' | 'y'>('y');
  const [lineVal, setLineVal] = useState<string>('0.0');
  const [lineColor, setLineColor] = useState<string>('#ef4444');
  const [lineDash, setLineDash] = useState<'solid' | 'dash' | 'dot'>('dash');

  const handleAddLine = () => {
    const val = parseFloat(lineVal);
    if (isNaN(val)) return;

    addThresholdLine({
      axis: lineAxis,
      value: val,
      color: lineColor,
      dash: lineDash,
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. INTERACTIVE LABELS */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 border-b border-zinc-800 pb-2">
          <Tag className="w-4 h-4 text-indigo-400" />
          <h3 className="font-bold text-xs uppercase text-zinc-400 tracking-wider">
            Plot Annotations
          </h3>
        </div>

        <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-850 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-zinc-300 font-medium">Add Text Label mode</span>
            <button
              onClick={() => setAnnotationMode(!annotationMode)}
              className="focus:outline-none"
              title="Click on the plot after activating to drop a label"
            >
              {annotationMode ? (
                <ToggleRight className="w-9 h-9 text-indigo-400" />
              ) : (
                <ToggleLeft className="w-9 h-9 text-zinc-600 hover:text-zinc-500" />
              )}
            </button>
          </div>
          <p className="text-[10px] text-zinc-500 leading-normal">
            When enabled, click on any data point on the plot canvas to add a custom descriptive label.
          </p>
        </div>

        {annotations.length > 0 && (
          <div className="space-y-1.5 max-h-36 overflow-y-auto">
            <Label className="text-[10px] uppercase font-bold text-zinc-500">Active Labels</Label>
            <div className="space-y-1.5">
              {annotations.map((ann) => (
                <div
                  key={ann.id}
                  className="flex items-center justify-between p-2 bg-zinc-950/60 border border-zinc-900 rounded text-[10px] text-zinc-300"
                >
                  <div className="truncate pr-2 flex-1">
                    <span className="font-bold text-zinc-400 font-mono">({ann.x.toFixed(1)}, {ann.y.toFixed(1)}):</span>{' '}
                    <span className="italic font-medium">"{ann.text}"</span>
                  </div>
                  <button
                    onClick={() => removeAnnotation(ann.id)}
                    className="p-1 hover:text-red-400 text-zinc-500 rounded transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. THRESHOLD LINES */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-1.5 border-b border-zinc-800 pb-2">
          <GitCommit className="w-4 h-4 text-indigo-400" />
          <h3 className="font-bold text-xs uppercase text-zinc-400 tracking-wider">
            Reference Lines
          </h3>
        </div>

        <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-850 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase font-bold text-zinc-500">Axis</Label>
              <select
                value={lineAxis}
                onChange={(e) => setLineAxis(e.target.value as any)}
                className="w-full text-xs bg-zinc-900 border border-zinc-800 text-zinc-200 rounded p-1.5 focus:outline-none"
              >
                <option value="x">Vertical (X)</option>
                <option value="y">Horizontal (Y)</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] uppercase font-bold text-zinc-500">Value</Label>
              <Input
                type="number"
                step="any"
                value={lineVal}
                onChange={(e) => setLineVal(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-zinc-100 text-xs h-8"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase font-bold text-zinc-500">Line Style</Label>
              <select
                value={lineDash}
                onChange={(e) => setLineDash(e.target.value as any)}
                className="w-full text-xs bg-zinc-900 border border-zinc-800 text-zinc-200 rounded p-1.5 focus:outline-none"
              >
                <option value="solid">Solid</option>
                <option value="dash">Dashed</option>
                <option value="dot">Dotted</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] uppercase font-bold text-zinc-500">Line Color</Label>
              <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded px-2 h-8">
                <input
                  type="color"
                  value={lineColor}
                  onChange={(e) => setLineColor(e.target.value)}
                  className="w-5 h-5 bg-transparent border-0 cursor-pointer p-0"
                />
                <span className="text-[10px] font-mono text-zinc-400">{lineColor}</span>
              </div>
            </div>
          </div>

          <Button
            size="sm"
            onClick={handleAddLine}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs gap-1.5"
          >
            <ListPlus className="w-3.5 h-3.5" /> Draw Line
          </Button>
        </div>

        {thresholdLines.length > 0 && (
          <div className="space-y-1.5 max-h-36 overflow-y-auto">
            <Label className="text-[10px] uppercase font-bold text-zinc-500">Active Lines</Label>
            <div className="space-y-1.5">
              {thresholdLines.map((line) => (
                <div
                  key={line.id}
                  className="flex items-center justify-between p-2 bg-zinc-950/60 border border-zinc-900 rounded text-[10px] text-zinc-300"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-3 h-0.5 rounded"
                      style={{
                        backgroundColor: line.color,
                        borderTop: line.dash !== 'solid' ? `1px ${line.dash} ${line.color}` : 'none',
                      }}
                    />
                    <span className="font-bold text-zinc-200">
                      {line.axis.toUpperCase()} = {line.value}
                    </span>
                  </div>
                  <button
                    onClick={() => removeThresholdLine(line.id)}
                    className="p-1 hover:text-red-400 text-zinc-500 rounded transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
