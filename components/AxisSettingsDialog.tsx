import React, { useRef, useState } from 'react';
import { useWorkspaceStore } from '../store/useWorkspaceStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Settings, HelpCircle } from 'lucide-react';

export default function AxisSettingsDialog() {
  const { globalSettings, updateGlobalSettings } = useWorkspaceStore();
  const [activeInput, setActiveInput] = useState<'title' | 'xLabel' | 'yLabel' | null>(null);
  
  // Keep input refs to handle cursor injection
  const titleRef = useRef<HTMLInputElement>(null);
  const xLabelRef = useRef<HTMLInputElement>(null);
  const yLabelRef = useRef<HTMLInputElement>(null);

  const getRef = (field: 'title' | 'xLabel' | 'yLabel') => {
    if (field === 'title') return titleRef;
    if (field === 'xLabel') return xLabelRef;
    return yLabelRef;
  };

  const handleFieldChange = (field: keyof typeof globalSettings, value: string) => {
    updateGlobalSettings({ [field]: value });
  };

  // Inject symbol at cursor
  const injectText = (text: string) => {
    if (!activeInput) return;
    const ref = getRef(activeInput);
    const input = ref.current;
    if (!input) return;

    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;
    const currentValue = input.value;
    const newValue = currentValue.substring(0, start) + text + currentValue.substring(end);
    
    handleFieldChange(activeInput, newValue);

    // Reposition cursor after injected text
    setTimeout(() => {
      input.focus();
      const newCursorPos = start + text.length;
      input.setSelectionRange(newCursorPos, newCursorPos);
    }, 50);
  };

  // Wrap selection or insert tags at cursor
  const injectTag = (openTag: string, closeTag: string) => {
    if (!activeInput) return;
    const ref = getRef(activeInput);
    const input = ref.current;
    if (!input) return;

    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;
    const currentValue = input.value;
    const selection = currentValue.substring(start, end);
    const textToInsert = `${openTag}${selection}${closeTag}`;
    const newValue = currentValue.substring(0, start) + textToInsert + currentValue.substring(end);

    handleFieldChange(activeInput, newValue);

    setTimeout(() => {
      input.focus();
      const newCursorPos = start + openTag.length + selection.length + closeTag.length;
      input.setSelectionRange(newCursorPos, newCursorPos);
    }, 50);
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
        <Settings className="w-3.5 h-3.5" /> Axis Settings
      </DialogTrigger>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-sm font-bold uppercase tracking-wider text-zinc-400">
            Axis & Title Config
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Scientific Symbols Helper Toolbar */}
          <div className="bg-zinc-950 p-2 border border-zinc-850 rounded-lg space-y-1.5">
            <div className="flex justify-between items-center text-[10px] text-zinc-400 font-bold uppercase">
              <span>Scientific Symbols Helper</span>
              <span className="text-[9px] text-indigo-400 font-medium normal-case">
                {activeInput ? `Editing: ${activeInput}` : 'Click an input below to edit'}
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {['α', 'β', 'Δ', 'σ', 'μ', 'θ', 'λ', 'π', '°'].map((sym) => (
                <button
                  key={sym}
                  type="button"
                  disabled={!activeInput}
                  onClick={() => injectText(sym)}
                  className="px-2 py-1 rounded bg-zinc-900 text-xs font-mono border border-zinc-800 hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-zinc-900 text-zinc-200"
                >
                  {sym}
                </button>
              ))}
              <span className="w-px h-5 bg-zinc-800 mx-1 align-middle self-center" />
              <button
                type="button"
                disabled={!activeInput}
                onClick={() => injectTag('<sup>', '</sup>')}
                className="px-2 py-1 rounded bg-zinc-900 text-xs font-mono border border-zinc-800 hover:bg-zinc-800 disabled:opacity-30 text-zinc-200"
                title="Superscript"
              >
                x<sup>y</sup>
              </button>
              <button
                type="button"
                disabled={!activeInput}
                onClick={() => injectTag('<sub>', '</sub>')}
                className="px-2 py-1 rounded bg-zinc-900 text-xs font-mono border border-zinc-800 hover:bg-zinc-800 disabled:opacity-30 text-zinc-200"
                title="Subscript"
              >
                x<sub>y</sub>
              </button>
            </div>
          </div>

          {/* Plot Title */}
          <div className="space-y-1.5">
            <Label htmlFor="plot-title" className="text-xs text-zinc-400 font-semibold">Plot Title</Label>
            <Input
              id="plot-title"
              ref={titleRef}
              value={globalSettings.title}
              onFocus={() => setActiveInput('title')}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              placeholder="e.g. Backbone RMSD over Time"
              className="bg-zinc-950 border-zinc-800 text-zinc-100 text-xs"
            />
          </div>

          {/* X Axis Label */}
          <div className="space-y-1.5">
            <Label htmlFor="x-label" className="text-xs text-zinc-400 font-semibold">X-Axis Label</Label>
            <Input
              id="x-label"
              ref={xLabelRef}
              value={globalSettings.xLabel}
              onFocus={() => setActiveInput('xLabel')}
              onChange={(e) => handleFieldChange('xLabel', e.target.value)}
              placeholder="e.g. Time (ps)"
              className="bg-zinc-950 border-zinc-800 text-zinc-100 text-xs"
            />
          </div>

          {/* Y Axis Label */}
          <div className="space-y-1.5">
            <Label htmlFor="y-label" className="text-xs text-zinc-400 font-semibold">Y-Axis Label</Label>
            <Input
              id="y-label"
              ref={yLabelRef}
              value={globalSettings.yLabel}
              onFocus={() => setActiveInput('yLabel')}
              onChange={(e) => handleFieldChange('yLabel', e.target.value)}
              placeholder="e.g. RMSD (nm)"
              className="bg-zinc-950 border-zinc-800 text-zinc-100 text-xs"
            />
          </div>

          {/* Axis Scale Overrides */}
          <div className="grid grid-cols-2 gap-4 pt-1">
            <div className="space-y-2 border border-zinc-850 p-3 rounded-lg bg-zinc-950/20">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block border-b border-zinc-850 pb-1">X-Axis Bounds</span>
              <div className="space-y-1.5">
                <Label htmlFor="x-min" className="text-[10px] text-zinc-500">Min</Label>
                <Input
                  id="x-min"
                  type="number"
                  step="any"
                  value={globalSettings.xMin}
                  onChange={(e) => handleFieldChange('xMin', e.target.value)}
                  placeholder="Auto"
                  className="bg-zinc-950 border-zinc-800 text-zinc-100 text-xs h-7 py-1"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="x-max" className="text-[10px] text-zinc-500">Max</Label>
                <Input
                  id="x-max"
                  type="number"
                  step="any"
                  value={globalSettings.xMax}
                  onChange={(e) => handleFieldChange('xMax', e.target.value)}
                  placeholder="Auto"
                  className="bg-zinc-950 border-zinc-800 text-zinc-100 text-xs h-7 py-1"
                />
              </div>
            </div>

            <div className="space-y-2 border border-zinc-850 p-3 rounded-lg bg-zinc-950/20">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block border-b border-zinc-850 pb-1">Y-Axis Bounds</span>
              <div className="space-y-1.5">
                <Label htmlFor="y-min" className="text-[10px] text-zinc-500">Min</Label>
                <Input
                  id="y-min"
                  type="number"
                  step="any"
                  value={globalSettings.yMin}
                  onChange={(e) => handleFieldChange('yMin', e.target.value)}
                  placeholder="Auto"
                  className="bg-zinc-950 border-zinc-800 text-zinc-100 text-xs h-7 py-1"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="y-max" className="text-[10px] text-zinc-500">Max</Label>
                <Input
                  id="y-max"
                  type="number"
                  step="any"
                  value={globalSettings.yMax}
                  onChange={(e) => handleFieldChange('yMax', e.target.value)}
                  placeholder="Auto"
                  className="bg-zinc-950 border-zinc-800 text-zinc-100 text-xs h-7 py-1"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-zinc-850 pt-4 mt-2">
          <DialogClose render={
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-xs px-4 text-white" />
          }>
            Save Settings
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
