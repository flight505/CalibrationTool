# DOE Planner Overview

Design of Experiments (DOE) in CalibrationTool provides a structured approach to tuning FDM printers. Instead of adjusting one variable at a time, DOE evaluates multiple factors simultaneously and uses statistical analysis to identify robust print settings. CalibrationTool focuses on Taguchi orthogonal arrays (L9, L18, L27) because they balance coverage and print count for 3D printing workflows.

## Why DOE for 3D Printing?

- **Fewer prints, better insight** – Orthogonal arrays capture factor interactions with 9–27 runs vs dozens of ad-hoc tests.
- **Objective decisions** – Taguchi signal-to-noise ratios and main effects quantify how each factor affects the selected quality metric.
- **Repeatable workflow** – Generated 3MF projects and CSVs keep experiments consistent across printers, materials, and operators.
- **LLM assistance** – GPT-5 retrieves manufacturer data, proposes safe ranges, and explains optimal settings directly in the app.

## DOE Terminology Refresher

| Term | Description | CalibrationTool Usage |
|------|-------------|------------------------|
| **Factor** | Adjustable printer/slicer variable (temperature, flow, fan, etc.) | Selected from presets or defined manually |
| **Level** | Specific value of a factor | Typically three levels per factor for Taguchi arrays |
| **Response** | Measured quality metric (dim accuracy, surface score, tensile strength) | Entered after printing; determines SNR |
| **Orthogonal array** | Predefined matrix specifying factor-level combinations | L9 (4 factors), L18 (up to 8 factors), L27 (up to 13 factors) |
| **Signal-to-Noise (SNR)** | Taguchi metric that rewards robustness; larger-is-better, smaller-is-better, or nominal targets | Displayed in Phase 2 analysis and GPT-5 summaries |
| **Main effect** | Average response per level showing trend direction | Visualized in manual analysis to highlight sensitive factors |

## How the Planner Works

1. **Phase 1 – Planning**
   - Provide filament + printer context.
   - Ask GPT-5 to propose factors and ranges or configure manually.
   - Generate orthogonal array runs, 3MF batch, and CSV summary.

2. **Printing & Scoring**
   - Execute generated prints (typically 9 for L9) and record scores/measurements.
   - Use the built-in rubric guidance for consistent evaluations.

3. **Phase 2 – Analysis**
   - Run manual analysis (main effects, SNR, ANOVA) for raw insights.
   - Optionally request GPT-5 analysis for narrative guidance, optimal settings, and confirmation-run suggestions.

## When to Choose Each Array

| Array | Print Count | Typical Usage |
|-------|-------------|----------------|
| **L9** | 9 runs | Up to 4 three-level factors (ideal for filament tuning) |
| **L18** | 18 runs | Mixed two/three-level factors or up to 8 variables |
| **L27** | 27 runs | Deep explorations with up to 13 factors (advanced only) |

Choose the smallest array that covers your critical factors. Use GPT-5’s recommendations or the planner’s heuristics to auto-select the array based on factor count.

## Next Steps

- Continue to [DOE Planner Walkthrough](./planner-guide.md) for UI instructions.
- Dive into [Taguchi Math Reference](./taguchi-reference.md) for formulas and decision criteria.
- Review [Scoring & Best Practices](./scoring-guide.md) before running your first DOE batch.
