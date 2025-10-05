# DOE Planner Walkthrough

This guide explains each step of the CalibrationTool DOE Planner interface and how to prepare, print, and analyze a complete experiment.

## 1. Launching the Planner

Open **DOE Workbench** from the Calibration suite. The top of the page contains experiment metadata:

- **Experiment Name** – Appears in exported files and saved sessions.
- **Orthogonal Array** – Choose L9, L18, or L27. The planner recommends an array based on factor count.
- **Test Model** – Select the pre-validated STL/3MF bundle used for scoring (bridge array, overhang ramp, etc.).
- **Templates** – Apply a preset factor bundle (e.g., PLA Quality DOE) for quick setup.

## 2. Phase 1: Assisted Planning

### LLM-Assisted Parameter Planning Card

1. Enter filament brand, material, printer model/architecture, nozzle size, target layer height, enclosure status, known issues, and objectives (strength/speed/surface quality/dimensional accuracy).
2. Click **Propose ranges with GPT-5**. The UI displays:
   - Streaming web-search badges (`in_progress → searching → completed`).
   - Text delta preview of GPT-5’s reasoning.
   - Final structured recommendation with factor plans, orthogonal array, test parts, rationales, and citations.
3. Press **Apply to experiment** to import the factors, levels, and suggested array into the planner.

### Manual Factor Management

- Use preset cards (Temperature, Flow Ratio, Fan Speed, etc.) or **Add custom factor** to define levels manually.
- Levels accept comma-separated numeric values. Three levels are recommended for Taguchi arrays.
- Remove or edit factors at any time; the orthogonal array updates accordingly.

## 3. Generating Experiment Assets

- **Generate DOE Batch** outputs:
  - Multi-run 3MF project with all orthogonal array combinations (one filament preset per build plate).
  - CSV summary listing factor levels per run.
- Download the 3MF file, slice it (keep modifiers intact), and print sequentially.

## 4. Printing & Scoring

1. Label each print with its **Run #**.
2. Use provided rubrics (dimensional checks, visual inspection, etc.) to score metrics.
3. Enter measurements in the **Experiment Matrix** table inside DOE Workbench.
4. Notes per run capture qualitative findings (stringing severity, bridging issues, etc.).

## 5. Phase 2: Analysis

### Manual Analysis

- **Metric for Analysis** – choose the primary response (e.g., surface_score).
- Click **Analyze Results** to compute:
  - Main Effects table (trend per factor level).
  - SNR report (larger/smaller/nominal based on metric definition).
  - ANOVA summary (factor contributions and F-values).

### GPT-5 Analysis

- After measurements are entered, select **Analyze with GPT-5**.
- Streaming output shows reasoning deltas followed by a structured summary containing:
  - Recommended optimal levels (badges).
  - SNR insights (textual interpretation of deltas).
  - Factor trend narratives (why levels matter).
  - Confirmation run guidance (settings, expected gain, notes).

## 6. Confirmation Runs & Iteration

- If GPT-5 or the main effects suggest ambiguous results, run a confirmation print with the recommended settings.
- Optionally design a follow-up DOE (e.g., narrow temperature band) by cloning the experiment and adjusting levels.

## 7. Export & Reporting (Roadmap)

- Upcoming features will allow persisting DOE sessions, exporting Markdown/PDF reports, and syncing optimal settings back into Orca profiles.
- Track progress in the implementation checklist inside `docs/LLM_ASSISTED_DOE_REVISED.md`.
