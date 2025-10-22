# AutoTowersGenerator Z-Height Calculation Analysis

## Executive Summary

This document provides a comprehensive analysis of how the [AutoTowersGenerator](https://github.com/kartchnb/AutoTowersGenerator) Cura plugin calculates Z-heights for parameter changes in 3D printer calibration towers. The plugin uses a **height-based approach** rather than layer counting, ensuring accurate parameter changes regardless of layer height variations.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Z-Height Calculation Algorithm](#z-height-calculation-algorithm)
3. [Tower Geometry Specifications](#tower-geometry-specifications)
4. [Post-Processing Implementation](#post-processing-implementation)
5. [Parameter Change Methods](#parameter-change-methods)
6. [Key Formulas and Constants](#key-formulas-and-constants)
7. [Implementation Recommendations](#implementation-recommendations)

---

## Architecture Overview

### Project Structure

```
AutoTowersGenerator/
├── Controllers/               # Tower-specific controllers
│   ├── ControllerBase.py      # Base controller with settings management
│   ├── TempTowerController.py # Temperature tower logic
│   ├── FlowTowerController.py # Flow rate tower logic
│   ├── RetractTowerController.py # Retraction tower logic
│   ├── SpeedTowerController.py # Speed tower logic
│   └── FanTowerController.py  # Fan speed tower logic
├── Models/                    # Data models for each tower type
│   ├── ModelBase.py           # Base model with geometry calculations
│   ├── TempTowerModel.py      # Temperature presets and parameters
│   ├── FlowTowerModel.py      # Flow rate presets
│   ├── RetractTowerModel.py   # Retraction presets
│   └── SpeedTowerModel.py     # Speed presets
├── Postprocessing/            # G-code modification logic
│   ├── PostProcessingCommon.py # Core Z-height tracking algorithm
│   ├── TempTower_PostProcessing.py # Temperature G-code injection
│   ├── FlowTower_PostProcessing.py # Flow rate G-code modification
│   ├── RetractDistanceTower_PostProcessing.py # Retraction injection
│   └── PrintSpeedTower_PostProcessing.py # Speed modification
├── Resources/
│   ├── OpenScad/              # OpenSCAD tower geometry definitions
│   │   ├── temptower.scad
│   │   ├── flowtower.scad
│   │   └── retracttower.scad
│   └── STL/                   # Pre-generated tower STL files
└── AutoTowersGenerator.py     # Main plugin entry point
```

### Data Flow

1. **User Configuration** → Model classes store parameters (start value, change, end value)
2. **Geometry Calculation** → ModelBase calculates optimal heights based on layer height
3. **STL Generation** → OpenSCAD files or pre-generated STLs provide tower geometry
4. **Slicing** → Cura generates G-code from the tower model
5. **Post-Processing** → PostProcessing modules inject parameter changes at calculated Z-heights

---

## Z-Height Calculation Algorithm

### Core Algorithm: `LayerEnumerate()`

Located in `Postprocessing/PostProcessingCommon.py`, this function implements the height-based tracking system.

#### Function Signature

```python
def LayerEnumerate(gcode, base_height: float, section_height: float,
                   initial_layer_height: float, layer_height: float,
                   enable_advanced_gcode_comments: bool)
```

#### Parameters

- **`base_height`**: Height of the base section before calibration sections begin (typically 0.8-0.84mm)
- **`section_height`**: Height of each calibration section (typically 8.0-8.4mm)
- **`initial_layer_height`**: First layer height setting (e.g., 0.20mm)
- **`layer_height`**: Standard layer height for subsequent layers (e.g., 0.20mm)
- **`enable_advanced_gcode_comments`**: Whether to add debugging comments

#### Algorithm Implementation

```python
# Initialize height tracking (using Decimal for precision)
current_print_height = Decimal('0')
next_section_start_height = Decimal(str(base_height))
tower_section_number = 0
start_of_new_section = False

# Process each line of G-code
for line in gcode:
    # Detect layer markers: ;LAYER:(\d+)
    if is_layer_marker:
        # Increment height
        if current_print_height == 0:
            current_print_height += Decimal(str(initial_layer_height))
        else:
            current_print_height += Decimal(str(layer_height))

        # Check if we've reached a new section
        if current_print_height > next_section_start_height:
            start_of_new_section = True
            next_section_start_height += Decimal(str(section_height))
            tower_section_number += 1

            # Add debug comment
            if enable_advanced_gcode_comments:
                add_comment(f";Starting tower section number {tower_section_number}")

    # Yield current line with section information
    yield (line, tower_section_number, start_of_new_section)

    # Check for end of processable G-code (;TIME_ELAPSED: marker)
    if IsEndOfGcodeLine(line):
        break
```

#### Key Design Decisions

1. **Decimal Precision**: Uses Python's `Decimal` type to avoid floating-point errors
   - Critical for accurate height calculations across many layers
   - Prevents cumulative rounding errors

2. **Height-Based (Not Layer-Based)**: Tracks actual Z-height rather than layer numbers
   - Works correctly when section heights don't divide evenly by layer height
   - More accurate than counting layers
   - Handles variable layer heights correctly

3. **Section Boundary Detection**: Compares `current_print_height > next_section_start_height`
   - Simple comparison, not modulo arithmetic
   - Advances boundary by `section_height` when crossed
   - Increments section number sequentially

---

## Tower Geometry Specifications

### Base Model Geometry Calculations

Located in `Models/ModelBase.py`, this class calculates optimal tower dimensions.

#### Constants

```python
_nominalBaseHeight = 0.84      # Nominal base height (mm)
_nominalSectionHeight = 8.4    # Nominal section height (mm)
```

#### Optimal Height Calculation

```python
def _calculateOptimalHeight(self, nominal_height) -> int:
    """
    Calculates an optimal height from a nominal height, based on the
    current printed layer height. For example, given a nominal height of
    1 mm and a current printed layer height of 0.12 mm, this function
    will return 1.08 mm (9 layers × 0.12mm). The optimal height will
    always be equal to or larger than the nominal height.
    """
    optimal_height = self.layerHeight * math.ceil(nominal_height / self.layerHeight)
    return optimal_height
```

#### Example Calculations

| Layer Height | Nominal Base (0.84mm) | Optimal Base | Nominal Section (8.4mm) | Optimal Section |
|--------------|----------------------|--------------|------------------------|----------------|
| 0.10mm       | 0.84mm               | 0.90mm (9 layers) | 8.4mm | 8.40mm (84 layers) |
| 0.12mm       | 0.84mm               | 0.96mm (8 layers) | 8.4mm | 8.52mm (71 layers) |
| 0.20mm       | 0.84mm               | 1.00mm (5 layers) | 8.4mm | 8.60mm (43 layers) |
| 0.24mm       | 0.84mm               | 0.96mm (4 layers) | 8.4mm | 8.64mm (36 layers) |
| 0.30mm       | 0.84mm               | 0.90mm (3 layers) | 8.4mm | 8.70mm (29 layers) |

**Key Insight**: The optimal height is always `≥` nominal height and is perfectly divisible by the layer height, ensuring complete layers with no partial-layer artifacts.

#### Properties

```python
@property
def optimalBaseHeight(self) -> int:
    return self._calculateOptimalHeight(self._nominalBaseHeight)

@property
def optimalSectionHeight(self) -> int:
    return self._calculateOptimalHeight(self._nominalSectionHeight)

@property
def layerHeight(self) -> float:
    return Application.getInstance().getGlobalContainerStack()\
        .getProperty("layer_height", "value")

@property
def initialLayerHeight(self) -> float:
    return Application.getInstance().getGlobalContainerStack()\
        .getProperty("layer_height_0", "value")
```

---

## Tower Geometry Specifications by Type

### Temperature Tower (`temptower.scad`)

#### Dimensions

```python
Section_Height = 8.001       # Height of each calibration section
Base_Height = 0.801          # Foundation/base height
Cube_Size = 8.001           # Width/length of each column
Tower_Width_Multiplier = 5.001  # Multiplier for overall width
Wall_Thickness = 0.601       # Wall thickness
Cap_Height = 0.601          # Inset cap at column tops
```

#### Calculated Dimensions

```python
Tower_Width = Cube_Size × Tower_Width_Multiplier = ~40 units
Tower_Length = Cube_Size = ~8 units
Base_Extension = Wall_Thickness × 4 = ~2.4 units
Base_Width = Tower_Width + (2 × Base_Extension) = ~44.8 units
Base_Length = Tower_Length + (2 × Base_Extension) = ~13.2 units
```

#### Total Height Calculation

```python
Section_Count = ceil(abs(Ending_Value - Starting_Value) / abs(Value_Change) + 1)

# Example: 220°C to 180°C in -5°C steps
Section_Count = ceil(abs(180 - 220) / abs(-5) + 1) = 9 sections

Total_Height = Base_Height + (Section_Count × Section_Height)
            = 0.801 + (9 × 8.001) = 72.810 mm
```

#### Structure

- **Base**: Solid foundation (0.801mm)
- **Sections**: 9 identical sections, each 8.001mm tall
- **Features**: Bridge tests, overhang tests, text labels

### Flow Tower (`flowtower.scad`)

#### Dimensions

```python
Base_Height = 0.841          # Base height
Section_Height = 8.401       # Section height
Section_Size = 8.401        # Square section dimensions
Hole_Diameter = 4.201       # Circular holes through sections
Wall_Thickness = 0.601       # Wall thickness
```

#### Unique Feature: Spiral Design

```python
# Each section rotates 90° relative to previous
z_rotation = -90 * section_number

# Creates twisted appearance through tower
Section_0: 0°
Section_1: -90°
Section_2: -180°
Section_3: -270°
Section_4: 0° (full rotation)
```

#### Structure

- **Base**: Extended foundation (0.841mm)
- **Sections**: 7 sections (115% to 85% in -5% steps)
- **Features**: Spiral rotation, circular holes, connector slopes
- **Labels**: Value labels on each section face

### Retraction Tower (`retracttower.scad`)

#### Dimensions

```python
Base_Height = 0.801          # Base height
Section_Height = 8.001       # Section height
Cube_Size = 8.001           # Column size
Tower_Width_Multiplier = 5.001
Wall_Thickness = 0.601       # Wall thickness
Bridge_Length = Cube_Size × 0.5  # 50% of column size
```

#### Unique Feature: Dual Pillar Design

```python
# Two columns per section for stringing tests
Left_Column: Square cross-section, hollow interior
Right_Column: Cylindrical design, hollow center

# Hollow cavity calculation
Interior_Size = Cube_Size - (Wall_Thickness × 3)

# Bridge connects columns at each section
Bridge_Thickness = Wall_Thickness
```

#### Structure

- **Base**: Solid foundation (0.801mm)
- **Sections**: Variable count based on retraction range
- **Features**: Two pillars per section, bridges for stringing tests
- **Purpose**: Non-retraction moves between pillars reveal stringing

### Speed Tower

Similar geometry to temperature tower, with variations for speed testing.

### Fan Speed Tower

Similar geometry to temperature tower, optimized for cooling tests.

---

## Post-Processing Implementation

### Temperature Tower

Located in `Postprocessing/TempTower_PostProcessing.py`

#### Parameter Calculation

```python
# Initialize temperature (start one step below)
current_temp = start_temp - temp_change

# Iterate through G-code layers
for line, section_num, is_new_section in LayerEnumerate(gcode, ...):
    if is_new_section:
        # Increment temperature
        current_temp += temp_change

        # Inject temperature commands
        inject_at_line_start([
            f"M104 S{current_temp}",  # Set temperature
            f"M109 S{current_temp}",  # Wait for temperature
            f"M117 TMP {current_temp} C"  # LCD message (optional)
        ])
```

#### Example Sequence (220°C to 180°C, -5°C steps)

| Section | Z-Height Range | Temperature | G-code Injected |
|---------|---------------|-------------|-----------------|
| Base    | 0 - 0.8mm     | (no change) | - |
| 1       | 0.8 - 8.8mm   | 220°C       | `M104 S220`, `M109 S220` |
| 2       | 8.8 - 16.8mm  | 215°C       | `M104 S215`, `M109 S215` |
| 3       | 16.8 - 24.8mm | 210°C       | `M104 S210`, `M109 S210` |
| 4       | 24.8 - 32.8mm | 205°C       | `M104 S205`, `M109 S205` |
| 5       | 32.8 - 40.8mm | 200°C       | `M104 S200`, `M109 S200` |
| 6       | 40.8 - 48.8mm | 195°C       | `M104 S195`, `M109 S195` |
| 7       | 48.8 - 56.8mm | 190°C       | `M104 S190`, `M109 S190` |
| 8       | 56.8 - 64.8mm | 185°C       | `M104 S185`, `M109 S185` |
| 9       | 64.8 - 72.8mm | 180°C       | `M104 S180`, `M109 S180` |

### Flow Tower

Located in `Postprocessing/FlowTower_PostProcessing.py`

#### Flow Rate Calculation

```python
# Initialize flow rate
current_flow_rate = start_flow_rate - flow_rate_change

# Process G-code
for line, section_num, is_new_section in LayerEnumerate(gcode, ...):
    if is_new_section:
        current_flow_rate += flow_rate_change

    # Modify extrusion commands
    if is_extrusion_line(line):
        # Extract original E value
        original_e = extract_e_value(line)

        # Normalize to reference flow rate
        nominal_e = original_e / (reference_flow_rate / 100)

        # Apply current flow rate
        updated_e = nominal_e * (current_flow_rate / 100)

        # Replace E value in G-code
        line = replace_e_value(line, updated_e)
```

#### Formula

```
Adjusted_E = (Original_E / Reference_Flow%) × Current_Flow%

# Example: Original E=10mm, Reference=100%, Current=95%
Adjusted_E = (10 / 1.00) × 0.95 = 9.5mm
```

### Retraction Tower

Located in `Postprocessing/RetractDistanceTower_PostProcessing.py`

#### Retraction Distance Calculation

```python
# Initialize retraction distance
current_retract = start_retract - retract_change

# Process G-code
for line, section_num, is_new_section in LayerEnumerate(gcode, ...):
    if is_new_section:
        current_retract += retract_change
        inject_comment(f"Retraction: {current_retract:.5f}mm")

    # Modify retraction commands
    if is_retraction_line(line):
        # Negative E value = retraction
        line = replace_e_value(line, f"-{current_retract:.5f}")

    if is_unretraction_line(line):
        # Positive E value = unretraction
        line = replace_e_value(line, f"{current_retract:.5f}")
```

#### Handling Absolute vs Relative Extrusion

```python
# Relative Extrusion (M83)
retract_command = f"G1 E-{current_retract:.5f} F{retract_speed}"
unretract_command = f"G1 E{current_retract:.5f} F{retract_speed}"

# Absolute Extrusion (M82)
retract_position = last_e_position - current_retract
unretract_position = last_e_position + current_retract
retract_command = f"G1 E{retract_position:.5f} F{retract_speed}"
unretract_command = f"G1 E{unretract_position:.5f} F{retract_speed}"
```

### Speed Tower

Located in `Postprocessing/PrintSpeedTower_PostProcessing.py`

#### Speed Calculation

```python
# Initialize speed
current_speed = start_speed - speed_change

# Process G-code
for line, section_num, is_new_section in LayerEnumerate(gcode, ...):
    if is_new_section:
        current_speed += speed_change

        # Calculate feedrate percentage
        feedrate_percentage = (current_speed / reference_speed) * 100

        # Inject M220 command (feedrate override)
        if section_num == 1:
            inject_command("M220 B")  # Backup original feedrate
        inject_command(f"M220 S{feedrate_percentage:.2f}")  # Set new feedrate
        inject_command(f"M117 SPD {current_speed} mm/s")  # LCD message

    if is_end_of_tower:
        inject_command("M220 R")  # Restore original feedrate
```

#### Formula

```
Feedrate% = (Current_Speed / Reference_Speed) × 100

# Example: Current=100mm/s, Reference=50mm/s
Feedrate% = (100 / 50) × 100 = 200%
```

---

## Parameter Change Methods

### Summary Table

| Parameter | Method | G-code Command | Modification Type |
|-----------|--------|----------------|-------------------|
| **Temperature** | Firmware command | `M104 S{temp}`, `M109 S{temp}` | Command injection |
| **Flow Rate** | Extrusion modification | (modify E values) | Line-by-line rewrite |
| **Retraction Distance** | Extrusion modification | (modify E values) | Line-by-line rewrite |
| **Retraction Speed** | Feedrate modification | `M207 S{distance} F{speed}` | Command injection |
| **Print Speed** | Feedrate override | `M220 S{percentage}` | Command injection |
| **Fan Speed** | Fan command | `M106 S{pwm_value}` | Command injection |

### Injection Strategy

1. **Command Injection**: Insert new G-code commands at section boundaries
   - Temperature: `M104`/`M109`
   - Speed: `M220`
   - Fan: `M106`
   - Retraction (firmware): `M207`

2. **Line-by-Line Modification**: Rewrite existing G-code lines
   - Flow rate: Modify E values in `G1` commands
   - Retraction: Modify E values in retraction moves

3. **Hybrid Approach**: Both injection and modification
   - Add section markers as comments
   - Modify relevant commands
   - Add LCD messages (`M117`)

---

## Key Formulas and Constants

### Height Calculations

```python
# Optimal Height Formula
Optimal_Height = Layer_Height × ceil(Nominal_Height / Layer_Height)

# Current Print Height
if first_layer:
    Current_Height = Initial_Layer_Height
else:
    Current_Height += Layer_Height

# Section Boundary Check
if Current_Height > Next_Section_Start:
    New_Section = True
    Next_Section_Start += Section_Height
    Section_Number += 1
```

### Parameter Calculations

```python
# Linear Progression (most towers)
Current_Value = Start_Value + (Section_Number × Value_Change)

# Alternative: Decrementing from start
Current_Value = Start_Value - Value_Change  # Initialize
Current_Value += Value_Change  # Each section

# Section Count
Section_Count = ceil(abs(End_Value - Start_Value) / abs(Value_Change)) + 1

# Total Tower Height
Total_Height = Base_Height + (Section_Count × Section_Height)
```

### Flow Rate Adjustment

```python
# Normalize to reference flow
Nominal_E = Original_E / (Reference_Flow% / 100)

# Apply current flow
Adjusted_E = Nominal_E × (Current_Flow% / 100)

# Combined formula
Adjusted_E = Original_E × (Current_Flow% / Reference_Flow%)
```

### Speed/Feedrate Adjustment

```python
# Feedrate percentage calculation
Feedrate% = (Target_Speed / Reference_Speed) × 100

# Example conversions
50mm/s → 100mm/s: 200% feedrate
100mm/s → 50mm/s: 50% feedrate
```

### Constants

```python
# Geometry Constants
NOMINAL_BASE_HEIGHT = 0.84      # mm
NOMINAL_SECTION_HEIGHT = 8.4    # mm
WALL_THICKNESS = 0.6            # mm

# OpenSCAD Constants (with anti-aliasing offsets)
BASE_HEIGHT = 0.801             # mm
SECTION_HEIGHT = 8.001          # mm
CUBE_SIZE = 8.001              # mm
WALL_THICKNESS = 0.601          # mm
```

---

## Implementation Recommendations

### For OrcaSlicer Integration

Based on the AutoTowersGenerator analysis, here are recommendations for implementing similar functionality in OrcaSlicer:

#### 1. Use Height-Based Tracking (Not Layer Numbers)

**Why**: More accurate and handles variable layer heights correctly.

```typescript
// Good: Height-based approach
function calculateSectionBoundaries(
    baseHeight: number,
    sectionHeight: number,
    layerHeight: number,
    sectionCount: number
): number[] {
    const boundaries: number[] = [];

    // Calculate optimal heights (round up to nearest layer)
    const optimalBase = Math.ceil(baseHeight / layerHeight) * layerHeight;
    const optimalSection = Math.ceil(sectionHeight / layerHeight) * layerHeight;

    // Generate section boundaries
    let currentHeight = optimalBase;
    for (let i = 0; i < sectionCount; i++) {
        boundaries.push(currentHeight);
        currentHeight += optimalSection;
    }

    return boundaries;
}
```

#### 2. Calculate Optimal Heights

**Why**: Ensures complete layers, no partial-layer artifacts.

```typescript
function calculateOptimalHeight(nominalHeight: number, layerHeight: number): number {
    return Math.ceil(nominalHeight / layerHeight) * layerHeight;
}

// Usage
const optimalBaseHeight = calculateOptimalHeight(0.84, 0.20);  // 1.00mm
const optimalSectionHeight = calculateOptimalHeight(8.4, 0.20); // 8.60mm
```

#### 3. Use Decimal/BigDecimal for Precision

**Why**: Avoids floating-point accumulation errors.

```typescript
import Decimal from 'decimal.js';

function trackPrintHeight(
    layers: Layer[],
    initialLayerHeight: number,
    layerHeight: number
): Decimal[] {
    const heights: Decimal[] = [];
    let currentHeight = new Decimal(0);

    layers.forEach((layer, index) => {
        if (index === 0) {
            currentHeight = currentHeight.plus(initialLayerHeight);
        } else {
            currentHeight = currentHeight.plus(layerHeight);
        }
        heights.push(currentHeight);
    });

    return heights;
}
```

#### 4. Section Boundary Detection Algorithm

```typescript
interface SectionInfo {
    sectionNumber: number;
    isNewSection: boolean;
    zHeight: Decimal;
}

function detectSections(
    gcode: string[],
    baseHeight: number,
    sectionHeight: number,
    initialLayerHeight: number,
    layerHeight: number
): SectionInfo[] {
    const sections: SectionInfo[] = [];

    let currentHeight = new Decimal(0);
    let nextSectionStart = new Decimal(baseHeight);
    let sectionNumber = 0;

    gcode.forEach(line => {
        // Detect layer markers: ;LAYER:N
        const layerMatch = line.match(/;LAYER:(\d+)/);
        if (layerMatch) {
            const layerNum = parseInt(layerMatch[1]);

            // Update height
            if (currentHeight.equals(0)) {
                currentHeight = currentHeight.plus(initialLayerHeight);
            } else {
                currentHeight = currentHeight.plus(layerHeight);
            }

            // Check section boundary
            const isNewSection = currentHeight.greaterThan(nextSectionStart);
            if (isNewSection) {
                sectionNumber++;
                nextSectionStart = nextSectionStart.plus(sectionHeight);
            }

            sections.push({
                sectionNumber,
                isNewSection,
                zHeight: currentHeight
            });
        }
    });

    return sections;
}
```

#### 5. Parameter Progression Formulas

```typescript
// Temperature tower
function calculateTemperature(
    sectionNumber: number,
    startTemp: number,
    tempChange: number
): number {
    return startTemp + (sectionNumber * tempChange);
}

// Flow tower
function calculateFlowRate(
    sectionNumber: number,
    startFlow: number,
    flowChange: number
): number {
    return startFlow + (sectionNumber * flowChange);
}

// Retraction tower
function calculateRetraction(
    sectionNumber: number,
    startRetract: number,
    retractChange: number
): number {
    return startRetract + (sectionNumber * retractChange);
}

// Speed tower
function calculateSpeed(
    sectionNumber: number,
    startSpeed: number,
    speedChange: number
): number {
    return startSpeed + (sectionNumber * speedChange);
}
```

#### 6. G-code Injection Points

```typescript
interface GcodeInjection {
    zHeight: number;
    sectionNumber: number;
    commands: string[];
}

function generateTemperatureInjections(
    sections: SectionInfo[],
    startTemp: number,
    tempChange: number,
    enableLCD: boolean
): GcodeInjection[] {
    return sections
        .filter(s => s.isNewSection)
        .map(s => {
            const temp = calculateTemperature(s.sectionNumber, startTemp, tempChange);
            const commands = [
                `M104 S${temp}`,  // Set temperature
                `M109 S${temp}`,  // Wait for temperature
            ];

            if (enableLCD) {
                commands.push(`M117 TMP ${temp} C`);
            }

            return {
                zHeight: s.zHeight.toNumber(),
                sectionNumber: s.sectionNumber,
                commands
            };
        });
}
```

#### 7. OrcaSlicer-Specific: Use Native Features

AutoTowersGenerator uses post-processing to inject G-code. **OrcaSlicer has native support** for modifier meshes and per-region settings, which is cleaner:

```typescript
// Generate 3MF with modifier meshes (OrcaSlicer approach)
function generateTemperatureTower3MF(
    baseHeight: number,
    sectionHeight: number,
    startTemp: number,
    tempChange: number,
    sectionCount: number
): Project3MF {
    const project = new Project3MF();

    // Add main tower model
    project.addModel('tower.stl', towerGeometry);

    // Add modifier meshes for each section
    for (let i = 0; i < sectionCount; i++) {
        const zStart = baseHeight + (i * sectionHeight);
        const zEnd = zStart + sectionHeight;
        const temp = startTemp + (i * tempChange);

        // Create modifier mesh for this section
        const modifier = createModifierBox(zStart, zEnd);
        project.addModifier(modifier, {
            'temperature': temp,
            'type': 'temperature_tower'
        });
    }

    return project;
}
```

#### 8. Total Tower Height Calculation

```typescript
function calculateTotalTowerHeight(
    baseHeight: number,
    sectionHeight: number,
    startValue: number,
    endValue: number,
    valueChange: number,
    layerHeight: number
): number {
    // Calculate section count
    const sectionCount = Math.ceil(
        Math.abs(endValue - startValue) / Math.abs(valueChange)
    ) + 1;

    // Calculate optimal heights
    const optimalBase = calculateOptimalHeight(baseHeight, layerHeight);
    const optimalSection = calculateOptimalHeight(sectionHeight, layerHeight);

    // Total height
    return optimalBase + (sectionCount * optimalSection);
}

// Example: Temperature tower 220°C to 180°C, -5°C steps, 0.20mm layers
const totalHeight = calculateTotalTowerHeight(
    0.84,   // base height
    8.4,    // section height
    220,    // start temp
    180,    // end temp
    -5,     // temp change
    0.20    // layer height
);
// Result: 1.0 + (9 × 8.6) = 78.4mm
```

#### 9. STL Template Filtering

AutoTowersGenerator uses pre-generated STL files. For dynamic height adjustment:

```typescript
function filterSTLByHeight(stl: ParsedSTL, maxHeight: number): ParsedSTL {
    return {
        ...stl,
        faces: stl.faces.filter(face => {
            // Keep face if any vertex is below max height
            return face.vertices.some(v => v.z <= maxHeight);
        })
    };
}

// Usage
const templateSTL = loadSTL('temptower_template.stl');
const filteredSTL = filterSTLByHeight(templateSTL, calculatedTotalHeight);
```

#### 10. Firmware-Specific G-code Commands

Different firmware requires different commands:

```typescript
interface FirmwareCommands {
    setTemperature: (temp: number) => string;
    waitTemperature: (temp: number) => string;
    setFanSpeed: (percent: number) => string;
    setPressureAdvance: (pa: number) => string;
    setFlowRate: (percent: number) => string;
    lcdMessage: (message: string) => string;
}

const MarlinCommands: FirmwareCommands = {
    setTemperature: (temp) => `M104 S${temp}`,
    waitTemperature: (temp) => `M109 S${temp}`,
    setFanSpeed: (percent) => `M106 S${Math.round(percent * 2.55)}`,  // 0-255 PWM
    setPressureAdvance: (pa) => `M900 K${pa.toFixed(4)}`,
    setFlowRate: (percent) => `M221 S${percent}`,
    lcdMessage: (msg) => `M117 ${msg}`
};

const KlipperCommands: FirmwareCommands = {
    setTemperature: (temp) => `SET_HEATER_TEMPERATURE HEATER=extruder TARGET=${temp}`,
    waitTemperature: (temp) => `TEMPERATURE_WAIT SENSOR=extruder MINIMUM=${temp}`,
    setFanSpeed: (percent) => `M106 S${Math.round(percent * 2.55)}`,
    setPressureAdvance: (pa) => `SET_PRESSURE_ADVANCE ADVANCE=${pa.toFixed(4)}`,
    setFlowRate: (percent) => `M221 S${percent}`,
    lcdMessage: (msg) => `M117 ${msg}`
};

const RepRapFirmwareCommands: FirmwareCommands = {
    setTemperature: (temp) => `G10 P0 S${temp}`,
    waitTemperature: (temp) => `M116`,
    setFanSpeed: (percent) => `M106 S${percent / 100}`,  // 0-1 range
    setPressureAdvance: (pa) => `M572 D0 S${pa.toFixed(4)}`,
    setFlowRate: (percent) => `M221 S${percent}`,
    lcdMessage: (msg) => `M117 ${msg}`
};
```

---

## Summary

### Key Takeaways

1. **Height-Based Tracking**: Use actual Z-heights, not layer numbers, for accurate section detection
2. **Optimal Height Calculation**: Round nominal heights up to nearest complete layer
3. **Decimal Precision**: Use `Decimal` type to avoid floating-point errors
4. **Section Boundary Detection**: Simple comparison: `currentHeight > nextSectionStart`
5. **Parameter Progression**: Linear formula: `value = start + (section × change)`
6. **Geometry Constants**: Base ≈ 0.8mm, Section ≈ 8.0mm (adjusted for layer height)
7. **Post-Processing Methods**:
   - Command injection for temperature, speed, fan
   - Line-by-line modification for flow, retraction
8. **OrcaSlicer Integration**: Use native modifier meshes instead of post-processing

### Recommended Implementation Order

1. ✅ Implement `calculateOptimalHeight()` function
2. ✅ Create section boundary detection algorithm with Decimal precision
3. ✅ Build parameter progression formulas for each tower type
4. ✅ Generate STL geometry (use templates or procedural generation)
5. ✅ Implement 3MF export with OrcaSlicer modifier meshes
6. ✅ Add firmware-specific G-code generation (fallback if modifiers not supported)
7. ✅ Create UI for tower configuration
8. ✅ Test with various layer heights (0.10mm, 0.12mm, 0.20mm, 0.24mm, 0.30mm)

---

## References

- **Repository**: https://github.com/kartchnb/AutoTowersGenerator
- **License**: AGPL-3.0
- **Language**: Python 52.2%, QML 30.3%, OpenSCAD 17.5%
- **Target Slicer**: Ultimaker Cura
- **Tower Types**: Temperature, Flow, Retraction (Distance/Speed), Speed, Fan, Bed Level

---

## Appendix: Code Examples from AutoTowersGenerator

### ModelBase.py - Optimal Height Calculation

```python
class ModelBase():
    """Base class for all tower models"""

    _nominalBaseHeight = 0.84
    _nominalSectionHeight = 8.4

    @property
    def optimalBaseHeight(self) -> int:
        return self._calculateOptimalHeight(self._nominalBaseHeight)

    @property
    def optimalSectionHeight(self) -> int:
        return self._calculateOptimalHeight(self._nominalSectionHeight)

    def _calculateOptimalHeight(self, nominal_height) -> int:
        """
        Calculates an optimal height from a nominal height, based on the
        current printed layer height. For example, given a nominal height of
        1 mm and a current printed layer height of 0.12 mm, this function
        will return 9 mm. The optimal height will always be equal to or
        larger than the nominal height.
        """
        optimal_height = self.layerHeight * math.ceil(nominal_height / self.layerHeight)
        return optimal_height

    @property
    def layerHeight(self) -> float:
        """Return the current layer height setting"""
        return Application.getInstance().getGlobalContainerStack()\
            .getProperty("layer_height", "value")

    @property
    def initialLayerHeight(self) -> float:
        """Return the current initial layer height setting"""
        return Application.getInstance().getGlobalContainerStack()\
            .getProperty("layer_height_0", "value")
```

### PostProcessingCommon.py - Layer Enumeration

```python
from decimal import Decimal

def LayerEnumerate(gcode, base_height: float, section_height: float,
                   initial_layer_height: float, layer_height: float,
                   enable_advanced_gcode_comments: bool):
    """
    Generator that yields each line of G-code with section information.
    Uses height-based tracking for accurate section detection.
    """

    # Convert to Decimal to prevent floating-point inaccuracies
    current_print_height = Decimal('0')
    next_section_start_height = Decimal(str(base_height))
    base_height = Decimal(str(base_height))
    section_height = Decimal(str(section_height))
    initial_layer_height = Decimal(str(initial_layer_height))
    layer_height = Decimal(str(layer_height))

    tower_section_number = 0
    start_of_new_section = False

    for line in gcode:
        # Detect layer marker: ;LAYER:N
        layer_match = re.search(r';LAYER:(\d+)', line)
        if layer_match:
            # Update current print height
            if current_print_height == 0:
                current_print_height += initial_layer_height
            else:
                current_print_height += layer_height

            # Check if we've crossed a section boundary
            if current_print_height > next_section_start_height:
                start_of_new_section = True
                next_section_start_height += section_height
                tower_section_number += 1

                if enable_advanced_gcode_comments:
                    line = f";AutoTowersGenerator:Starting tower section {tower_section_number}\n" + line

        # Yield current line with section info
        yield (line, tower_section_number, start_of_new_section)

        # Reset new section flag
        start_of_new_section = False

        # Check for end of processable G-code
        if IsEndOfGcodeLine(line):
            break
```

### TempTower_PostProcessing.py - Temperature Injection

```python
def execute(gcode, base_height, section_height, initial_layer_height,
            layer_height, start_temp, temp_change, enable_lcd_messages,
            enable_advanced_gcode_comments):
    """
    Post-process G-code to inject temperature changes at section boundaries.
    """

    # Initialize temperature (one step below start)
    current_temp = start_temp - temp_change

    result = []

    # Enumerate through layers with section detection
    for line, section_num, is_new_section in LayerEnumerate(
        gcode, base_height, section_height, initial_layer_height,
        layer_height, enable_advanced_gcode_comments
    ):
        if is_new_section:
            # Increment temperature
            current_temp += temp_change

            # Inject temperature commands
            result.append(f"M104 S{current_temp}\n")  # Set temperature
            result.append(f"M109 S{current_temp}\n")  # Wait for temperature

            if enable_lcd_messages:
                result.append(f"M117 TMP {current_temp} C\n")  # LCD message

        result.append(line)

    return ''.join(result)
```

### FlowTower_PostProcessing.py - Flow Rate Modification

```python
def execute(gcode, base_height, section_height, initial_layer_height,
            layer_height, start_flow_rate, flow_rate_change, reference_flow_rate,
            enable_lcd_messages, enable_advanced_gcode_comments):
    """
    Post-process G-code to modify extrusion amounts for flow rate changes.
    """

    current_flow_rate = start_flow_rate - flow_rate_change

    result = []

    for line, section_num, is_new_section in LayerEnumerate(
        gcode, base_height, section_height, initial_layer_height,
        layer_height, enable_advanced_gcode_comments
    ):
        if is_new_section:
            current_flow_rate += flow_rate_change

            if enable_lcd_messages:
                result.append(f"M117 FLOW {current_flow_rate}%\n")

        # Modify extrusion lines
        if IsExtrusionLine(line):
            # Extract E value
            e_match = re.search(r'E([-\d.]+)', line)
            if e_match:
                original_e = float(e_match.group(1))

                # Normalize to reference flow rate
                nominal_e = original_e / (reference_flow_rate / 100)

                # Apply current flow rate
                adjusted_e = nominal_e * (current_flow_rate / 100)

                # Replace E value
                line = re.sub(r'E[-\d.]+', f'E{adjusted_e:.5f}', line)

        result.append(line)

    return ''.join(result)
```

---

**Document Version**: 1.0
**Date**: 2025-01-30
**Author**: Analysis of AutoTowersGenerator by kartchnb
