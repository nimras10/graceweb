'use client';

import React, { useState, useEffect } from 'react';
import { useWorkspaceStore } from '../store/useWorkspaceStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import FileUpload from '../components/FileUpload';
import SeriesList from '../components/SeriesList';
import PlotCanvas from '../components/PlotCanvas';
import StatsPanel from '../components/StatsPanel';
import AnnotationTools from '../components/AnnotationTools';
import AxisSettingsDialog from '../components/AxisSettingsDialog';
import ExportMenu from '../components/ExportMenu';
import { Button } from '../components/ui/button';
import { Activity, Files, BarChart3, Tag, Sun, Moon } from 'lucide-react';

export default function Home() {
  const { datasets, theme, toggleTheme } = useWorkspaceStore();
  
  // Tracking current zoom viewport for statistics computation
  const [viewport, setViewport] = useState<{ xMin: number | null; xMax: number | null }>({
    xMin: null,
    xMax: null,
  });

  // Keep HTML class list in sync with theme state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  }, [theme]);

  const handleViewportChange = (range: { xMin: number | null; xMax: number | null }) => {
    setViewport(range);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground font-sans transition-colors duration-200">
      {/* Left Sidebar containing Files, Stats, and Annotations */}
      <aside className="w-80 border-r border-border bg-sidebar flex flex-col h-full overflow-hidden select-none transition-colors duration-200">
        {/* Logo and branding */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-zinc-950/5 dark:bg-zinc-950/20">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary animate-pulse" />
            <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
              GraceWeb
            </span>
          </div>
          <span className="text-[9px] bg-muted dark:bg-zinc-850 text-muted-foreground px-2 py-0.5 rounded font-mono border border-border">
            v1.0.0
          </span>
        </div>

        {/* Navigation Tabs in Sidebar */}
        <Tabs defaultValue="curves" className="flex-1 flex flex-col overflow-hidden">
          <div className="px-3 pt-3 border-b border-border bg-zinc-950/5 dark:bg-zinc-950/10">
            <TabsList className="grid w-full grid-cols-3 bg-muted dark:bg-zinc-950 border border-border h-9 p-0.5 rounded-full">
              <TabsTrigger
                value="curves"
                className="rounded-full text-[9px] tracking-wider uppercase font-extrabold py-1.5 gap-1 text-muted-foreground data-[state=active]:text-primary-foreground dark:data-[state=active]:text-primary-foreground data-[state=active]:bg-primary dark:data-[state=active]:bg-primary cursor-pointer transition-all duration-200"
              >
                <Files className="w-3 h-3" /> Curves
              </TabsTrigger>
              <TabsTrigger
                value="analysis"
                className="rounded-full text-[9px] tracking-wider uppercase font-extrabold py-1.5 gap-1 text-muted-foreground data-[state=active]:text-primary-foreground dark:data-[state=active]:text-primary-foreground data-[state=active]:bg-primary dark:data-[state=active]:bg-primary cursor-pointer transition-all duration-200"
              >
                <BarChart3 className="w-3 h-3" /> Analysis
              </TabsTrigger>
              <TabsTrigger
                value="labels"
                className="rounded-full text-[9px] tracking-wider uppercase font-extrabold py-1.5 gap-1 text-muted-foreground data-[state=active]:text-primary-foreground dark:data-[state=active]:text-primary-foreground data-[state=active]:bg-primary dark:data-[state=active]:bg-primary cursor-pointer transition-all duration-200"
              >
                <Tag className="w-3 h-3" /> Labels
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Scrollable Sidebar Panels */}
          <div className="flex-1 overflow-y-auto p-4">
            <TabsContent value="curves" className="space-y-5 outline-none mt-0">
              <div className="space-y-1">
                <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Import Files
                </h2>
                <FileUpload />
              </div>
              <div className="space-y-1">
                <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Loaded Datasets
                </h2>
                <SeriesList />
              </div>
            </TabsContent>

            <TabsContent value="analysis" className="outline-none mt-0">
              <StatsPanel xMin={viewport.xMin} xMax={viewport.xMax} />
            </TabsContent>

            <TabsContent value="labels" className="outline-none mt-0">
              <AnnotationTools />
            </TabsContent>
          </div>
        </Tabs>

        {/* Sidebar Footer Info */}
        <div className="p-3 border-t border-border bg-muted/40 text-center text-[9px] text-muted-foreground font-medium">
          xmgrace Web Alternative &bull; Client-Side
        </div>
      </aside>

      {/* Main Canvas Panel */}
      <main className="flex-1 flex flex-col h-full bg-background overflow-hidden relative transition-colors duration-200">
        {/* Header toolbar */}
        <header className="h-14 border-b border-border bg-zinc-50 dark:bg-zinc-900/10 px-6 flex items-center justify-between flex-shrink-0 transition-colors duration-200">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Plot Viewport</span>
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
          </div>
          <div className="flex items-center gap-2">
            {/* Theme Toggle Button */}
            <Button
              variant="outline"
              size="icon-sm"
              onClick={toggleTheme}
              className="bg-card border-border hover:bg-muted text-muted-foreground hover:text-foreground h-8 w-8"
              title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-indigo-600" />
              )}
            </Button>
            <AxisSettingsDialog />
            <ExportMenu />
          </div>
        </header>

        {/* Visual Graph Area */}
        <div className="flex-1 flex items-center justify-center p-6 relative">
          {datasets.length === 0 ? (
            <div className="text-center p-8 max-w-sm border border-border rounded-2xl bg-card shadow-lg select-none">
              <div className="w-12 h-12 rounded-full bg-muted border border-border flex items-center justify-center mx-auto mb-4">
                <UploadSvg />
              </div>
              <h3 className="font-semibold text-sm text-foreground">No data loaded</h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Upload one or multiple GROMACS <span className="font-mono bg-muted text-primary px-1 py-0.5 rounded border border-border">.xvg</span> files in the sidebar to overlay and analyze.
              </p>
            </div>
          ) : (
            <div className="w-full h-full bg-background rounded-xl flex items-center justify-center border border-border/40 p-2 shadow-inner">
              <PlotCanvas onViewportChange={handleViewportChange} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// Inline decorative SVG logo
function UploadSvg() {
  return (
    <svg
      className="w-5 h-5 text-primary"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  );
}
