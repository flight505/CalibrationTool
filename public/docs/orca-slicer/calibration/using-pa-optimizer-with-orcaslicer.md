# Using the PA Optimizer with OrcaSlicer

## Overview

The Pressure Advance Optimizer is a web-based analysis tool that works in conjunction with OrcaSlicer's built-in PA calibration feature. This guide explains the complete workflow for calibrating Pressure Advance using both tools together.

## Workflow Summary

1. **Configure** → Enter your test parameters in the PA Optimizer
2. **Generate** → Use OrcaSlicer to create the PA test pattern
3. **Print** → Print the pattern and observe corner quality
4. **Analyze** → Input results back into the PA Optimizer
5. **Export** → Get your optimized adaptive PA table
6. **Apply** → Use the PA table in OrcaSlicer

---

## Step 1: Configure Test Parameters

Open the **Pressure Advance Optimizer** in your web browser and navigate to the **Input** tab.

### PA Test Parameters

Configure the following values (these will be used in both tools):

| Parameter | Description | Typical Values |
|-----------|-------------|----------------|
| **Start PA** | Starting Pressure Advance value | 0.000 - 0.010 |
| **End PA** | Ending Pressure Advance value | 0.020 - 0.100 |
| **PA Step** | Increment between test values | 0.002 - 0.005 |
| **Layer Height** | Print layer height | 0.16 - 0.20 mm |
| **Line Width** | Extrusion width | 0.40 - 0.48 mm |

### Speed Configuration (3×3 Grid Columns)

Enter three different print speeds to test:

- **Speed 1**: 120 mm/s (conservative)
- **Speed 2**: 150 mm/s (moderate)
- **Speed 3**: 200 mm/s (fast)

### Acceleration Configuration (3×3 Grid Rows)

Enter three different acceleration values to test:

- **Accel 1**: 4000 mm/s² (low)
- **Accel 2**: 6000 mm/s² (medium)
- **Accel 3**: 10000 mm/s² (high)

> **Important**: Write down these exact values - you'll need them in OrcaSlicer!

---

## Step 2: Generate PA Pattern in OrcaSlicer

### Access the PA Calibration Tool

1. Open **OrcaSlicer**
2. Go to **Calibration** → **Pressure Advance** in the top menu
3. The PA calibration dialog will open

### Enter Configuration Values

In the OrcaSlicer PA calibration dialog, enter the **exact same values** you configured in Step 1:

| Field | Value from PA Optimizer |
|-------|-------------------------|
| Start PA | Your Start PA value |
| End PA | Your End PA value |
| PA Step | Your PA Step value |
| Method | **Pattern** (3×3 grid) |
| Speeds | Your 3 speed values |
| Accelerations | Your 3 acceleration values |
| Layer Height | Your layer height value |
| Line Width | Your line width value |

### Generate the 3MF Project

1. Click **Generate** in the OrcaSlicer dialog
2. OrcaSlicer will create a complete 3MF project file with:
   - PA test pattern geometry
   - 9 modifier meshes (one for each tile in the 3×3 grid)
   - Embedded speed and acceleration settings
   - PA value modifiers for each section

3. Save the 3MF file to your computer

---

## Step 3: Print the PA Pattern

### Slicing Settings

The generated 3MF already contains most settings, but verify these:

- **Layer Height**: Should match your configured value
- **Line Width**: Should match your configured value
- **Infill**: 0% (pattern is perimeters only)
- **Perimeters**: 2
- **Top/Bottom Layers**: 0
- **Cooling**: Normal for your material

### Print Preparation

1. **Slice** the 3MF project in OrcaSlicer
2. **Preview** the G-code to verify PA commands are present
3. **Export** the G-code to your printer
4. **Print** the pattern

> **Tip**: Print on a smooth build surface for easier corner inspection

---

## Step 4: Evaluate the Print

### Understanding the 3×3 Grid Layout

The PA pattern consists of 9 tiles arranged in a grid:

```
┌─────────────────────────────────┐
│  Tile 1    Tile 2    Tile 3     │  ← Accel 1 (4000)
│ (120mm/s) (150mm/s) (200mm/s)   │
├─────────────────────────────────┤
│  Tile 4    Tile 5    Tile 6     │  ← Accel 2 (6000)
│ (120mm/s) (150mm/s) (200mm/s)   │
├─────────────────────────────────┤
│  Tile 7    Tile 8    Tile 9     │  ← Accel 3 (10000)
│ (120mm/s) (150mm/s) (200mm/s)   │
└─────────────────────────────────┘
```

Each tile tests a different speed/acceleration combination at a specific PA value.

### What to Look For

Inspect each tile's corner quality:

| Quality | PA Value | Visual Indicators |
|---------|----------|-------------------|
| **Too Low PA** | Increase needed | Bulging at corners, excess material after direction changes |
| **Optimal PA** | ✓ Perfect | Sharp corners, consistent line width, no gaps or bulges |
| **Too High PA** | Decrease needed | Gaps at corners, under-extrusion after direction changes |

### Measurement Tips

- Use good lighting (natural light or bright LED)
- Inspect corners at eye level
- Look for the sharpest corners with no bulging
- Check line width consistency throughout the pattern
- Use a loupe or magnifying glass for detailed inspection

---

## Step 5: Input Results into PA Optimizer

Return to the **PA Optimizer** web tool and navigate to the **Input** tab.

### Enter Test Data

For each of the 9 tiles, record which PA value produced the best quality:

1. Switch to **Grid View** for easier input
2. For each tile, enter:
   - **Tile ID**: 1-9 (row-major order)
   - **Speed**: The speed for that column
   - **Acceleration**: The acceleration for that row
   - **Flow**: Measured flow rate (if available) or calculate from geometry
   - **PA Value**: The PA value that produced the best corner quality

### Grid View Layout

The grid view matches the physical print layout:

```
┌─────────────────────────────────────┐
│     120mm/s   150mm/s   200mm/s     │
├─────────────────────────────────────┤
│ 4000 │ Tile 1 │ Tile 2 │ Tile 3  │ │
├─────────────────────────────────────┤
│ 6000 │ Tile 4 │ Tile 5 │ Tile 6  │ │
├─────────────────────────────────────┤
│10000 │ Tile 7 │ Tile 8 │ Tile 9  │ │
└─────────────────────────────────────┘
```

### Quick Test with Example Data

Not ready to print yet? Use the **Load Example** button to see how the analysis works with sample data.

---

## Step 6: Analyze Results

Click **Continue to Analysis →** to proceed to the analysis panel.

### Quality Score

The PA Optimizer calculates a quality score based on:

- **Trend Validation**: Does PA decrease with higher flow/acceleration?
- **Data Consistency**: How consistent are the PA values across tiles?
- **Model Fit**: How well do the models predict PA values?

| Score Range | Confidence | Recommendation |
|-------------|------------|----------------|
| **80-100** | High | Excellent calibration - proceed to export |
| **60-80** | Medium | Good calibration - minor improvements possible |
| **< 60** | Low | Consider re-running test with adjusted parameters |

### Expected Trends

The analysis validates these physical relationships:

- ✓ **PA should DECREASE with higher flow** (more material = less back-pressure)
- ✓ **PA should DECREASE with higher acceleration** (less time for pressure buildup)

If trends are inverted, the analysis will flag potential measurement issues.

---

## Step 7: Review Models

Navigate to the **Models** tab to see different regression models.

### Available Models

The PA Optimizer tests multiple mathematical models:

1. **Linear Flow + Accel**: `PA = a × Flow + b × Accel + c`
2. **Inverse Flow + Accel**: `PA = a/Flow + b/Accel + c`
3. **Flow/Accel Ratio**: `PA = a × (Flow/Accel) + b`
4. **Flow + Accel/10000**: `PA = a × Flow + b × (Accel/10000) + c`

The tool automatically selects the best model based on R² score and physical validity.

### Manual Model Selection

You can override the automatic selection if you have specific requirements:

- **Direct Drive**: Linear or inverse models typically work best
- **Bowden**: Flow/Accel ratio may be more accurate
- **High Flow**: Consider inverse flow model for better high-flow predictions

---

## Step 8: Export PA Table

Navigate to the **Results** tab to get your optimized PA table.

### Adaptive PA Table Format

The PA Optimizer generates a table compatible with OrcaSlicer's Adaptive Pressure Advance feature:

```
# Adaptive Pressure Advance Table
# Generated by PA Optimizer - [Date]
# Model: [Selected Model Type]
# Quality Score: [Score]/100

9.75,0.025    # 120mm/s @ 4000mm/s²
12.16,0.030   # 150mm/s @ 4000mm/s²
16.25,0.025   # 200mm/s @ 4000mm/s²
9.75,0.015    # 120mm/s @ 6000mm/s²
12.19,0.015   # 150mm/s @ 6000mm/s²
...
```

Format: `Flow_Rate,PA_Value`

### Download Options

1. **Copy to Clipboard**: Click the copy button to copy the table
2. **Download as Text**: Save as a `.txt` file for reference

---

## Step 9: Apply PA Table in OrcaSlicer

### Enable Adaptive Pressure Advance

1. Open **OrcaSlicer**
2. Go to **Filament Settings** → **Advanced** (or **Filament Overrides**)
3. Find **Pressure Advance** section
4. Enable **Use Adaptive Pressure Advance**

### Input the PA Table

1. Locate the **Adaptive PA Table** text field
2. Paste or type your PA table (one entry per line)
3. Format: `flow_rate,pa_value` (e.g., `9.75,0.025`)

### Verify Configuration

- Check that **Enable Pressure Advance** is ON
- Set a **Default PA Value** (e.g., 0.025) for fallback
- Ensure your printer firmware supports PA commands

---

## Step 10: Test Your Calibration

### Print a Real Part

Print a functional part with:

- Multiple speeds
- Various accelerations
- Direction changes and corners

### What to Check

- **Corner Quality**: Sharp edges without bulging
- **Line Width Consistency**: Even extrusion throughout
- **Surface Finish**: Smooth surfaces with no artifacts
- **Dimensional Accuracy**: Part matches expected dimensions

### Fine-Tuning

If needed, adjust the PA table values slightly:

- Corners still bulging? Increase PA values by 0.002-0.005
- Gaps at corners? Decrease PA values by 0.002-0.005
- Speed-specific issues? Adjust specific flow rate entries

---

## Troubleshooting

### Common Issues

| Problem | Possible Cause | Solution |
|---------|----------------|----------|
| No PA commands in G-code | PA not enabled in filament settings | Enable PA in OrcaSlicer filament settings |
| Inverted trends in analysis | Measurement errors or swapped tiles | Verify tile numbering and re-measure |
| Low quality score (< 60) | Inconsistent measurements | Re-run test with better lighting and inspection |
| Table not working in OrcaSlicer | Format error | Check comma separation and no extra spaces |

### Parameter Mismatch Warning

If the analysis shows unexpected results, verify that you used the **exact same parameters** in both:

- PA Optimizer configuration
- OrcaSlicer PA calibration dialog

Even small differences in speeds, accelerations, or PA range can lead to incorrect analysis.

---

## Tips for Best Results

### Test Parameter Selection

- **Conservative Range**: Start PA 0.000, End PA 0.040, Step 0.002 (Direct Drive)
- **Wider Range**: Start PA 0.000, End PA 0.100, Step 0.005 (Bowden)
- **Speeds**: Choose speeds you actually use in real prints
- **Accelerations**: Test your typical acceleration values

### Print Quality Factors

- **Bed Adhesion**: Ensure pattern sticks well (use brim if needed)
- **First Layer**: Calibrate first layer before PA testing
- **Flow Rate**: Calibrate flow rate before PA testing
- **Temperature**: Use your typical printing temperature

### Advanced Usage

- **Multiple Materials**: Run separate tests for each filament type
- **Speed Profiles**: Create different PA tables for draft/quality modes
- **High-Speed Printing**: Test higher accelerations (15000+ mm/s²)

---

## Related Documentation

- [Adaptive Pressure Advance Calibration](./adaptive-pressure-advance-calibration.md) - In-depth guide to PA concepts
- [Flow Rate Calibration](./flow-rate-calibration.md) - Calibrate flow before PA testing
- [Retraction Calibration](./retraction-calibration.md) - Complement PA with retraction tuning

---

## Frequently Asked Questions

### Why can't I generate the PA pattern directly in the web tool?

OrcaSlicer's PA pattern generation uses complex C++ code (~1000+ lines) with custom G-code injection. Rather than duplicating this functionality, the PA Optimizer focuses on providing advanced analysis features that OrcaSlicer doesn't offer, such as multi-variable modeling, trend validation, and adaptive PA table generation.

### What's the difference between OrcaSlicer PA calibration and the PA Optimizer?

- **OrcaSlicer**: Generates the test pattern, handles slicing with PA modifiers
- **PA Optimizer**: Analyzes results, validates trends, generates optimized adaptive PA tables, provides quality scoring

Use both together for the best results!

### Do I need to test all 9 tiles?

For accurate analysis, yes. The 3×3 grid (9 tiles) tests the interaction between speed and acceleration, which is critical for adaptive PA. Testing fewer tiles will result in less accurate models.

### Can I use this with non-OrcaSlicer slicers?

The PA table format is OrcaSlicer-specific, but the analysis principles apply to any slicer. You can manually extract PA values for specific speeds and apply them in your slicer's settings.

### How often should I recalibrate PA?

Recalibrate when you:

- Change filament brands or materials
- Modify your extruder setup (e.g., swap hotend, change tubing length)
- Upgrade firmware
- Notice corner quality issues

For the same filament brand and setup, PA typically remains stable for months.

---

## Next Steps

- Generate your PA pattern in OrcaSlicer
- Print and evaluate the test
- Input your results for analysis
- Export and apply your optimized PA table
- Enjoy improved print quality with adaptive PA!
