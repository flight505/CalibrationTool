# Tower Generation Methods Documentation

## Overview
This document explains the two distinct tower generation methods used in the CalibrationTool project, their differences, and when to use each approach.

## Method 1: AutoTowersGenerator Template-Based Approach

### Description
This method uses pre-validated STL template files from OrcaSlicer's AutoTowersGenerator project. The templates are professional-grade calibration models with proven geometry that have been tested extensively by the OrcaSlicer community.

### Key Features
- **Template-based**: Uses ASCII STL files stored in `/templates/`
- **Height Filtering**: Dynamically adjusts tower height based on calibration parameters
- **Post-Processing Support**: Full G-code injection at specific Z heights
- **3MF Export**: Complete OrcaSlicer project files with embedded commands
- **Firmware Support**: Marlin, Klipper, RepRapFirmware, and OrcaSlicer native

### Implementation Pattern
```typescript
export class TowerGenerator extends TowerGeneratorBase {
  protected async generateTowerGeometry(): Promise<ParsedSTL> {
    // 1. Load template STL
    const response = await fetch('/templates/tower_template_ascii.stl');
    const templateContent = await response.text();
    
    // 2. Calculate required height
    const totalHeight = baseHeight + (sections.length * sectionHeight);
    
    // 3. Filter STL to required height
    const filteredSTL = filterAsciiSTLByHeight(templateContent, totalHeight);
    
    // 4. Parse and return triangles
    return parseSTL(filteredSTL);
  }
}
```

### Towers Using This Method
1. **Temperature Tower** (`orcaTemperatureTower.ts`)
   - Template: `/templates/temp_tower_ascii.stl`
   - Material-specific presets (PLA, PETG, ABS, TPU, ASA, PC, PA)
   - Bridge and overhang test features

2. **Pressure Advance Tower** (`orcaPressureAdvanceTower.ts`)
   - Template: `/templates/pa_pattern_ascii.stl`
   - Corner test pattern for PA calibration
   - Fixed after user feedback about floating geometry

3. **Fan Speed Tower** (`orcaFanSpeedTower.ts`)
   - Template: `/templates/fan_tower_ascii.stl`
   - Bridging, overhang, and stringing test features

4. **Flow Rate Tower** (`orcaFlowRateTower.ts`)
   - Template: `/templates/flow_tower_ascii.stl`
   - Wall thickness variation tests

5. **Max Volumetric Speed Tower** (`orcaMaxVolumetricTower.ts`)
   - Template: `/templates/mvs_tower_ascii.stl`
   - Spiral, zigzag, and straight patterns

6. **Retraction Tower** (`orcaRetractionTower.ts`)
   - Template: `/templates/retraction_tower_orca_ascii.stl`
   - Multiple pillars for stringing detection

### Advantages
- ✅ Professional geometry with no floating parts
- ✅ Validated by OrcaSlicer community
- ✅ Consistent, predictable results
- ✅ Easy to maintain (just update template files)
- ✅ Full post-processing support

### Disadvantages
- ⚠️ Requires template STL files
- ⚠️ Less flexible for custom geometry
- ⚠️ Fixed design patterns

## Method 2: Simple STL Generation

### Description
This method generates basic STL files without post-processing support. Used for simple calibration models that don't require parameter changes at different heights.

### Key Features
- **Programmatic or Template**: Can use either approach
- **Basic STL Export**: Simple geometry files
- **No Post-Processing**: Manual G-code setup required
- **Quick Generation**: Fast, lightweight models

### Implementation Pattern
```typescript
export async function generateSimpleSTL(params: Parameters): Promise<Blob> {
  // Option 1: Load and adjust template
  const response = await fetch('/templates/simple_template.stl');
  const template = await response.text();
  const adjusted = adjustTemplate(template, params);
  
  // Option 2: Generate programmatically (deprecated)
  const geometry = createGeometry(params);
  const stl = geometryToSTL(geometry);
  
  return new Blob([stl], { type: 'application/sla' });
}
```

### Models Using This Method
1. **Flow Calibration Cube** (`stlGenerator.ts`)
   - Template: `/templates/flow_calibration_cube_template.stl`
   - Simple cube with varying wall thickness
   - No height-based changes needed

2. **First Layer Calibration** (`stlGenerator.ts`)
   - Template: `/templates/first_layer_calibration_ascii.stl`
   - Parametric patch generation
   - Pattern-based layout

3. **Calibration Cube** (standard 20mm cube)
   - Simple geometry generation
   - No special features needed

### Advantages
- ✅ Simple and fast
- ✅ Lightweight files
- ✅ Good for basic shapes
- ✅ No complex dependencies

### Disadvantages
- ⚠️ No post-processing support
- ⚠️ Manual slicer setup required
- ⚠️ No embedded settings

## Post-Processing System

### Overview
The post-processing system injects G-code commands at specific layer heights to change calibration parameters during printing.

### Components
1. **PostProcessingGenerator** (`postProcessingGenerator.ts`)
   - Generates firmware-specific G-code commands
   - Creates `custom_gcode_per_layer.xml` for OrcaSlicer

2. **Tower Sections**
   - Each section has: height, value, label
   - Commands injected at section boundaries

3. **Firmware Support**
   - **Marlin**: `M104 S{temp}`, `M220 S{flow}`, etc.
   - **Klipper**: `SET_HEATER_TEMPERATURE`, `SET_PRESSURE_ADVANCE`
   - **RepRapFirmware**: `G10 P0 S{temp}`, `M572 D0 S{pa}`
   - **OrcaSlicer**: Native modifier mesh support

### 3MF Export Features
```typescript
export interface OrcaSlicerProject {
  file: Blob;              // Complete 3MF file
  filename: string;        // Project filename
  
  // Embedded components:
  // - Main tower STL
  // - Modifier meshes for each section
  // - Post-processing G-code
  // - Calibration instructions
  // - Firmware-specific commands
}
```

## Decision Matrix: Which Method to Use?

| Use Case | Method | Reason |
|----------|--------|---------|
| Multi-height calibration | AutoTowersGenerator | Need post-processing |
| Simple test shapes | Simple STL | No height changes |
| Professional towers | AutoTowersGenerator | Validated geometry |
| Quick prototypes | Simple STL | Fast generation |
| OrcaSlicer integration | AutoTowersGenerator | 3MF support |
| Manual slicing | Simple STL | Basic geometry |

## Migration Path

### From Programmatic to Template-Based
When a tower has floating geometry issues (like the original PA tower):

1. **Identify Problem**: User reports floating/disconnected parts
2. **Find Template**: Locate validated STL from AutoTowersGenerator
3. **Convert to ASCII**: Ensure template is in ASCII STL format
4. **Implement Generator**:
   ```typescript
   class NewTowerGenerator extends TowerGeneratorBase {
     protected async generateTowerGeometry() {
       const template = await fetch('/templates/validated_tower.stl');
       // ... height filtering and parsing
     }
   }
   ```
5. **Add Post-Processing**: Implement section-based G-code injection
6. **Test 3MF Export**: Verify OrcaSlicer compatibility

## File Organization

```
/templates/                        # STL template files
  ├── temp_tower_ascii.stl        # Temperature tower
  ├── pa_pattern_ascii.stl        # Pressure advance
  ├── fan_tower_ascii.stl         # Fan speed
  ├── flow_tower_ascii.stl        # Flow rate
  ├── mvs_tower_ascii.stl         # Max volumetric
  ├── retraction_tower_orca_ascii.stl  # Retraction
  ├── flow_calibration_cube_template.stl  # Flow cube
  └── first_layer_calibration_ascii.stl   # First layer

/src/utils/
  ├── orcaTowerGenerator.ts       # Base class for towers
  ├── orcaTemperatureTower.ts     # Temperature implementation
  ├── orcaPressureAdvanceTower.ts # PA implementation
  ├── orcaRetractionTower.ts      # Retraction implementation
  ├── postProcessingGenerator.ts  # G-code injection
  ├── orca3mfExporter.ts          # 3MF project export
  └── stlGenerator.ts             # Simple STL generation
```

## Best Practices

1. **Always Use Templates for Complex Towers**
   - Avoid programmatic generation for multi-part models
   - Templates ensure no floating geometry

2. **Validate Template Geometry**
   - Check for disconnected parts in CAD software
   - Ensure proper manifold geometry

3. **Height Calculation Formula**
   ```typescript
   totalHeight = baseHeight + (numSections * sectionHeight)
   ```

4. **Post-Processing Integration**
   - Always include firmware selection UI
   - Default to Marlin for widest compatibility
   - Include toggle for post-processing on/off

5. **3MF Export Naming**
   ```typescript
   filename = `${TowerType}_${Material}_${StartValue}-${EndValue}.3mf`
   ```

## Troubleshooting

### Floating Geometry
- **Symptom**: Parts not connected in slicer
- **Solution**: Switch to template-based approach
- **Example**: PA tower migration (commit fb3d8a3)

### Post-Processing Not Working
- **Symptom**: Parameters don't change during print
- **Check**: Firmware compatibility
- **Check**: G-code injection heights
- **Check**: custom_gcode_per_layer.xml in 3MF

### Template Loading Fails
- **Symptom**: 404 error fetching template
- **Check**: Template file exists in /templates/
- **Check**: File path in fetch() call
- **Fallback**: Implement graceful degradation

## Future Improvements

1. **Template Validation Tool**
   - Automated geometry checking
   - Manifold verification
   - Height range validation

2. **Dynamic Template Generation**
   - Parametric CAD integration
   - OpenSCAD export pipeline
   - Real-time preview

3. **Extended Firmware Support**
   - Smoothieware
   - Duet3D
   - Custom firmware profiles

4. **Cloud Template Library**
   - Community-contributed templates
   - Version control for templates
   - Automatic updates