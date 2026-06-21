'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useWorkspaceStore } from '../store/useWorkspaceStore';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Activity, Sun, Moon, ArrowRight, ShieldCheck, Zap, BarChart2, CheckCircle, Sliders, Calculator, Sparkles, Tag } from 'lucide-react';

// Dynamic import of Plotly to avoid SSR failures on build
const Plot = dynamic(
  async () => {
    const Plotly = (await import('plotly.js-dist-min')).default;
    const createPlotlyComponent = (await import('react-plotly.js/factory')).default;
    return createPlotlyComponent(Plotly);
  },
  { ssr: false }
) as any;

export default function LandingPage() {
  const { theme, toggleTheme } = useWorkspaceStore();

  // Sync document dark class with Zustand theme state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  }, [theme]);

  // Generate mock RMSD dataset coordinates for the live preview widget
  const mockData = useMemo(() => {
    const time: number[] = [];
    const rmsdProtein: number[] = [];
    const rmsdLigand: number[] = [];

    for (let i = 0; i <= 200; i++) {
      const t = i * 0.5; // 0 to 100 ns
      time.push(t);

      // Protein RMSD asymptotic curve with fluctuations
      const baseProtein = 0.18 * (1 - Math.exp(-t / 20));
      const noiseProtein = 0.015 * Math.sin(t * 1.5) + 0.008 * Math.cos(t * 4.2) + (Math.random() - 0.5) * 0.01;
      rmsdProtein.push(Math.max(0, parseFloat((baseProtein + noiseProtein).toFixed(4))));

      // Ligand RMSD curve (equilibrating faster, slightly different level)
      const baseLigand = 0.12 * (1 - Math.exp(-t / 8));
      const noiseLigand = 0.01 * Math.sin(t * 2.5) + 0.005 * Math.cos(t * 5.5) + (Math.random() - 0.5) * 0.008;
      rmsdLigand.push(Math.max(0, parseFloat((baseLigand + noiseLigand).toFixed(4))));
    }

    return { time, rmsdProtein, rmsdLigand };
  }, []);

  // Configure preview chart layout dynamically based on active theme
  const previewLayout = useMemo(() => {
    const isDark = theme === 'dark';
    return {
      title: {
        text: 'Live Interaction Preview: Receptor-Ligand RMSD',
        font: { color: isDark ? '#f4f4f5' : '#09090b', family: 'sans-serif', size: 14 },
      },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: isDark ? 'rgba(20,19,25,0.4)' : 'rgba(244,244,245,0.4)',
      xaxis: {
        title: { text: 'Time (ns)', font: { color: isDark ? '#8f8c9f' : '#71717a', size: 11 } },
        gridcolor: isDark ? '#22202b' : '#e4e4e7',
        zerolinecolor: isDark ? '#2c2938' : '#d4d4d8',
        tickfont: { color: isDark ? '#8f8c9f' : '#71717a', size: 10 },
      },
      yaxis: {
        title: { text: 'RMSD (nm)', font: { color: isDark ? '#8f8c9f' : '#71717a', size: 11 } },
        gridcolor: isDark ? '#22202b' : '#e4e4e7',
        zerolinecolor: isDark ? '#2c2938' : '#d4d4d8',
        tickfont: { color: isDark ? '#8f8c9f' : '#71717a', size: 10 },
      },
      legend: {
        font: { color: isDark ? '#f4f4f5' : '#09090b', size: 10 },
        bgcolor: isDark ? 'rgba(19,18,24,0.9)' : 'rgba(255,255,255,0.9)',
        bordercolor: isDark ? '#22202b' : '#e4e4e7',
        borderwidth: 1,
      },
      hovermode: 'closest',
      margin: { l: 50, r: 20, t: 40, b: 45 },
      autosize: true,
    };
  }, [theme]);

  const previewTraces = useMemo(() => {
    return [
      {
        name: 'Protein Backbone',
        x: mockData.time,
        y: mockData.rmsdProtein,
        type: 'scatter',
        mode: 'lines',
        line: { color: '#a78bfa', width: 2 },
        hovertemplate: 'Time: %{x:.1f} ns<br>Backbone RMSD: %{y:.3f} nm<extra></extra>',
      },
      {
        name: 'Pocket Ligand',
        x: mockData.time,
        y: mockData.rmsdLigand,
        type: 'scatter',
        mode: 'lines',
        line: { color: '#3b82f6', width: 2 },
        hovertemplate: 'Time: %{x:.1f} ns<br>Ligand RMSD: %{y:.3f} nm<extra></extra>',
      },
    ];
  }, [mockData]);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans transition-colors duration-200 flex flex-col select-none">
      {/* 1. Header Toolbar */}
      <header className="h-16 border-b border-border bg-card/60 backdrop-blur px-6 md:px-12 flex items-center justify-between sticky top-0 z-50 transition-colors duration-200">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary animate-pulse" />
          <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
            GraceWeb
          </span>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/nimras10/graceweb"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-muted-foreground hover:text-foreground transition hidden sm:inline"
          >
            GitHub
          </a>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={toggleTheme}
            className="bg-card border-border hover:bg-muted text-muted-foreground hover:text-foreground h-8 w-8 rounded-full"
            title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === 'dark' ? (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-indigo-600" />
            )}
          </Button>
          <a href="/workspace">
            <Button size="sm" className="bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-1.5 transition-transform duration-200 hover:scale-[1.03]">
              Launch Workspace <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </a>
        </div>
      </header>

      {/* 2. Hero Section */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 md:px-12 py-12 md:py-20 space-y-16">
        <div className="grid md:grid-cols-5 gap-12 items-center">
          <div className="md:col-span-3 space-y-6 text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-primary text-[10px] uppercase font-bold tracking-wider">
              <Sparkles className="w-3 h-3" /> Modern xmgrace Alternative
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
              Scientific Visualization <br />
              <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 dark:from-violet-400 dark:via-indigo-400 dark:to-pink-400 bg-clip-text text-transparent">
                Reimagined.
              </span>
            </h1>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-xl">
              GraceWeb is a premium browser-based plotter built for molecular dynamics research. Analyze, filter, and style GROMACS <span className="font-mono bg-muted border border-border px-1 py-0.5 rounded text-primary">.xvg</span> files instantly with zero configuration, zero server overhead, and 100% client-side security.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <a href="/workspace">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6 py-2 rounded-full flex items-center gap-2 transition duration-200">
                  Open Workspace <ArrowRight className="w-4 h-4" />
                </Button>
              </a>
              <a
                href="https://github.com/nimras10/graceweb"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="lg" className="border-border bg-card text-foreground hover:bg-muted font-bold px-6 py-2 rounded-full">
                  GitHub Repository
                </Button>
              </a>
            </div>
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/60 max-w-md">
              <div>
                <h4 className="text-lg font-bold text-foreground">100%</h4>
                <p className="text-[10px] text-muted-foreground font-semibold uppercase">Client Side</p>
              </div>
              <div>
                <h4 className="text-lg font-bold text-foreground">Zero</h4>
                <p className="text-[10px] text-muted-foreground font-semibold uppercase">Setup Needed</p>
              </div>
              <div>
                <h4 className="text-lg font-bold text-foreground">300 DPI</h4>
                <p className="text-[10px] text-muted-foreground font-semibold uppercase">Pub Ready Exports</p>
              </div>
            </div>
          </div>

          {/* Interactive Plot Preview Widget */}
          <div className="md:col-span-2 w-full">
            <Card className="bg-card border-border shadow-xl overflow-hidden rounded-xl">
              <CardContent className="p-4 flex flex-col items-center">
                <div className="w-full h-64 bg-background border border-border/40 rounded-lg flex items-center justify-center p-1">
                  <Plot
                    data={previewTraces}
                    layout={previewLayout}
                    config={{
                      responsive: true,
                      displaylogo: false,
                      scrollZoom: true,
                      modeBarButtonsToRemove: ['select2d', 'lasso2d', 'toggleSpikelines'],
                    }}
                    className="w-full h-full"
                    style={{ width: '100%', height: '100%' }}
                  />
                </div>
                <div className="flex items-center gap-1.5 mt-3 text-[10px] text-muted-foreground font-semibold uppercase">
                  <Zap className="w-3.5 h-3.5 text-primary animate-pulse" />
                  Try dragging, zooming, or hovering the plot
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 3. Features Bento Grid */}
        <div className="space-y-6 pt-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Built for Rigorous Molecular Analysis</h2>
            <p className="text-xs md:text-sm text-muted-foreground max-w-md mx-auto">
              Replace command-line plotting lag with immediate analytical filters and styling controls.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <Card className="bg-card/50 border-border hover:border-border/80 transition-all rounded-xl shadow-sm">
              <CardContent className="p-5 space-y-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400">
                  <Sliders className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-foreground">Smooth Filters</h3>
                <p className="text-xs text-muted-foreground leading-normal">
                  Calculate and overlay Moving Average and Savitzky-Golay filtering in-browser to denoise RMSD and energies.
                </p>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="bg-card/50 border-border hover:border-border/80 transition-all rounded-xl shadow-sm">
              <CardContent className="p-5 space-y-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-400">
                  <Zap className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-foreground">LTTB Downsampling</h3>
                <p className="text-xs text-muted-foreground leading-normal">
                  Visualize large datasets of 200,000+ coordinates instantly downsampled to 3,000 points while keeping all shapes and peaks.
                </p>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="bg-card/50 border-border hover:border-border/80 transition-all rounded-xl shadow-sm">
              <CardContent className="p-5 space-y-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400">
                  <Calculator className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-foreground">Math Transform</h3>
                <p className="text-xs text-muted-foreground leading-normal">
                  Apply permanent arithmetic modifications across columns directly (e.g. converting kJ/mol to kcal/mol).
                </p>
              </CardContent>
            </Card>

            {/* Feature 4 */}
            <Card className="bg-card/50 border-border hover:border-border/80 transition-all rounded-xl shadow-sm">
              <CardContent className="p-5 space-y-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center border border-purple-500/20 text-purple-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-foreground">Image Export</h3>
                <p className="text-xs text-muted-foreground leading-normal">
                  Export to high-resolution publication-quality PNG, vector SVG formats, and export modified columns to CSV.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* 4. Footer */}
      <footer className="border-t border-border/85 bg-card py-8 text-xs text-muted-foreground transition-colors duration-200 mt-auto">
        <div className="max-w-6xl mx-auto px-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 font-semibold">
            <div>
              GraceWeb &bull; Client-Side Scientific Plotter
            </div>
            <div className="flex gap-4">
              <a href="/workspace" className="hover:text-primary transition">Workspace</a>
              <a href="https://github.com/nimras10/graceweb" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition">GitHub</a>
            </div>
            <div className="text-[10px] text-muted-foreground/60 font-medium">
              Designed for GROMACS Molecular Dynamics visualization
            </div>
          </div>
          
          <div className="border-t border-border/40 pt-4 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
            <p className="text-[11px] text-muted-foreground leading-relaxed max-w-xl">
              Built by <a href="https://www.linkedin.com/in/nimrasaeed10/" target="_blank" rel="noopener noreferrer" className="font-bold text-primary hover:underline">Nimra Saeed</a>, a student from Punjab University and a Master of Biochemistry specializing in computational biology, actively involved in drug design research targeting Nipah and COVID-19.
            </p>
            <a 
              href="https://www.linkedin.com/in/nimrasaeed10/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-border bg-background hover:bg-muted text-[10px] font-bold text-foreground transition"
            >
              <svg className="w-3.5 h-3.5 text-[#0077b5] fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.23 0H1.77C.8 0 0 .77 0 1.72v20.56C0 23.23.8 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.72V1.72C24 .77 23.2 0 22.23 0zM7.12 20.45H3.56V9h3.56v11.45zM5.34 7.43c-1.14 0-2.06-.92-2.06-2.06 0-1.14.92-2.06 2.06-2.06 1.14 0 2.06.92 2.06 2.06 0 1.14-.92 2.06-2.06 2.06zm15.11 13.02h-3.56v-5.6c0-1.34-.03-3.05-1.86-3.05-1.86 0-2.14 1.45-2.14 2.95v5.7h-3.56V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29z"/>
              </svg>
              Connect on LinkedIn
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
