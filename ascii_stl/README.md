# DOE Test Parts Library

This folder contains pre-validated ASCII STL test models for Design of Experiments (DOE) calibration.

## Available Test Parts

| File | Purpose | Print Time | Metrics |
|------|---------|------------|---------|
| bridge_array_v2.stl | Bridging capability (5 spans: 10-30mm) | ~20min | Bridge quality, max span |
| overhang_ramp_v2.stl | Overhang angles (30°-70°) | ~15min | Max angle, quality score |
| stringing_towers_v2.stl | Retraction/stringing (6 pillars) | ~25min | String count |
| thin_wall_patch_v2.stl | Flow accuracy (single/multi walls) | ~30min | Line width, wall accuracy |
| dimensional_cube_v2.stl | Dimensional accuracy (20mm cube) | ~15min | X/Y/Z dimensions |
| clearance_gauge_v2.stl | Tolerance testing (5 gaps) | ~20min | Min clearance |
| surface_plate_v2.stl | Surface finish (4 pattern pads) | ~25min | Surface score |
| pa_corner_v2.stl | Pressure advance corners | ~10min | Corner sharpness |

## Usage in DOE

These parts are used in Taguchi L9/L18/L27 experiments to test multiple parameter combinations.
See `docs/DOE_PARTS_LIBRARY_SPEC.md` for detailed specifications.

## File Format

All files are ASCII STL format for:
- Easy inspection and debugging
- Compatibility with web-based STL processing
- Version control friendliness

## Adding New Test Parts

When adding new test parts to this library:

1. **Design requirements:**
   - Must have clear, measurable outcomes
   - Should test ONE specific aspect of print quality
   - Must be printable in < 30 minutes
   - Feature minimum thickness ≥ 0.4mm

2. **File format:**
   - Export as ASCII STL (not binary)
   - Validate geometry (manifold, no errors)
   - Test slice in OrcaSlicer

3. **Documentation:**
   - Create `.meta.json` file (see manifest.json)
   - Update `docs/DOE_PARTS_LIBRARY_SPEC.md`
   - Document metrics and scoring rubric

4. **Validation:**
   - Print test part with known-good settings
   - Verify metrics are measurable
   - Document in scoring guide

## Related Documentation

- **Technical Spec:** `docs/DOE_PARTS_LIBRARY_SPEC.md`
- **DOE Implementation:** `docs/LLM_ASSISTED_DOE_REVISED.md`
- **User Guide:** `public/docs/doe/overview.md`
