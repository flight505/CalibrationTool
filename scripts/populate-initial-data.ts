#!/usr/bin/env node
import { Client } from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env.local') });

async function populateInitialData() {
  console.log('🚀 Populating OrcaSlicer knowledge base with initial data...\n');

  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  
  if (!connectionString) {
    console.error('❌ No database connection string found in environment variables');
    process.exit(1);
  }

  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('📡 Connected to database\n');

    // Check if data already exists
    const checkResult = await client.query('SELECT COUNT(*) FROM documents');
    const existingCount = parseInt(checkResult.rows[0].count);
    
    if (existingCount > 0) {
      console.log(`⚠️  Database already contains ${existingCount} documents.`);
      console.log('   Run with --force to add data anyway.\n');
      
      if (!process.argv.includes('--force')) {
        process.exit(0);
      }
    }

    console.log('📚 Adding calibration guides...\n');

    // Initial calibration guides data
    const calibrationGuides = [
      {
        title: 'Flow Ratio Calibration Guide',
        content: `Flow ratio calibration is essential for accurate extrusion in OrcaSlicer. This calibration ensures your printer extrudes the exact amount of filament needed.

## Why Calibrate Flow Ratio?
- Prevents over-extrusion (blobby prints, stringing)
- Prevents under-extrusion (gaps, weak prints)
- Ensures dimensional accuracy
- Material-specific optimization

## Calibration Process:
1. **Generate Calibration Cube**: Use OrcaSlicer's built-in flow calibration
   - Go to Calibration menu → Flow Rate
   - Select your nozzle size (default 0.4mm)
   - Print the 20×20×18.8mm calibration cube

2. **Measure Wall Thickness**:
   - Measure at multiple heights (2-3mm, 8-10mm, 15-17mm)
   - Use digital calipers for accuracy
   - Note both thick walls (1.2mm expected) and thin walls (0.4mm expected)

3. **Calculate New Flow Ratio**:
   - Formula: New Flow = Current Flow × (Expected / Measured)
   - Example: If measuring 0.45mm instead of 0.4mm
   - New Flow = 1.00 × (0.4 / 0.45) = 0.89

4. **Apply Settings**:
   - Go to Filament Settings → Flow ratio
   - Enter calculated value (typically 0.90-1.10)
   - Save as new filament profile

## Typical Values by Material:
- PLA: 0.92-0.98
- PETG: 0.94-1.00
- ABS: 0.90-0.96
- TPU: 0.98-1.05
- PA-CF: 0.88-0.94

## Tips:
- Calibrate for each filament brand/type
- Re-calibrate when changing nozzles
- Temperature affects flow - calibrate at printing temp
- Use consistent measurement technique`,
        source_type: 'guide',
        metadata: { category: 'calibration', difficulty: 'beginner', tool: 'flow_rate' }
      },
      {
        title: 'Temperature Tower Calibration',
        content: `Temperature calibration helps find the optimal printing temperature for your specific filament in OrcaSlicer.

## Why Temperature Matters:
- Too hot: stringing, oozing, poor overhangs
- Too cold: poor layer adhesion, under-extrusion
- Sweet spot: best strength, quality, and appearance

## Calibration Process:
1. **Setup Temperature Tower**:
   - Calibration menu → Temperature Tower
   - Set temperature range (e.g., PLA: 190-220°C)
   - 5°C increments recommended
   - Enable temperature changes in G-code

2. **Print and Evaluate**:
   Look for these qualities at each temperature:
   - **Layer Adhesion**: No splitting between layers
   - **Bridging**: Minimal sagging on bridges
   - **Overhangs**: Clean 45° and 60° angles
   - **Stringing**: Minimal wisps between towers
   - **Surface Quality**: Smooth, consistent finish

3. **Select Optimal Temperature**:
   - Balance all factors
   - Prioritize layer adhesion for strength
   - Note: ±5°C from optimal is usually acceptable

## Material Temperature Ranges:
- **PLA**: 190-220°C (bed: 50-60°C)
- **PETG**: 220-250°C (bed: 70-80°C)
- **ABS**: 230-260°C (bed: 90-110°C)
- **TPU**: 210-230°C (bed: 40-60°C)
- **PA-CF**: 260-280°C (bed: 80-100°C)
- **ASA**: 240-260°C (bed: 90-110°C)

## First Layer Temperature:
- Add 5-10°C for first layer
- Improves bed adhesion
- Set in Filament Settings → Temperature

## Environmental Factors:
- Enclosed printers: reduce by 5°C
- High ambient temp: reduce by 5°C
- Drafty environment: increase by 5°C`,
        source_type: 'guide',
        metadata: { category: 'calibration', difficulty: 'beginner', tool: 'temperature_tower' }
      },
      {
        title: 'Pressure Advance Calibration',
        content: `Pressure Advance (PA) compensates for filament compression in the hotend, improving print quality at corners and reducing bulging.

## What PA Does:
- Sharpens corners
- Reduces bulging at direction changes
- Minimizes oozing during travel
- Improves consistency at varying speeds

## Calibration Methods:

### Method 1: PA Pattern Test
1. **Generate Test Pattern**:
   - Calibration → Pressure Advance
   - Select PA range based on extruder type
   - Direct Drive: 0.02-0.10
   - Bowden: 0.2-0.8

2. **Print and Measure**:
   - Look for sharpest corners
   - No bulging at direction changes
   - Consistent line width throughout
   - Measure height where quality is best

3. **Calculate PA Value**:
   - PA = Step × Measured Height
   - Example: Step 0.002, best at 25mm
   - PA = 0.002 × 25 = 0.050

### Method 2: PA Tower Test
1. **Setup**:
   - Print PA calibration tower
   - PA increases with height
   - Look for optimal corner quality

2. **Visual Inspection**:
   - Too low: bulging corners, rounded edges
   - Too high: gaps at corners, thin walls
   - Just right: sharp, consistent corners

## Typical PA Values:
- **Direct Drive Extruders**:
  - BMG/Orbiter: 0.02-0.05
  - Hemera: 0.03-0.06
  - E3D Revo: 0.04-0.08

- **Bowden Extruders**:
  - Short Bowden (<30cm): 0.2-0.4
  - Medium Bowden (30-60cm): 0.4-0.6
  - Long Bowden (>60cm): 0.6-0.8

## Apply Settings:
- Filament Settings → Advanced → Pressure Advance
- Save per filament type
- May need adjustment for:
  - Different nozzle sizes
  - Temperature changes
  - Speed profiles

## Advanced Tips:
- PA interacts with Linear Advance (Marlin)
- Klipper: Use SET_PRESSURE_ADVANCE command
- Test at your typical print speeds
- Flexible filaments need minimal PA`,
        source_type: 'guide',
        metadata: { category: 'calibration', difficulty: 'intermediate', tool: 'pressure_advance' }
      },
      {
        title: 'Retraction Calibration Guide',
        content: `Retraction calibration eliminates stringing and oozing by pulling filament back during travel moves.

## Key Retraction Parameters:
1. **Retraction Length**: How far to pull back
2. **Retraction Speed**: How fast to retract
3. **Retract on Layer Change**: Enable for cleaner layers
4. **Wipe While Retracting**: Reduces stringing

## Calibration Process:

### Step 1: Retraction Length Test
1. **Generate Retraction Tower**:
   - Calibration → Retraction Test
   - Set range based on extruder:
   - Direct Drive: 0.5-2.0mm
   - Bowden: 3.0-7.0mm

2. **Print and Evaluate**:
   - Look for minimal stringing
   - No gaps at retraction points
   - Clean travel moves
   - Note height with best results

3. **Calculate Length**:
   - Length = Start + (Height × Factor)
   - Example: Start 0.5mm, Factor 0.05, Best at 20mm
   - Length = 0.5 + (20 × 0.05) = 1.5mm

### Step 2: Retraction Speed Test
After finding optimal length:
1. **Test Speed Range**:
   - Direct Drive: 30-60mm/s
   - Bowden: 40-80mm/s

2. **Look For**:
   - No grinding/skipping
   - Clean retractions
   - Minimal stringing

## Material-Specific Settings:

### PLA:
- Length: 0.5-1.5mm (DD), 4-6mm (Bowden)
- Speed: 40-50mm/s
- Temperature affects stringing significantly

### PETG:
- Length: 1-2mm (DD), 5-7mm (Bowden)
- Speed: 30-40mm/s (slower prevents stringing)
- Disable Z-hop to reduce stringing

### TPU/Flexible:
- Length: 0-0.5mm (minimal retraction)
- Speed: 20-30mm/s
- Often better with no retraction

### ABS/ASA:
- Length: 0.5-1.5mm (DD), 3-5mm (Bowden)
- Speed: 40-60mm/s
- Higher temps need more retraction

## Advanced Settings:
- **Retraction on Layer Change**: Yes
- **Wipe Distance**: 2-5mm
- **Retract Amount Before Wipe**: 70%
- **Minimum Travel**: 2mm
- **Combing Mode**: Within Infill

## Troubleshooting:
- **Still Stringing**: Increase length by 0.2mm
- **Gaps/Under-extrusion**: Reduce length
- **Grinding Filament**: Reduce speed
- **Blobs on Surface**: Enable wipe, coasting`,
        source_type: 'guide',
        metadata: { category: 'calibration', difficulty: 'beginner', tool: 'retraction_test' }
      },
      {
        title: 'Maximum Volumetric Speed Calibration',
        content: `Maximum Volumetric Speed (MVS) determines your hotend's melting capacity, preventing under-extrusion at high speeds.

## Understanding MVS:
- Measured in mm³/s
- Limits maximum print speed
- Prevents cold extrusion
- Material and temperature dependent

## Calibration Process:

### Step 1: MVS Test Print
1. **Setup Test**:
   - Calibration → Max Volumetric Speed
   - Start conservatively:
   - PLA: 5-8 mm³/s
   - PETG: 8-10 mm³/s
   - ABS: 10-12 mm³/s

2. **Print MVS Tower**:
   - Speed increases with height
   - Watch for under-extrusion signs:
   - Gaps between lines
   - Rough surface texture
   - Clicking extruder
   - Poor layer adhesion

3. **Identify Maximum**:
   - Note height where issues start
   - Calculate: MVS = Start + (Height × Step)
   - Reduce by 10-15% for safety margin

## Hotend Capabilities:

### Standard Hotends:
- **V6**: 11-15 mm³/s
- **Dragon**: 15-20 mm³/s
- **Mosquito**: 20-25 mm³/s
- **Revo**: 18-23 mm³/s

### High-Flow Hotends:
- **Volcano**: 25-30 mm³/s
- **Dragon HF**: 30-35 mm³/s
- **Mosquito Magnum**: 35-40 mm³/s
- **CHT Nozzles**: +20-30% over standard

## Material-Specific MVS:
Temperature shown at typical printing temp

### PLA (210°C):
- Standard: 12-15 mm³/s
- High-flow: 20-25 mm³/s

### PETG (240°C):
- Standard: 10-13 mm³/s
- High-flow: 18-22 mm³/s

### ABS (250°C):
- Standard: 11-14 mm³/s
- High-flow: 20-24 mm³/s

### TPU (220°C):
- Standard: 5-8 mm³/s
- High-flow: 10-12 mm³/s

## Apply Settings:
1. **Set in OrcaSlicer**:
   - Filament Settings → Advanced
   - Max Volumetric Speed
   - Enter calculated value

2. **Speed Limitations**:
   - Print Speed × Layer Height × Line Width ≤ MVS
   - Example: 100mm/s × 0.2mm × 0.4mm = 8 mm³/s

## Optimization Tips:
- Higher temps increase MVS
- Larger nozzles have higher MVS
- Check extruder motor current
- Ensure proper cooling
- PID tune after changes`,
        source_type: 'guide',
        metadata: { category: 'calibration', difficulty: 'advanced', tool: 'max_volumetric_speed' }
      },
      {
        title: 'OrcaSlicer Print Quality Troubleshooting',
        content: `Common print quality issues and their solutions in OrcaSlicer.

## Layer Adhesion Issues

### Problem: Layers separating or weak prints
**Solutions**:
- Increase nozzle temperature by 5-10°C
- Reduce cooling fan speed (especially for ABS/PETG)
- Check for partial clogs
- Calibrate flow ratio
- Reduce print speed for better bonding

## Stringing and Oozing

### Problem: Thin strings between parts
**Solutions**:
- Calibrate retraction settings
- Reduce nozzle temperature by 5°C
- Enable combing within infill
- Increase travel speed
- Dry filament if hygroscopic

## Poor First Layer

### Problem: First layer not sticking or too squished
**Solutions**:
- Level bed properly
- Adjust Z-offset
- Clean bed surface
- Use appropriate bed temperature
- Enable first layer compensation
- Slow down first layer speed (10-20mm/s)

## Surface Quality Issues

### Problem: Rough surfaces, visible layer lines
**Solutions**:
- Calibrate Linear/Pressure Advance
- Reduce layer height
- Enable ironing for top surfaces
- Check belt tension
- Verify stepper driver currents
- Use variable layer height

## Dimensional Accuracy

### Problem: Parts wrong size
**Solutions**:
- Calibrate flow ratio precisely
- Check filament diameter consistency
- Enable shrinkage compensation
- Calibrate XY steps/mm
- Use Precise Wall feature
- Consider horizontal expansion

## Corner Bulging

### Problem: Bulges at sharp corners
**Solutions**:
- Calibrate Pressure Advance
- Reduce printing speed at corners
- Lower acceleration values
- Enable jerk control
- Use slower external perimeter speed

## Overhangs and Bridging

### Problem: Sagging overhangs, poor bridges
**Solutions**:
- Increase cooling fan speed
- Reduce nozzle temperature
- Slow down overhang speed
- Enable overhang speed reduction
- Adjust bridge flow ratio
- Use support for angles >45°

## Z-Banding/Wobble

### Problem: Periodic patterns on vertical surfaces
**Solutions**:
- Check Z-axis components
- PID tune bed heater
- Isolate printer from vibrations
- Verify leadscrew alignment
- Check for bent Z-rods
- Enable Z-hop judiciously`,
        source_type: 'troubleshooting',
        metadata: { category: 'troubleshooting', difficulty: 'intermediate' }
      },
      {
        title: 'Material-Specific Settings Guide',
        content: `Optimized OrcaSlicer settings for different materials.

## PLA (Polylactic Acid)

### Basic Settings:
- **Nozzle**: 190-220°C (205°C typical)
- **Bed**: 50-60°C
- **Cooling**: 100% after layer 1
- **Speed**: 60-150mm/s

### OrcaSlicer Specific:
- Flow Ratio: 0.92-0.98
- Pressure Advance: 0.02-0.05
- Retraction: 0.5-1.5mm @ 40mm/s
- Max Volumetric: 12-15 mm³/s

## PETG (Polyethylene Terephthalate Glycol)

### Basic Settings:
- **Nozzle**: 220-250°C (240°C typical)
- **Bed**: 70-80°C
- **Cooling**: 30-50%
- **Speed**: 40-80mm/s

### OrcaSlicer Specific:
- Flow Ratio: 0.94-1.00
- Pressure Advance: 0.04-0.08
- Retraction: 1-2mm @ 30mm/s
- Max Volumetric: 10-13 mm³/s
- Z-offset: +0.02mm (less squish)

## ABS (Acrylonitrile Butadiene Styrene)

### Basic Settings:
- **Nozzle**: 230-260°C (250°C typical)
- **Bed**: 90-110°C
- **Cooling**: 0-30%
- **Speed**: 50-100mm/s
- **Enclosure**: Recommended

### OrcaSlicer Specific:
- Flow Ratio: 0.90-0.96
- Pressure Advance: 0.03-0.06
- Retraction: 0.5-1.5mm @ 50mm/s
- Max Volumetric: 11-14 mm³/s
- Draft Shield: Enable for open printers

## TPU (Thermoplastic Polyurethane)

### Basic Settings:
- **Nozzle**: 210-230°C (220°C typical)
- **Bed**: 40-60°C
- **Cooling**: 0-50%
- **Speed**: 20-40mm/s

### OrcaSlicer Specific:
- Flow Ratio: 0.98-1.05
- Pressure Advance: 0-0.02 (minimal)
- Retraction: 0-0.5mm @ 20mm/s
- Max Volumetric: 5-8 mm³/s
- Flexible Filament Settings: Enable

## Nylon (PA)

### Basic Settings:
- **Nozzle**: 240-270°C
- **Bed**: 80-100°C
- **Cooling**: 0-20%
- **Speed**: 40-60mm/s
- **Dry Box**: Essential

### OrcaSlicer Specific:
- Flow Ratio: 0.92-0.98
- Pressure Advance: 0.04-0.08
- Retraction: 2-3mm @ 40mm/s
- Max Volumetric: 8-12 mm³/s
- Moisture: Dry at 80°C for 6+ hours

## Carbon Fiber Composites

### Basic Settings:
- **Nozzle**: Per base material +10°C
- **Hardened Nozzle**: Required
- **Bed**: Per base material
- **Speed**: -20% from base

### OrcaSlicer Specific:
- Flow Ratio: -0.02 from base
- Pressure Advance: +0.01 from base
- Line Width: >0.5mm recommended
- Top/Bottom Layers: +2 from normal`,
        source_type: 'reference',
        metadata: { category: 'materials', difficulty: 'intermediate' }
      }
    ];

    // Insert calibration guides
    for (const guide of calibrationGuides) {
      try {
        await client.query(
          `INSERT INTO documents (title, content, url, source_type, metadata)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (title) DO UPDATE
           SET content = $2, updated_at = CURRENT_TIMESTAMP`,
          [guide.title, guide.content, 'manual-entry', guide.source_type, JSON.stringify(guide.metadata)]
        );
        console.log(`✓ Added: ${guide.title}`);
      } catch (error) {
        console.error(`✗ Failed to add ${guide.title}:`, error);
      }
    }

    console.log('\n📊 Adding knowledge graph entities...\n');

    // Basic entities for knowledge graph
    const entities = [
      { name: 'PLA', type: 'material', description: 'Polylactic Acid - Easy to print biodegradable thermoplastic' },
      { name: 'PETG', type: 'material', description: 'Strong, chemical resistant, slightly flexible thermoplastic' },
      { name: 'ABS', type: 'material', description: 'Strong, heat resistant thermoplastic requiring enclosure' },
      { name: 'TPU', type: 'material', description: 'Flexible thermoplastic polyurethane' },
      { name: 'Flow Ratio', type: 'setting', description: 'Extrusion multiplier controlling material flow rate' },
      { name: 'Pressure Advance', type: 'setting', description: 'Compensates for filament compression in hotend' },
      { name: 'Retraction', type: 'setting', description: 'Pulls filament back to prevent oozing' },
      { name: 'Temperature', type: 'setting', description: 'Nozzle temperature for melting filament' },
      { name: 'Stringing', type: 'problem', description: 'Thin wisps of plastic between parts' },
      { name: 'Layer Adhesion', type: 'problem', description: 'Layers not bonding properly' },
      { name: 'Corner Bulging', type: 'problem', description: 'Excess material at sharp corners' },
      { name: 'Under-extrusion', type: 'problem', description: 'Not enough material being extruded' },
      { name: 'Over-extrusion', type: 'problem', description: 'Too much material being extruded' },
    ];

    for (const entity of entities) {
      try {
        await client.query(
          `INSERT INTO kg_entities (name, entity_type, description)
           VALUES ($1, $2, $3)
           ON CONFLICT (name) DO UPDATE
           SET description = $3`,
          [entity.name, entity.type, entity.description]
        );
        console.log(`✓ Added entity: ${entity.name}`);
      } catch (error) {
        console.error(`✗ Failed to add entity ${entity.name}:`, error);
      }
    }

    console.log('\n🔗 Adding entity relationships...\n');

    // Define relationships
    const relationships = [
      { source: 'Retraction', target: 'Stringing', type: 'solves', weight: 0.9 },
      { source: 'Temperature', target: 'Layer Adhesion', type: 'affects', weight: 0.8 },
      { source: 'Pressure Advance', target: 'Corner Bulging', type: 'solves', weight: 0.85 },
      { source: 'Flow Ratio', target: 'Under-extrusion', type: 'solves', weight: 0.9 },
      { source: 'Flow Ratio', target: 'Over-extrusion', type: 'solves', weight: 0.9 },
      { source: 'PLA', target: 'Temperature', type: 'requires', weight: 0.7 },
      { source: 'PETG', target: 'Temperature', type: 'requires', weight: 0.7 },
      { source: 'TPU', target: 'Retraction', type: 'sensitive_to', weight: 0.8 },
    ];

    // Get entity IDs
    const entityMap = new Map();
    const entityResult = await client.query('SELECT id, name FROM kg_entities');
    for (const row of entityResult.rows) {
      entityMap.set(row.name, row.id);
    }

    // Insert relationships
    for (const rel of relationships) {
      const sourceId = entityMap.get(rel.source);
      const targetId = entityMap.get(rel.target);
      
      if (sourceId && targetId) {
        try {
          await client.query(
            `INSERT INTO kg_relationships (source_entity_id, target_entity_id, relationship_type, weight)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (source_entity_id, target_entity_id, relationship_type) DO UPDATE
             SET weight = $4`,
            [sourceId, targetId, rel.type, rel.weight]
          );
          console.log(`✓ Added relationship: ${rel.source} → ${rel.target} (${rel.type})`);
        } catch (error) {
          console.error(`✗ Failed to add relationship:`, error);
        }
      }
    }

    // Final summary
    const finalCount = await client.query('SELECT COUNT(*) FROM documents');
    const entityCount = await client.query('SELECT COUNT(*) FROM kg_entities');
    const relCount = await client.query('SELECT COUNT(*) FROM kg_relationships');

    console.log('\n✅ Initial data population complete!\n');
    console.log(`📚 Documents: ${finalCount.rows[0].count}`);
    console.log(`🔵 Entities: ${entityCount.rows[0].count}`);
    console.log(`🔗 Relationships: ${relCount.rows[0].count}`);
    console.log('\nThe AI assistant now has foundational knowledge to help users!');

  } catch (error) {
    console.error('❌ Error populating data:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the script
populateInitialData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });