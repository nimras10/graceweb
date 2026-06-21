# GraceWeb

GraceWeb is a modern, responsive, browser-based alternative to `xmgrace` designed specifically for scientists to visualize and analyze GROMACS Molecular Dynamics `.xvg` output files. It runs entirely client-side, making it fast, secure, and easily deployable as a static site.

## Key Features

1. **GROMACS .xvg Parser**:
   - Parses comments (`#`) and header commands (`@`) for plot titles, subtitle combinations, and axis labels.
   - Extracts legend names (`@s0 legend "Protein"`, etc.) and maps multi-column series into independent curves.

2. **Core Plotting Canvas**:
   - Built on **Plotly** for high-fidelity interactive graphing.
   - Supports box zoom, scroll-wheel zoom, click-drag panning, and a "Reset View" button.
   - Tooltips are custom-formatted to 3 decimal places.
   - Interactive legend allows single-click toggles and double-click curve isolation.

3. **Performance (LTTB Downsampling)**:
   - Integrates the **Largest-Triangle-Three-Buckets (LTTB)** algorithm to downsample curves with more than 5,000 data points to 3,000 points for display, preventing browser lag while maintaining shape.

4. **Curve Styling Panel**:
   - Interactive popover per curve to change colors (preset grid + custom hex input), thickness (1–8px), opacity (0–100%), and style (solid, dashed, dotted).

5. **Axis Settings**:
   - Custom plot title and axis labels.
   - Scientific helper toolbar to inject Greek letters (α, β, Δ, σ, μ) and HTML superscript/subscript tags (`<sup>`, `<sub>`).
   - Manual min/max scale overrides for both axes.

6. **Analysis & Math Operations**:
   - **Smoothing**: Moving Average filter (window sizes 3–101, odd only) and Savitzky-Golay polynomial filter (custom window and polynomial orders) written from scratch.
   - **Viewport Statistics**: Real-time stats (mean, standard deviation, min, max, and convergence slope) computed dynamically based on the current zoom viewport window.
   - **Math Operations**: Form to scale/shift curve coordinates (e.g. converting kJ/mol to kcal/mol via multiplying by 0.239).
   - **Histogram Mode**: Quick toggle to plot Y-value distributions.

7. **Annotations**:
   - Click "Label Mode" and click any point on the canvas to place custom labels.
   - Draw horizontal or vertical reference threshold lines in custom styles and colors.

8. **Export Center**:
   - High-resolution image export (PNG/SVG) with scale quality multipliers (Standard, 300dpi, publication grade) and transparent background options.
   - Export smoothed/modified curve coordinates to `.csv`.
   - Complete workspace session saving/loading (.json serialization).

---

## How to Run Locally

To launch GraceWeb on your local machine:

1. Clone or navigate to the directory:
   ```bash
   cd C:\Users\PMLS\Documents\antigravity\wonderful-hypatia
   ```

2. Run the development server (Node v20.12.2 portable is pre-configured):
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to:
   **[http://localhost:3000](http://localhost:3000)**
