# [ARCHIVED] LLM‑Assisted DOE Design Guide (Geometry)

## Purpose
This document described geometry generation via LLM. That approach is superseded.
Active plan: docs/LLM_ASSISTED_DOE_REVISED.md (LLM assists ranges/analysis, not STL).

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
- Base thickness ≥ 1.2 mm; minimum feature thickness ≥ 0.4 mm; minimum air gap between distinct features ≥ 0.4 mm.
- Parts must be manifold/watertight; no coplanar duplicates; no faces below Z=0.
- Output format: ASCII STL only. You may include a single JSON meta header line for QA, *but strip it out before saving the final `.stl`* because some slicers reject non-STL preamble. After any optional header, begin with `solid <name>`.

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

## Prompt Examples

### stringing_towers_v2
Six 6×6×35 mm pillars on a 90×60×1.2 mm base with ID tick bars. Use the rectangular-solids contract; no JSON header in the saved STL.

### thin_wall_patch_v2 (copy/paste prompt)

TITLE: Generate ASCII STL for thin_wall_patch_v2 (rectangular solids only)

- Output only the ASCII STL. Optional: one JSON meta header line, but strip it before saving; final file must start with `solid thin_wall_patch_v2`.
- Units: millimeters, Z up. Rectangular solids only. No curves, no booleans.
- Geometry:
  - Base: 120 × 80 × 2.0, lower-left at (0,0,0).
  - Single-line ridges (flow probes): 3 prisms, length 90 (X 15→105), height 12 (Z 2→14).
    - Lane A: thickness 0.40, Y center 24 (Y 23.8→24.2).
    - Lane B: thickness 0.45, Y center 32 (Y 31.775→32.225).
    - Lane C: thickness 0.50, Y center 40 (Y 39.75→40.25).
  - Multi-wall strips: 3 prisms, length 90 (X 15→105), height 8 (Z 2→10).
    - Strip D: thickness 1.20, Y center 58 (Y 57.4→58.6).
    - Strip E: thickness 1.35, Y center 66 (Y 65.325→66.675).
    - Strip F: thickness 1.50, Y center 74 (Y 73.25→74.75).
  - ID tick bars: rectangular bars on the base (Z 2→2.6), each 1.5 × 2.5 × 0.6, 0.5 mm gaps. Place n bars (n=1..6) centered around X≈6 mm, 4 mm in front of the feature (towards −Y).
- Triangulate each face with two triangles; outward normals axis-aligned. No coordinates below Z=0. Bounding box must stay within X:[0,120], Y:[0,80], Z:[0,14].
- If constraints can’t be met, reply `ERROR: cannot satisfy manifold/constraints`.

### clearance_gauge_v2 (copy/paste prompt)

TITLE: Generate ASCII STL for clearance_gauge_v2 (rectangular solids only)

- Output only the ASCII STL (optional meta header may be used for QA but strip before saving). Final file must start with `solid clearance_gauge_v2`.
- Units: millimeters, Z up. Rectangular solids only.
- Geometry:
  - Base: 90 × 35 × 1.2, lower-left at (0,0,0).
  - Five gap lanes indexed 1..5 from left to right with gap sizes [0.20, 0.30, 0.40, 0.50, 0.60] mm.
    - Lane centers X = 15, 30, 45, 60, 75.
    - Each lane has two posts: 5 × 20 mm footprint (X × Y) from Y=8 to Y=28, height 15 mm (Z 1.2→16.2).
    - Left post X span: [cx − gap/2 − 5, cx − gap/2]; Right post X span: [cx + gap/2, cx + gap/2 + 5].
  - ID tick bars: rectangular bars on the base (Z 1.2→1.8), each 1.5 × 2.5 × 0.6 with 0.5 mm gaps, centered on X=cx at Y=3→5.5. Place i bars for lane index i.
- Ensure minimum air gap equals target gap ± 0.01 tolerance. No overlaps or caps.
- Triangulate each face with two triangles; outward normals axis-aligned. No coordinate below Z=0.
- If constraints can’t be met, respond `ERROR: cannot satisfy manifold/constraints`.

### surface_plate_v2 (copy/paste prompt)

TITLE: Generate ASCII STL for surface_plate_v2 (rectangular solids only)

- Output only the ASCII STL. Final file must start with `solid surface_plate_v2`.
- Units: millimeters, Z up. Rectangular solids only.
- Geometry:
  - Pads occupy a 70 × 70 mm footprint. Add two connector bars 70×1×0.4 (one at Y=33.5–34.5, one at X=33.5–34.5) to tie pads together.
  - Four pads: 30 × 30 × 0.4 each, located at rectangles [0–30]×[0–30], [35–65]×[0–30], [0–30]×[35–65], [35–65]×[35–65].
  - Ridge patterns (rectangular ribs 1.0 × 0.4):
    1. Pad A (front-left): ribs parallel to X, spaced 3 mm in Y.
    2. Pad B (front-right): ribs parallel to Y, spaced 3 mm in X.
    3. Pad C (rear-left): stepped diagonal strips 4 mm apart forming a 45° approximation.
    4. Pad D (rear-right): crosshatch with 1 mm ribs every 4 mm in both X and Y.
  - ID tick bars: place N bars (N=1..4) within each pad (front pads at Y=2, rear pads at Y=68), bar size 1.2×2.0×0.6 with 0.5 mm gaps; center around pad center X positions (15 or 50 mm).
- Triangulate faces with two triangles; outward normals axis-aligned. No coordinates below Z=0.
- If constraints can’t be met, respond `ERROR: cannot satisfy manifold/constraints`.

### pa_corner_v2 (copy/paste prompt)

TITLE: Generate ASCII STL for pa_corner_v2 (rectangular solids only)

- Output only ASCII STL (optionally meta header). Final file must begin `solid pa_corner_v2`.
- Units: millimeters, Z up. Rectangular solids only.
- Geometry:
  - Base frame: four strips 70×2.5×1.0 mm along the edges (bottom, top, left, right) providing adhesion while keeping the center open.
  - Track: continuous square loop 60 × 60 mm centered within the frame. Bar width 1.2 mm, height 18 mm above the frame (Z 1.0→19.0). The loop runs along inner offsets X,Y = 5→65.
  - Seam indicator: square pillar 3 × 3 × 20 mm (above the frame) at the start corner near (5,5).
  - Orientation bars: two 1.2 × 2.5 × 0.6 bars on the base near the start corner.
- Ensure no overlapping solids except shared faces. Triangulate each face with two triangles; outward normals axis-aligned; no coordinates below Z=0.
- If constraints can’t be met, respond `ERROR: cannot satisfy manifold/constraints`.

### dimensional_cube_v2 (copy/paste prompt)

TITLE: Generate ASCII STL for dimensional_cube_v2 (rectangular solids only)

- Output only the ASCII STL. Do not include comments or code fences. Final file must start with `solid dimensional_cube_v2`.
- Units: millimeters, Z up. Rectangular solids only; no booleans, no curves.
- Geometry:
  - Bottom relief block (elephant-foot mitigation): 19.2 × 19.2 × 0.4 mm, centered on the origin so its lower-left corner is at (0.4, 0.4, 0.0) and upper-right at (19.6, 19.6, 0.4).
  - Main cube body: 20 × 20 × 19.6 mm sitting on top of the relief block. Lower-left corner at (0, 0, 0.4), upper-right at (20, 20, 20).
  - Combined shape equals a 20×20×20 mm cube with a 0.4 mm inset band at the first layer.
- Triangulate each rectangular face with two triangles, outward normals axis-aligned. No coordinate below Z=0.
- If constraints can’t be met, respond with `ERROR: cannot satisfy manifold/constraints`.

## Risks and Mitigations
- Over‑trusting LLM geometry → mitigate with strict constraints and automated validation.
- Over‑narrowed ranges → keep safety margins and allow manual override in UI.
- Library drift → version all parts and keep a manifest with checksums.
