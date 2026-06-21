import React, { useState } from 'react';
import { useWorkspaceStore, Curve } from '../store/useWorkspaceStore';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Slider } from './ui/slider';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { movingAverage, savitzkyGolay } from '../lib/smoothing';
import { Palette, Layers, Sparkles } from 'lucide-react';

const SWATCHES = [
  '#3b82f6', // blue
  '#a855f7', // purple
  '#10b981', // emerald
  '#f97316', // orange
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#eab308', // yellow
  '#ef4444', // red
  '#14b8a6', // teal
  '#6366f1', // indigo
  '#f43f5e', // rose
  '#a1a1aa', // zinc
];

interface StylePopoverProps {
  datasetId: string;
  curve: Curve;
}

export default function StylePopover({ datasetId, curve }: StylePopoverProps) {
  const { updateCurveStyle, applySmoothing } = useWorkspaceStore();
  const style = curve.style;

  // Local state for smoothing inputs to avoid extreme lag when typing
  const [smoothType, setSmoothType] = useState(curve.smoothType);
  const [windowVal, setWindowVal] = useState(curve.smoothWindow);
  const [orderVal, setOrderVal] = useState(curve.smoothOrder);
  const [showSmoothed, setShowSmoothed] = useState(curve.showSmoothed);

  const handleColorChange = (color: string) => {
    updateCurveStyle(datasetId, curve.id, { color });
  };

  const handleWidthChange = (val: number | readonly number[]) => {
    const widthVal = Array.isArray(val) ? val[0] : val;
    updateCurveStyle(datasetId, curve.id, { width: widthVal });
  };

  const handleOpacityChange = (val: number | readonly number[]) => {
    const opacityVal = Array.isArray(val) ? val[0] : val;
    updateCurveStyle(datasetId, curve.id, { opacity: opacityVal });
  };

  const handleDashChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateCurveStyle(datasetId, curve.id, { dash: e.target.value as any });
  };

  // Re-run smoothing and update state
  const handleSmoothingApply = (
    type: 'none' | 'moving_average' | 'savitzky_golay',
    w: number,
    o: number,
    show: boolean
  ) => {
    let smoothed: number[] | null = null;
    if (type === 'moving_average') {
      smoothed = movingAverage(curve.y, w);
    } else if (type === 'savitzky_golay') {
      smoothed = savitzkyGolay(curve.y, w, o);
    }

    applySmoothing(datasetId, curve.id, {
      type,
      window: w,
      order: o,
      showSmoothed: show,
      smoothedY: smoothed,
    });
  };

  return (
    <Popover>
      <PopoverTrigger render={
        <button
          className="p-1 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded transition"
          title="Curve settings"
        />
      }>
        <Palette className="w-3.5 h-3.5" />
      </PopoverTrigger>
      <PopoverContent className="w-68 bg-zinc-900 border-zinc-850 text-zinc-200 p-4 space-y-4 shadow-xl z-50 overflow-y-auto max-h-[85vh]">
        <div className="flex items-center gap-1.5 border-b border-zinc-850 pb-2 mb-1">
          <Layers className="w-4 h-4 text-indigo-400" />
          <h4 className="font-semibold text-xs text-zinc-100 truncate flex-1">
            Styling: {curve.name}
          </h4>
        </div>

        {/* Color Palette Swatches */}
        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase font-bold text-zinc-400">Curve Color</Label>
          <div className="grid grid-cols-6 gap-1">
            {SWATCHES.map((color) => (
              <button
                key={color}
                onClick={() => handleColorChange(color)}
                className={`w-full h-5 rounded border ${
                  style.color === color ? 'border-zinc-200' : 'border-transparent'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-zinc-500">Hex:</span>
            <Input
              type="text"
              value={style.color}
              onChange={(e) => handleColorChange(e.target.value)}
              className="h-6 text-[10px] font-mono px-2 py-0.5 bg-zinc-950 border-zinc-800 rounded text-zinc-200"
            />
          </div>
        </div>

        {/* Thickness Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-[10px]">
            <Label className="uppercase font-bold text-zinc-400">Thickness</Label>
            <span className="text-zinc-500 font-mono">{style.width}px</span>
          </div>
          <Slider
            min={1}
            max={8}
            step={1}
            value={style.width}
            onValueChange={handleWidthChange}
            className="py-1 cursor-pointer"
          />
        </div>

        {/* Opacity Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-[10px]">
            <Label className="uppercase font-bold text-zinc-400">Opacity</Label>
            <span className="text-zinc-500 font-mono">{style.opacity}%</span>
          </div>
          <Slider
            min={0}
            max={100}
            step={5}
            value={style.opacity}
            onValueChange={handleOpacityChange}
            className="py-1 cursor-pointer"
          />
        </div>

        {/* Dash Style Dropdown */}
        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase font-bold text-zinc-400">Line Style</Label>
          <select
            value={style.dash}
            onChange={handleDashChange}
            className="w-full text-xs bg-zinc-950 border border-zinc-800 text-zinc-200 rounded p-1.5 focus:outline-none focus:border-zinc-700 font-medium"
          >
            <option value="solid">Solid Line</option>
            <option value="dash">Dashed Line</option>
            <option value="dot">Dotted Line</option>
          </select>
        </div>

        {/* SMOOTHING SECTION */}
        <div className="border-t border-zinc-850 pt-3 space-y-3">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[10px] uppercase font-bold text-zinc-400">Smoothing Filters</span>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] text-zinc-500">Filter Type</Label>
            <select
              value={smoothType}
              onChange={(e) => {
                const nextType = e.target.value as any;
                setSmoothType(nextType);
                handleSmoothingApply(nextType, windowVal, orderVal, showSmoothed);
              }}
              className="w-full text-xs bg-zinc-950 border border-zinc-800 text-zinc-200 rounded p-1.5 focus:outline-none focus:border-zinc-700 font-medium"
            >
              <option value="none">No Smoothing</option>
              <option value="moving_average">Moving Average</option>
              <option value="savitzky_golay">Savitzky-Golay</option>
            </select>
          </div>

          {smoothType !== 'none' && (
            <>
              {/* Window size slider - odd numbers only */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px]">
                  <Label className="text-zinc-500">Window Size</Label>
                  <span className="text-zinc-400 font-mono">{windowVal} pts</span>
                </div>
                <Slider
                  min={3}
                  max={101}
                  step={2}
                  value={windowVal}
                  onValueChange={(val) => {
                    const numberVal = Array.isArray(val) ? val[0] : val;
                    setWindowVal(numberVal);
                    handleSmoothingApply(smoothType, numberVal, orderVal, showSmoothed);
                  }}
                  className="py-1 cursor-pointer"
                />
              </div>

              {/* Savitzky-Golay polynomial order input */}
              {smoothType === 'savitzky_golay' && (
                <div className="space-y-1.5">
                  <Label className="text-[10px] text-zinc-500">Polynomial Order</Label>
                  <Input
                    type="number"
                    min={1}
                    max={12}
                    value={orderVal}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10) || 3;
                      setOrderVal(val);
                      handleSmoothingApply(smoothType, windowVal, val, showSmoothed);
                    }}
                    className="h-7 text-[10px] px-2 py-0.5 bg-zinc-950 border-zinc-800 rounded text-zinc-200"
                  />
                </div>
              )}

              {/* Overlay / Replace mode */}
              <div className="flex items-center justify-between py-1">
                <span className="text-[10px] text-zinc-400">Render Smoothed Curve</span>
                <button
                  type="button"
                  onClick={() => {
                    const nextShow = !showSmoothed;
                    setShowSmoothed(nextShow);
                    handleSmoothingApply(smoothType, windowVal, orderVal, nextShow);
                  }}
                  className={`text-[9px] px-2 py-0.5 rounded font-semibold border ${
                    showSmoothed
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-300'
                  }`}
                >
                  {showSmoothed ? 'Active' : 'Disabled'}
                </button>
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
