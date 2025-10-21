# OrcaSlicer Modifier Mesh Implementation Plan

**Date**: 2025-01-21
**Status**: Phase 1 & 2 Complete - Ready for Testing
**Goal**: Implement proper OrcaSlicer modifier mesh support in 3MF files

---

## Background

### Problem
Current implementation generates modifier mesh geometry but OrcaSlicer doesn't recognize them because we're missing the critical `model_settings.config` file that declares which objects are modifiers and what settings they apply.

### Current State
- ✅ G-code post-processing works (custom_gcode_per_layer.xml)
- ❌ Orca native modifiers don't work (missing model_settings.config)
- ❌ Toggle "Use Orca native modifiers" produces non-functional 3MF files

### Research Findings
Based on OrcaSlicer source code analysis (`OrcaSlicer-main/src/libslic3r/Format/bbs_3mf.cpp`):
- Modifiers require `model_settings.config` file in `Metadata/` folder
- Each modifier must be declared with `subtype="modifier_part"`
- Settings are stored as `<metadata key="setting_name" value="setting_value"/>` within each part
- Part IDs must match object IDs in `3D/3dmodel.model`

---

## Implementation Plan

### Phase 1: Core Infrastructure

#### 1.1 Create Model Settings Generator
- [x] Create new file: `src/utils/orcaModelSettings.ts`
- [x] Define TypeScript interfaces:
  ```typescript
  interface ModelPart {
    id: number;
    subtype: 'normal_part' | 'modifier_part';
    name: string;
    matrix: string; // Transformation matrix
    settings?: Record<string, string | number>; // Only for modifiers
  }

  interface ModelObject {
    id: number;
    name: string;
    parts: ModelPart[];
  }

  interface ModelSettingsConfig {
    objects: ModelObject[];
    plates?: PlateConfig[];
    assemble?: AssembleConfig[];
  }
  ```

- [x] Implement `generateModelSettingsXML(config: ModelSettingsConfig): string`
  - [x] Generate `<config>` root element
  - [x] Generate `<object>` elements with proper IDs
  - [x] Generate `<part>` elements with correct subtype
  - [x] Generate `<metadata>` elements for settings
  - [x] Add `<mesh_stat>` elements (required but can be zeros)
  - [x] Generate `<plate>` element with model instances
  - [x] Generate `<assemble>` element with transformations

#### 1.2 Update Base Tower Generator
- [x] Open `src/utils/orcaTowerGenerator.ts`
- [x] Add abstract method: `protected abstract getModifierSettings(section: TowerSection): Record<string, string | number>`
  ```typescript
  protected generateModifierSettings(): ModelPart[] {
    const parts: ModelPart[] = [];

    // Add main tower as normal part
    parts.push({
      id: 1,
      subtype: 'normal_part',
      name: this.params.type + '_tower',
      matrix: '1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 1',
    });

    // Add modifier parts for each section
    this.sections.forEach((section, index) => {
      parts.push({
        id: index + 2, // Start at 2 (1 is main part)
        subtype: 'modifier_part',
        name: `Section_${index + 1}`,
        matrix: '1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 1',
        settings: this.getModifierSettings(section),
      });
    });

    return parts;
  }
  ```

  - Each tower type will implement this to return appropriate settings

#### 1.3 Update 3MF Exporter
- [x] Open `src/utils/orca3mfExporter.ts`
- [x] Import the new model settings generator:
  ```typescript
  import { generateModelSettingsXML, ModelSettingsConfig } from './orcaModelSettings';
  ```

- [x] Add new method: `private addModelSettings(tower, towerName)`
  ```typescript
  private addModelSettings(tower: GeneratedTower, towerName: string) {
    const config = createTowerModelSettings(towerName, modifierSettings);
    const xml = generateModelSettingsXML(config);
    this.zip.file('Metadata/model_settings.config', xml);
  }
  ```

- [x] Update `exportTower()` method:
  - [x] After adding 3D model, check if using Orca modifiers
  - [x] If yes, call `addModelSettings()` with proper config
  - [x] Config includes main part + all modifier parts with settings from tower.orcaSettings

---

### Phase 2: Tower-Specific Implementations

#### 2.1 Flow Rate Tower
- [x] Open `src/utils/orcaFlowRateTower.ts`
- [x] Implement `getModifierSettings()`:
  ```typescript
  protected getModifierSettings(section: TowerSection): Record<string, string | number> {
    return {
      'flow_ratio': section.value,
      'bridge_flow_ratio': section.value,
      'top_surface_flow_ratio': section.value,
      'internal_solid_infill_flow_ratio': section.value,
    };
  }
  ```

- [ ] Test with OrcaSlicer:
  - [ ] Generate 3MF with "Use Orca native modifiers" enabled
  - [ ] Open in OrcaSlicer
  - [ ] Verify modifiers appear in object tree
  - [ ] Verify settings show correct flow ratios
  - [ ] Slice and verify G-code has flow changes

#### 2.2 Temperature Tower
- [x] Open `src/utils/orcaTemperatureTower.ts`
- [x] Implement `getModifierSettings()`:
  ```typescript
  protected getModifierSettings(section: TowerSection): Record<string, string | number> {
    return {
      'nozzle_temperature': section.value.toString(),
    };
  }
  ```

- [ ] Test with OrcaSlicer (same validation steps as Flow Rate)

#### 2.3 Fan Speed Tower
- [x] Open `src/utils/orcaFanSpeedTower.ts`
- [x] Implement `getModifierSettings()`:
  ```typescript
  protected getModifierSettings(section: TowerSection): Record<string, string | number> {
    return {
      'fan_max_speed': section.value.toString() + '%',
      'fan_min_speed': section.value.toString() + '%',
    };
  }
  ```

- [ ] Test with OrcaSlicer

#### 2.4 Retraction Tower
- [x] Open `src/utils/orcaRetractionTower.ts`
- [x] Implement `getModifierSettings()`:
  ```typescript
  protected getModifierSettings(section: TowerSection): Record<string, string | number> {
    return {
      'retraction_length': section.value,
      'retraction_speed': this.params.retractionSpeed || 30,
    };
  }
  ```

- [ ] Test with OrcaSlicer

#### 2.5 Max Volumetric Speed Tower
- [x] Open `src/utils/orcaMaxVolumetricTower.ts`
- [x] Implement `getModifierSettings()`:
  ```typescript
  protected getModifierSettings(section: TowerSection): Record<string, string | number> {
    // Convert volumetric speed to linear speed
    // This might need special handling
    return {
      'outer_wall_speed': this.volumetricToLinearSpeed(section.value),
      'inner_wall_speed': this.volumetricToLinearSpeed(section.value),
    };
  }
  ```

- [ ] Test with OrcaSlicer

#### 2.6 Pressure Advance Tower
- [x] Open `src/utils/orcaPressureAdvanceTower.ts`
- [x] Implement `getModifierSettings()`:
  ```typescript
  protected getModifierSettings(section: TowerSection): Record<string, string | number> {
    return {
      'pressure_advance': section.value,
    };
  }
  ```

- [ ] Test with OrcaSlicer

---

### Phase 3: XML Generation Details

#### 3.1 Complete model_settings.config Structure

```xml
<?xml version="1.0" encoding="UTF-8"?>
<config>
  <object id="1">
    <metadata key="name" value="Flow_Rate_Tower_PLA"/>

    <!-- Main tower part -->
    <part id="1" subtype="normal_part">
      <metadata key="name" value="Tower"/>
      <metadata key="matrix" value="1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 1"/>
      <mesh_stat edges_fixed="0" degenerate_facets="0"
                 facets_removed="0" facets_reversed="0" backwards_edges="0"/>
    </part>

    <!-- Modifier for section 1: 0.90 flow -->
    <part id="2" subtype="modifier_part">
      <metadata key="name" value="Section_1_Flow_0.90"/>
      <metadata key="matrix" value="1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 1"/>
      <metadata key="flow_ratio" value="0.9"/>
      <metadata key="bridge_flow_ratio" value="0.9"/>
      <metadata key="top_surface_flow_ratio" value="0.9"/>
      <metadata key="internal_solid_infill_flow_ratio" value="0.9"/>
      <mesh_stat edges_fixed="0" degenerate_facets="0"
                 facets_removed="0" facets_reversed="0" backwards_edges="0"/>
    </part>

    <!-- Modifier for section 2: 0.95 flow -->
    <part id="3" subtype="modifier_part">
      <metadata key="name" value="Section_2_Flow_0.95"/>
      <metadata key="matrix" value="1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 1"/>
      <metadata key="flow_ratio" value="0.95"/>
      <metadata key="bridge_flow_ratio" value="0.95"/>
      <metadata key="top_surface_flow_ratio" value="0.95"/>
      <metadata key="internal_solid_infill_flow_ratio" value="0.95"/>
      <mesh_stat edges_fixed="0" degenerate_facets="0"
                 facets_removed="0" facets_reversed="0" backwards_edges="0"/>
    </part>

    <!-- More modifiers... -->
  </object>

  <!-- Build plate configuration -->
  <plate>
    <metadata key="plater_id" value="1"/>
    <metadata key="plater_name" value=""/>
    <metadata key="locked" value="false"/>
    <model_instance>
      <metadata key="object_id" value="1"/>
      <metadata key="instance_id" value="0"/>
      <metadata key="identify_id" value="1"/>
    </model_instance>
  </plate>

  <!-- Assembly information -->
  <assemble>
    <assemble_item object_id="1" instance_id="0"
                   transform="1 0 0 0 1 0 0 0 1 90 90 0"
                   offset="0 0 0" />
  </assemble>
</config>
```

#### 3.2 Required XML Elements

- [ ] Implement XML escaping for values
- [ ] Handle special characters in metadata values
- [ ] Ensure proper indentation for readability
- [ ] Validate XML structure before adding to ZIP

---

### Phase 4: Integration & Testing

#### 4.1 Update exportTower() Logic Flow

Current flow:
```
1. Add 3D model (main tower + modifier geometries)
2. Add OrcaSlicer config JSON (our custom format)
3. Add post-processing G-code (if enabled)
```

New flow:
```
1. Add 3D model (main tower + modifier geometries)
2. IF includeModifierMesh === true:
   a. Generate ModelSettingsConfig from tower sections
   b. Add model_settings.config to Metadata/
   c. Skip post-processing G-code
3. ELSE:
   a. Add post-processing G-code (firmware-specific)
   b. Skip model_settings.config
```

- [ ] Update `exportTower()` in `orca3mfExporter.ts`:
  ```typescript
  async exportTower(tower: GeneratedTower, options: Partial<ThreeMFExportOptions>): Promise<OrcaSlicerProject> {
    // ... existing code ...

    await this.add3DModel(mainSTL, tower, mappedOrcaSettings, firmware);

    // NEW: Check if we should use Orca native modifiers
    if (tower.modifierMeshes && tower.modifierMeshes.length > 0 && options.includePostProcessing === false) {
      // Generate and add model_settings.config
      const modelSettings = this.generateModelSettingsFromTower(tower);
      this.addModelSettings(modelSettings);
    } else if (includePostProcessing && tower.orcaSettings) {
      // Use G-code post-processing instead
      this.addPostProcessing(tower, firmware, options.postProcessingOptions);
    }

    // ... rest of code ...
  }
  ```

- [ ] Implement `generateModelSettingsFromTower()`:
  ```typescript
  private generateModelSettingsFromTower(tower: GeneratedTower): ModelSettingsConfig {
    const parts: ModelPart[] = [];

    // Add main tower as normal part
    parts.push({
      id: 1,
      subtype: 'normal_part',
      name: 'Tower',
      matrix: '1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 1',
    });

    // Add modifiers from tower.orcaSettings.modifierSettings
    if (tower.orcaSettings?.modifierSettings) {
      tower.orcaSettings.modifierSettings.forEach((modSettings, index) => {
        parts.push({
          id: index + 2,
          subtype: 'modifier_part',
          name: `Section_${index + 1}`,
          matrix: '1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 1',
          settings: modSettings.settings,
        });
      });
    }

    return {
      objects: [{
        id: 1,
        name: tower.orcaSettings?.calibrationType || 'Calibration_Tower',
        parts,
      }],
    };
  }
  ```

#### 4.2 Testing Checklist

For each tower type:

- [ ] **Flow Rate Tower**
  - [ ] Generate with toggle OFF → verify G-code present, no model_settings.config
  - [ ] Generate with toggle ON → verify model_settings.config present, no G-code
  - [ ] Open in OrcaSlicer → verify modifiers visible
  - [ ] Check modifier settings → verify flow_ratio values correct
  - [ ] Slice → verify G-code shows flow changes at correct heights

- [ ] **Temperature Tower**
  - [ ] Same validation steps as Flow Rate
  - [ ] Verify nozzle_temperature values correct

- [ ] **Fan Speed Tower**
  - [ ] Same validation steps
  - [ ] Verify fan_max_speed and fan_min_speed values

- [ ] **Retraction Tower**
  - [ ] Same validation steps
  - [ ] Verify retraction_length and retraction_speed

- [ ] **Max Volumetric Speed Tower**
  - [ ] Same validation steps
  - [ ] Verify speed conversions correct

- [ ] **Pressure Advance Tower**
  - [ ] Same validation steps
  - [ ] Verify pressure_advance values

#### 4.3 Edge Cases to Test

- [ ] Empty sections array
- [ ] Single section (no modifiers needed)
- [ ] Very large number of sections (>20)
- [ ] Special characters in tower names
- [ ] Negative values in settings
- [ ] Very small/large numeric values

---

### Phase 5: Documentation & Cleanup

#### 5.1 Code Documentation
- [ ] Add JSDoc comments to new interfaces
- [ ] Add JSDoc comments to new methods
- [ ] Add inline comments explaining XML structure
- [ ] Update README with modifier mesh documentation

#### 5.2 User Documentation
- [ ] Update tower generation docs to explain modifier mesh option
- [ ] Add troubleshooting section for OrcaSlicer import issues
- [ ] Add screenshots of modifiers in OrcaSlicer UI
- [ ] Document which settings each tower type modifies

#### 5.3 Code Cleanup
- [ ] Remove debug console.log statements
- [ ] Remove commented-out code
- [ ] Ensure consistent formatting
- [ ] Run linter and fix warnings
- [ ] Run TypeScript check

---

## Success Criteria

✅ **Implementation Complete When:**

1. All 6 tower types support Orca native modifiers
2. Toggle "Use Orca native modifiers" works correctly:
   - ON: Generates model_settings.config, modifiers visible in OrcaSlicer
   - OFF: Generates custom_gcode_per_layer.xml, firmware-specific G-code
3. Generated 3MF files open in OrcaSlicer without errors
4. Modifier meshes appear in object tree with correct icons
5. Settings in modifiers match expected values
6. Sliced G-code shows parameter changes at correct Z heights
7. All tests pass
8. Documentation updated

---

## Timeline Estimate

- **Phase 1 (Core Infrastructure)**: 4-6 hours
- **Phase 2 (Tower Implementations)**: 3-4 hours
- **Phase 3 (XML Details)**: 2 hours
- **Phase 4 (Testing)**: 3-4 hours
- **Phase 5 (Documentation)**: 1-2 hours

**Total**: ~13-18 hours

---

## References

- OrcaSlicer source: `OrcaSlicer-main/src/libslic3r/Format/bbs_3mf.cpp`
- Example 3MF files: `OrcaSlicer-main/resources/calib/`
- 3MF specification: https://3mf.io/specification/
- OrcaSlicer settings: Search codebase for `PrintConfig.cpp`

---

## Notes

- Keep both methods (G-code + modifiers) working
- G-code method is universal (works in any slicer)
- Modifier method is OrcaSlicer-specific but cleaner UX
- Consider adding a "Recommended" badge to modifier option when firmware is OrcaSlicer
