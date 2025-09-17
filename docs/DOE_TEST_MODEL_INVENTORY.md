# DOE Test Model Inventory

## Overview
This document tracks all available test models for Design of Experiments (DOE) calibration, their capabilities, measurable outcomes, and implementation status.

## Testing Philosophy
For effective DOE, each test model should measure ONE specific aspect of print quality. This allows us to isolate variables and understand their individual effects and interactions.

## Current Test Model Library

### ✅ Existing Tower-Based Tests (Ready for DOE)

| Test Model | File | Purpose | Measurable Outcome | Parameter Tested |
|------------|------|---------|-------------------|------------------|
| **Temperature Tower** | `temp_tower_ascii.stl` | Layer adhesion, strength | Optimal temperature range | Nozzle temperature |
| **Flow Tower** | `flow_tower_ascii.stl` | Extrusion accuracy | Wall thickness deviation | Flow ratio/multiplier |
| **Flow Tower Spiral** | `flow_tower_spiral_ascii.stl` | Continuous flow test | Surface consistency | Flow ratio |
| **Pressure Advance Pattern** | `pa_pattern_ascii.stl` | Corner quality | Corner sharpness score | PA/LA value |
| **PA Tower with Seam** | `pa_tower_with_seam_ascii.stl` | Seam quality | Seam visibility | PA value |
| **Retraction Tower** | `retraction_tower_orca_ascii.stl` | Stringing control | String count (0-10) | Retraction distance/speed |
| **Fan Speed Tower** | `fan_tower_ascii.stl` | Cooling optimization | Bridge quality, overhang angle | Fan speed % |
| **Speed Tower** | `speed_tower_ascii.stl` | Speed limits | Print quality at speed | Print speed mm/s |
| **VFA Tower** | `vfa_tower_ascii.stl` | Vibration/ghosting | Ringing severity (1-5) | Input shaper freq |
| **First Layer Calibration** | `first_layer_calibration_ascii.stl` | Z-offset, adhesion | First layer quality | Z-offset |

### ❌ Missing Single-Purpose Tests (Need to Create)

| Test Model | Purpose | Design Specification | Measurable Outcome | Priority |
|------------|---------|---------------------|-------------------|----------|
| **20mm Calibration Cube** | Dimensional accuracy | Solid 20×20×20mm cube | X/Y/Z deviation (mm) | **HIGH** |
| **Bridge Test Array** | Bridging capability | 5 bridges: 5,10,15,20,25mm spans | Success count (0-5), max span | **HIGH** |
| **Overhang Test** | Overhang capability | Progressive: 30°,45°,60°,70°,80° | Max successful angle | **HIGH** |
| **Clearance Test** | Tolerance/fit | Holes/pins: 0.1-0.5mm steps | Min functional clearance (mm) | **MEDIUM** |
| **Surface Quality Patch** | Top surface finish | 50×50×5mm flat patch | Roughness score (1-5) | **MEDIUM** |
| **Single Bridge Test** | Isolated bridging | Single 20mm span | Bridge sag (mm) | **LOW** |
| **Stringing Pillars** | Isolated stringing | Two 20mm pillars, 10mm apart | String presence (Y/N) | **LOW** |
| **Thin Wall Test** | Wall precision | 0.4mm single wall square | Wall consistency score | **LOW** |

## DOE Test Selection Guide

### For Taguchi L9 Basic Screening (4 factors, 9 runs)
**Recommended Test Set:**
1. 20mm Calibration Cube - Overall quality metric
2. Bridge Test Array - Cooling/temp interaction
3. Retraction Tower section - Stringing metric
4. Surface Quality Patch - Finish quality

**Typical Factors:**
- Temperature (3 levels)
- Fan Speed (3 levels)
- Print Speed (3 levels)
- Layer Height (3 levels)

### For Comprehensive L18 Analysis (7 factors, 18 runs)
**Extended Test Set:**
1. All from L9 set
2. Overhang Test - Advanced cooling assessment
3. Flow Tower section - Dimensional precision
4. Clearance Test - Tolerance capability

**Additional Factors:**
- Flow Ratio
- Retraction Distance
- Acceleration

## Scoring Rubrics

### Quantitative Metrics (Direct Measurement)
| Test | Measurement | Tool | Target | Score Calculation |
|------|-------------|------|--------|------------------|
| Calibration Cube | X,Y,Z dimensions | Calipers | 20.00mm | Error = \|measured - 20.00\| |
| Bridge Sag | Center deflection | Ruler/Calipers | 0mm | Sag in mm |
| Clearance | Smallest free gap | Go/no-go test | Varies | Gap size in mm |
| String Count | Number of strings | Visual count | 0 | Integer count |

### Qualitative Metrics (Scored 1-5)
| Score | Surface Quality | Bridge Quality | Overhang Quality | Corner Quality |
|-------|----------------|----------------|------------------|----------------|
| 5 | Glass smooth | Perfect, no sag | Clean to 80° | Sharp, no bulge |
| 4 | Minor layer lines | Slight sag <1mm | Clean to 70° | Slight rounding |
| 3 | Visible layers | Sag 1-2mm | Clean to 60° | Noticeable bulge |
| 2 | Rough surface | Sag 2-3mm | Clean to 45° | Significant bulge |
| 1 | Failed surface | Bridge failed | Only 30° clean | Corner blob |

## Implementation Status

### Phase 1: Model Preparation ⏳
- [ ] Design missing test models in Fusion 360
- [ ] Export as STL files
- [ ] Convert to ASCII STL format
- [ ] Validate geometry (no floating parts)
- [ ] Create templates folder structure

### Phase 2: Integration 🔄
- [x] Temperature tower generator
- [x] Flow tower generator
- [x] Retraction tower generator
- [x] Fan speed tower generator
- [ ] Calibration cube generator
- [ ] Bridge test generator
- [ ] Overhang test generator

### Phase 3: DOE System 📊
- [ ] Parameter variation engine
- [ ] Batch 3MF generation
- [ ] Experiment tracking
- [ ] Results analysis

## File Organization

```
/public/templates/
├── doe/                    # DOE-specific test models
│   ├── calibration_cube.stl
│   ├── bridge_array.stl
│   ├── overhang_test.stl
│   ├── clearance_test.stl
│   └── surface_patch.stl
├── towers/                 # Existing tower tests
│   ├── temp_tower_ascii.stl
│   ├── flow_tower_ascii.stl
│   └── ...
└── README.md              # Template documentation
```

## 3MF Generation Strategy

For each DOE experimental run:
1. Select appropriate test model
2. Apply parameter combination from orthogonal array
3. Generate 3MF with:
   - Test model geometry
   - Preset slicer parameters
   - Post-processing G-code (if needed)
   - Experiment metadata in filename
4. Label clearly: `DOE_L9_Run01_T210_F60_S50_L02.3mf`

## Notes for Implementation

1. **Single Purpose Rule**: Each test measures ONE thing
2. **Quick Print Rule**: Keep tests small (<30 min print time)
3. **Clear Metrics Rule**: Every test must have measurable outcome
4. **Reproducibility Rule**: Tests must be consistent across printers
5. **ASCII STL Rule**: All models in ASCII format for easy manipulation

## References
- MakerWorld Test Models: https://makerworld.com/en/3d-models/903-test-models
- Teaching Tech Calibration: https://teachingtechyt.github.io/calibration.html
- OrcaSlicer Calibration Wiki: GitHub OrcaSlicer Wiki