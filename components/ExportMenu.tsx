import React, { useState, useRef } from 'react';
import { useWorkspaceStore } from '../store/useWorkspaceStore';
import { saveAs } from 'file-saver';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Download, FileJson, FileSpreadsheet, Image as ImageIcon, Upload } from 'lucide-react';

export default function ExportMenu() {
  const { datasets, globalSettings, annotations, thresholdLines, loadWorkspace } = useWorkspaceStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Image export state
  const [imgFormat, setImgFormat] = useState<'png' | 'svg'>('png');
  const [imgScale, setImgScale] = useState<number>(2); // 1 = 96dpi, 2 = 300dpi, 3 = ultra
  const [transparentBg, setTransparentBg] = useState<boolean>(false);

  // CSV export state
  const [csvCurveKey, setCsvCurveKey] = useState<string>('');

  const allCurves = datasets.flatMap((dataset) =>
    dataset.curves.map((c) => ({
      datasetId: dataset.id,
      curveId: c.id,
      name: `${dataset.filename} - ${c.name}`,
      curve: c,
    }))
  );

  if (allCurves.length > 0 && !csvCurveKey) {
    setCsvCurveKey(`${allCurves[0].datasetId}:${allCurves[0].curveId}`);
  }

  // IMAGE EXPORT
  const handleImageExport = async () => {
    const Plotly = (await import('plotly.js-dist-min')).default;
    const gd = document.querySelector('.js-plotly-plot') as any;
    if (!gd) {
      alert('Plot canvas not found.');
      return;
    }

    const overrides: any = {};
    if (transparentBg) {
      overrides.paper_bgcolor = 'rgba(0,0,0,0)';
      overrides.plot_bgcolor = 'rgba(0,0,0,0)';
    }

    try {
      await Plotly.downloadImage(gd, {
        format: imgFormat,
        width: gd.offsetWidth,
        height: gd.offsetHeight,
        scale: imgScale,
        filename: (globalSettings.title || 'graceweb_plot').toLowerCase().replace(/\s+/g, '_'),
        imageDataOnly: false,
        setBackgroundColor: transparentBg ? 'transparent' : undefined,
      });
    } catch (err) {
      console.error(err);
      alert('Failed to export image.');
    }
  };

  // CSV DATA EXPORT
  const handleCsvExport = () => {
    if (!csvCurveKey) return;
    const [datasetId, curveId] = csvCurveKey.split(':');
    const selected = allCurves.find(c => c.datasetId === datasetId && c.curveId === curveId);
    if (!selected) return;

    const curve = selected.curve;
    let csvContent = 'X,Y';
    const isSmoothed = curve.smoothType !== 'none' && curve.smoothedY;
    if (isSmoothed) {
      csvContent += ',SmoothedY';
    }
    csvContent += '\n';

    for (let i = 0; i < curve.x.length; i++) {
      csvContent += `${curve.x[i]},${curve.y[i]}`;
      if (isSmoothed) {
        csvContent += `,${curve.smoothedY![i]}`;
      }
      csvContent += '\n';
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${curve.name.toLowerCase().replace(/\s+/g, '_')}_data.csv`);
  };

  // WORKSPACE EXPORT (SAVE)
  const handleSaveWorkspace = () => {
    const session = {
      datasets,
      globalSettings,
      annotations,
      thresholdLines,
    };

    const json = JSON.stringify(session, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    saveAs(blob, 'graceweb_workspace.json');
  };

  // WORKSPACE IMPORT (LOAD)
  const handleLoadWorkspaceClick = () => {
    fileInputRef.current?.click();
  };

  const handleWorkspaceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        loadWorkspace(parsed);
        alert('Workspace loaded successfully!');
      } catch (err) {
        alert('Invalid workspace JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <Dialog>
      <DialogTrigger render={
        <Button
          variant="outline"
          size="sm"
          className="bg-zinc-900/80 border-zinc-800 hover:bg-zinc-800 text-xs gap-1.5"
        />
      }>
        <Download className="w-3.5 h-3.5" /> Export
      </DialogTrigger>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-sm font-bold uppercase tracking-wider text-zinc-400">
            Export Center & Workspace
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2 divide-y divide-zinc-800">
          {/* 1. PLOT IMAGE EXPORT */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-semibold text-zinc-300">Save Plot Image</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px] text-zinc-500 uppercase font-bold">Format</Label>
                <select
                  value={imgFormat}
                  onChange={(e) => setImgFormat(e.target.value as any)}
                  className="w-full text-xs bg-zinc-950 border border-zinc-800 text-zinc-200 rounded p-1.5 focus:outline-none"
                >
                  <option value="png">PNG Image</option>
                  <option value="svg">SVG Vector (Lossless)</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] text-zinc-500 uppercase font-bold">DPI / Scale</Label>
                <select
                  value={imgScale}
                  onChange={(e) => setImgScale(parseFloat(e.target.value))}
                  className="w-full text-xs bg-zinc-950 border border-zinc-800 text-zinc-200 rounded p-1.5 focus:outline-none"
                >
                  <option value="1">Standard (96 DPI)</option>
                  <option value="2">High (300 DPI - Pub)</option>
                  <option value="3">Ultra (Publication Grade)</option>
                </select>
              </div>
            </div>

            {imgFormat === 'png' && (
              <div className="flex items-center gap-2 py-1 select-none">
                <input
                  type="checkbox"
                  id="transparent-bg"
                  checked={transparentBg}
                  onChange={(e) => setTransparentBg(e.target.checked)}
                  className="w-3.5 h-3.5 accent-indigo-500 bg-zinc-950 border border-zinc-800 rounded"
                />
                <Label htmlFor="transparent-bg" className="text-xs text-zinc-400 cursor-pointer">
                  Transparent background
                </Label>
              </div>
            )}

            <Button
              size="sm"
              onClick={handleImageExport}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-white text-xs border border-zinc-700"
            >
              Download Plot Image
            </Button>
          </div>

          {/* 2. DATA CSV EXPORT */}
          <div className="space-y-3 pt-4">
            <div className="flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-semibold text-zinc-300">Export Raw/Filtered Data</span>
            </div>

            {allCurves.length === 0 ? (
              <div className="text-[10px] text-zinc-500 italic">No curves available to export.</div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-[10px] text-zinc-500 uppercase font-bold">Select Curve</Label>
                  <select
                    value={csvCurveKey}
                    onChange={(e) => setCsvCurveKey(e.target.value)}
                    className="w-full text-xs bg-zinc-950 border border-zinc-800 text-zinc-200 rounded p-1.5 focus:outline-none"
                  >
                    {allCurves.map((c) => (
                      <option key={`${c.datasetId}:${c.curveId}`} value={`${c.datasetId}:${c.curveId}`}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <Button
                  size="sm"
                  onClick={handleCsvExport}
                  className="w-full bg-zinc-800 hover:bg-zinc-700 text-white text-xs border border-zinc-700"
                >
                  Download .csv Column Data
                </Button>
              </div>
            )}
          </div>

          {/* 3. WORKSPACE SAVE / LOAD */}
          <div className="space-y-3 pt-4">
            <div className="flex items-center gap-1.5">
              <FileJson className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-semibold text-zinc-300">Workspace Sessions</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                size="sm"
                onClick={handleSaveWorkspace}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs"
              >
                Save Workspace (.json)
              </Button>

              <Button
                size="sm"
                onClick={handleLoadWorkspaceClick}
                className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs border border-zinc-700"
              >
                <Upload className="w-3 h-3 mr-1" /> Load Workspace
              </Button>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleWorkspaceFileChange}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
