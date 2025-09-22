# LLM‑Assisted DOE Design Guide

## Purpose
This document defines how we use an LLM (e.g., GPT‑5 with web search) to assist the Design of Experiments (DOE) workflow in CalibrationTool without compromising reliability. It covers inputs, prompting constraints, artifacts, and the adaptive strategy we use to reduce print counts while still collecting high‑value data.

## Scope and Principles
- Library‑first: prefer curated, pre‑vetted test parts; only ask the LLM to propose new parts when a gap exists.
- Strong constraints: any LLM‑generated geometry must follow strict rules (simple solids, ASCII STL, manifold, minimum thicknesses) and pass automated and manual validation before use.
- Human‑in‑the‑loop: an operator accepts/rejects proposals; only accepted parts become part of the permanent library with metadata.

## User Inputs (Context Form)
Collected in the DOE Workbench to condition both factor ranges and test selection:
- Filament brand (e.g., Prusament, eSun)
- Material (PLA, PETG, ABS, ASA, TPU, PC, PA)
- Printer model (e.g., Bambu P1S, Prusa MK4, Voron 2.4)
- Printer type (bedslinger / CoreXY / Delta)
- Nozzle size (e.g., 0.4 mm)
- Target layer height (e.g., 0.2 mm)
- Optional: enclosure, chamber temp, draft protection, known constraints (e.g., “no ASA fumes, keep bed ≤ 90 °C”)

## Outputs From LLM
- Factor set for screening (typically 4 factors): temperature, fan speed, print speed, flow ratio; optionally retraction distance or acceleration.
- Three‑level ranges per factor tailored to brand/printer (e.g., PETG on Prusa MK4: 225/240/255 °C; fan 30/60/90 %; speed 40/60/80 mm/s; flow 0.95/1.00/1.05).
- Recommended test plates from the curated library that cover required metrics.
- If the library lacks a plate: a candidate simple ASCII STL proposal with a one‑line JSON meta header.

## Prompting Constraints (for Geometry)
- Units: millimeters, Z up.
- Geometry primitives: rectangular solids/extrusions only. No boolean subtracts, no curves.
- Base thickness ≥ 2.0 mm; minimum feature thickness ≥ 0.4 mm; minimum air gap between distinct features ≥ 0.4 mm.
- Parts must be manifold/watertight; no coplanar duplicates; no faces below Z=0.
- Output format: ASCII STL only. Optionally precede with a single JSON line `{name, size_mm:{x,y,z}, features:[...], factors:[...]}` to aid QA; after that line, begin with `solid <name>`.

## Validation Pipeline
1. Automated geometry checks (ASCII parse → triangle count, bounding box, degenerate triangles, normal magnitudes, min feature heuristics).
2. “Slicer smoke test” with low‑time settings to catch empty layers and fused features.
3. Manual check for legibility (labels), measurement access points, intended behavior.
4. If accepted: save as `public/templates/doe/library/<category>/<model>.stl` with a `<model>.meta.json`; add to manifest; assign a semantic version.

## Library Artifacts
- Manifest: `public/templates/doe/library/manifest.json` (array of objects)
  - id, name, version, category, path, dimensions_mm, factors[], metrics[], recommended slicer defaults, preview image path, notes.
- Per‑model meta: `<model>.meta.json` containing the same fields + printable guidance and known pitfalls.

## DOE Strategy With LLM (Run Reduction)
1. Screening with context‑aware L9 (3^4)
   - Use brand/printer‑specific ranges from LLM to avoid wasting runs on non‑informative extremes.
   - Choose 1–2 curated plates that collectively cover required metrics (e.g., Bridge Array V2 + Surface Patch).
2. Adaptive narrowing
   - After the L9, calculate main effects/SNR; LLM proposes narrowed ranges for the top 2 factors.
   - Run a small RSM (e.g., 5–7 runs around the likely optimum) or a reduced L9 with tightened levels.
3. Composite plates
   - Where practical, combine compatible tests on one plate using region modifiers to reduce total print time; cap each plate ≤ 45 minutes.
4. Early stopping
   - Stop when SNR gains plateau or when constraints/quality thresholds are met (e.g., stringing count ≤ target at mid fan + tuned retraction).

## Export Modes (UI Toggle)
- Orca native modifiers (recommended when slicing in OrcaSlicer): full visualization, no firmware M‑code injection.
- Firmware post‑processing (portable SD prints): inject M104/M109/M221/M106… per section; preview appears single‑color.

## Run Recipe (Optional JSON)
For reproducibility, we can emit a run recipe alongside 3MF exports:
```
{
  "experiment_id": "<id>",
  "array": "L9",
  "context": {"brand":"…","material":"…","printer":"…","type":"…","nozzle":0.4,"layer_height":0.2},
  "factors": [{"name":"Temperature","levels":[225,240,255],"unit":"°C"}, …],
  "plates": [
    {"part_id":"bridge_array_v2","metrics":["successful_bridges","max_span"],"mode":"orcaslicer"}
  ]
}
```

## Risks and Mitigations
- Over‑trusting LLM geometry → mitigate with strict constraints and automated validation.
- Over‑narrowed ranges → keep safety margins and allow manual override in UI.
- Library drift → version all parts and keep a manifest with checksums.

