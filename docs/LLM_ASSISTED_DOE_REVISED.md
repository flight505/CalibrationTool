# LLM-Assisted DOE Implementation Plan (Revised)

## Executive Summary

This document specifies how to integrate LLM capabilities into the CalibrationTool DOE workflow to optimize FDM printer settings for specific filament brands. The LLM assists with parameter range selection, test reduction, and results analysis—NOT with generating or modifying test part geometry. All test parts use pre-validated ASCII STL files from the curated library.

**Core objectives:**
1. Minimize number of test prints required (reduce from 27+ to 9-15 prints)
2. Use web search to retrieve ground truth specifications for specific filament brands and printer models
3. Select optimal parameter ranges and orthogonal arrays based on material/printer context
4. Analyze scored test results and interpolate optimal settings
5. Generate final OrcaSlicer configuration table

**Model recommendation:** Use GPT-5 (`gpt-5`, fallback `gpt-5-mini`) through the OpenAI Responses API. The CalibrationTool DOE workbench now streams web-search progress and structured JSON outputs directly into the UI.


## Current Implementation Snapshot (2025-10)

- Phase 1 GPT-5 integration (context capture, web-search streaming, factor application) is live in `DOEWorkbench`.
- Phase 2 GPT-5 analysis streams optimal settings, SNR commentary, and confirmation-run guidance.
- Core helper logic resides in `src/lib/utils/openai.ts`, `src/utils/doe/llmSchemas.ts`, and `src/utils/doe/llmPrompts.ts`.
- Remaining work: persist GPT outputs, export structured reports, migrate ESLint config, and add an end-to-end test script.

---

## System Architecture Overview

```
User Input (Dropdowns)
  → Filament brand, material type, printer model, nozzle size, target layer height
  ↓
LLM Phase 1: Context Gathering & Parameter Range Selection
  → Web search: Filament manufacturer specs, printer capabilities, community data
  → Output: Recommended parameter ranges (temperature, speed, fan, flow, retraction)
  → Output: Selected orthogonal array (L9, L18, or L27)
  ↓
Test Part Selection & G-code Generation
  → Select relevant test parts from library (bridge_array_v2, overhang_ramp_v2, etc.)
  → Generate 3MF files with G-code modifiers for each experimental run
  → User downloads combined experiment package
  ↓
User Prints & Scores Tests
  → User prints all test parts
  → User evaluates using provided scoring rubrics (1-5 scales, measurements)
  → User inputs scores into web application
  ↓
LLM Phase 2: Results Analysis & Optimization
  → Analyze scored results using Taguchi analysis (SNR, main effects)
  → Identify significant factors and optimal levels
  → Interpolate between tested levels if needed
  → Generate confidence intervals and robustness metrics
  → Output: Final OrcaSlicer settings table
```

---

## Phase 1: Context Gathering & Parameter Range Selection

### User Inputs (Form with Dropdowns)

**Required fields:**
- `filament_brand`: String (e.g., "Prusament", "eSun", "Polymaker", "Hatchbox")
- `material_type`: Enum ["PLA", "PETG", "ABS", "ASA", "TPU", "Nylon", "PC"]
- `printer_model`: String (e.g., "Prusa MK4", "Bambu P1S", "Voron 2.4")
- `printer_type`: Enum ["bedslinger", "CoreXY", "Delta"]
- `nozzle_diameter`: Float [0.2, 0.4, 0.6, 0.8, 1.0] mm
- `target_layer_height`: Float (e.g., 0.1, 0.12, 0.16, 0.2, 0.24, 0.28 mm)

**Optional fields:**
- `enclosure`: Boolean (affects temperature management for ABS/ASA)
- `known_issues`: Text area (e.g., "printer has X-axis ringing at high speeds")
- `print_objectives`: Multi-select ["strength", "speed", "surface_quality", "dimensional_accuracy"]

### LLM Task 1.1: Retrieve Ground Truth Specifications *(implemented)*

**UI:** The `DOEWorkbench` now includes an "LLM-Assisted Parameter Planning" card that captures filament/printer context, enclosure, known issues, and objectives. GPT-5 web-search progress is streamed as badges (`in_progress → searching → completed`).

**Implementation:** `callPhase1LLM` (see `src/lib/utils/openai.ts`) enforces a strict JSON schema and streams partial text into the UI until the final payload arrives. Users can apply the recommended factors directly to the experiment.


**API call structure:**
```typescript
interface SpecificationQuery {
  task: "retrieve_specifications";
  filament_brand: string;
  material_type: string;
  printer_model: string;
  printer_type: string;
}
```

**LLM prompt template:**
```
You are an expert in FDM 3D printing calibration. Retrieve SPECIFIC technical specifications 
for the following configuration using web search:

Filament: {filament_brand} {material_type}
Printer: {printer_model} ({printer_type} architecture)
Nozzle: {nozzle_diameter}mm
Target layer height: {target_layer_height}mm

Use web search to find:

1. Filament specifications (from manufacturer datasheet or technical page):
   - Recommended print temperature range (°C)
   - Recommended bed temperature range (°C)
   - Glass transition temperature (Tg)
   - Melt flow index (MFI) if available
   - Recommended print speed range (mm/s)
   - Retraction recommendations

2. Printer specifications (from manufacturer or community sources):
   - Maximum recommended acceleration (mm/s²)
   - Maximum recommended speed (mm/s)
   - Typical print temperatures used by community for this material
   - Any known issues with this printer model

3. Community empirical data:
   - Successful parameter ranges from forums, Reddit, Discord
   - Common problems with this filament brand on this printer type

CRITICAL: Use web search to find ACTUAL specifications, not general knowledge.
Cite sources for each specification retrieved.
```

**Expected LLM output structure:**
```json
{
  "filament_specs": {
    "temperature_range": {"min": 190, "max": 220, "optimal": 205},
    "bed_temperature": {"min": 50, "max": 70, "optimal": 60},
    "glass_transition_temp": 60,
    "print_speed_range": {"min": 40, "max": 80},
    "retraction_distance": {"min": 0.5, "max": 2.0},
    "sources": ["https://prusament.com/materials/pla/", "..."]
  },
  "printer_specs": {
    "max_acceleration": 3000,
    "max_speed": 200,
    "typical_temps_this_material": [200, 205, 210],
    "known_issues": ["slight ringing at 100mm/s+"],
    "sources": ["https://help.prusa3d.com/...", "..."]
  },
  "community_data": {
    "successful_ranges": {
      "temperature": [195, 210],
      "speed": [50, 70]
    },
    "sources": ["reddit.com/r/prusa3d/...", "..."]
  }
}
```

### LLM Task 1.2: Select Parameter Ranges for DOE *(implemented)*

**Workflow:** GPT-5 returns factor plans with levels, units, rationales, and optional citations. The UI renders each recommendation with an "Apply to experiment" button that swaps the manual factor list and orthogonal array.


**LLM prompt template:**
```
Based on the retrieved specifications, select 3-level parameter ranges for a Taguchi DOE:

Retrieved specs:
{json_from_task_1.1}

User objectives: {print_objectives}
Constraints: {known_issues}

Select ranges for these factors:
1. Temperature (°C): 3 levels spanning the safe operating range
2. Print speed (mm/s): 3 levels from conservative to aggressive
3. Fan speed (%): 3 levels appropriate for this material
4. Flow ratio: 3 levels (typically 0.95, 1.00, 1.05)
5. Optional: Retraction distance (mm) if stringing is a concern

Guidelines:
- Level 1 (low): Conservative, proven to work
- Level 2 (mid): Manufacturer recommended or community consensus
- Level 3 (high): Aggressive but within safe limits
- Ensure levels are evenly spaced
- Consider material properties (e.g., PLA needs cooling, ABS doesn't)
- Consider printer capabilities (don't exceed max acceleration)

Output as structured JSON with rationale for each selection.
```

**Expected output:**
```json
{
  "factors": [
    {
      "name": "temperature",
      "unit": "°C",
      "levels": [195, 205, 215],
      "rationale": "Prusament PLA recommended range is 195-220°C. Selected 195 as conservative baseline, 205 as manufacturer optimum, 215 as high end for better layer adhesion."
    },
    {
      "name": "speed",
      "unit": "mm/s",
      "levels": [50, 65, 80],
      "rationale": "Prusa MK4 capable of 200mm/s but community reports good quality at 50-80mm/s for PLA. Selected range balances speed vs quality."
    },
    {
      "name": "fan_speed",
      "unit": "%",
      "levels": [50, 75, 100],
      "rationale": "PLA requires active cooling. 50% minimum to avoid drooping, 100% maximum for bridges/overhangs."
    },
    {
      "name": "flow_ratio",
      "unit": "ratio",
      "levels": [0.96, 1.00, 1.04],
      "rationale": "Standard flow calibration range. 1.00 is baseline, ±4% captures most extrusion variations."
    }
  ],
  "excluded_factors": [
    {
      "name": "retraction_distance",
      "reason": "Will test separately using stringing tower if initial results show stringing issues"
    }
  ]
}
```

### LLM Task 1.3: Select Orthogonal Array

**Decision logic (can be rule-based or LLM-assisted):**

```python
def select_orthogonal_array(num_factors: int, levels_per_factor: int) -> str:
    """
    Select appropriate Taguchi orthogonal array.
    
    For 3-level factors:
    - L9: Up to 4 factors, 9 runs
    - L18: Up to 7 factors (or fewer with interactions), 18 runs  
    - L27: Up to 13 factors, 27 runs
    """
    if num_factors <= 4 and levels_per_factor == 3:
        return "L9"  # Most common - 4 factors, 9 runs
    elif num_factors <= 7 and levels_per_factor == 3:
        return "L18"  # When interactions matter or more factors
    elif num_factors > 7 and levels_per_factor == 3:
        return "L27"  # Rarely needed for basic calibration
    else:
        raise ValueError("Unsupported factor/level combination")
```

**If using LLM for array selection:**
```
Given {num_factors} factors each at 3 levels, recommend the appropriate Taguchi 
orthogonal array (L9, L18, or L27).

Factors: {list_of_factors}
User objectives: {print_objectives}

Consider:
- L9 (9 runs): Fastest, sufficient if factor interactions unlikely
- L18 (18 runs): Better resolution, can detect some interactions
- L27 (27 runs): Maximum information but time-consuming

Recommend array and explain trade-offs.
```

**Expected output:**
```json
{
  "recommended_array": "L9",
  "runs_required": 9,
  "rationale": "4 factors at 3 levels fits L9 array. For basic calibration, factor interactions (e.g., temp×speed) are typically weak compared to main effects. L9 provides good efficiency (9 runs vs 81 for full factorial). If results show significant interaction effects, can follow up with targeted experiments.",
  "alternative": {
    "array": "L18",
    "reason": "Choose if user suspects strong temp×fan interaction or wants higher confidence"
  }
}
```

### Phase 1 Output: Experiment Design Document

Combine outputs from Tasks 1.1-1.3 into a structured experiment design:

```json
{
  "experiment_id": "uuid-generated",
  "configuration": {
    "filament": "Prusament PLA",
    "printer": "Prusa MK4",
    "nozzle": 0.4,
    "layer_height": 0.2
  },
  "design": {
    "array_type": "L9",
    "total_runs": 9,
    "factors": [ /* from Task 1.2 */ ],
    "test_parts": [
      "bridge_array_v2",
      "overhang_ramp_v2", 
      "stringing_towers_v2",
      "dimensional_cube_v2"
    ]
  },
  "run_matrix": [
    {"run": 1, "temperature": 195, "speed": 50, "fan_speed": 50, "flow_ratio": 0.96},
    {"run": 2, "temperature": 195, "speed": 65, "fan_speed": 75, "flow_ratio": 1.00},
    /* ... 7 more runs per L9 array structure */
  ],
  "sources": [ /* citations from web search */ ]
}
```

---

## Phase 2: Test Part Selection & G-code Generation

### Test Part Selection Logic

**Rule-based selection** (no LLM needed here):

```python
PART_REQUIREMENTS = {
    "bridge_array_v2": {
        "tests": ["bridging"],
        "sensitive_to": ["fan_speed", "temperature", "speed"],
        "duration": "~20min"
    },
    "overhang_ramp_v2": {
        "tests": ["overhang_quality"],
        "sensitive_to": ["fan_speed", "temperature"],
        "duration": "~15min"
    },
    "stringing_towers_v2": {
        "tests": ["retraction"],
        "sensitive_to": ["temperature", "retraction_distance", "retraction_speed"],
        "duration": "~25min"
    },
    "dimensional_cube_v2": {
        "tests": ["dimensional_accuracy", "elephant_foot"],
        "sensitive_to": ["flow_ratio", "temperature", "first_layer_height"],
        "duration": "~15min"
    },
    "thin_wall_patch_v2": {
        "tests": ["extrusion_width", "flow_accuracy"],
        "sensitive_to": ["flow_ratio", "speed"],
        "duration": "~30min"
    }
}

def select_test_parts(factors: List[str]) -> List[str]:
    """Select test parts based on factors being tested."""
    selected = []
    
    # Always include dimensional cube for baseline quality check
    selected.append("dimensional_cube_v2")
    
    # Select based on factors
    if "fan_speed" in factors or "temperature" in factors:
        selected.append("bridge_array_v2")
        selected.append("overhang_ramp_v2")
    
    if "temperature" in factors and len(factors) >= 4:
        selected.append("stringing_towers_v2")
    
    if "flow_ratio" in factors:
        selected.append("thin_wall_patch_v2")
    
    return selected
```

### G-code Modifier Generation

**For OrcaSlicer, use Orca native modifiers** (preferred) or firmware G-code injection:

#### Orca Native Modifiers (Height-based)

For each experimental run, generate a 3MF project with modifiers:

```xml
<!-- Example: Temperature tower in Orca -->
<modifier type="height_range">
  <range min="0" max="10" />
  <settings>
    <temperature>195</temperature>
    <speed>50</speed>
    <fan_speed>50</fan_speed>
    <flow_ratio>0.96</flow_ratio>
  </settings>
</modifier>
```

#### Firmware G-code Injection (Portable to SD card)

If user wants portable G-code without Orca:

```gcode
; === Run 1: T=195, S=50, F=50%, Flow=0.96 ===
M104 S195      ; Set hotend temp
M109 S195      ; Wait for temp
M106 S127      ; Fan 50% (255 * 0.5)
M221 S96       ; Flow 96%
G1 F3000       ; Speed 50mm/s for perimeters (F = mm/s * 60)
```

**Implementation approach:**

```python
def generate_experiment_gcode(
    base_stl: str,
    run_params: dict,
    modifier_type: str = "orca_native"
) -> str:
    """
    Generate 3MF with modifiers or G-code with parameter changes.
    
    Args:
        base_stl: Path to test part STL (e.g., "bridge_array_v2.stl")
        run_params: {"temperature": 195, "speed": 50, ...}
        modifier_type: "orca_native" or "firmware_gcode"
    
    Returns:
        Path to generated 3MF or G-code file
    """
    if modifier_type == "orca_native":
        # Generate Orca 3MF project with modifiers
        return generate_orca_3mf(base_stl, run_params)
    else:
        # Slice with OrcaSlicer CLI, inject G-code
        return inject_firmware_gcode(base_stl, run_params)
```

**NO LLM involvement in this phase** - this is deterministic G-code generation based on the experiment matrix.

---

## Phase 3: User Testing & Scoring

### Scoring Rubric Implementation

Each test part has specific metrics and scoring guidance:

#### Bridge Array V2 Scoring
```json
{
  "metrics": [
    {
      "id": "successful_bridges",
      "type": "count",
      "description": "Count bridges that didn't collapse (out of 5)",
      "min": 0,
      "max": 5,
      "optimal": 5
    },
    {
      "id": "max_bridge_length",
      "type": "measurement",
      "description": "Longest successful bridge (mm)",
      "unit": "mm",
      "possible_values": [10, 15, 20, 25, 30]
    },
    {
      "id": "bridge_quality",
      "type": "visual_score",
      "description": "Visual quality: 1=collapsed, 3=sagging, 5=perfect",
      "min": 1,
      "max": 5,
      "optimal": 5,
      "visual_guide": {
        "1": "Collapsed or severe sagging",
        "2": "Heavy sagging, rough underside",
        "3": "Moderate sagging but printable",
        "4": "Slight sagging, acceptable quality", 
        "5": "Perfect bridge, smooth underside"
      }
    }
  ]
}
```

#### Dimensional Cube V2 Scoring
```json
{
  "metrics": [
    {
      "id": "x_dimension",
      "type": "caliper_measurement",
      "description": "Measure X dimension with calipers (mm)",
      "target": 20.0,
      "tolerance": 0.1,
      "unit": "mm"
    },
    {
      "id": "y_dimension",
      "type": "caliper_measurement", 
      "description": "Measure Y dimension with calipers (mm)",
      "target": 20.0,
      "tolerance": 0.1,
      "unit": "mm"
    },
    {
      "id": "z_dimension",
      "type": "caliper_measurement",
      "description": "Measure Z dimension with calipers (mm)",
      "target": 20.0,
      "tolerance": 0.2,
      "unit": "mm"
    },
    {
      "id": "elephant_foot",
      "type": "visual_score",
      "description": "Rate elephant foot severity: 1=severe, 5=none",
      "min": 1,
      "max": 5,
      "optimal": 5
    }
  ]
}
```

### Data Collection Interface

**User inputs for each experimental run:**

```typescript
interface RunResults {
  run_id: number;
  part_id: string; // e.g., "bridge_array_v2"
  scores: {
    [metric_id: string]: number; // e.g., {"successful_bridges": 4, "bridge_quality": 3}
  };
  measurements: {
    [metric_id: string]: number; // e.g., {"x_dimension": 20.05, "y_dimension": 19.98}
  };
  notes?: string; // Optional user observations
  photos?: string[]; // Optional uploaded images
}
```

**Web interface presents:**
1. Test part image/diagram
2. Scoring rubric with visual examples
3. Input fields for each metric
4. Ability to flag failed prints (exclude from analysis)

---

## Phase 4: Results Analysis & Optimization

### LLM Task 2.1: Taguchi Analysis

Once user completes all test runs and inputs scores, trigger LLM analysis.

**Input to LLM:**
```json
{
  "experiment_design": { /* from Phase 1 */ },
  "results": [
    {
      "run": 1,
      "parameters": {"temperature": 195, "speed": 50, "fan_speed": 50, "flow_ratio": 0.96},
      "scores": {
        "bridge_array_v2": {"successful_bridges": 3, "max_bridge_length": 15, "bridge_quality": 2},
        "dimensional_cube_v2": {"x_dimension": 20.08, "y_dimension": 20.05, "z_dimension": 20.15}
      }
    },
    /* ... 8 more runs */
  ]
}
```

**LLM prompt template:**
```
You are an expert in Design of Experiments and Taguchi methods. Analyze the following 
experimental results and determine optimal parameter settings.

Experiment Design:
{json_experiment_design}

Results:
{json_results}

Perform Taguchi analysis:

1. Calculate Signal-to-Noise Ratios (SNR) for each metric:
   - For "larger-is-better": SNR = -10 * log10(mean(1/y²))
   - For "smaller-is-better": SNR = -10 * log10(mean(y²))
   - For "nominal-is-best": SNR = 10 * log10(mean² / variance)

2. Calculate main effects for each factor:
   - Average SNR at each factor level
   - Determine which level is optimal for each factor

3. Identify significant factors:
   - Calculate range (max SNR - min SNR) for each factor
   - Factors with larger range have stronger effects

4. Predict optimal settings:
   - Select the level with highest SNR for each factor
   - Estimate expected performance at optimal settings

5. Provide confidence assessment:
   - Are effects consistent across metrics?
   - Are there any contradictory factor effects?
   - Do results suggest factor interactions?

Output as structured JSON with calculations, reasoning, and recommendations.
```

**Expected LLM output:**
```json
{
  "snr_calculations": {
    "bridge_quality": {
      "metric_type": "larger_is_better",
      "run_snr": [
        {"run": 1, "value": 2, "snr": 6.02},
        {"run": 2, "value": 4, "snr": 12.04},
        /* ... */
      ]
    }
  },
  "main_effects": {
    "temperature": {
      "level_1": {"runs": [1,4,7], "avg_snr": 8.5},
      "level_2": {"runs": [2,5,8], "avg_snr": 10.2},
      "level_3": {"runs": [3,6,9], "avg_snr": 9.1},
      "range": 1.7,
      "optimal_level": 2,
      "optimal_value": 205
    },
    "speed": {
      "level_1": {"runs": [1,2,3], "avg_snr": 9.8},
      "level_2": {"runs": [4,5,6], "avg_snr": 9.2},
      "level_3": {"runs": [7,8,9], "avg_snr": 8.8},
      "range": 1.0,
      "optimal_level": 1,
      "optimal_value": 50
    },
    "fan_speed": {
      "range": 2.5,
      "optimal_level": 2,
      "optimal_value": 75
    },
    "flow_ratio": {
      "range": 0.8,
      "optimal_level": 2,
      "optimal_value": 1.00
    }
  },
  "factor_ranking": [
    {"factor": "fan_speed", "range": 2.5, "significance": "high"},
    {"factor": "temperature", "range": 1.7, "significance": "medium"},
    {"factor": "speed", "range": 1.0, "significance": "low"},
    {"factor": "flow_ratio", "range": 0.8, "significance": "low"}
  ],
  "optimal_settings": {
    "temperature": 205,
    "speed": 50,
    "fan_speed": 75,
    "flow_ratio": 1.00
  },
  "predicted_performance": {
    "bridge_quality": {
      "predicted_snr": 11.5,
      "predicted_score": 4.2
    },
    "dimensional_accuracy": {
      "predicted_error": 0.03
    }
  },
  "confidence": {
    "level": "high",
    "notes": "Main effects are consistent across metrics. Fan speed shows strongest effect on bridging and overhangs as expected. No contradictory effects detected.",
    "recommendations": [
      "Optimal settings predicted with high confidence",
      "Consider confirmation run at optimal settings",
      "Speed has minimal effect - can increase if faster prints needed"
    ]
  }
}
```

### LLM Task 2.2: Interpolation & Fine-Tuning

If optimal level falls between tested levels, or if user wants to refine:

**LLM prompt:**
```
Based on the Taguchi analysis results, the optimal temperature appears to be between 
205°C (level 2) and 215°C (level 3). 

Results at tested levels:
- 195°C: Bridge quality = 2.5, dimensional accuracy = 0.08mm error
- 205°C: Bridge quality = 4.0, dimensional accuracy = 0.04mm error  
- 215°C: Bridge quality = 3.5, dimensional accuracy = 0.06mm error

The optimal appears to be near 205°C, but could potentially be improved with fine adjustment.

Tasks:
1. Analyze the response curve shape (linear, quadratic, optimal at tested point?)
2. Recommend if further testing needed or if 205°C is optimal
3. If refinement suggested, propose narrow 3-level follow-up (e.g., 200/205/210°C)

Consider physical constraints:
- Material properties: {material_tg}, {melt_flow_index}
- Printer capabilities: {max_temp}
```

**Output:**
```json
{
  "analysis": "Bridge quality shows quadratic response with maximum at 205°C. Dimensional accuracy improves monotonically as temperature decreases, but 205°C provides best balance.",
  "refinement_needed": false,
  "final_recommendation": 205,
  "confidence": "high",
  "reasoning": "Peak performance at tested level 2. No indication of better performance in untested regions. Recommend using 205°C as optimal."
}
```

### LLM Task 2.3: Generate Final Settings Table

**LLM prompt:**
```
Generate the final OrcaSlicer configuration settings based on optimal parameters:

Optimal parameters from analysis:
{optimal_parameters}

Original user configuration:
- Filament: {filament_brand} {material}
- Printer: {printer_model}
- Nozzle: {nozzle_diameter}mm
- Layer height: {layer_height}mm

Generate a complete settings table for OrcaSlicer including:
1. Core parameters (from DOE optimization)
2. Derived parameters (based on core parameters and physical relationships)
3. Recommended unchanged parameters (good defaults)

Format as markdown table suitable for user to reference while configuring slicer.
```

**Expected output:**

```markdown
## Optimized OrcaSlicer Settings for Prusament PLA on Prusa MK4

### Filament Settings (Material Tab)
| Parameter | Value | Notes |
|-----------|-------|-------|
| **Nozzle Temperature** | 205°C | First layer: 210°C |
| **Bed Temperature** | 60°C | First layer: 60°C |
| **Fan Speed** | 75% | Min: 40%, Max: 100% |
| **Flow Ratio** | 1.00 | (100%) |

### Print Settings (Process Tab)
| Parameter | Value | Notes |
|-----------|-------|-------|
| **Layer Height** | 0.2mm | As specified |
| **First Layer Height** | 0.2mm | Same as layer height |
| **Perimeter Speed** | 50mm/s | Outer wall |
| **Infill Speed** | 70mm/s | Can increase, minimal quality impact |
| **Bridge Speed** | 25mm/s | 50% of perimeter speed recommended |
| **Small Perimeter Speed** | 40mm/s | 80% of perimeter speed |

### Advanced Settings
| Parameter | Value | Notes |
|-----------|-------|-------|
| **Retraction Distance** | 0.8mm | Standard for direct drive |
| **Retraction Speed** | 35mm/s | Conservative, adjust if stringing |
| **Seam Position** | Rear | Or "Random" for organic shapes |
| **Elephant Foot Compensation** | 0.1mm | Adjust based on cube measurement |

### Derived Calculations
- **Line Width**: 0.45mm (nozzle × 1.125)
- **Extrusion Width**: First layer 0.48mm, others 0.45mm
- **Cooling Thresholds**: Enable for layers > 30s

### Quality Expectations
Based on test results, expect:
- Bridge spans up to 25mm reliably
- Overhangs up to 60° without supports
- Dimensional accuracy ±0.04mm
- Minimal stringing

### Next Steps
1. Input these settings into OrcaSlicer
2. Run a small test print to verify
3. If issues persist, consider targeted refinement:
   - Stringing → reduce temperature 5°C or increase retraction
   - Rough surfaces → reduce speed 10mm/s
   - Dimensional errors → adjust flow ±2%
```

---

## Implementation Details for GPT-5 Responses API

### Directory Structure

```
src/
  doe/
    llm/
      contextGathering.ts      # Phase 1 LLM calls
      analysisEngine.ts        # Phase 2 LLM calls
      promptTemplates.ts       # Structured prompts
      
    core/
      orthogonalArrays.ts      # L9, L18, L27 generators
      testPartSelection.ts     # Part selection logic
      gcodeGeneration.ts       # 3MF/G-code generation
      
    analysis/
      taguchiAnalysis.ts       # SNR calculations, main effects
      statisticalUtils.ts      # Helper functions
      
    types/
      experiments.ts           # TypeScript interfaces
      
  api/
    routes/
      doeRoutes.ts            # Express endpoints
      
public/
  templates/
    doe/
      library/                # Pre-validated STL files
        manifest.json
        bridging/
          bridge_array_v2.stl
          bridge_array_v2.meta.json
        overhang/
          overhang_ramp_v2.stl
        /* ... other test parts */
```

### API Endpoint Specifications

#### POST /api/doe/design
Create new experiment design (Phase 1)

**Request:**
```json
{
  "filament_brand": "Prusament",
  "material_type": "PLA",
  "printer_model": "Prusa MK4",
  "printer_type": "bedslinger",
  "nozzle_diameter": 0.4,
  "target_layer_height": 0.2,
  "print_objectives": ["strength", "surface_quality"],
  "enclosure": false
}
```

**Response:**
```json
{
  "experiment_id": "exp_abc123",
  "status": "design_complete",
  "design": {
    "array_type": "L9",
    "total_runs": 9,
    "factors": [ /* parameter ranges */ ],
    "run_matrix": [ /* 9 runs with parameter combinations */ ],
    "test_parts": ["bridge_array_v2", "dimensional_cube_v2"]
  },
  "estimated_time": "4 hours",
  "download_url": "/api/doe/download/exp_abc123"
}
```

#### GET /api/doe/download/:experiment_id
Download 3MF files for all runs

**Response:** ZIP file containing:
- `run_01.3mf` (bridge array + dimensional cube with Run 1 parameters)
- `run_02.3mf`
- ... `run_09.3mf`
- `scoring_guide.pdf` (visual rubrics)
- `data_entry_template.csv` (for offline scoring)

#### POST /api/doe/results/:experiment_id
Submit test results (Phase 3 → 4)

**Request:**
```json
{
  "results": [
    {
      "run": 1,
      "bridge_array_v2": {
        "successful_bridges": 3,
        "max_bridge_length": 15,
        "bridge_quality": 2
      },
      "dimensional_cube_v2": {
        "x_dimension": 20.08,
        "y_dimension": 20.05,
        "z_dimension": 20.15,
        "elephant_foot": 3
      }
    },
    /* ... runs 2-9 */
  ]
}
```

**Response:**
```json
{
  "status": "analysis_complete",
  "analysis": {
    "optimal_settings": { /* from LLM Task 2.1 */ },
    "factor_ranking": [ /* significance ranking */ ],
    "confidence": "high"
  },
  "settings_table_url": "/api/doe/settings/exp_abc123",
  "report_url": "/api/doe/report/exp_abc123"
}
```

#### GET /api/doe/settings/:experiment_id
Get final settings table (markdown format for display or export)

### LLM Integration Pattern

**Use GPT-5 via OpenAI Responses API (tool calling + json_schema):**

```typescript
import { callPhase1LLM } from '@/lib/utils/openai';
import type { Phase1RequestPayload } from '@/utils/doe/doeTypes';

async function proposeRanges(payload: Phase1RequestPayload) {
  const result = await callPhase1LLM({
    payload,
    stream: true,
    handlers: {
      onWebSearchStatus: (status) => console.log('web search status', status),
      onTextDelta: (delta) => process.stdout.write(delta),
      onCompleted: (data) => console.log('final JSON', data)
    }
  });

  return result.factorPlans;
}
```

**Validate all LLM outputs:**

```typescript
import Ajv from 'ajv';

const ajv = new Ajv();

function validateLLMOutput(data: any, schema: object): boolean {
  const validate = ajv.compile(schema);
  const valid = validate(data);
  
  if (!valid) {
    console.error('LLM output validation failed:', validate.errors);
    throw new Error('Invalid LLM response structure');
  }
  
  return true;
}
```

### Caching Strategy for Cost Optimization

**Cache static content** (test part library metadata, DOE theory):

```typescript
const STATIC_SYSTEM_PROMPT = `
You are an expert in Design of Experiments for FDM 3D printing calibration.

# Test Parts Library
[Include full test part descriptions from manifest - 5000+ tokens]

# DOE Theory
[Include Taguchi method theory, SNR calculations - 3000+ tokens]

# Material Properties Reference
[Include common material properties - 2000+ tokens]

[Total: ~10,000 tokens for 90% caching discount]
`;

// Optional: use cache_control for GPT-5 when leveraging prompt caching (coming soon).
const systemPrompt = [
  {
    type: "text",
    text: STATIC_SYSTEM_PROMPT,
    cache_control: {type: "ephemeral"}
  }
];
```

### Error Handling & Retry Logic

```typescript
async function llmWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation();
      return result;
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      console.warn(`LLM call failed (attempt ${attempt}/${maxRetries}):`, error);
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
    }
  }
  throw new Error('Unreachable');
}
```

---

## Test Reduction Strategies

### Strategy 1: Intelligent Factor Screening

**Before running full L9:**

Ask LLM to assess which factors likely matter most:

```
Given the following configuration:
- Material: {material} (Tg: {tg}, typical print range: {temp_range})
- Printer: {printer_type}
- User objectives: {objectives}

Rank these factors by expected impact on print quality:
1. Temperature
2. Print speed  
3. Fan speed
4. Flow ratio

For each factor, assess:
- Expected effect magnitude (high/medium/low)
- Confidence in effect (high/medium/low based on material science)
- Recommendation: test with full range, narrow range, or hold constant

If ≤2 factors show high expected impact, recommend simplified experiment (fewer runs).
```

**Outcome:** May reduce from L9 (4 factors, 9 runs) to L4 (2 factors, 4 runs) if other factors deemed low-impact.

### Strategy 2: Sequential Experimentation

**Phase A: Screening (L9 with 4 factors)**
- Identify significant factors (via Taguchi analysis)
- Typical outcome: 1-2 factors dominate effects

**Phase B: Refinement (L4 or targeted tests)**
- Focus only on significant factors
- Narrow ranges around optimal region
- 4-5 additional runs instead of full new L9

**Example:**
```
L9 results show:
- Temperature: High impact (range = 3.2 SNR)
- Fan speed: Medium impact (range = 1.8 SNR)  
- Speed: Low impact (range = 0.5 SNR)
- Flow: Low impact (range = 0.4 SNR)

Recommendation: Fix speed and flow at optimal levels from L9.
Run 4-point refinement on temperature × fan_speed:
- (200°C, 70%)
- (200°C, 80%)
- (210°C, 70%)  
- (210°C, 80%)

Total runs: 9 (screening) + 4 (refinement) = 13 runs
Versus: 27 runs for full 3^4 factorial without DOE
```

**LLM decides** whether refinement needed based on:
1. How close optimal settings are to tested levels
2. Whether performance curve shows plateau or peak
3. User's quality requirements vs additional effort

### Strategy 3: Composite Test Plates

**Combine multiple test parts in one print:**

Instead of:
- 9 runs × 4 test parts = 36 individual prints

Do:
- 9 composite plates, each containing:
  - Bridge array (small version)
  - Overhang ramp (small version)
  - Dimensional cube
  - Thin wall patch (single wall)
  
**Result:** 9 total prints, ~45 minutes each = 6.75 hours total
Versus: 36 individual prints × 20 minutes = 12 hours

**G-code approach:**
```python
def create_composite_plate(run_params: dict) -> str:
    """
    Generate 3MF with all test parts on one plate.
    Each part positioned in quadrant of 200×200mm bed.
    """
    parts = [
        {"stl": "bridge_array_v2_compact.stl", "position": (20, 20, 0)},
        {"stl": "overhang_ramp_v2.stl", "position": (120, 20, 0)},
        {"stl": "dimensional_cube_v2.stl", "position": (20, 120, 0)},
        {"stl": "thin_wall_single.stl", "position": (120, 120, 0)}
    ]
    
    # Apply same parameters to all parts
    return generate_multi_part_3mf(parts, run_params)
```

**Trade-off:** If one part fails (e.g., bridging collapses), entire print wasted. Recommend for experienced users or when parameters likely successful.

---

## STL Modification Constraints (If Needed)

**Original concern:** LLM cannot reliably generate/modify ASCII STL without errors.

**Approach if STL modification absolutely required:**

### Constrained Modification Strategy

**Only allow these operations:**
1. Uniform scaling (multiply all coordinates by factor)
2. Translation (add offset to X, Y, or Z coordinates)
3. Validation after every modification

**Example: Scale test part for different nozzle size**

```typescript
interface STLModificationRequest {
  operation: "scale" | "translate";
  factor?: number;    // For scale: 0.5 to 2.0
  offset?: {x: number; y: number; z: number};  // For translate
}

function modifySTL(
  originalSTL: string,
  modification: STLModificationRequest
): string {
  const parsed = parseASCIISTL(originalSTL);
  
  // Apply modification
  if (modification.operation === "scale") {
    for (const triangle of parsed.triangles) {
      for (const vertex of triangle.vertices) {
        vertex.x *= modification.factor!;
        vertex.y *= modification.factor!;
        vertex.z *= modification.factor!;
      }
    }
  }
  
  // Validate result
  const validated = validateSTL(parsed);
  if (!validated.valid) {
    throw new Error(`STL modification failed validation: ${validated.errors}`);
  }
  
  return generateASCIISTL(parsed);
}
```

**Validation checks:**
```typescript
function validateSTL(parsed: ParsedSTL): {valid: boolean; errors: string[]} {
  const errors: string[] = [];
  
  // Check 1: All normals non-zero magnitude
  for (const tri of parsed.triangles) {
    const mag = Math.sqrt(tri.normal.x**2 + tri.normal.y**2 + tri.normal.z**2);
    if (mag < 0.9 || mag > 1.1) {
      errors.push('Invalid normal vector');
    }
  }
  
  // Check 2: No coordinates below Z=0
  for (const tri of parsed.triangles) {
    for (const v of tri.vertices) {
      if (v.z < 0) errors.push('Vertex below build plate');
    }
  }
  
  // Check 3: Bounding box reasonable
  const bbox = calculateBoundingBox(parsed);
  if (bbox.x > 300 || bbox.y > 300 || bbox.z > 300) {
    errors.push('Part exceeds maximum dimensions');
  }
  
  // Check 4: Manifold (edge count)
  const edgeMap = buildEdgeMap(parsed);
  for (const [edge, count] of edgeMap) {
    if (count !== 2) errors.push('Non-manifold geometry detected');
  }
  
  return {valid: errors.length === 0, errors};
}
```

**Recommendation:** Avoid STL modification entirely. Pre-generate test parts at multiple scales (0.4mm nozzle, 0.6mm nozzle versions) and select appropriate version based on user's nozzle size.

---

## Monitoring & Quality Assurance

### Experiment Tracking Dashboard

**Monitor these metrics:**
- Experiments created per week
- Completion rate (how many users finish all runs)
- Average time to complete experiments
- Quality of LLM outputs (track validation failures)
- User satisfaction scores

### LLM Output Quality Checks

```typescript
interface QualityCheck {
  check: string;
  passed: boolean;
  details?: string;
}

function validateExperimentDesign(design: ExperimentDesign): QualityCheck[] {
  const checks: QualityCheck[] = [];
  
  // Check 1: Temperature ranges physically reasonable
  const tempRange = design.factors.find(f => f.name === 'temperature');
  checks.push({
    check: 'temperature_range',
    passed: tempRange.levels[0] >= 150 && tempRange.levels[2] <= 300,
    details: tempRange.levels.toString()
  });
  
  // Check 2: Fan speed 0-100%
  const fanRange = design.factors.find(f => f.name === 'fan_speed');
  checks.push({
    check: 'fan_speed_range',
    passed: fanRange.levels.every(l => l >= 0 && l <= 100)
  });
  
  // Check 3: Levels evenly spaced
  for (const factor of design.factors) {
    const spacing1 = factor.levels[1] - factor.levels[0];
    const spacing2 = factor.levels[2] - factor.levels[1];
    const evenlySpaced = Math.abs(spacing1 - spacing2) < 0.01 * spacing1;
    
    checks.push({
      check: `${factor.name}_spacing`,
      passed: evenlySpaced,
      details: `${spacing1} vs ${spacing2}`
    });
  }
  
  // Check 4: Run matrix matches array structure
  const expectedRuns = design.array_type === 'L9' ? 9 : 
                       design.array_type === 'L18' ? 18 : 27;
  checks.push({
    check: 'run_count',
    passed: design.run_matrix.length === expectedRuns
  });
  
  return checks;
}
```

### User Feedback Loop

After experiment completion, ask:
```
- Did the optimized settings improve print quality? (Yes/No)
- How many test prints did you run? (Expected: 9-15)
- How long did calibration take? (Expected: 4-8 hours)
- Would you use DOE calibration again? (Yes/No)
- Any issues with test parts, scoring, or analysis?
```

Use feedback to refine:
- LLM prompt templates
- Parameter range selection heuristics
- Test part selection logic
- Scoring rubric clarity

---

## Cost & Performance Estimates

### LLM Usage Per Experiment

**Phase 1: Context Gathering & Design**
- Input: ~9k tokens (system prompt + curated factor library + user context)
- Output: ~2k tokens (spec ranges, orthogonal array, citations)
- Cost (GPT-5 at $10 / $30 per MTok in/out): **≈$0.13**

**Phase 2: Results Analysis**  
- Input: ~11k tokens (system prompt + experiment matrix + measurements)
- Output: ~2.5k tokens (optimal levels, SNR commentary, confirmation guidance)
- Cost: **≈$0.14**

**Total per experiment: ≈$0.27**

With 100 users/month completing experiments: **≈$27/month** in GPT-5 usage.

### Time Estimates

**Traditional calibration (without DOE):**
- User runs: temp tower (30 min), fan tower (30 min), speed test (30 min), retraction tower (45 min)
- Trial and error adjustments: 2-4 hours
- **Total: 4-6 hours**, often with suboptimal results

**DOE-assisted calibration:**
- Phase 1 (design generation): 2 minutes
- User prints: 9 runs × 30 min = 4.5 hours (overnight)
- User scoring: 20 minutes
- Phase 2 (analysis): 3 minutes
- **Total: 5 hours**, with statistically optimized results

**Benefit:** Similar time investment but higher confidence in optimality, plus understanding of which factors matter most.

---

## Future Enhancements

### Enhancement 1: Adaptive Experiment Continuation

After initial L9, automatically suggest follow-up experiments:

```
LLM analyzes L9 results and detects:
- Temperature shows strong effect but optimal might be between level 1 and 2
- Suggest narrow 5-point temperature refinement (195, 200, 205, 210, 215°C)
- Fix other factors at optimal levels
- Cost: 5 additional prints for high-precision temperature tuning
```

### Enhancement 2: Historical Data Learning

Build database of experiment results:
```sql
CREATE TABLE experiment_results (
  filament_brand VARCHAR(100),
  material VARCHAR(50),
  printer_model VARCHAR(100),
  optimal_temperature DECIMAL(5,2),
  optimal_speed DECIMAL(5,2),
  optimal_fan DECIMAL(5,2),
  quality_score DECIMAL(3,2),
  created_at TIMESTAMP
);
```

Use for:
- Better initial parameter range suggestions (skip web search for common combos)
- Community-validated optimal settings
- Detect anomalies (user results far from typical)

### Enhancement 3: Computer Vision for Automated Scoring

Replace manual scoring with photo-based analysis:
```
User uploads photos of test prints
→ CV model detects bridge sagging, stringing, dimensional errors
→ Automatically generates scores
→ Reduces user effort from 20 minutes to 5 minutes
```

### Enhancement 4: Real-time Optimization During Prints

For advanced printers with API access (e.g., Klipper):
```
Stream printer data during test prints
→ Detect failures early (bridging collapsed at run 3)
→ Automatically adjust subsequent runs
→ "Run 4: Increase fan speed to 85% based on Run 3 bridging failure"
```

---

## Implementation Checklist (GPT-5 Responses API)
### Developer Tooling Follow-up
- Migrate from legacy `.eslintrc` to `eslint.config.ts` (or pin ESLint < 9) so `npm run lint` succeeds.
- Add a `scripts/check.sh` helper that runs build + lint + future tests for automated verification.
- Wire the new checker into CI once the lint config migration is complete.



### Phase 1: Foundation
- [ ] Set up TypeScript interfaces for all data structures
- [ ] Implement GPT-5 client wrapper with retry logic
- [ ] Create prompt template system
- [ ] Build validation schemas for LLM outputs
- [ ] Set up caching for static content

### Phase 2: LLM Integration  
- [x] Implement Task 1.1: Specification retrieval with web search (UI streaming badge + structured output)
- [x] Implement Task 1.2: Parameter range selection (Apply-to-experiment workflow)
- [ ] Implement Task 1.3: Orthogonal array selection
- [x] Implement Task 2.1: Taguchi analysis (LLM streaming summary available)
- [ ] Implement Task 2.2: Interpolation logic
- [ ] Implement Task 2.3: Settings table generation

### Phase 3: Core DOE Logic
- [ ] Implement L9/L18/L27 array generators
- [ ] Create test part selection algorithm
- [ ] Build 3MF generation with Orca modifiers
- [ ] Alternative: G-code injection for firmware modifiers
- [ ] Implement SNR calculations
- [ ] Build main effects analysis

### Phase 4: API & Database
- [ ] Create Express routes for all endpoints
- [ ] Set up PostgreSQL schema for experiments
- [ ] Implement results storage and retrieval
- [ ] Build file generation and download system
- [ ] Create scoring interface components

### Phase 5: Testing & Validation
- [ ] Unit tests for Taguchi calculations
- [ ] Integration tests for LLM calls
- [ ] Validate against known good experiments
- [ ] Test with multiple material/printer combinations
- [ ] User acceptance testing

### Phase 6: Production Readiness
- [ ] Error monitoring (Sentry/similar)
- [ ] LLM cost tracking
- [ ] Performance optimization (caching, DB indexes)
- [ ] Documentation for users
- [ ] Deployment pipeline

---

## Success Criteria

**System is successful if:**

1. **Test reduction achieved:** Users complete calibration in 9-15 prints (vs 20-30 traditional)
2. **Quality improvement:** Optimized settings produce measurably better prints than default profiles
3. **User completion rate:** ≥70% of users who start an experiment complete it
4. **LLM reliability:** ≥95% of LLM outputs pass validation without retry
5. **Cost sustainability:** LLM costs < $0.25 per experiment
6. **Time efficiency:** End-to-end calibration (design + print + analysis) < 6 hours

**Measure these KPIs:**
- Experiments created per week
- Completion rate  
- Average optimal settings vs manufacturer recommendations
- User-reported quality improvement (survey)
- LLM validation failure rate
- Cost per experiment

---

## Conclusion

This implementation plan removes unreliable STL generation and focuses the LLM on its strengths: information retrieval, parameter optimization, and statistical analysis. By combining pre-validated test parts with intelligent experiment design, the system minimizes user effort while maximizing calibration quality.

The LLM acts as an expert assistant that:
1. Researches specific filament/printer specifications
2. Designs efficient experiments tailored to user context
3. Analyzes results with Taguchi methods
4. Generates actionable settings recommendations

Users benefit from:
- Fewer test prints required
- Higher confidence in optimal settings  
- Understanding of which parameters matter most
- Professional-grade DOE methodology accessible to hobbyists

Implementation priorities:
1. Core LLM integration (Phases 1-2 from architecture)
2. Taguchi analysis engine
3. User interface for scoring and results
4. 3MF/G-code generation
5. Monitoring and refinement based on real user data
