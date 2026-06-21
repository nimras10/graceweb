import React, { useState } from 'react';
import { useWorkspaceStore } from '../store/useWorkspaceStore';
import { ChevronDown, ChevronRight, Eye, EyeOff, Trash2, LineChart } from 'lucide-react';
import StylePopover from './StylePopover';

export default function SeriesList() {
  const { datasets, toggleCurveVisibility, removeDataset, toggleHistogram } = useWorkspaceStore();
  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({});

  const toggleExpand = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (datasets.length === 0) {
    return (
      <div className="text-xs text-zinc-500 italic py-2">
        No files uploaded yet. Upload .xvg files to see lists here.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {datasets.map((dataset) => {
        const isExpanded = expanded[dataset.id] !== false; // Default to expanded
        const activeCurvesCount = dataset.curves.filter(c => c.visible).length;

        return (
          <div key={dataset.id} className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900/20">
            {/* Header */}
            <div
              className="flex items-center justify-between p-3 bg-zinc-900/40 hover:bg-zinc-900/60 cursor-pointer select-none border-b border-zinc-800/50"
              onClick={() => toggleExpand(dataset.id)}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                )}
                <span className="text-xs font-semibold text-zinc-300 truncate" title={dataset.filename}>
                  {dataset.filename}
                </span>
                <span className="text-[10px] bg-zinc-800/80 text-zinc-500 px-1.5 py-0.5 rounded flex-shrink-0 font-mono">
                  {activeCurvesCount}/{dataset.curves.length}
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeDataset(dataset.id);
                }}
                className="p-1 hover:text-red-400 text-zinc-500 rounded transition ml-1"
                title="Remove dataset"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Curves list */}
            {isExpanded && (
              <div className="p-2 divide-y divide-zinc-800/30">
                {dataset.curves.map((curve) => (
                  <div
                    key={curve.id}
                    className="flex items-center justify-between py-2 px-1 text-xs hover:bg-zinc-800/20 rounded transition"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <button
                        onClick={() => toggleCurveVisibility(dataset.id, curve.id)}
                        className={`p-1 rounded hover:bg-zinc-800 transition flex-shrink-0 ${
                          curve.visible ? 'text-indigo-400' : 'text-zinc-600'
                        }`}
                        title={curve.visible ? "Hide curve" : "Show curve"}
                      >
                        {curve.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                      
                      {/* Color indicator */}
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm"
                        style={{
                          backgroundColor: curve.style.color,
                          opacity: curve.style.opacity / 100,
                        }}
                      />

                      <span className="text-zinc-300 truncate" title={curve.name}>
                        {curve.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0 pl-2">
                      {/* Histogram toggle */}
                      <button
                        onClick={() => toggleHistogram(dataset.id, curve.id)}
                        className={`p-1 rounded hover:bg-zinc-800 transition ${
                          curve.isHistogram ? 'text-amber-400' : 'text-zinc-500 hover:text-zinc-400'
                        }`}
                        title={curve.isHistogram ? "Switch to Line chart" : "Switch to Histogram"}
                      >
                        <LineChart className="w-3.5 h-3.5" />
                      </button>

                      {/* Style trigger */}
                      <StylePopover datasetId={dataset.id} curve={curve} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
