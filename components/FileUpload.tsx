import React, { useRef, useState } from 'react';
import { useWorkspaceStore } from '../store/useWorkspaceStore';
import { parseXvg } from '../lib/parseXvg';
import { Upload, FileWarning, CheckCircle } from 'lucide-react';

export default function FileUpload() {
  const addDataset = useWorkspaceStore((state) => state.addDataset);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = async (files: FileList) => {
    setError(null);
    setSuccessMsg(null);
    let successCount = 0;
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.name.endsWith('.xvg') && !file.name.endsWith('.XVG')) {
        setError(`File "${file.name}" is not a .xvg file.`);
        continue;
      }

      try {
        const text = await file.text();
        const parsed = parseXvg(text, file.name);
        addDataset(parsed);
        successCount++;
      } catch (err: any) {
        setError(`Failed to parse "${file.name}": ${err?.message || err}`);
      }
    }

    if (successCount > 0) {
      setSuccessMsg(`Successfully imported ${successCount} dataset(s)!`);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFiles(e.target.files);
    }
  };

  const onButtonClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className="space-y-3">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
        className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition select-none flex flex-col items-center justify-center ${
          dragActive
            ? 'border-indigo-400 bg-indigo-500/10'
            : 'border-zinc-700 bg-zinc-900/30 hover:border-zinc-500 hover:bg-zinc-900/50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          multiple
          accept=".xvg"
          onChange={handleChange}
        />
        <Upload className={`w-8 h-8 mb-2 transition-transform ${dragActive ? 'scale-110 text-indigo-400' : 'text-zinc-500'}`} />
        <p className="text-xs text-zinc-300 font-medium">Drag & drop files or click to browse</p>
        <p className="text-[10px] text-zinc-500 mt-1">Accepts GROMACS .xvg files</p>
      </div>

      {error && (
        <div className="p-2.5 bg-red-950/40 border border-red-900/50 text-[11px] text-red-300 rounded flex gap-2 items-start">
          <FileWarning className="w-4 h-4 flex-shrink-0 text-red-400 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-2.5 bg-emerald-950/40 border border-emerald-900/50 text-[11px] text-emerald-300 rounded flex gap-2 items-start">
          <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-400 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}
    </div>
  );
}
