# DOE Test Models Inventory

## Current Test Models Available

### Calibration Towers (Already Implemented)
| Model | File | Purpose | DOE Suitable |
|-------|------|---------|--------------|
| Temperature Tower | `temperature_tower_ascii.stl` | Layer adhesion, bridging | ✅ Yes |
| Flow Tower | `flow_tower_ascii.stl` | Wall quality, extrusion | ✅ Yes |
| Flow Tower Spiral | `flow_tower_spiral_ascii.stl` | Continuous flow test | ✅ Yes |
| Pressure Advance Pattern | `pa_pattern_ascii.stl` | Corner sharpness | ✅ Yes |
| Retraction Tower | `retraction_tower_orca_ascii.stl` | Stringing control | ✅ Yes |
| Fan Speed Tower | `fan_tower_ascii.stl` | Cooling optimization | ✅ Yes |
| Speed Tower | `speed_tower_ascii.stl` | Print speed limits | ✅ Yes |
| VFA Tower | `vfa_tower_ascii.stl` | Vibration/ghosting | ✅ Yes |

### Basic Calibration Models
| Model | File | Purpose | DOE Suitable |
|-------|------|---------|--------------|
| First Layer Patch | `first_layer_calibration_ascii.stl` | Z-offset, adhesion | ⚠️ Limited |
| Flow Calibration Cube | `flow_calibration_cube_template.stl` | Flow ratio | ✅ Yes |

## Missing Test Models for DOE

### Priority 1: Essential DOE Models (Must Create/Import)

#### 1. Standard Calibration Cube (20mm)
- **Purpose**: Dimensional accuracy across X, Y, Z axes
- **Metrics**: Dimension measurements, corner sharpness, surface quality
- **DOE Use**: Primary model for dimensional accuracy factors
- **Status**: ❌ **MISSING** - Need to create

#### 2. 3DBenchy
- **Purpose**: Comprehensive quality assessment
- **Metrics**: Overhangs, bridges, details, surfaces, dimensions
- **DOE Use**: Overall quality scoring for multi-factor optimization
- **Status**: ❌ **MISSING** - Need to import (available from Creative Tools)
- **License**: Creative Commons - Attribution - No Derivatives

#### 3. Overhang Test (Progressive Angles)
- **Purpose**: Test cooling and support requirements
- **Metrics**: Maximum successful overhang angle without support
- **DOE Use**: Cooling factor optimization
- **Status**: ❌ **MISSING** - Need to create (30°, 45°, 60°, 70°, 80°)

#### 4. Bridge Torture Test
- **Purpose**: Bridging performance at various spans
- **Metrics**: Bridge sagging, string formation
- **DOE Use**: Temperature and cooling interaction studies
- **Status**: ❌ **MISSING** - Need to create (5mm, 10mm, 15mm, 20mm, 25mm spans)

#### 5. Thin Wall Test
- **Purpose**: Flow precision and wall quality
- **Metrics**: Wall consistency, gaps, overlaps
- **DOE Use**: Flow ratio optimization
- **Status**: ⚠️ **PARTIAL** - Have flow cube, need dedicated thin wall test

### Priority 2: Advanced DOE Models (Should Have)

#### 6. Dimensional Accuracy Test
- **Purpose**: Precise measurement of holes, pins, gaps
- **Metrics**: Hole diameter, pin diameter, clearance gaps
- **DOE Use**: Tolerance and fit optimization
- **Status**: ❌ **MISSING** - Need to create

#### 7. Surface Quality Test Patch
- **Purpose**: Top surface finish quality
- **Metrics**: Surface roughness, layer visibility
- **DOE Use**: Top layer settings optimization
- **Status**: ❌ **MISSING** - Need to create (100x100x5mm patch)

#### 8. Support Test Model
- **Purpose**: Support interface quality
- **Metrics**: Support removal ease, surface quality after removal
- **DOE Use**: Support settings optimization
- **Status**: ❌ **MISSING** - Need to create

#### 9. Text & Detail Test
- **Purpose**: Fine detail reproduction
- **Metrics**: Text readability, minimum feature size
- **DOE Use**: Resolution and quality optimization
- **Status**: ❌ **MISSING** - Need to create

#### 10. Multi-Material Test
- **Purpose**: Material change quality
- **Metrics**: Purge effectiveness, color bleeding
- **DOE Use**: Multi-material optimization
- **Status**: ❌ **MISSING** - Need to create

### Priority 3: Specialized Tests (Nice to Have)

#### 11. Mechanical Strength Test
- **Purpose**: Layer adhesion and part strength
- **Metrics**: Breaking force, layer separation
- **DOE Use**: Strength optimization
- **Status**: ❌ **MISSING** - Need tensile bar design

#### 12. Warping Test Grid
- **Purpose**: First layer adhesion and warping
- **Metrics**: Corner lifting, dimensional stability
- **DOE Use**: Bed adhesion optimization
- **Status**: ❌ **MISSING** - Need large flat grid

#### 13. Z-Wobble Test
- **Purpose**: Z-axis consistency
- **Metrics**: Layer alignment, surface regularity
- **DOE Use**: Mechanical calibration validation
- **Status**: ❌ **MISSING** - Need tall cylindrical test

## Implementation Plan for Missing Models

### Quick Wins (Can Generate Programmatically)
1. **Calibration Cube** - Simple box geometry, can generate with Three.js
2. **Thin Wall Test** - Series of walls with varying thickness
3. **Surface Test Patch** - Flat rectangular patch
4. **Bridge Test** - Series of bridges at different spans
5. **Overhang Test** - Progressive angle test

### Need to Source/Import
1. **3DBenchy** - Download from CreativeTools (check license)
2. **Dimensional Test** - May find open-source alternatives

### Complex Models to Design
1. **Support Test** - Requires specific geometry for support testing
2. **Text & Detail** - Needs embedded text at various sizes
3. **Multi-Material** - Requires color/material change points

## Recommended DOE Test Suite

### Minimal Set (5 Models)
1. Calibration Cube - Dimensional accuracy
2. Temperature Tower - Temperature optimization
3. Retraction Tower - Stringing control
4. Flow Cube - Extrusion calibration
5. Overhang Test - Cooling optimization

### Standard Set (10 Models)
All minimal set plus:
6. 3DBenchy - Overall quality
7. Bridge Test - Bridging performance
8. PA Pattern - Pressure advance
9. Thin Wall Test - Wall quality
10. Surface Patch - Top surface quality

### Comprehensive Set (15+ Models)
All standard set plus specialized tests for specific optimization goals

## File Organization Structure

```
public/
└── templates/
    ├── calibration/        # Basic calibration models
    │   ├── cube_20mm.stl
    │   ├── thin_wall.stl
    │   └── surface_patch.stl
    ├── towers/             # Existing tower models
    │   └── [existing files]
    ├── doe_tests/          # DOE-specific test models
    │   ├── benchy.stl
    │   ├── overhang_test.stl
    │   ├── bridge_array.stl
    │   ├── dimensional_test.stl
    │   └── detail_test.stl
    └── specialized/        # Advanced test models
        ├── strength_bar.stl
        ├── warping_grid.stl
        └── z_wobble.stl
```

## Next Steps

1. **Immediate Actions**:
   - Create programmatic generator for calibration cube
   - Create overhang test generator
   - Create bridge test generator
   - Create thin wall test generator

2. **Short Term**:
   - Source and validate 3DBenchy model
   - Design dimensional accuracy test
   - Create surface quality patch

3. **Long Term**:
   - Develop specialized test models
   - Create model validation system
   - Build model recommendation engine based on DOE goals

## Model Generation Code Structure

```typescript
// src/utils/doe/testModelGenerator.ts
export class DOETestModelGenerator {
  generateCalibrationCube(size: number = 20): ArrayBuffer
  generateOverhangTest(angles: number[]): ArrayBuffer
  generateBridgeTest(spans: number[]): ArrayBuffer
  generateThinWallTest(thicknesses: number[]): ArrayBuffer
  generateSurfacePatch(size: [number, number, number]): ArrayBuffer
}
```

## Quality Requirements for Test Models

1. **Printability**: All models must be printable without supports (except support test)
2. **Measurement**: Clear measurement points and references
3. **Time Efficiency**: Most models should print in under 30 minutes
4. **Material Efficiency**: Minimize material usage while maintaining test validity
5. **Repeatability**: Consistent results across multiple prints
6. **Scalability**: Models should work at different scales if needed