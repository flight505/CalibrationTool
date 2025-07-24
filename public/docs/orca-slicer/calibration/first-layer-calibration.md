# First Layer Calibration Guide

## Overview

First layer calibration is the most critical calibration for successful 3D printing. Without proper bed adhesion, no other calibration matters. This test helps you achieve perfect first layer adhesion in less than 5 minutes.

## Why First Layer Calibration Matters

The first layer is the foundation of your entire print. Problems with the first layer lead to:
- Print failures due to poor adhesion
- Warping and lifting corners
- Elephant foot (over-squished first layer)
- Poor surface quality on the bottom of prints

## Test Pattern

The first layer calibration pattern consists of a single-layer test print that covers a large area of your build plate. This allows you to:
- See adhesion quality across different areas
- Adjust Z-offset while printing
- Verify bed leveling accuracy

## Calibration Process

### 1. Prepare Your Print Bed

**Clean the Surface**
- Use isopropyl alcohol (70% or higher)
- Wipe with a lint-free cloth
- Let it dry completely

**Heat the Bed**
- Set to your material's recommended temperature
- Wait 5-10 minutes for thermal expansion

### 2. Material-Specific Settings

| Material | Bed Temp | Nozzle Temp | First Layer Squish |
|----------|----------|-------------|-------------------|
| PLA      | 60°C     | 210°C       | Moderate          |
| PETG     | 80°C     | 240°C       | Light             |
| ABS      | 100°C    | 255°C       | Moderate          |
| TPU      | 50°C     | 225°C       | Heavy             |
| PA-CF    | 100°C    | 300°C       | Light             |

### 3. Start the Test Print

1. Download and slice the first layer calibration STL
2. Set print speed to 50% for better observation
3. Start the print
4. Watch the first few lines being laid down

### 4. Live Z-Offset Adjustment

While the test pattern is printing:

**Too High (Poor Adhesion)**
- Lines don't stick to the bed
- Visible gaps between lines
- Round cross-section visible
- Easy to remove with fingernail

→ **Action**: Decrease Z-offset (move nozzle closer)

**Just Right (Perfect)**
- Lines touch each other perfectly
- Slightly squished appearance
- Good adhesion to bed
- Smooth, flat surface

→ **Action**: Save this Z-offset value!

**Too Low (Over-squished)**
- Lines are transparent/very thin
- Nozzle scraping sounds
- Ridges between lines
- Very difficult to remove

→ **Action**: Increase Z-offset (move nozzle further)

### 5. Fine-Tuning Tips

**Baby Stepping**
- Adjust in 0.01-0.02mm increments
- Wait for 2-3 lines before judging
- Look at the most recent lines, not old ones

**Check Multiple Areas**
- Front, back, left, right, and center
- If inconsistent, bed may need leveling
- Manual mesh adjustment may help

## Common Issues and Solutions

### Print Won't Stick at All

1. **Contaminated Bed**
   - Clean again with IPA
   - Try dish soap and water for stubborn oils
   - Consider bed adhesive (glue stick, hairspray)

2. **Bed Not Level**
   - Run auto-bed leveling
   - Check for warped bed
   - Use manual mesh adjustment

3. **Wrong Temperature**
   - Increase bed temp by 5-10°C
   - Check actual vs. displayed temperature

### First Layer Too Squished

**Elephant Foot**
- Enable elephant foot compensation
- Reduce first layer flow to 90-95%
- Increase Z-offset slightly

**Nozzle Dragging**
- Immediately increase Z-offset
- Check for bent/damaged nozzle
- Verify Z-axis movement is smooth

### Inconsistent First Layer

**Partial Adhesion**
- Check for drafts/air currents
- Verify bed is truly flat
- Consider using a brim

**Warping Corners**
- Increase bed temperature
- Use enclosure for ABS/PA
- Add mouse ears to corners

## OrcaSlicer Settings

### First Layer Settings Location
**Process Settings → Quality → First Layer**

Key settings to adjust:
- **First Layer Height**: 0.2-0.3mm (thicker = more forgiving)
- **First Layer Line Width**: 120-150% (wider = better adhesion)
- **First Layer Speed**: 20-30mm/s (slower = better adhesion)
- **First Layer Acceleration**: 500-1000mm/s² (gentler = less chance of pulling up)

### Z-Offset Storage
**Printer Settings → Machine → Machine G-code**

Add to your start G-code:
```gcode
; Z-offset adjustment
M851 Z{your_offset_value} ; Replace with your calibrated value
```

Or use OrcaSlicer's Z-offset field:
**Process Settings → Others → Z offset**

## Material-Specific Tips

### PLA
- Most forgiving material
- Works on most bed surfaces
- Can use lower temperatures if adhesion is too strong

### PETG
- Tends to stick TOO well
- Use slightly higher Z-offset
- Consider release agent on glass beds
- First layer 10°C hotter than other layers

### ABS
- Requires heated enclosure for best results
- Use ABS juice or glue stick
- Brim highly recommended
- Keep bed very clean

### TPU
- Needs more squish than rigid materials
- Reduce first layer speed to 15mm/s
- Disable retraction for first layer
- Use thicker first layer (0.3mm)

## Next Steps

Once you achieve perfect first layer adhesion:
1. Save your Z-offset value
2. Document bed/nozzle temperatures used
3. Proceed to Temperature Tower calibration
4. Remember to recalibrate when changing:
   - Nozzle
   - Bed surface
   - Filament brand

## Quick Reference Card

**Adjustment Guide**
- Gaps between lines → Lower nozzle (- Z-offset)
- Transparent/scraped → Raise nozzle (+ Z-offset)
- Perfect → Slightly squished, no gaps

**Standard First Layer Settings**
- Height: 0.2-0.3mm
- Width: 0.5-0.6mm
- Speed: 20-30mm/s
- Temp: +5-10°C above normal

Remember: A perfect first layer is worth the time investment. It's the foundation of every successful print!