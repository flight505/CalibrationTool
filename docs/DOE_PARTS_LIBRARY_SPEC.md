# DOE Test Parts Library Specification

This document specifies the test parts we will ship (or accept after vetting) for DOE. Each entry includes purpose, geometry, constraints, metrics, and how it fits into DOE plates. Use these specs when generating parts with GPT or CAD.

## Conventions
- Units: millimeters; Z up; ASCII STL.
- Base thickness: 2.0 mm unless otherwise noted.
- Minimum feature thickness: ≥ 0.4 mm; air gaps between distinct elements ≥ 0.4 mm.
- Embossed/engraved labels: 0.6–0.8 mm tall, 0.3–0.4 mm depth/height.

## Core Parts

### 1) Bridge Array V2 — `bridge_array_v2`
- Purpose: bridging capability vs span (and fan/temperature interactions).
- Geometry: five U‑shaped lanes; pillars 8×6×25 mm; gaps 10/15/20/25/30 mm; bridge deck thickness 1.2 mm; lane clearance ≥ 6 mm; base 150×60×2 mm; embossed span labels.
- Constraints: no top bar connecting lanes; decks rest only across their gap.
- Metrics: `successful_bridges`, `max_bridge_length`, `bridge_quality`.
- DOE: pair with fan % and temperature ranges; can be a standalone plate or combined with Overhang Ramp V2.

### 2) Overhang Ramp V2 — `overhang_ramp_v2`
- Purpose: overhang capability vs angle (fan/temperature interactions).
- Geometry: cantilever stages at 30/40/50/60/70°; plate thickness 1.4 mm; each stage 30×6 mm; stiffener rib at trailing edge; base 120×40×2 mm.
- Metrics: `max_overhang_angle`, `overhang_quality`.
- DOE: complements Bridge Array V2; same fan/temp factors.

### 3) Stringing Towers — `stringing_towers_v2`
- Purpose: evaluate stringing as a function of retraction distance/speed and fan.
- Geometry: six pillars 10×10×40 mm; centers spaced 25 mm; travel path should traverse diagonals (slicer setting); optional small catch cones on top.
- Metrics: `string_count`, `string_mass_score`.
- DOE: use as a region for retraction sweeps; combine on a plate with a small cube for dimensional check.

### 4) Thin‑Wall Flow Patch — `thin_wall_patch_v2`
- Purpose: measure single‑line width and multi‑wall accuracy vs flow ratio.
- Geometry: grid with lanes targeting 0.40/0.45/0.50 mm; adjacent 3‑wall blocks targeting 1.2/1.35/1.5 mm; overall 120×80×2 base; labels for target widths.
- Metrics: `measured_line_width`, `wall_accuracy`, `surface_score`.
- DOE: use for flow factor confirmation after screening.

### 5) Dimensional Cube V2 — `dimensional_cube_v2`
- Purpose: XY dimension and Z accuracy checks; elephant‑foot mitigation.
- Geometry: 20×20×20 solid cube, chamfered 0.4 mm on first‑layer edges; optional XY calibration tabs.
- Metrics: `x_dim`, `y_dim`, `z_dim`, `corner_quality`.
- DOE: general health check; quick to print; can be tiled as part of composite plates.

### 6) Clearance Gauge V2 — `clearance_gauge_v2`
- Purpose: minimum functional clearance.
- Geometry: paired walls/posts with gaps 0.2/0.3/0.4/0.5/0.6 mm; cap markers; base 120×60×2 mm.
- Metrics: `smallest_free_fit`.
- DOE: used after initial tuning to verify practical tolerances.

### 7) Surface Quality Plate — `surface_plate_v2`
- Purpose: surface finish variability vs speed/acceleration.
- Geometry: four 40×40 zones on a 120×100×2 base; ridges to expose banding; optional ring for seam inspection.
- Metrics: `surface_band_score`, `seam_quality`.
- DOE: confirms speed/accel trade‑offs.

### 8) PA Corner Pattern — `pa_corner_v2`
- Purpose: corner bulging vs pressure advance / linear advance.
- Geometry: square path with sharp internal/external corners; base for adhesion; seam indicator.
- Metrics: `corner_sharpness_score`, `seam_quality`.
- DOE: used when PA is included as a factor.

## Composite Plates (to cut prints)
- Bridge+Overhang Plate: place Bridge Array V2 and Overhang Ramp V2 side‑by‑side on a 180×140 base; apply region modifiers (fan/temp) per half or per band to compare regimes in one print.
- Stringing+Cube Plate: towers plus two 20 mm cubes; test retraction and dimensionality together.
- Surface+Thin‑Wall Plate: surface zones with adjacent thin‑wall lanes for a visual+measurement combo.

## Orca Modifiers Guidance
- Prefer Orca native modifiers for visual QA; use firmware G‑code only when portability is required.
- Height modifiers: classic towers (temp, flow, fan, speed) where changes occur by Z.
- Region modifiers: composite plates where each sub‑part is a “region” with fixed settings for a run.

## Metadata and Manifest
- Manifest: `public/templates/doe/library/manifest.json` list of models.
- Meta file: `<model>.meta.json` with fields:
```
{
  "id": "bridge_array_v2",
  "name": "Bridge Test Array V2",
  "version": "1.0.0",
  "category": "bridging",
  "path": "/templates/doe/library/bridging/bridge_array_v2.stl",
  "dimensions_mm": {"x": 150, "y": 90, "z": 30},
  "factors": ["fan_speed", "temperature"],
  "metrics": ["successful_bridges", "max_bridge_length", "bridge_quality"],
  "recommended": {"layer_height": 0.2, "nozzle": 0.4, "infill": 0, "wall_loops": 2},
  "notes": "U‑shaped spans, 6 mm lane clearance; embossed labels"
}
```

## Generation Prompts (LLM)
Provide a tight prompt including: required dimensions, base thickness, min feature thickness, exact feature layout with coordinates, labels, and the ASCII STL contract. Refer to DOE_LLM_ASSISTED_DESIGN.md for the full constraints and the meta header convention.

## QA Checklist (per part)
- ASCII parse ok; triangle count reasonable; dimensions match spec.
- No degenerate triangles; normal magnitudes ~1; min feature ≥ 0.4 mm.
- Orca slice has no empty layers; intended features are separated; labels readable.
- Metrics measurable with calipers or clear visual rubric.

