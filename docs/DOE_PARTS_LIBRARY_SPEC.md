# DOE Test Parts Library Specification

This document specifies the test parts we will ship (or accept after vetting) for DOE. Each entry includes purpose, geometry, constraints, metrics, and how it fits into DOE plates. Use these specs when generating parts with GPT or CAD.

## Implementation Status (2025-01-21)

✅ **Complete**: All 8 test parts implemented and available in `ascii_stl/` folder
- All STL files validated and ready for use
- Test model definitions in `src/utils/doe/testModels.ts` updated to point to correct paths
- 3MF generation fully implemented with parameter embedding
- Batch ZIP download includes all experimental runs, CSV manifest, and README

🔄 **Next Steps**: Testing and validation of generated 3MF files in OrcaSlicer

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
- Geometry: base 90×60×1.2 mm; six pillars 6×6×35 mm arranged in a 2×3 grid at centers (22,22), (45,22), (68,22), (22,44), (45,44), (68,44); rectangular ID tick bars in front of each pillar.
- Metrics: `string_count` (smaller-is-better).
- DOE: use as the single-purpose stringing probe in L9 screening and refinement.

### 4) Thin‑Wall Flow Patch — `thin_wall_patch_v2`
- Purpose: measure single‑line width and multi‑wall accuracy vs flow ratio.
- Geometry: base 120×80×2 mm; three long single-line ridges (0.40/0.45/0.50 mm thick, 90 mm long, 12 mm tall) at Y centers 24/32/40; three multi-wall strips (1.20/1.35/1.50 mm thick, 90 mm long, 8 mm tall) at Y centers 58/66/74; each row has rectangular ID tick bars near the left edge.
- Metrics: `measured_line_width`, `wall_accuracy`, `surface_score`.
- DOE: use after L9 screening to confirm flow settings or when flow ratio is refined.

### 5) Dimensional Cube V2 — `dimensional_cube_v2`
- Purpose: XY dimension and Z accuracy checks; elephant-foot mitigation.
- Geometry: solid cube 20×20×20 mm. Base step (elephant-foot relief): first 0.4 mm of height inset by 0.4 mm on all sides (i.e. bottom block 19.2×19.2×0.4 mm centered, topped by 20×20×19.6 mm block). Optional orientation tick can be added via printed marker—no integrated protrusions to preserve measurement.
- Metrics: `x_dim`, `y_dim`, `z_dim`, `corner_quality`.
- DOE: general health check; quick to print; can be tiled as part of composite plates.

### 6) Clearance Gauge V2 — `clearance_gauge_v2`
- Purpose: minimum functional clearance.
- Geometry: base 90×35×1.2 mm. Each of five lanes (X centers 15/30/45/60/75) has two posts 5×20 mm (X×Y) rising from Z=1.2→16.2 with gaps 0.20/0.30/0.40/0.50/0.60 mm. ID tick bars (1.5×2.5×0.6) at the front identify lanes 1–5.
- Metrics: `smallest_free_fit` (smallest gap that allows free movement).
- DOE: validate tolerance capability after initial tuning.

### 7) Surface Quality Plate — `surface_plate_v2`
- Purpose: surface finish variability vs speed/acceleration.
- Geometry: four 30×30×0.4 mm pads arranged within a 70×70 mm rim. Pad A (front-left) has horizontal ribs (1 mm × 0.4 every 3 mm), Pad B vertical ribs, Pad C stepped diagonal strips, Pad D crosshatch. ID tick bars sit on the rim at each pad’s edge.
- Metrics: `surface_band_score`, `seam_quality`.
- DOE: confirms speed/accel trade-offs with short prints.

### 8) PA Corner Pattern — `pa_corner_v2`
- Purpose: corner bulging vs pressure advance / linear advance.
- Geometry: lightweight frame (64×64×0.6 mm) composed of four 2 mm flange strips. A 60×60 mm loop (1.2 mm width, 25 mm tall) sits flush on the flange with a 1.2 mm seam gap at the start corner. A 3×3×25.6 mm seam pillar and two orientation tick bars sit on the front rim.
- Metrics: `corner_sharpness_score` (1–5 visual, larger-is-better) and seam quality notes.
- DOE: used when PA is included as a factor; prints in ~10 minutes.

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
