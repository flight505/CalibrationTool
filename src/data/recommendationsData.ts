// Auto-generated from OrcaSlicer Comprehensive Settings.md
// Generated on: 2025-07-16T08:58:32.458Z
// Total settings: 119

export interface Setting {
  id: string;
  category: string;
  subCategory: string;
  name: string;
  recommendedValue: string;
  notes: string;
  example: string;
  reference: string;
  tags: string[];
  printerTypes?: string[];
  materials?: string[];
  relatedSettings?: string[];
  calibrationTool?: string;
  critical?: boolean;
  new?: string;
  problemKeywords?: string[];
  fixes?: string[];
  impact?: 1 | 2 | 3 | 4 | 5;
}

export const recommendations: Setting[] = [
  {
  "name": "Max Print Speed X/Y",
  "recommendedValue": "200-500mm/s",
  "notes": "Values are printer-specific examples. Controls maximum feedrate for printing moves. Higher values enable faster printing but require rigid frames and proper acceleration tuning. CoreXY printers handle higher speeds better than Cartesian.",
  "example": "X1C: 500mm/s, Ender3: 200mm/s",
  "reference": "https://github.com/SoftFever/OrcaSlicer/wiki",
  "tags": [
    "speed",
    "performance"
  ],
  "printers": [
    "CoreXY",
    "Cartesian"
  ],
  "materials": [
    "All"
  ],
  "critical": false,
  "category": "Printer Settings",
  "subCategory": "Machine Limits",
  "id": "max-print-speed-xy",
  "problemKeywords": [
    "speed"
  ],
  "fixes": [],
  "impact": 3,
  "relatedSettings": [
    "normal-printing-accel",
    "travel-speed"
  ]
},
  {
  "name": "Max Print Speed Z",
  "recommendedValue": "4-10mm/s",
  "notes": "Z-axis speed affects layer adhesion and print quality. Too fast causes layer separation, too slow wastes time. Most printers are mechanically limited by Z-axis design.",
  "example": "Most printers: 5mm/s",
  "reference": "https://github.com/SoftFever/OrcaSlicer/wiki",
  "tags": [
    "speed",
    "quality"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "All"
  ],
  "critical": false,
  "category": "Printer Settings",
  "subCategory": "Machine Limits",
  "id": "max-print-speed-z",
  "problemKeywords": [
    "adhesion",
    "speed"
  ],
  "fixes": [],
  "impact": 3,
  "relatedSettings": [
    "layer-height"
  ]
},
  {
  "name": "Travel Speed",
  "recommendedValue": "120-200mm/s",
  "notes": "Speed during non-printing moves. Higher speeds reduce print time but may cause ringing/ghosting if printer can't handle rapid direction changes. Balance with acceleration settings. Note: Known bug - travel acceleration not respected after purge lines or during PAUSE/START sequences.",
  "example": "CoreXY: 200mm/s, Cartesian: 150mm/s",
  "reference": "https://github.com/SoftFever/OrcaSlicer/wiki",
  "tags": [
    "speed",
    "time-saving"
  ],
  "printers": [
    "CoreXY",
    "Cartesian"
  ],
  "materials": [
    "All"
  ],
  "critical": false,
  "category": "Printer Settings",
  "subCategory": "Machine Limits",
  "id": "travel-speed",
  "problemKeywords": [
    "speed"
  ],
  "fixes": [
    "print time but may cause ringing/ghosting if printer can't handle rapid direction changes"
  ],
  "impact": 3,
  "relatedSettings": [
    "normal-printing-accel"
  ]
},
  {
  "name": "Normal Printing Accel",
  "recommendedValue": "2000-4000mm/s²",
  "notes": "Primary acceleration for most print moves. Higher values reduce print time but may cause ringing, layer shifting, or poor surface quality. Start conservative and increase gradually.",
  "example": "X1C: 3000mm/s², Ender3: 1000mm/s²",
  "reference": "https://www.obico.io/blog/orcaslicer-comprehensive-calibration-guide/",
  "tags": [
    "speed",
    "calibration",
    "quality"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "All"
  ],
  "critical": true,
  "category": "Printer Settings",
  "subCategory": "Acceleration Settings",
  "id": "normal-printing-accel",
  "problemKeywords": [
    "quality",
    "speed"
  ],
  "fixes": [
    "print time but may cause ringing, layer shifting, or poor surface quality"
  ],
  "impact": 5,
  "relatedSettings": [
    "input-shaping",
    "xy-jerk"
  ]
},
  {
  "name": "Outer Wall Accel",
  "recommendedValue": "1000-2000mm/s²",
  "notes": "Lower acceleration for visible surfaces ensures smooth finish. This is the most critical setting for surface quality - too high causes visible artifacts and dimensional inaccuracy.",
  "example": "Most printers: 1500mm/s²",
  "reference": "https://www.obico.io/blog/orcaslicer-comprehensive-calibration-guide/",
  "tags": [
    "quality",
    "surface-finish",
    "calibration"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "All"
  ],
  "critical": true,
  "category": "Printer Settings",
  "subCategory": "Acceleration Settings",
  "id": "outer-wall-accel",
  "problemKeywords": [
    "quality",
    "accuracy"
  ],
  "fixes": [
    "smooth finish"
  ],
  "impact": 5,
  "relatedSettings": [
    "outer-wall-speed",
    "outer-wall-jerk"
  ]
},
  {
  "name": "Inner Wall Accel",
  "recommendedValue": "3000-8000mm/s²",
  "notes": "Inner walls aren't visible so can use higher acceleration for speed. Should be 2-3x outer wall acceleration. Affects overall print strength and dimensional accuracy.",
  "example": "Direct drive: 5000mm/s²",
  "reference": "https://www.obico.io/blog/orcaslicer-comprehensive-calibration-guide/",
  "tags": [
    "speed",
    "strength"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "All"
  ],
  "critical": false,
  "category": "Printer Settings",
  "subCategory": "Acceleration Settings",
  "id": "inner-wall-accel",
  "problemKeywords": [
    "speed",
    "accuracy"
  ],
  "fixes": [],
  "impact": 3,
  "relatedSettings": [
    "inner-wall-speed"
  ]
},
  {
  "name": "First Layer Accel",
  "recommendedValue": "300-500mm/s²",
  "notes": "Conservative acceleration for bed adhesion. Too high causes layer shifting or poor adhesion. Critical for print success - failed first layer ruins entire print.",
  "example": "All printers: 400mm/s²",
  "reference": "https://www.obico.io/blog/orcaslicer-comprehensive-calibration-guide/",
  "tags": [
    "adhesion",
    "first-layer",
    "critical"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "All"
  ],
  "critical": true,
  "category": "Printer Settings",
  "subCategory": "Acceleration Settings",
  "id": "first-layer-accel",
  "problemKeywords": [
    "adhesion"
  ],
  "fixes": [],
  "impact": 5,
  "relatedSettings": [
    "first-layer-speed",
    "first-layer-temp"
  ]
},
  {
  "name": "Junction Deviation",
  "recommendedValue": "0.01-0.08mm",
  "notes": "Modern replacement for classic jerk. Calculated as JD = 0.4 × (Jerk²/Acceleration). Provides smoother motion control than traditional jerk settings. Lower values for precision, higher for speed.",
  "example": "Klipper: 0.04mm, Marlin: 0.02mm",
  "reference": "https://github.com/SoftFever/OrcaSlicer/wiki",
  "tags": [
    "advanced",
    "precision",
    "klipper"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "All"
  ],
  "critical": false,
  "new": "2.3.1-dev",
  "category": "Printer Settings",
  "subCategory": "Acceleration Settings",
  "id": "junction-deviation",
  "problemKeywords": [
    "speed",
    "accuracy"
  ],
  "fixes": [],
  "impact": 2,
  "relatedSettings": [
    "xy-jerk",
    "normal-printing-accel"
  ]
},
  {
  "name": "XY Jerk",
  "recommendedValue": "8-20mm/s",
  "notes": "Instantaneous velocity change without acceleration phase. Higher values enable sharper corners but cause ringing/ghosting. Tune with acceleration for optimal balance.",
  "example": "Enclosed: 15mm/s, Open: 10mm/s",
  "reference": "https://github.com/SoftFever/OrcaSlicer/wiki/speed_settings_jerk_xy",
  "tags": [
    "speed",
    "corners",
    "quality"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "All"
  ],
  "critical": false,
  "category": "Printer Settings",
  "subCategory": "Jerk Settings",
  "id": "xy-jerk",
  "problemKeywords": [
    "corners",
    "speed"
  ],
  "fixes": [],
  "impact": 3,
  "relatedSettings": [
    "normal-printing-accel",
    "junction-deviation"
  ]
},
  {
  "name": "Outer Wall Jerk",
  "recommendedValue": "6-9mm/s",
  "notes": "Lower jerk for smooth corner transitions on visible surfaces. Too high creates corner bulging and surface artifacts. Most important for print quality on detailed parts.",
  "example": "Quality prints: 7mm/s",
  "reference": "https://github.com/SoftFever/OrcaSlicer/wiki/speed_settings_jerk_xy",
  "tags": [
    "quality",
    "corners",
    "surface-finish"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "All"
  ],
  "critical": false,
  "category": "Printer Settings",
  "subCategory": "Jerk Settings",
  "id": "outer-wall-jerk",
  "problemKeywords": [
    "corners",
    "quality"
  ],
  "fixes": [],
  "impact": 5,
  "relatedSettings": [
    "outer-wall-accel",
    "xy-jerk"
  ]
},
  {
  "name": "Pressure Advance",
  "recommendedValue": "0.02-0.8",
  "notes": "Compensates for nozzle pressure lag during speed changes. Eliminates bulging at corners and gaps on direction changes. Direct drive systems need less due to shorter filament path. Calibrate per filament type.",
  "example": "BMG Direct: 0.05, Bowden: 0.4",
  "reference": "https://github.com/SoftFever/OrcaSlicer/wiki/adaptive-pressure-advance",
  "tags": [
    "calibration",
    "extrusion",
    "corners",
    "critical"
  ],
  "printers": [
    "Direct Drive",
    "Bowden"
  ],
  "materials": [
    "All"
  ],
  "critical": true,
  "category": "Printer Settings",
  "subCategory": "Extruder Configuration",
  "id": "pressure-advance",
  "problemKeywords": [
    "corners",
    "speed"
  ],
  "fixes": [
    "bulging at corners and gaps on direction changes"
  ],
  "impact": 5,
  "calibrationTool": "pressure",
  "relatedSettings": [
    "retraction-length",
    "adaptive-pressure-advance"
  ]
},
  {
  "name": "Adaptive Pressure Advance",
  "recommendedValue": "Enable",
  "notes": "Advanced feature that dynamically adjusts pressure advance based on flow rate, acceleration, and feature type. Provides superior quality across varying print conditions but requires comprehensive calibration.",
  "example": "Requires calibration",
  "reference": "https://github.com/SoftFever/OrcaSlicer/wiki/adaptive-pressure-advance",
  "tags": [
    "advanced",
    "calibration",
    "quality",
    "klipper"
  ],
  "printers": [
    "Klipper"
  ],
  "materials": [
    "All"
  ],
  "critical": false,
  "category": "Printer Settings",
  "subCategory": "Extruder Configuration",
  "id": "adaptive-pressure-advance",
  "problemKeywords": [],
  "fixes": [],
  "impact": 3,
  "calibrationTool": "pressure",
  "relatedSettings": [
    "pressure-advance",
    "input-shaping"
  ]
},
  {
  "name": "Retraction Length",
  "recommendedValue": "0.2-6mm",
  "notes": "Distance filament pulls back to prevent stringing. Direct drive needs less due to short path to nozzle. Bowden systems need more to overcome tube compression. Too much causes gaps, too little causes stringing.",
  "example": "Direct: 0.8mm, Bowden: 4mm",
  "reference": "https://www.obico.io/blog/retraction-test-in-orcaslicer-a-comprehensive-guide/",
  "tags": [
    "calibration",
    "stringing",
    "critical"
  ],
  "printers": [
    "Direct Drive",
    "Bowden"
  ],
  "materials": [
    "All"
  ],
  "critical": true,
  "category": "Printer Settings",
  "subCategory": "Extruder Configuration",
  "id": "retraction-length",
  "problemKeywords": [
    "stringing"
  ],
  "fixes": [
    "stringing"
  ],
  "impact": 5,
  "calibrationTool": "retraction",
  "relatedSettings": [
    "pressure-advance",
    "retraction-speed"
  ]
},
  {
  "name": "Retraction Speed",
  "recommendedValue": "20-60mm/s",
  "notes": "Speed of filament retraction. Too fast can strip flexible filaments or cause extruder skipping. Too slow allows stringing during travel moves. Material dependent - flexible needs slower speeds.",
  "example": "PLA: 45mm/s, TPU: 25mm/s",
  "reference": "https://www.obico.io/blog/retraction-test-in-orcaslicer-a-comprehensive-guide/",
  "tags": [
    "calibration",
    "stringing"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "PLA",
    "PETG",
    "ABS",
    "TPU"
  ],
  "critical": false,
  "category": "Printer Settings",
  "subCategory": "Extruder Configuration",
  "id": "retraction-speed",
  "problemKeywords": [
    "stringing",
    "speed"
  ],
  "fixes": [],
  "impact": 3,
  "calibrationTool": "retraction",
  "relatedSettings": [
    "retraction-length"
  ]
},
  {
  "name": "Z-Hop Height",
  "recommendedValue": "0.1-0.4mm",
  "notes": "Lifts nozzle during travel moves to avoid hitting printed parts. Essential for complex prints with overhangs. Too low still causes collisions, too high wastes time and may cause oozing.",
  "example": "0.2mm for most prints",
  "reference": "https://www.obico.io/blog/z-hop-in-orca-slicer-the-secret-to-perfect-3d-prints/",
  "tags": [
    "collision-avoidance",
    "quality"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "All"
  ],
  "critical": false,
  "category": "Printer Settings",
  "subCategory": "Extruder Configuration",
  "id": "z-hop-height",
  "problemKeywords": [
    "stringing"
  ],
  "fixes": [],
  "impact": 5,
  "relatedSettings": [
    "travel-speed",
    "retraction-length"
  ]
},
  {
  "name": "E-steps/Rotation Distance",
  "recommendedValue": "Calibrate per extruder",
  "notes": "Steps per mm of filament for extruder motor. Fundamental calibration before any other tests. Mark filament, extrude 100mm, measure actual movement. Critical for accurate extrusion.",
  "example": "BMG: 415 steps/mm, Stock: 93 steps/mm",
  "reference": "https://teachingtechyt.github.io/calibration.html",
  "tags": [
    "calibration",
    "extrusion",
    "fundamental",
    "critical"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "All"
  ],
  "critical": true,
  "category": "Printer Settings",
  "subCategory": "Fundamental Calibration",
  "id": "e-stepsrotation-distance",
  "problemKeywords": [],
  "fixes": [],
  "impact": 5,
  "relatedSettings": [
    "flow-ratio",
    "pressure-advance"
  ]
},
  {
  "name": "Z-offset",
  "recommendedValue": "-0.5 to +0.5mm",
  "notes": "Distance between nozzle and bed for perfect first layer. Too high causes poor adhesion, too low causes nozzle drag. Use paper test or automatic probe. Most critical setting for print success.",
  "example": "Typical: -0.15mm",
  "reference": "https://github.com/SoftFever/OrcaSlicer/wiki",
  "tags": [
    "calibration",
    "first-layer",
    "adhesion",
    "critical"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "All"
  ],
  "critical": true,
  "category": "Printer Settings",
  "subCategory": "Fundamental Calibration",
  "id": "z-offset",
  "problemKeywords": [
    "adhesion"
  ],
  "fixes": [],
  "impact": 5,
  "relatedSettings": [
    "first-layer-height",
    "bed-temp"
  ]
},
  {
  "name": "Square Corner Velocity",
  "recommendedValue": "5-20mm/s",
  "notes": "Klipper's alternative to jerk. Speed maintained through corners based on angle. 5mm/s for 90° corners is typical starting point. Higher values increase corner speed but may cause artifacts.",
  "example": "Standard: 5mm/s",
  "reference": "https://www.klipper3d.org/Config_Reference.html",
  "tags": [
    "speed",
    "corners",
    "klipper"
  ],
  "printers": [
    "Klipper"
  ],
  "materials": [
    "All"
  ],
  "critical": false,
  "category": "Printer Settings",
  "subCategory": "Fundamental Calibration",
  "id": "square-corner-velocity",
  "problemKeywords": [
    "corners",
    "quality",
    "speed"
  ],
  "fixes": [],
  "impact": 3,
  "relatedSettings": [
    "xy-jerk",
    "junction-deviation"
  ]
},
  {
  "name": "Minimum Junction Speed",
  "recommendedValue": "0-5mm/s",
  "notes": "Minimum speed for very sharp corners (<18°). Default 0mm/s treats sharp corners as full stops. Increase for faster sharp corner printing at cost of potential artifacts.",
  "example": "Sharp corners: 1mm/s",
  "reference": "https://github.com/SoftFever/OrcaSlicer/wiki",
  "tags": [
    "speed",
    "corners",
    "advanced"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "All"
  ],
  "critical": false,
  "category": "Printer Settings",
  "subCategory": "Fundamental Calibration",
  "id": "minimum-junction-speed",
  "problemKeywords": [
    "corners",
    "quality",
    "speed"
  ],
  "fixes": [],
  "impact": 2,
  "relatedSettings": [
    "junction-deviation",
    "xy-jerk"
  ]
},
  {
  "name": "Input Shaping Frequency X/Y",
  "recommendedValue": "20-150Hz",
  "notes": "Resonance frequency for each axis from input shaping test. Used by firmware to cancel vibrations. Must be calibrated per printer. Enables much higher speeds without quality loss.",
  "example": "X: 42Hz, Y: 38Hz",
  "reference": "https://www.klipper3d.org/Resonance_Compensation.html",
  "tags": [
    "advanced",
    "resonance",
    "klipper",
    "calibration"
  ],
  "printers": [
    "Klipper"
  ],
  "materials": [
    "All"
  ],
  "critical": false,
  "category": "Printer Settings",
  "subCategory": "Fundamental Calibration",
  "id": "input-shaping-frequency-xy",
  "problemKeywords": [
    "speed"
  ],
  "fixes": [],
  "impact": 3,
  "relatedSettings": [
    "input-shaping",
    "normal-printing-accel"
  ]
},
  {
  "name": "Input Shaping Damping X/Y",
  "recommendedValue": "0.02-0.1",
  "notes": "Damping factor for input shaping. Lower values provide better vibration cancellation but may cause overshooting. Typically 0.05-0.07 for most printers. Test with shaping calibration.",
  "example": "X: 0.06, Y: 0.05",
  "reference": "https://www.klipper3d.org/Resonance_Compensation.html",
  "tags": [
    "advanced",
    "resonance",
    "klipper"
  ],
  "printers": [
    "Klipper"
  ],
  "materials": [
    "All"
  ],
  "critical": false,
  "category": "Printer Settings",
  "subCategory": "Fundamental Calibration",
  "id": "input-shaping-damping-xy",
  "problemKeywords": [],
  "fixes": [],
  "impact": 2,
  "relatedSettings": [
    "input-shaping-frequency"
  ]
},
  {
  "name": "Nozzle Temp PLA",
  "recommendedValue": "190-220°C",
  "notes": "Lower temps reduce stringing but may cause under-extrusion. Higher temps improve layer adhesion but increase oozing. Use temperature towers to find optimal balance for each filament brand.",
  "example": "eSUN PLA+: 210°C",
  "reference": "https://www.obico.io/blog/temperature-tower-test-orcaslicer-comprehensive-guide/",
  "tags": [
    "temperature",
    "calibration",
    "critical"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "PLA"
  ],
  "critical": true,
  "category": "Filament Settings",
  "subCategory": "Temperature Control",
  "id": "nozzle-temp-pla",
  "problemKeywords": [
    "stringing",
    "adhesion"
  ],
  "fixes": [
    "stringing but may cause under-extrusion",
    "layer adhesion but increase oozing"
  ],
  "impact": 5,
  "calibrationTool": "temperature",
  "relatedSettings": [
    "first-layer-temp",
    "fan-speed-pla"
  ]
},
  {
  "name": "Nozzle Temp PETG",
  "recommendedValue": "230-250°C",
  "notes": "PETG requires higher temps than PLA for proper flow. Too low causes layer delamination and poor surface finish. Too high increases stringing and thermal degradation.",
  "example": "Overture PETG: 240°C",
  "reference": "https://www.obico.io/blog/temperature-tower-test-orcaslicer-comprehensive-guide/",
  "tags": [
    "temperature",
    "calibration",
    "critical"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "PETG"
  ],
  "critical": true,
  "category": "Filament Settings",
  "subCategory": "Temperature Control",
  "id": "nozzle-temp-petg",
  "problemKeywords": [
    "stringing",
    "quality",
    "strength"
  ],
  "fixes": [],
  "impact": 5,
  "calibrationTool": "temperature",
  "relatedSettings": [
    "first-layer-temp",
    "fan-speed-petg"
  ]
},
  {
  "name": "Nozzle Temp ABS/ASA",
  "recommendedValue": "230-260°C",
  "notes": "High temperature plastics requiring enclosed chambers for best results. Temperature affects layer adhesion, warping tendency, and surface finish. ASA typically runs 5-10°C higher than ABS.",
  "example": "ABS: 245°C",
  "reference": "https://www.obico.io/blog/temperature-tower-test-orcaslicer-comprehensive-guide/",
  "tags": [
    "temperature",
    "calibration",
    "warping",
    "critical"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "ABS",
    "ASA"
  ],
  "critical": true,
  "category": "Filament Settings",
  "subCategory": "Temperature Control",
  "id": "nozzle-temp-absasa",
  "problemKeywords": [
    "warping",
    "adhesion",
    "quality"
  ],
  "fixes": [],
  "impact": 5,
  "calibrationTool": "temperature",
  "relatedSettings": [
    "bed-temp-absasa",
    "chamber-temp"
  ]
},
  {
  "name": "Nozzle Temp TPU",
  "recommendedValue": "230-240°C",
  "notes": "Flexible filaments require careful temperature control. Too low causes poor flow and extruder skipping, too high degrades material. Shore hardness affects optimal temperature.",
  "example": "95A TPU: 235°C",
  "reference": "https://wiki.bambulab.com/en/knowledge-sharing/tpu-printing-guide",
  "tags": [
    "temperature",
    "calibration",
    "critical"
  ],
  "printers": [
    "Direct Drive"
  ],
  "materials": [
    "TPU"
  ],
  "critical": true,
  "new": "2.3.0",
  "category": "Filament Settings",
  "subCategory": "Temperature Control",
  "id": "nozzle-temp-tpu",
  "problemKeywords": [],
  "fixes": [],
  "impact": 5,
  "calibrationTool": "temperature",
  "relatedSettings": [
    "retraction-speed",
    "print-speed"
  ]
},
  {
  "name": "Nozzle Temp Nylon",
  "recommendedValue": "260-280°C",
  "notes": "Requires all-metal hotend. Temperature critical for layer adhesion and strength. Must be dried before use. Higher temps improve strength but increase warping.",
  "example": "Taulman Nylon: 270°C",
  "reference": "https://www.linkedin.com/advice/0/what-best-ways-prevent-warping-nylon-3d-prints-skills-3d-printing",
  "tags": [
    "temperature",
    "calibration",
    "warping",
    "critical"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "Nylon"
  ],
  "critical": true,
  "new": "2.3.0",
  "category": "Filament Settings",
  "subCategory": "Temperature Control",
  "id": "nozzle-temp-nylon",
  "problemKeywords": [
    "warping",
    "adhesion"
  ],
  "fixes": [
    "strength but increase warping"
  ],
  "impact": 5,
  "calibrationTool": "temperature",
  "relatedSettings": [
    "chamber-temp",
    "drying-time"
  ]
},
  {
  "name": "Nozzle Temp PC",
  "recommendedValue": "260-310°C",
  "notes": "Polycarbonate pushes equipment limits. Requires all-metal hotend and heated chamber. Temperature affects strength and clarity.",
  "example": "Prusament PC: 275°C",
  "reference": "https://www.matterhackers.com/articles/how-to-succeed-when-printing-with-polycarbonate-filament",
  "tags": [
    "temperature",
    "calibration",
    "advanced",
    "critical"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "PC"
  ],
  "critical": true,
  "new": "2.3.0",
  "category": "Filament Settings",
  "subCategory": "Temperature Control",
  "id": "nozzle-temp-pc",
  "problemKeywords": [],
  "fixes": [],
  "impact": 5,
  "calibrationTool": "temperature",
  "relatedSettings": [
    "chamber-temp",
    "bed-temp-pc"
  ]
},
  {
  "name": "First Layer Temp",
  "recommendedValue": "+5-10°C above normal",
  "notes": "Higher first layer temperature improves bed adhesion by making plastic more fluid. Critical for preventing warping and ensuring good layer bonding to build surface.",
  "example": "PLA: 215°C if normal is 210°C",
  "reference": "https://www.obico.io/blog/temperature-tower-test-orcaslicer-comprehensive-guide/",
  "tags": [
    "temperature",
    "adhesion",
    "first-layer",
    "critical"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "All"
  ],
  "critical": true,
  "category": "Filament Settings",
  "subCategory": "Temperature Control",
  "id": "first-layer-temp",
  "problemKeywords": [
    "warping",
    "adhesion",
    "strength"
  ],
  "fixes": [
    "bed adhesion by making plastic more fluid"
  ],
  "impact": 5,
  "calibrationTool": "temperature",
  "relatedSettings": [
    "bed-temp",
    "first-layer-speed"
  ]
},
  {
  "name": "Bed Temp PLA",
  "recommendedValue": "50-60°C",
  "notes": "PLA has minimal warping so moderate bed temps sufficient. Glass beds need higher temps than PEI. Too high can cause elephant foot or poor part removal.",
  "example": "Glass bed: 60°C, PEI: 50°C",
  "reference": "https://orca-slicer.org/how-to-set-bed-temperature-in-orca-slicer/",
  "tags": [
    "temperature",
    "adhesion"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "PLA"
  ],
  "critical": false,
  "category": "Filament Settings",
  "subCategory": "Temperature Control",
  "id": "bed-temp-pla",
  "problemKeywords": [
    "warping",
    "adhesion"
  ],
  "fixes": [],
  "impact": 3,
  "calibrationTool": "temperature",
  "relatedSettings": [
    "first-layer-temp"
  ]
},
  {
  "name": "Bed Temp PETG",
  "recommendedValue": "70-80°C",
  "notes": "PETG requires higher bed temps for proper adhesion. Too low causes warping and poor first layer. PETG bonds strongly to many surfaces - use release agent if needed.",
  "example": "Most beds: 75°C",
  "reference": "https://orca-slicer.org/how-to-set-bed-temperature-in-orca-slicer/",
  "tags": [
    "temperature",
    "adhesion",
    "warping"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "PETG"
  ],
  "critical": false,
  "category": "Filament Settings",
  "subCategory": "Temperature Control",
  "id": "bed-temp-petg",
  "problemKeywords": [
    "warping",
    "adhesion"
  ],
  "fixes": [],
  "impact": 3,
  "calibrationTool": "temperature",
  "relatedSettings": [
    "first-layer-temp"
  ]
},
  {
  "name": "Bed Temp ABS/ASA",
  "recommendedValue": "90-110°C",
  "notes": "High bed temps essential for preventing warping in large ABS prints. Enclosed chambers help maintain consistent temperature. Consider thermal expansion of bed surface.",
  "example": "Enclosed: 100°C",
  "reference": "https://orca-slicer.org/how-to-set-bed-temperature-in-orca-slicer/",
  "tags": [
    "temperature",
    "adhesion",
    "warping",
    "critical"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "ABS",
    "ASA"
  ],
  "critical": true,
  "category": "Filament Settings",
  "subCategory": "Temperature Control",
  "id": "bed-temp-absasa",
  "problemKeywords": [
    "warping",
    "adhesion"
  ],
  "fixes": [],
  "impact": 5,
  "calibrationTool": "temperature",
  "relatedSettings": [
    "chamber-temp",
    "first-layer-temp"
  ]
},
  {
  "name": "Bed Temp TPU",
  "recommendedValue": "50-60°C",
  "notes": "Flexible materials need moderate bed temps. Too high causes excessive adhesion and removal difficulty. PEI surfaces work best with TPU.",
  "example": "PEI: 55°C",
  "reference": "https://wiki.bambulab.com/en/knowledge-sharing/tpu-printing-guide",
  "tags": [
    "temperature",
    "adhesion"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "TPU"
  ],
  "critical": false,
  "new": "2.3.0",
  "category": "Filament Settings",
  "subCategory": "Temperature Control",
  "id": "bed-temp-tpu",
  "problemKeywords": [
    "adhesion"
  ],
  "fixes": [],
  "impact": 3,
  "calibrationTool": "temperature",
  "relatedSettings": [
    "first-layer-speed"
  ]
},
  {
  "name": "Bed Temp Nylon",
  "recommendedValue": "60-80°C",
  "notes": "Nylon requires high bed temps to prevent warping. Garolite or specialized surfaces recommended. Adhesives often necessary.",
  "example": "Garolite: 70°C",
  "reference": "https://www.linkedin.com/advice/0/what-best-ways-prevent-warping-nylon-3d-prints-skills-3d-printing",
  "tags": [
    "temperature",
    "adhesion",
    "warping",
    "critical"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "Nylon"
  ],
  "critical": true,
  "new": "2.3.0",
  "category": "Filament Settings",
  "subCategory": "Temperature Control",
  "id": "bed-temp-nylon",
  "problemKeywords": [
    "warping",
    "adhesion"
  ],
  "fixes": [
    "warping"
  ],
  "impact": 5,
  "calibrationTool": "temperature",
  "relatedSettings": [
    "chamber-temp"
  ]
},
  {
  "name": "Bed Temp PC",
  "recommendedValue": "135-150°C",
  "notes": "Extreme bed temps required for polycarbonate. Many printers cannot reach these temps. PC sheet or Garolite surfaces mandatory.",
  "example": "PC sheet: 140°C",
  "reference": "https://www.matterhackers.com/articles/how-to-succeed-when-printing-with-polycarbonate-filament",
  "tags": [
    "temperature",
    "adhesion",
    "warping",
    "advanced",
    "critical"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "PC"
  ],
  "critical": true,
  "new": "2.3.0",
  "category": "Filament Settings",
  "subCategory": "Temperature Control",
  "id": "bed-temp-pc",
  "problemKeywords": [
    "warping",
    "adhesion"
  ],
  "fixes": [],
  "impact": 5,
  "calibrationTool": "temperature",
  "relatedSettings": [
    "chamber-temp"
  ]
},
  {
  "name": "Chamber Temp",
  "recommendedValue": "40-70°C",
  "notes": "Heated chamber reduces warping for engineering materials. Not all printers support this. Critical for ABS/ASA/Nylon/PC success.",
  "example": "ABS: 50°C, PC: 70°C",
  "reference": "https://github.com/SoftFever/OrcaSlicer/wiki",
  "tags": [
    "temperature",
    "warping",
    "advanced"
  ],
  "printers": [
    "Enclosed"
  ],
  "materials": [
    "ABS",
    "ASA",
    "Nylon",
    "PC"
  ],
  "critical": false,
  "category": "Filament Settings",
  "subCategory": "Temperature Control",
  "id": "chamber-temp",
  "problemKeywords": [
    "warping"
  ],
  "fixes": [
    "warping for engineering materials"
  ],
  "impact": 5,
  "calibrationTool": "temperature",
  "relatedSettings": [
    "bed-temp",
    "nozzle-temp"
  ]
},
  {
  "name": "Fan Speed PLA",
  "recommendedValue": "80-100%",
  "notes": "PLA benefits from aggressive cooling to prevent overheating and improve bridging. Maximum cooling after first layer. Reduces stringing and improves overhangs significantly.",
  "example": "Layer 2+: 100%",
  "reference": "https://wiki.bambulab.com/en/software/bambu-studio/auto-cooling",
  "tags": [
    "cooling",
    "quality",
    "bridging"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "PLA"
  ],
  "critical": false,
  "category": "Filament Settings",
  "subCategory": "Cooling Configuration",
  "id": "fan-speed-pla",
  "problemKeywords": [
    "stringing",
    "adhesion"
  ],
  "fixes": [
    "overheating and improve bridging",
    "stringing and improves overhangs significantly",
    "bridging",
    "overhangs significantly"
  ],
  "impact": 4,
  "relatedSettings": [
    "overhang-fan-speed",
    "bridge-fan-speed"
  ]
},
  {
  "name": "Fan Speed PETG",
  "recommendedValue": "30-50%",
  "notes": "Moderate cooling prevents layer adhesion issues while controlling stringing. Too much cooling causes poor layer bonding and warping. Balance quality vs strength.",
  "example": "Layer 3+: 40%",
  "reference": "https://wiki.bambulab.com/en/software/bambu-studio/auto-cooling",
  "tags": [
    "cooling",
    "bonding"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "PETG"
  ],
  "critical": false,
  "category": "Filament Settings",
  "subCategory": "Cooling Configuration",
  "id": "fan-speed-petg",
  "problemKeywords": [
    "stringing",
    "warping",
    "adhesion",
    "strength"
  ],
  "fixes": [
    "layer adhesion issues while controlling stringing"
  ],
  "impact": 3,
  "relatedSettings": [
    "layer-adhesion"
  ]
},
  {
  "name": "Fan Speed ABS/ASA",
  "recommendedValue": "0-20%",
  "notes": "Minimal cooling to prevent warping and layer delamination. Enclosed printers can use slightly more cooling. Focus on chamber temperature control instead.",
  "example": "Enclosed: 0%, Open: 15%",
  "reference": "https://wiki.bambulab.com/en/software/bambu-studio/auto-cooling",
  "tags": [
    "cooling",
    "warping",
    "bonding"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "ABS",
    "ASA"
  ],
  "critical": false,
  "category": "Filament Settings",
  "subCategory": "Cooling Configuration",
  "id": "fan-speed-absasa",
  "problemKeywords": [
    "warping",
    "strength"
  ],
  "fixes": [
    "warping and layer delamination"
  ],
  "impact": 3,
  "relatedSettings": [
    "chamber-temp"
  ]
},
  {
  "name": "Fan Speed TPU",
  "recommendedValue": "0-30%",
  "notes": "Flexible materials need minimal cooling for proper layer bonding. Too much cooling causes poor adhesion and warping. Shore hardness affects optimal cooling.",
  "example": "95A TPU: 20%",
  "reference": "https://wiki.bambulab.com/en/knowledge-sharing/tpu-printing-guide",
  "tags": [
    "cooling",
    "bonding"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "TPU"
  ],
  "critical": false,
  "new": "2.3.0",
  "category": "Filament Settings",
  "subCategory": "Cooling Configuration",
  "id": "fan-speed-tpu",
  "problemKeywords": [
    "warping",
    "adhesion",
    "strength"
  ],
  "fixes": [],
  "impact": 3,
  "relatedSettings": [
    "print-speed",
    "layer-height"
  ]
},
  {
  "name": "Fan Speed Nylon",
  "recommendedValue": "0-10%",
  "notes": "Nylon requires minimal cooling to prevent warping and ensure strength. Any cooling should be gradual. Focus on chamber control.",
  "example": "Enclosed: 0%",
  "reference": "https://www.linkedin.com/advice/0/what-best-ways-prevent-warping-nylon-3d-prints-skills-3d-printing",
  "tags": [
    "cooling",
    "warping",
    "strength"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "Nylon"
  ],
  "critical": false,
  "new": "2.3.0",
  "category": "Filament Settings",
  "subCategory": "Cooling Configuration",
  "id": "fan-speed-nylon",
  "problemKeywords": [
    "warping"
  ],
  "fixes": [
    "warping and ensure strength",
    "strength"
  ],
  "impact": 3,
  "relatedSettings": [
    "chamber-temp"
  ]
},
  {
  "name": "Fan Speed PC",
  "recommendedValue": "0%",
  "notes": "Polycarbonate cannot tolerate any cooling fan. Will crack and delaminate with any fan usage. Chamber temperature control only.",
  "example": "Always: 0%",
  "reference": "https://www.matterhackers.com/articles/how-to-succeed-when-printing-with-polycarbonate-filament",
  "tags": [
    "cooling",
    "critical",
    "warping"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "PC"
  ],
  "critical": true,
  "new": "2.3.0",
  "category": "Filament Settings",
  "subCategory": "Cooling Configuration",
  "id": "fan-speed-pc",
  "problemKeywords": [
    "warping"
  ],
  "fixes": [],
  "impact": 5,
  "relatedSettings": [
    "chamber-temp"
  ]
},
  {
  "name": "First Layer Fan",
  "recommendedValue": "0%",
  "notes": "Always disable cooling for first layer to ensure proper bed adhesion. Any cooling can cause warping, layer separation, or poor surface bonding for all materials.",
  "example": "All materials: 0%",
  "reference": "https://wiki.bambulab.com/en/software/bambu-studio/auto-cooling",
  "tags": [
    "cooling",
    "adhesion",
    "first-layer",
    "critical"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "All"
  ],
  "critical": true,
  "category": "Filament Settings",
  "subCategory": "Cooling Configuration",
  "id": "first-layer-fan",
  "problemKeywords": [
    "warping",
    "adhesion"
  ],
  "fixes": [
    "proper bed adhesion"
  ],
  "impact": 5,
  "relatedSettings": [
    "first-layer-temp",
    "first-layer-speed"
  ]
},
  {
  "name": "Overhang Fan Speed",
  "recommendedValue": "80-100%",
  "notes": "Automatic fan speed increase for steep overhangs improves print quality. OrcaSlicer detects overhang angles and adjusts cooling accordingly. Critical for bridging success.",
  "example": ">50° overhang: 100%",
  "reference": "https://wiki.bambulab.com/en/software/bambu-studio/auto-cooling",
  "tags": [
    "cooling",
    "overhangs",
    "quality",
    "calibration"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "PLA",
    "PETG"
  ],
  "critical": false,
  "category": "Filament Settings",
  "subCategory": "Cooling Configuration",
  "id": "overhang-fan-speed",
  "problemKeywords": [
    "speed"
  ],
  "fixes": [
    "print quality"
  ],
  "impact": 5,
  "relatedSettings": [
    "overhang-speed",
    "bridge-settings"
  ]
},
  {
  "name": "Bridge Fan Speed",
  "recommendedValue": "100%",
  "notes": "Maximum cooling during bridging prevents sagging. OrcaSlicer 2.3.0 adds separate bridge fan control for optimal results. Works with internal bridge settings.",
  "example": "All bridges: 100%",
  "reference": "https://github.com/SoftFever/OrcaSlicer/releases/tag/v2.3.0",
  "tags": [
    "cooling",
    "bridging",
    "quality"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "PLA",
    "PETG"
  ],
  "critical": false,
  "new": "2.3.0",
  "category": "Filament Settings",
  "subCategory": "Cooling Configuration",
  "id": "bridge-fan-speed",
  "problemKeywords": [],
  "fixes": [
    "sagging"
  ],
  "impact": 3,
  "relatedSettings": [
    "bridge-speed",
    "internal-bridge-density"
  ]
},
  {
  "name": "Flow Ratio",
  "recommendedValue": "0.95-1.05",
  "notes": "Multiplier for extrusion amount. Calibrate using flow rate test prints. Too high causes over-extrusion and poor surface quality. Too low causes gaps and weak parts. Material and nozzle dependent.",
  "example": "Start: 1.0, tune via calibration",
  "reference": "https://www.obico.io/blog/flow-rate-calibration-orca-slicer-comprehensive-guide/",
  "tags": [
    "calibration",
    "extrusion",
    "quality",
    "critical"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "All"
  ],
  "critical": true,
  "category": "Filament Settings",
  "subCategory": "Flow and Extrusion",
  "id": "flow-ratio",
  "problemKeywords": [
    "quality",
    "strength"
  ],
  "fixes": [],
  "impact": 5,
  "calibrationTool": "flow",
  "relatedSettings": [
    "pressure-advance",
    "line-width"
  ]
},
  {
  "name": "Max Volumetric Speed PLA",
  "recommendedValue": "12-16mm³/s",
  "notes": "Maximum plastic flow rate to prevent under-extrusion. Depends on hotend capability and nozzle size. Exceeding limit causes gaps and poor quality. Higher for larger nozzles.",
  "example": "0.4mm nozzle: 15mm³/s",
  "reference": "https://www.obico.io/blog/maximum-volumetric-speed-test-in-orcaslicer-a-comprehensive-guide/",
  "tags": [
    "speed",
    "extrusion",
    "calibration"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "PLA"
  ],
  "critical": false,
  "category": "Filament Settings",
  "subCategory": "Flow and Extrusion",
  "id": "max-volumetric-speed-pla",
  "problemKeywords": [
    "quality",
    "speed"
  ],
  "fixes": [
    "under-extrusion"
  ],
  "impact": 3,
  "calibrationTool": "maxspeed",
  "relatedSettings": [
    "nozzle-temp",
    "print-speed"
  ]
},
  {
  "name": "Max Volumetric Speed ABS",
  "recommendedValue": "8-12mm³/s",
  "notes": "ABS requires more heat to melt properly, limiting flow rate. Conservative values prevent under-extrusion at high speeds. Critical for maintaining quality in speed prints.",
  "example": "0.4mm nozzle: 11mm³/s",
  "reference": "https://www.obico.io/blog/maximum-volumetric-speed-test-in-orcaslicer-a-comprehensive-guide/",
  "tags": [
    "speed",
    "extrusion",
    "calibration"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "ABS",
    "ASA"
  ],
  "critical": false,
  "category": "Filament Settings",
  "subCategory": "Flow and Extrusion",
  "id": "max-volumetric-speed-abs",
  "problemKeywords": [
    "speed"
  ],
  "fixes": [
    "under-extrusion at high speeds"
  ],
  "impact": 5,
  "calibrationTool": "maxspeed",
  "relatedSettings": [
    "nozzle-temp",
    "print-speed"
  ]
},
  {
  "name": "Max Volumetric Speed PETG",
  "recommendedValue": "6-10mm³/s",
  "notes": "PETG has highest melt temperature requirement, limiting flow rate most. Essential setting for preventing under-extrusion during fast printing or thick layers.",
  "example": "0.4mm nozzle: 8mm³/s",
  "reference": "https://www.obico.io/blog/maximum-volumetric-speed-test-in-orcaslicer-a-comprehensive-guide/",
  "tags": [
    "speed",
    "extrusion",
    "calibration"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "PETG"
  ],
  "critical": false,
  "category": "Filament Settings",
  "subCategory": "Flow and Extrusion",
  "id": "max-volumetric-speed-petg",
  "problemKeywords": [
    "speed"
  ],
  "fixes": [],
  "impact": 5,
  "calibrationTool": "maxspeed",
  "relatedSettings": [
    "nozzle-temp",
    "print-speed"
  ]
},
  {
  "name": "Max Volumetric Speed TPU",
  "recommendedValue": "1.5-3.75mm³/s",
  "notes": "Flexible materials have very limited flow rates. Shore hardness affects maximum speed. Critical to prevent extruder skipping and jams.",
  "example": "95A TPU: 2.5mm³/s",
  "reference": "https://wiki.bambulab.com/en/knowledge-sharing/tpu-printing-guide",
  "tags": [
    "speed",
    "extrusion",
    "critical"
  ],
  "printers": [
    "Direct Drive"
  ],
  "materials": [
    "TPU"
  ],
  "critical": true,
  "new": "2.3.0",
  "category": "Filament Settings",
  "subCategory": "Flow and Extrusion",
  "id": "max-volumetric-speed-tpu",
  "problemKeywords": [
    "speed"
  ],
  "fixes": [
    "extruder skipping and jams"
  ],
  "impact": 5,
  "calibrationTool": "maxspeed",
  "relatedSettings": [
    "print-speed",
    "nozzle-temp"
  ]
},
  {
  "name": "Max Volumetric Speed Nylon",
  "recommendedValue": "5-8mm³/s",
  "notes": "Nylon requires careful flow control. Too fast causes poor layer bonding. Moisture content significantly affects flow rate.",
  "example": "0.4mm nozzle: 6mm³/s",
  "reference": "Research",
  "tags": [
    "speed",
    "extrusion"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "Nylon"
  ],
  "critical": false,
  "new": "2.3.0",
  "category": "Filament Settings",
  "subCategory": "Flow and Extrusion",
  "id": "max-volumetric-speed-nylon",
  "problemKeywords": [
    "speed",
    "strength"
  ],
  "fixes": [],
  "impact": 4,
  "calibrationTool": "maxspeed",
  "relatedSettings": [
    "drying-time",
    "nozzle-temp"
  ]
},
  {
  "name": "Max Volumetric Speed PC",
  "recommendedValue": "4-6mm³/s",
  "notes": "Polycarbonate has very limited flow due to high viscosity. Conservative rates essential for quality. Requires powerful hotend.",
  "example": "0.4mm nozzle: 5mm³/s",
  "reference": "https://www.matterhackers.com/articles/how-to-succeed-when-printing-with-polycarbonate-filament",
  "tags": [
    "speed",
    "extrusion",
    "advanced"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "PC"
  ],
  "critical": false,
  "new": "2.3.0",
  "category": "Filament Settings",
  "subCategory": "Flow and Extrusion",
  "id": "max-volumetric-speed-pc",
  "problemKeywords": [
    "speed"
  ],
  "fixes": [],
  "impact": 5,
  "calibrationTool": "maxspeed",
  "relatedSettings": [
    "nozzle-temp",
    "print-speed"
  ]
},
  {
  "name": "Drying Time Nylon",
  "recommendedValue": "4-6 hours @ 70-80°C",
  "notes": "Nylon is extremely hygroscopic and must be dried before use. Wet nylon causes poor surface finish, stringing, and weak parts. Use filament dryer or oven.",
  "example": "PA12: 6hr @ 80°C",
  "reference": "https://www.linkedin.com/advice/0/what-best-ways-prevent-warping-nylon-3d-prints-skills-3d-printing",
  "tags": [
    "material-prep",
    "critical"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "Nylon"
  ],
  "critical": true,
  "new": "2.3.0",
  "category": "Filament Settings",
  "subCategory": "Material-Specific Settings",
  "id": "drying-time-nylon",
  "problemKeywords": [
    "stringing",
    "quality",
    "strength"
  ],
  "fixes": [],
  "impact": 5,
  "relatedSettings": [
    "storage-method"
  ]
},
  {
  "name": "Shore Hardness Range",
  "recommendedValue": "75A-95D",
  "notes": "TPU hardness rating affects all print settings. Lower values (75A) are softer but harder to print. 95A is optimal balance. Above 95A behaves more like PETG.",
  "example": "Optimal: 85A-95A",
  "reference": "https://wiki.bambulab.com/en/knowledge-sharing/tpu-printing-guide",
  "tags": [
    "material-property"
  ],
  "printers": [
    "Direct Drive"
  ],
  "materials": [
    "TPU"
  ],
  "critical": false,
  "new": "2.3.0",
  "category": "Filament Settings",
  "subCategory": "Material-Specific Settings",
  "id": "shore-hardness-range",
  "problemKeywords": [],
  "fixes": [],
  "impact": 3,
  "relatedSettings": [
    "print-speed",
    "retraction"
  ]
},
  {
  "name": "Purge Volume",
  "recommendedValue": "100-800mm³",
  "notes": "Amount of material purged during color/material changes. Dark to light needs more purge. Material compatibility affects required volume. Minimize waste with purge objects.",
  "example": "PLA→PLA: 200mm³, ABS→PLA: 600mm³",
  "reference": "https://wiki.bambulab.com/en/software/bambu-studio/multi-color-printing",
  "tags": [
    "multi-material",
    "material-usage"
  ],
  "printers": [
    "AMS",
    "MMU",
    "IDEX"
  ],
  "materials": [
    "All"
  ],
  "critical": false,
  "new": "2.3.0",
  "category": "Filament Settings",
  "subCategory": "Multi-Material Settings",
  "id": "purge-volume",
  "problemKeywords": [],
  "fixes": [],
  "impact": 3,
  "relatedSettings": [
    "prime-tower",
    "wipe-tower"
  ]
},
  {
  "name": "Tool Change Temp",
  "recommendedValue": "-10 to -20°C",
  "notes": "Temperature reduction during tool changes prevents oozing. Applied to inactive extruder. Balance between ooze prevention and restart time.",
  "example": "Idle temp: -15°C",
  "reference": "https://wiki.bambulab.com/en/software/bambu-studio/multi-color-printing",
  "tags": [
    "multi-material",
    "temperature"
  ],
  "printers": [
    "AMS",
    "MMU",
    "IDEX"
  ],
  "materials": [
    "All"
  ],
  "critical": false,
  "new": "2.3.0",
  "category": "Filament Settings",
  "subCategory": "Multi-Material Settings",
  "id": "tool-change-temp",
  "problemKeywords": [
    "stringing"
  ],
  "fixes": [
    "oozing"
  ],
  "impact": 3,
  "calibrationTool": "temperature",
  "relatedSettings": [
    "standby-temperature"
  ]
},
  {
  "name": "Layer Height",
  "recommendedValue": "0.1-0.3mm",
  "notes": "Fundamental quality vs speed tradeoff. Smaller layers give finer detail but longer print times. Limited by nozzle diameter - typically 25-75% of nozzle width for best results.",
  "example": "Detail: 0.12mm, Draft: 0.28mm",
  "reference": "https://github.com/SoftFever/OrcaSlicer/wiki/quality_settings_layer_height",
  "tags": [
    "quality",
    "speed",
    "critical"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "All"
  ],
  "critical": true,
  "category": "Process Settings",
  "subCategory": "Quality Settings",
  "id": "layer-height",
  "problemKeywords": [
    "speed"
  ],
  "fixes": [],
  "impact": 5,
  "relatedSettings": [
    "nozzle-diameter",
    "print-speed"
  ]
},
  {
  "name": "First Layer Height",
  "recommendedValue": "0.2-0.25mm",
  "notes": "Slightly thicker first layer improves bed adhesion and compensates for bed irregularities. Too thick causes elephant foot, too thin causes poor adhesion. Critical for print success.",
  "example": "0.4mm nozzle: 0.24mm",
  "reference": "https://github.com/SoftFever/OrcaSlicer/wiki/quality_settings_layer_height",
  "tags": [
    "quality",
    "adhesion",
    "first-layer",
    "critical"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "All"
  ],
  "critical": true,
  "category": "Process Settings",
  "subCategory": "Quality Settings",
  "id": "first-layer-height",
  "problemKeywords": [
    "adhesion"
  ],
  "fixes": [
    "bed adhesion and compensates for bed irregularities"
  ],
  "impact": 5,
  "relatedSettings": [
    "first-layer-speed",
    "first-layer-temp"
  ]
},
  {
  "name": "Line Width Default",
  "recommendedValue": "105-150%",
  "notes": "Based on nozzle diameter. Wider lines print faster and stronger. Narrower lines give finer detail. 110-120% is sweet spot for strength vs quality. Affects all print features.",
  "example": "0.4mm nozzle: 0.42mm (105%)",
  "reference": "https://github.com/SoftFever/OrcaSlicer/wiki",
  "tags": [
    "quality",
    "extrusion"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "All"
  ],
  "critical": false,
  "category": "Process Settings",
  "subCategory": "Quality Settings",
  "id": "line-width-default",
  "problemKeywords": [],
  "fixes": [],
  "impact": 3,
  "relatedSettings": [
    "flow-ratio",
    "nozzle-diameter"
  ]
},
  {
  "name": "Line Width First Layer",
  "recommendedValue": "105-115%",
  "notes": "Conservative width for reliable bed adhesion. Wider lines help bridge bed irregularities. Too wide causes over-extrusion and poor surface. Foundation for entire print.",
  "example": "0.4mm nozzle: 0.44mm",
  "reference": "https://github.com/SoftFever/OrcaSlicer/wiki",
  "tags": [
    "adhesion",
    "first-layer",
    "quality"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "All"
  ],
  "critical": false,
  "category": "Process Settings",
  "subCategory": "Quality Settings",
  "id": "line-width-first-layer",
  "problemKeywords": [
    "adhesion"
  ],
  "fixes": [],
  "impact": 3,
  "relatedSettings": [
    "first-layer-height"
  ]
},
  {
  "name": "Line Width Outer Wall",
  "recommendedValue": "105-150%",
  "notes": "Controls surface finish and dimensional accuracy. Narrower for precision parts, wider for speed. Most visible setting - directly affects print appearance and tolerances.",
  "example": "Precision: 0.4mm, Standard: 0.45mm",
  "reference": "https://github.com/SoftFever/OrcaSlicer/wiki",
  "tags": [
    "quality",
    "precision",
    "surface-finish"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "All"
  ],
  "critical": false,
  "category": "Process Settings",
  "subCategory": "Quality Settings",
  "id": "line-width-outer-wall",
  "problemKeywords": [
    "quality",
    "speed",
    "accuracy"
  ],
  "fixes": [],
  "impact": 3,
  "relatedSettings": [
    "outer-wall-speed",
    "precise-wall"
  ]
},
  {
  "name": "Line Width Inner Wall",
  "recommendedValue": "120-125%",
  "notes": "Can be wider since not visible. Improves strength and reduces print time. Balances structural integrity with speed. Affects overall part strength significantly.",
  "example": "0.4mm nozzle: 0.5mm",
  "reference": "https://github.com/SoftFever/OrcaSlicer/wiki",
  "tags": [
    "strength",
    "speed"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "All"
  ],
  "critical": false,
  "category": "Process Settings",
  "subCategory": "Quality Settings",
  "id": "line-width-inner-wall",
  "problemKeywords": [
    "speed",
    "strength"
  ],
  "fixes": [
    "print time",
    "strength and reduces print time"
  ],
  "impact": 4,
  "relatedSettings": [
    "wall-count",
    "inner-wall-speed"
  ]
},
  {
  "name": "Line Width Top Surface",
  "recommendedValue": "100-105%",
  "notes": "Controls line width for top surfaces in mm or as percentage of nozzle size. Lower values provide most precision for smooth top surfaces. Higher values may cause over-extrusion on visible surfaces.",
  "example": "0.4mm nozzle: 0.42mm",
  "reference": "https://github.com/SoftFever/OrcaSlicer/wiki/quality_settings_line_width",
  "tags": [
    "quality",
    "surface-finish",
    "precision"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "All"
  ],
  "critical": false,
  "category": "Process Settings",
  "subCategory": "Quality Settings",
  "id": "line-width-top-surface",
  "problemKeywords": [
    "accuracy"
  ],
  "fixes": [],
  "impact": 3,
  "relatedSettings": [
    "top-shells",
    "ironing"
  ]
},
  {
  "name": "Line Width Sparse Infill",
  "recommendedValue": "120-125%",
  "notes": "Line width for sparse infill patterns. Wider lines allow faster infill with same density by increasing spacing between lines. Balances speed with material usage.",
  "example": "0.4mm nozzle: 0.5mm",
  "reference": "https://github.com/SoftFever/OrcaSlicer/wiki/quality_settings_line_width",
  "tags": [
    "speed",
    "infill"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "All"
  ],
  "critical": false,
  "category": "Process Settings",
  "subCategory": "Quality Settings",
  "id": "line-width-sparse-infill",
  "problemKeywords": [
    "speed"
  ],
  "fixes": [],
  "impact": 3,
  "relatedSettings": [
    "infill-density",
    "infill-pattern"
  ]
},
  {
  "name": "Line Width Internal Solid Infill",
  "recommendedValue": "120-125%",
  "notes": "Line width for internal solid infill areas. Can be wider for faster printing since not visible. Affects bonding between solid infill areas and part strength.",
  "example": "0.4mm nozzle: 0.5mm",
  "reference": "https://github.com/SoftFever/OrcaSlicer/wiki/quality_settings_line_width",
  "tags": [
    "strength",
    "speed"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "All"
  ],
  "critical": false,
  "category": "Process Settings",
  "subCategory": "Quality Settings",
  "id": "line-width-internal-solid-infill",
  "problemKeywords": [
    "speed",
    "strength"
  ],
  "fixes": [],
  "impact": 3,
  "relatedSettings": [
    "infill-wall-overlap",
    "topbottom-shells"
  ]
},
  {
  "name": "Line Width Support",
  "recommendedValue": "95-105%",
  "notes": "Line width for support structures. Lower values make supports weaker and easier to remove by reducing layer adhesion. Balance removability with support effectiveness.",
  "example": "0.4mm nozzle: 0.38mm",
  "reference": "https://github.com/SoftFever/OrcaSlicer/wiki/quality_settings_line_width",
  "tags": [
    "support",
    "removal"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "All"
  ],
  "critical": false,
  "category": "Process Settings",
  "subCategory": "Quality Settings",
  "id": "line-width-support",
  "problemKeywords": [
    "adhesion",
    "strength"
  ],
  "fixes": [],
  "impact": 3,
  "relatedSettings": [
    "support-distance",
    "support-type"
  ]
},
  {
  "name": "Seam Position",
  "recommendedValue": "Aligned/Back/Scarf",
  "notes": "Controls where layer changes occur. Aligned creates straight vertical line, Back hides seam, Scarf eliminates seam visibility through overlapping transitions. Most important for surface finish.",
  "example": "Curved objects: Scarf seam",
  "reference": "https://github.com/SoftFever/OrcaSlicer/wiki/quality_settings_seam",
  "tags": [
    "quality",
    "seam",
    "surface-finish"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "All"
  ],
  "critical": false,
  "category": "Process Settings",
  "subCategory": "Seam Settings",
  "id": "seam-position",
  "problemKeywords": [
    "quality"
  ],
  "fixes": [
    "seam visibility through overlapping transitions"
  ],
  "impact": 5,
  "relatedSettings": [
    "scarf-seam",
    "seam-gap"
  ]
},
  {
  "name": "Scarf Seam",
  "recommendedValue": "Enable for curved surfaces",
  "notes": "Revolutionary OrcaSlicer feature that creates angled transitions between layers, virtually eliminating visible seam lines. Requires Inner/Outer/Inner wall ordering and proper flow calibration.",
  "example": "Enable with Inner/Outer/Inner order",
  "reference": "https://www.obico.io/blog/orcaslicer-seam-settings/",
  "tags": [
    "quality",
    "seam",
    "surface-finish",
    "advanced"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "All"
  ],
  "critical": false,
  "category": "Process Settings",
  "subCategory": "Seam Settings",
  "id": "scarf-seam",
  "problemKeywords": [],
  "fixes": [],
  "impact": 2,
  "relatedSettings": [
    "wall-ordering",
    "seam-position"
  ]
},
  {
  "name": "Seam Gap",
  "recommendedValue": "0-15%",
  "notes": "Controls overlap between perimeter start/end points. Larger gaps reduce seam bulging but risk visible gaps. Well-calibrated printers can use larger values safely.",
  "example": "Well-tuned printer: 10-15%",
  "reference": "https://github.com/SoftFever/OrcaSlicer/wiki/quality_settings_seam",
  "tags": [
    "quality",
    "seam",
    "calibration"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "All"
  ],
  "critical": false,
  "category": "Process Settings",
  "subCategory": "Seam Settings",
  "id": "seam-gap",
  "problemKeywords": [
    "corners"
  ],
  "fixes": [
    "seam bulging but risk visible gaps"
  ],
  "impact": 3,
  "relatedSettings": [
    "flow-ratio",
    "pressure-advance"
  ]
},
  {
  "name": "Staggered Inner Seams",
  "recommendedValue": "Enable",
  "notes": "Shifts inner wall seams backward based on depth, forming zigzag pattern. Prevents all seams aligning vertically, creating stronger parts and better water resistance. Essential for mechanical strength.",
  "example": "Enable for stronger parts",
  "reference": "https://github.com/SoftFever/OrcaSlicer/wiki/quality_settings_seam",
  "tags": [
    "seam",
    "strength",
    "quality"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "All"
  ],
  "critical": false,
  "category": "Process Settings",
  "subCategory": "Seam Settings",
  "id": "staggered-inner-seams",
  "problemKeywords": [],
  "fixes": [
    "all seams aligning vertically, creating stronger parts and better water resistance"
  ],
  "impact": 5,
  "relatedSettings": [
    "seam-position",
    "wall-count"
  ]
},
  {
  "name": "Role-based Wipe Speed",
  "recommendedValue": "Enable",
  "notes": "Controls wipe motion speed based on printed feature speed. Ensures nozzle wipes at same speed as feature was printed for consistent results. Reduces seam artifacts and stringing.",
  "example": "Enable for better seams",
  "reference": "https://github.com/SoftFever/OrcaSlicer/wiki/quality_settings_seam#wipe-speed",
  "tags": [
    "seam",
    "quality",
    "speed"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "All"
  ],
  "critical": false,
  "category": "Process Settings",
  "subCategory": "Seam Settings",
  "id": "role-based-wipe-speed",
  "problemKeywords": [
    "stringing",
    "quality",
    "speed"
  ],
  "fixes": [
    "seam artifacts and stringing",
    "nozzle wipes at same speed as feature was printed for consistent results"
  ],
  "impact": 3,
  "relatedSettings": [
    "wipe-speed",
    "outer-wall-speed"
  ]
},
  {
  "name": "Wipe Speed",
  "recommendedValue": "80-100% of travel",
  "notes": "Absolute wipe speed or percentage of travel speed when role-based disabled. Controls how fast nozzle moves over printed area to clean before travel. Too fast may damage surface.",
  "example": "100mm/s or 80% travel",
  "reference": "https://github.com/SoftFever/OrcaSlicer/wiki/quality_settings_seam#wipe-speed",
  "tags": [
    "seam",
    "speed",
    "travel"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "All"
  ],
  "critical": false,
  "category": "Process Settings",
  "subCategory": "Seam Settings",
  "id": "wipe-speed",
  "problemKeywords": [
    "speed"
  ],
  "fixes": [],
  "impact": 3,
  "relatedSettings": [
    "travel-speed",
    "role-based-wipe-speed"
  ]
},
  {
  "name": "Wipe on Loop",
  "recommendedValue": "Enable (Off with Scarf)",
  "notes": "Moves nozzle slightly inward when finishing loop to tuck seam end into part. Reduces seam visibility and cleans nozzle before travel. Disable when using scarf seams.",
  "example": "Enable for traditional seams",
  "reference": "https://github.com/SoftFever/OrcaSlicer/wiki/quality_settings_seam#wipe-on-loopinward-movement",
  "tags": [
    "seam",
    "quality",
    "stringing"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "All"
  ],
  "critical": false,
  "category": "Process Settings",
  "subCategory": "Seam Settings",
  "id": "wipe-on-loop",
  "problemKeywords": [
    "stringing"
  ],
  "fixes": [
    "seam visibility and cleans nozzle before travel"
  ],
  "impact": 3,
  "relatedSettings": [
    "scarf-seam",
    "seam-gap"
  ]
},
  {
  "name": "Wipe Before External",
  "recommendedValue": "Enable (Off with Scarf)",
  "notes": "Performs de-retraction inside model before starting external perimeter. Hides potential over-extrusion from outer surface. Critical for clean visible surfaces.",
  "example": "Enable for better surface",
  "reference": "https://github.com/SoftFever/OrcaSlicer/wiki/quality_settings_seam#wipe-before-external",
  "tags": [
    "seam",
    "quality",
    "surface-finish"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "All"
  ],
  "critical": false,
  "category": "Process Settings",
  "subCategory": "Seam Settings",
  "id": "wipe-before-external",
  "problemKeywords": [],
  "fixes": [],
  "impact": 5,
  "relatedSettings": [
    "retraction",
    "outer-wall-speed"
  ]
},
  {
  "name": "Precise Wall",
  "recommendedValue": "Enable",
  "notes": "Sets overlap between outer and inner walls to zero, dramatically improving dimensional accuracy without compromising strength. Essential for precision parts and tight tolerances.",
  "example": "Enable for dimensional accuracy",
  "reference": "https://github.com/SoftFever/OrcaSlicer/wiki/Precise-wall",
  "tags": [
    "precision",
    "quality",
    "tolerance"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "All"
  ],
  "critical": false,
  "category": "Process Settings",
  "subCategory": "Precision Settings",
  "id": "precise-wall",
  "problemKeywords": [
    "accuracy"
  ],
  "fixes": [],
  "impact": 5,
  "relatedSettings": [
    "xy-compensation",
    "wall-ordering"
  ]
},
  {
  "name": "Arc Fitting",
  "recommendedValue": "Enable (not Klipper)",
  "notes": "Replaces short line segments with G2/G3 arc commands for smoother curves and smaller G-code files. Not recommended for Klipper due to processing overhead. Improves surface finish on curved surfaces.",
  "example": "Marlin: Enable, Klipper: Disable",
  "reference": "https://github.com/SoftFever/OrcaSlicer/wiki/quality_settings_precision",
  "tags": [
    "quality",
    "curves",
    "advanced"
  ],
  "printers": [
    "Marlin",
    "RepRap"
  ],
  "materials": [
    "All"
  ],
  "critical": false,
  "category": "Process Settings",
  "subCategory": "Precision Settings",
  "id": "arc-fitting",
  "problemKeywords": [
    "quality"
  ],
  "fixes": [
    "surface finish on curved surfaces"
  ],
  "impact": 2,
  "relatedSettings": [
    "resolution"
  ]
},
  {
  "name": "XY Compensation",
  "recommendedValue": "-0.1 to +0.1mm",
  "notes": "Compensates for material expansion/shrinkage and extruder characteristics. Positive values enlarge parts, negative shrinks them. Use tolerance test prints to determine correct value.",
  "example": "Tight holes: +0.05mm",
  "reference": "https://github.com/SoftFever/OrcaSlicer/wiki/quality_settings_precision",
  "tags": [
    "precision",
    "tolerance",
    "calibration"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "All"
  ],
  "critical": false,
  "category": "Process Settings",
  "subCategory": "Precision Settings",
  "id": "xy-compensation",
  "problemKeywords": [
    "accuracy"
  ],
  "fixes": [],
  "impact": 3,
  "relatedSettings": [
    "precise-wall",
    "hole-expansion"
  ]
},
  {
  "name": "Polyholes Conversion",
  "recommendedValue": "Enable for mechanical parts",
  "notes": "Converts circular holes to polygonal approximations for better dimensional accuracy. Circular holes tend to print undersized; polyholes compensate for this effect. Essential for precise mechanical fits.",
  "example": "Enable for bolt holes",
  "reference": "https://github.com/SoftFever/OrcaSlicer/wiki",
  "tags": [
    "precision",
    "tolerance",
    "mechanical"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "All"
  ],
  "critical": false,
  "new": "2.3.0",
  "category": "Process Settings",
  "subCategory": "Precision Settings",
  "id": "polyholes-conversion",
  "problemKeywords": [
    "accuracy"
  ],
  "fixes": [],
  "impact": 5,
  "relatedSettings": [
    "xy-compensation",
    "hole-expansion"
  ]
},
  {
  "name": "Precise Z Height",
  "recommendedValue": "Enable",
  "notes": "Adjusts layer height of last 5 layers to match exact object height. Prevents rounding errors where object height doesn't divide evenly by layer height. Essential for precise dimensional parts.",
  "example": "20.1mm object = 20.1mm print",
  "reference": "https://github.com/SoftFever/OrcaSlicer/wiki/precise-z-height",
  "tags": [
    "precision",
    "quality",
    "tolerance"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "All"
  ],
  "critical": false,
  "category": "Process Settings",
  "subCategory": "Precision Settings",
  "id": "precise-z-height",
  "problemKeywords": [
    "accuracy"
  ],
  "fixes": [
    "rounding errors where object height doesn't divide evenly by layer height"
  ],
  "impact": 5,
  "relatedSettings": [
    "layer-height",
    "first-layer-height"
  ]
},
  {
  "name": "Outer Wall Speed",
  "recommendedValue": "30-60mm/s",
  "notes": "Most critical speed setting for surface quality. Slower speeds give better finish but increase print time. Balance quality requirements with time constraints. Visible surface quality depends on this setting.",
  "example": "Quality prints: 40mm/s",
  "reference": "https://www.obico.io/blog/speed-test-in-orcaslicer-vfa-a-comprehensive-guide/",
  "tags": [
    "speed",
    "quality",
    "surface-finish",
    "calibration"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "All"
  ],
  "critical": true,
  "category": "Process Settings",
  "subCategory": "Speed Settings",
  "id": "outer-wall-speed",
  "problemKeywords": [
    "quality",
    "speed"
  ],
  "fixes": [],
  "impact": 5,
  "relatedSettings": [
    "outer-wall-accel",
    "max-volumetric-speed"
  ]
},
  {
  "name": "Inner Wall Speed",
  "recommendedValue": "60-120mm/s",
  "notes": "Can be faster than outer walls since not visible. Affects structural integrity and overall print time. Should complement outer wall speed for smooth tool path transitions.",
  "example": "Standard: 80mm/s",
  "reference": "https://www.obico.io/blog/speed-test-in-orcaslicer-vfa-a-comprehensive-guide/",
  "tags": [
    "speed",
    "time-saving"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "All"
  ],
  "critical": false,
  "category": "Process Settings",
  "subCategory": "Speed Settings",
  "id": "inner-wall-speed",
  "problemKeywords": [
    "speed"
  ],
  "fixes": [],
  "impact": 3,
  "relatedSettings": [
    "inner-wall-accel"
  ]
},
  {
  "name": "Infill Speed",
  "recommendedValue": "80-150mm/s",
  "notes": "Fastest print feature since internal and less critical for quality. Limited by volumetric flow rate and printer capability. Major factor in total print time reduction.",
  "example": "High-end printers: 120mm/s",
  "reference": "https://www.obico.io/blog/speed-test-in-orcaslicer-vfa-a-comprehensive-guide/",
  "tags": [
    "speed",
    "time-saving"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "All"
  ],
  "critical": false,
  "category": "Process Settings",
  "subCategory": "Speed Settings",
  "id": "infill-speed",
  "problemKeywords": [
    "speed"
  ],
  "fixes": [],
  "impact": 5,
  "relatedSettings": [
    "max-volumetric-speed",
    "infill-pattern"
  ]
},
  {
  "name": "First Layer Speed",
  "recommendedValue": "20-30mm/s",
  "notes": "Critical for bed adhesion success. Slow speed ensures proper layer bonding and accommodation of bed irregularities. Failed first layer ruins entire print regardless of other settings.",
  "example": "All features: 25mm/s",
  "reference": "https://www.obico.io/blog/speed-test-in-orcaslicer-vfa-a-comprehensive-guide/",
  "tags": [
    "speed",
    "adhesion",
    "first-layer",
    "critical"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "All"
  ],
  "critical": true,
  "category": "Process Settings",
  "subCategory": "Speed Settings",
  "id": "first-layer-speed",
  "problemKeywords": [
    "adhesion",
    "speed",
    "strength"
  ],
  "fixes": [
    "proper layer bonding and accommodation of bed irregularities"
  ],
  "impact": 5,
  "relatedSettings": [
    "first-layer-accel",
    "first-layer-height"
  ]
},
  {
  "name": "Bridge Speed",
  "recommendedValue": "20-40mm/s",
  "notes": "Slower speeds during bridging prevent sagging. Must balance with cooling for optimal results. OrcaSlicer 2.3.0 adds enhanced bridge control.",
  "example": "PLA: 30mm/s",
  "reference": "https://github.com/SoftFever/OrcaSlicer/releases/tag/v2.3.0",
  "tags": [
    "speed",
    "bridging",
    "quality"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "PLA",
    "PETG"
  ],
  "critical": false,
  "new": "2.3.0",
  "category": "Process Settings",
  "subCategory": "Speed Settings",
  "id": "bridge-speed",
  "problemKeywords": [
    "speed"
  ],
  "fixes": [
    "sagging"
  ],
  "impact": 3,
  "relatedSettings": [
    "bridge-fan-speed",
    "internal-bridge-density"
  ]
},
  {
  "name": "Overhang Speed 10-25%",
  "recommendedValue": "80-100% of outer wall",
  "notes": "Speed for slight overhangs. Can maintain normal speed for minimal angles. Part of OrcaSlicer's granular overhang control system.",
  "example": "90% of outer wall speed",
  "reference": "https://github.com/SoftFever/OrcaSlicer/wiki",
  "tags": [
    "speed",
    "overhangs",
    "quality"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "All"
  ],
  "critical": false,
  "new": "2.3.0",
  "category": "Process Settings",
  "subCategory": "Speed Settings",
  "id": "overhang-speed-10-25",
  "problemKeywords": [
    "speed"
  ],
  "fixes": [],
  "impact": 3,
  "relatedSettings": [
    "overhang-fan-speed"
  ]
},
  {
  "name": "Overhang Speed 25-50%",
  "recommendedValue": "60-80% of outer wall",
  "notes": "Moderate overhang speed reduction. Balances quality with print time. Prevents sagging on medium overhangs.",
  "example": "70% of outer wall speed",
  "reference": "https://github.com/SoftFever/OrcaSlicer/wiki",
  "tags": [
    "speed",
    "overhangs",
    "quality"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "All"
  ],
  "critical": false,
  "new": "2.3.0",
  "category": "Process Settings",
  "subCategory": "Speed Settings",
  "id": "overhang-speed-25-50",
  "problemKeywords": [
    "speed"
  ],
  "fixes": [
    "sagging on medium overhangs"
  ],
  "impact": 3,
  "relatedSettings": [
    "overhang-fan-speed"
  ]
},
  {
  "name": "Overhang Speed 50-75%",
  "recommendedValue": "40-60% of outer wall",
  "notes": "Significant speed reduction for steep overhangs. Critical for preventing failures. Works with increased cooling.",
  "example": "50% of outer wall speed",
  "reference": "https://github.com/SoftFever/OrcaSlicer/wiki",
  "tags": [
    "speed",
    "overhangs",
    "quality"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "All"
  ],
  "critical": false,
  "new": "2.3.0",
  "category": "Process Settings",
  "subCategory": "Speed Settings",
  "id": "overhang-speed-50-75",
  "problemKeywords": [
    "speed"
  ],
  "fixes": [],
  "impact": 5,
  "relatedSettings": [
    "overhang-fan-speed"
  ]
},
  {
  "name": "Overhang Speed 75-100%",
  "recommendedValue": "20-40% of outer wall",
  "notes": "Maximum speed reduction for near-horizontal overhangs. Essential for bridging transitions. Requires maximum cooling.",
  "example": "30% of outer wall speed",
  "reference": "https://github.com/SoftFever/OrcaSlicer/wiki",
  "tags": [
    "speed",
    "overhangs",
    "bridging",
    "quality"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "All"
  ],
  "critical": false,
  "new": "2.3.0",
  "category": "Process Settings",
  "subCategory": "Speed Settings",
  "id": "overhang-speed-75-100",
  "problemKeywords": [
    "speed"
  ],
  "fixes": [],
  "impact": 5,
  "relatedSettings": [
    "bridge-speed",
    "overhang-fan-speed"
  ]
},
  {
  "name": "TPU Print Speed",
  "recommendedValue": "20-35mm/s",
  "notes": "Flexible materials require slow, consistent speeds. Too fast causes extruder skipping and poor quality. Shore hardness affects maximum speed.",
  "example": "95A TPU: 25mm/s",
  "reference": "https://wiki.bambulab.com/en/knowledge-sharing/tpu-printing-guide",
  "tags": [
    "speed",
    "critical"
  ],
  "printers": [
    "Direct Drive"
  ],
  "materials": [
    "TPU"
  ],
  "critical": true,
  "new": "2.3.0",
  "category": "Process Settings",
  "subCategory": "Speed Settings",
  "id": "tpu-print-speed",
  "problemKeywords": [
    "quality",
    "speed"
  ],
  "fixes": [],
  "impact": 5,
  "relatedSettings": [
    "max-volumetric-speed-tpu"
  ]
},
  {
  "name": "PC Print Speed",
  "recommendedValue": "15-30mm/s",
  "notes": "Polycarbonate requires very slow speeds for quality. High viscosity limits print speed severely. Temperature stability critical.",
  "example": "Standard: 20mm/s",
  "reference": "https://www.matterhackers.com/articles/how-to-succeed-when-printing-with-polycarbonate-filament",
  "tags": [
    "speed",
    "advanced"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "PC"
  ],
  "critical": false,
  "new": "2.3.0",
  "category": "Process Settings",
  "subCategory": "Speed Settings",
  "id": "pc-print-speed",
  "problemKeywords": [
    "speed"
  ],
  "fixes": [],
  "impact": 5,
  "relatedSettings": [
    "max-volumetric-speed-pc"
  ]
},
  {
  "name": "Wall Count",
  "recommendedValue": "2-4 walls",
  "notes": "Directly affects part strength, surface finish, and print time. More walls increase strength but slow printing. Minimum 2 for decent quality, 3-4 for functional parts requiring strength.",
  "example": "Decorative: 2, Functional: 3-4",
  "reference": "https://github.com/SoftFever/OrcaSlicer/wiki/strength_settings_walls",
  "tags": [
    "strength",
    "quality",
    "structure"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "All"
  ],
  "critical": false,
  "category": "Process Settings",
  "subCategory": "Wall Configuration",
  "id": "wall-count",
  "problemKeywords": [
    "quality",
    "speed",
    "strength"
  ],
  "fixes": [],
  "impact": 3,
  "relatedSettings": [
    "infill-density",
    "topbottom-shells"
  ]
},
  {
  "name": "Wall Ordering",
  "recommendedValue": "Inner/Outer/Inner",
  "notes": "Print sequence affects surface quality and dimensional accuracy. Inner/Outer/Inner sandwiches outer wall for best surface finish and accuracy. Critical for precision parts.",
  "example": "Always use for precision",
  "reference": "https://github.com/SoftFever/OrcaSlicer/wiki/strength_settings_walls",
  "tags": [
    "quality",
    "precision",
    "surface-finish"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "All"
  ],
  "critical": false,
  "category": "Process Settings",
  "subCategory": "Wall Configuration",
  "id": "wall-ordering",
  "problemKeywords": [
    "quality",
    "accuracy"
  ],
  "fixes": [],
  "impact": 5,
  "relatedSettings": [
    "scarf-seam",
    "precise-wall"
  ]
},
  {
  "name": "Sandwich Mode",
  "recommendedValue": "Enable",
  "notes": "OrcaSlicer's unique Inner/Outer/Inner wall ordering. Improves surface finish by supporting outer wall from both sides. Reduces visible defects and improves dimensional accuracy.",
  "example": "Enable for quality",
  "reference": "https://github.com/SoftFever/OrcaSlicer/releases",
  "tags": [
    "quality",
    "surface-finish",
    "advanced"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "All"
  ],
  "critical": false,
  "new": "2.3.0",
  "category": "Process Settings",
  "subCategory": "Wall Configuration",
  "id": "sandwich-mode",
  "problemKeywords": [
    "quality",
    "accuracy"
  ],
  "fixes": [
    "visible defects and improves dimensional accuracy",
    "surface finish by supporting outer wall from both sides",
    "dimensional accuracy"
  ],
  "impact": 2,
  "relatedSettings": [
    "wall-ordering",
    "outer-wall-speed"
  ]
},
  {
  "name": "Top/Bottom Shells",
  "recommendedValue": "3-5 layers",
  "notes": "Solid layers on top and bottom surfaces. More shells give stronger surfaces but increase print time. Must prevent infill show-through on visible surfaces. Layer height dependent.",
  "example": "0.2mm layers: 4 shells",
  "reference": "https://github.com/SoftFever/OrcaSlicer/wiki/strength_settings_top_bottom_shells",
  "tags": [
    "strength",
    "quality",
    "surface-finish"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "All"
  ],
  "critical": false,
  "category": "Process Settings",
  "subCategory": "Wall Configuration",
  "id": "topbottom-shells",
  "problemKeywords": [
    "speed"
  ],
  "fixes": [
    "infill show-through on visible surfaces"
  ],
  "impact": 3,
  "relatedSettings": [
    "layer-height",
    "monotonic-infill"
  ]
},
  {
  "name": "First Layer Minimum Wall Width",
  "recommendedValue": "Match nozzle diameter",
  "notes": "Minimum wall width for first layer only. Matching nozzle diameter improves adhesion and ensures stable base walls. Wider first layer walls bridge bed irregularities better.",
  "example": "0.4mm nozzle: 0.4mm",
  "reference": "https://github.com/SoftFever/OrcaSlicer/wiki/quality_settings_wall_generator#first-layer-minimum-wall-width",
  "tags": [
    "adhesion",
    "first-layer",
    "walls"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "All"
  ],
  "critical": false,
  "category": "Process Settings",
  "subCategory": "Wall Configuration",
  "id": "first-layer-minimum-wall-width",
  "problemKeywords": [
    "adhesion"
  ],
  "fixes": [
    "adhesion and ensures stable base walls",
    "stable base walls"
  ],
  "impact": 3,
  "relatedSettings": [
    "first-layer-height",
    "line-width-first-layer"
  ]
},
  {
  "name": "Infill Density",
  "recommendedValue": "15-30%",
  "notes": "Balances strength, weight, and print time. Higher density increases strength but uses more material and time. Consider application requirements - decorative vs functional parts.",
  "example": "Decorative: 15%, Functional: 25%",
  "reference": "https://github.com/SoftFever/OrcaSlicer/wiki/strength_settings_infill",
  "tags": [
    "strength",
    "material-usage",
    "time-saving"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "All"
  ],
  "critical": false,
  "category": "Process Settings",
  "subCategory": "Infill Configuration",
  "id": "infill-density",
  "problemKeywords": [
    "speed"
  ],
  "fixes": [],
  "impact": 3,
  "relatedSettings": [
    "wall-count",
    "infill-pattern"
  ]
},
  {
  "name": "Infill Pattern",
  "recommendedValue": "Gyroid/3D Honeycomb",
  "notes": "Pattern affects strength, flexibility, and print time. Gyroid provides isotropic strength ideal for stressed parts. 3D Honeycomb prints faster with good strength. Lightning infill for minimal strength needs.",
  "example": "Flexible parts: Gyroid",
  "reference": "https://github.com/SoftFever/OrcaSlicer/wiki/strength_settings_infill",
  "tags": [
    "strength",
    "pattern",
    "structure"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "All"
  ],
  "critical": false,
  "category": "Process Settings",
  "subCategory": "Infill Configuration",
  "id": "infill-pattern",
  "problemKeywords": [
    "speed"
  ],
  "fixes": [],
  "impact": 3,
  "relatedSettings": [
    "infill-density",
    "infill-speed"
  ]
},
  {
  "name": "2D Lattice Infill",
  "recommendedValue": "Enable for lightweight",
  "notes": "New pattern found in Process Settings > Strength > Infill > Sparse infill pattern > 2D lattice. Optimized for model aircraft and lightweight structures. Provides excellent strength-to-weight ratio. Works best with low densities (5-15%).",
  "example": "RC planes: 10% lattice",
  "reference": "https://github.com/SoftFever/OrcaSlicer/releases/tag/v2.3.0",
  "tags": [
    "pattern",
    "lightweight",
    "advanced"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "PLA",
    "PETG"
  ],
  "critical": false,
  "new": "2.3.1-dev",
  "category": "Process Settings",
  "subCategory": "Infill Configuration",
  "id": "2d-lattice-infill",
  "problemKeywords": [],
  "fixes": [],
  "impact": 2,
  "relatedSettings": [
    "infill-density"
  ]
},
  {
  "name": "Infill Wall Overlap",
  "recommendedValue": "10-15%",
  "notes": "Bonding between infill and walls. Too little causes delamination, too much causes over-extrusion. Critical for part strength - failed bond creates weak points in stressed parts.",
  "example": "Standard: 12%",
  "reference": "https://github.com/SoftFever/OrcaSlicer/wiki/strength_settings_infill",
  "tags": [
    "strength",
    "bonding"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "All"
  ],
  "critical": false,
  "category": "Process Settings",
  "subCategory": "Infill Configuration",
  "id": "infill-wall-overlap",
  "problemKeywords": [
    "strength"
  ],
  "fixes": [],
  "impact": 5,
  "relatedSettings": [
    "wall-count",
    "flow-ratio"
  ]
},
  {
  "name": "Top Solid Infill/Wall Overlap",
  "recommendedValue": "25-30%",
  "notes": "Top solid infill enlarged to overlap walls for better bonding and minimize pinholes. Percentage relative to sparse infill line width. Too high causes over-extrusion, too low leaves gaps.",
  "example": "Standard: 25%",
  "reference": "https://github.com/SoftFever/OrcaSlicer/wiki/strength_settings_top_bottom_shells#top-and-bottom-shells",
  "tags": [
    "quality",
    "bonding",
    "surface-finish"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "All"
  ],
  "critical": false,
  "category": "Process Settings",
  "subCategory": "Infill Configuration",
  "id": "top-solid-infillwall-overlap",
  "problemKeywords": [],
  "fixes": [],
  "impact": 3,
  "relatedSettings": [
    "infill-wall-overlap",
    "top-shells"
  ]
},
  {
  "name": "Support Angle",
  "recommendedValue": "45-50°",
  "notes": "Overhang angle requiring support. Steeper angles (lower numbers) need more support but ensure better quality. Consider printer capability and post-processing time when setting.",
  "example": "Most prints: 45°",
  "reference": "https://wiki.bambulab.com/en/software/bambu-studio/support-painting",
  "tags": [
    "support",
    "overhangs",
    "quality"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "All"
  ],
  "critical": false,
  "category": "Process Settings",
  "subCategory": "Support Settings",
  "id": "support-angle",
  "problemKeywords": [],
  "fixes": [
    "better quality"
  ],
  "impact": 3,
  "relatedSettings": [
    "overhang-speed",
    "support-type"
  ]
},
  {
  "name": "Support Distance",
  "recommendedValue": "0.2mm",
  "notes": "Gap between support and part. Equal to layer height provides easy removal while maintaining support effectiveness. Too close bonds permanently, too far provides inadequate support.",
  "example": "0.2mm layers: 0.2mm distance",
  "reference": "https://wiki.bambulab.com/en/software/bambu-studio/support-painting",
  "tags": [
    "support",
    "removal"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "All"
  ],
  "critical": false,
  "category": "Process Settings",
  "subCategory": "Support Settings",
  "id": "support-distance",
  "problemKeywords": [],
  "fixes": [],
  "impact": 3,
  "relatedSettings": [
    "layer-height",
    "support-interface"
  ]
},
  {
  "name": "Support Type",
  "recommendedValue": "Tree/Normal",
  "notes": "Tree supports provide better surface finish and easier removal but may fail on complex geometry. Normal supports more reliable but leave marks. Choose based on part complexity.",
  "example": "Complex geometry: Normal",
  "reference": "https://wiki.bambulab.com/en/software/bambu-studio/support-painting",
  "tags": [
    "support",
    "quality",
    "removal"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "All"
  ],
  "critical": false,
  "category": "Process Settings",
  "subCategory": "Support Settings",
  "id": "support-type",
  "problemKeywords": [
    "quality"
  ],
  "fixes": [],
  "impact": 3,
  "relatedSettings": [
    "support-angle",
    "support-distance"
  ]
},
  {
  "name": "Support Interface",
  "recommendedValue": "Enable",
  "notes": "Dense layers between support and part improve surface quality. Adds print time but significantly improves supported surface finish. Essential for visible supported surfaces.",
  "example": "Quality prints: Enable",
  "reference": "https://wiki.bambulab.com/en/software/bambu-studio/support-painting",
  "tags": [
    "support",
    "quality",
    "surface-finish"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "All"
  ],
  "critical": false,
  "category": "Process Settings",
  "subCategory": "Support Settings",
  "id": "support-interface",
  "problemKeywords": [
    "quality",
    "speed"
  ],
  "fixes": [
    "surface quality",
    "supported surface finish"
  ],
  "impact": 5,
  "relatedSettings": [
    "support-distance",
    "interface-layers"
  ]
},
  {
  "name": "Internal Bridge Density",
  "recommendedValue": "50-100%",
  "notes": "Density of internal bridging areas. Higher density improves top surface quality but increases print time. New in OrcaSlicer 2.3.0 for better internal geometry.",
  "example": "Standard: 75%",
  "reference": "https://github.com/SoftFever/OrcaSlicer/releases/tag/v2.3.0",
  "tags": [
    "bridging",
    "quality",
    "internal"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "All"
  ],
  "critical": false,
  "new": "2.3.0",
  "category": "Process Settings",
  "subCategory": "Bridge Settings",
  "id": "internal-bridge-density",
  "problemKeywords": [
    "quality",
    "speed"
  ],
  "fixes": [
    "top surface quality but increases print time"
  ],
  "impact": 3,
  "relatedSettings": [
    "bridge-speed",
    "bridge-fan-speed"
  ]
},
  {
  "name": "Bridge Angle Override",
  "recommendedValue": "0-90°",
  "notes": "Override automatic bridge angle detection. Useful for specific geometries where auto-detection fails. Part of enhanced bridge control in 2.3.0.",
  "example": "Auto: 0° (disabled)",
  "reference": "https://github.com/SoftFever/OrcaSlicer/releases/tag/v2.3.0",
  "tags": [
    "bridging",
    "advanced"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "All"
  ],
  "critical": false,
  "new": "2.3.0",
  "category": "Process Settings",
  "subCategory": "Bridge Settings",
  "id": "bridge-angle-override",
  "problemKeywords": [],
  "fixes": [],
  "impact": 2,
  "relatedSettings": [
    "bridge-speed"
  ]
},
  {
  "name": "Fuzzy Skin",
  "recommendedValue": "Perlin/Billow/Ridged/Voronoi",
  "notes": "Creates textured surface finish. OrcaSlicer 2.3.0 adds structured noise patterns beyond random. Perlin for organic, Voronoi for cellular, Ridged for rough textures.",
  "example": "Organic look: Perlin",
  "reference": "https://github.com/SoftFever/OrcaSlicer/releases/tag/v2.3.0",
  "tags": [
    "surface-finish",
    "aesthetic",
    "advanced"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "All"
  ],
  "critical": false,
  "new": "2.3.0",
  "category": "Process Settings",
  "subCategory": "Special Effects",
  "id": "fuzzy-skin",
  "problemKeywords": [
    "quality"
  ],
  "fixes": [],
  "impact": 2,
  "relatedSettings": [
    "fuzzy-skin-thickness"
  ]
},
  {
  "name": "Fuzzy Skin Thickness",
  "recommendedValue": "0.1-0.3mm",
  "notes": "Distance of fuzzy skin displacement. Larger values create more pronounced texture but may affect dimensional accuracy. Balance aesthetics with function.",
  "example": "Standard: 0.2mm",
  "reference": "https://github.com/SoftFever/OrcaSlicer/releases/tag/v2.3.0",
  "tags": [
    "surface-finish",
    "aesthetic"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "All"
  ],
  "critical": false,
  "category": "Process Settings",
  "subCategory": "Special Effects",
  "id": "fuzzy-skin-thickness",
  "problemKeywords": [
    "accuracy"
  ],
  "fixes": [],
  "impact": 3,
  "relatedSettings": [
    "fuzzy-skin",
    "fuzzy-skin-density"
  ]
},
  {
  "name": "Ironing",
  "recommendedValue": "Enable for top surfaces",
  "notes": "Smooths top layers by remelting with hot nozzle. Significantly improves surface finish but adds considerable time. Best for visible flat surfaces.",
  "example": "Smooth tops: Enable",
  "reference": "https://github.com/SoftFever/OrcaSlicer/wiki",
  "tags": [
    "surface-finish",
    "quality",
    "time-consuming"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "PLA",
    "PETG"
  ],
  "critical": false,
  "category": "Process Settings",
  "subCategory": "Special Effects",
  "id": "ironing",
  "problemKeywords": [
    "quality"
  ],
  "fixes": [
    "surface finish but adds considerable time"
  ],
  "impact": 4,
  "relatedSettings": [
    "ironing-speed",
    "top-shells"
  ]
},
  {
  "name": "Variable Layer Height",
  "recommendedValue": "Enable",
  "notes": "Automatically adjusts layer height based on model geometry. Provides smooth curves without sacrificing speed on flat areas. Excellent for organic shapes and detailed models with varying complexity.",
  "example": "Complex curves: Enable",
  "reference": "https://www.obico.io/blog/orca-slicer-adaptive-and-variable-layer-height-guide-smoother-3d-prints/",
  "tags": [
    "quality",
    "speed",
    "advanced",
    "adaptive"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "All"
  ],
  "critical": false,
  "category": "Process Settings",
  "subCategory": "Advanced Features",
  "id": "variable-layer-height",
  "problemKeywords": [
    "speed"
  ],
  "fixes": [],
  "impact": 2,
  "relatedSettings": [
    "layer-height",
    "print-speed"
  ]
},
  {
  "name": "Monotonic Infill",
  "recommendedValue": "Enable for top surfaces",
  "notes": "Eliminates visible infill lines bleeding through top surfaces by ensuring consistent infill direction. Critical for professional appearance on visible top surfaces. Slight time penalty.",
  "example": "Visible top surfaces: Enable",
  "reference": "https://github.com/SoftFever/OrcaSlicer/wiki",
  "tags": [
    "quality",
    "surface-finish",
    "top-surface"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "All"
  ],
  "critical": false,
  "category": "Process Settings",
  "subCategory": "Advanced Features",
  "id": "monotonic-infill",
  "problemKeywords": [],
  "fixes": [
    "visible infill lines bleeding through top surfaces by ensuring consistent infill direction"
  ],
  "impact": 5,
  "relatedSettings": [
    "top-shells",
    "infill-pattern"
  ]
},
  {
  "name": "Input Shaping (Klipper)",
  "recommendedValue": "Enable if available",
  "notes": "Compensates for mechanical vibrations at high speeds by predicting and countering resonance frequencies. Enables much higher print speeds without quality loss. Requires firmware tuning first.",
  "example": "Requires firmware tuning",
  "reference": "https://www.klipper3d.org/Resonance_Compensation.html",
  "tags": [
    "speed",
    "quality",
    "advanced",
    "klipper",
    "calibration"
  ],
  "printers": [
    "Klipper"
  ],
  "materials": [
    "All"
  ],
  "critical": false,
  "category": "Process Settings",
  "subCategory": "Advanced Features",
  "id": "input-shaping-klipper",
  "problemKeywords": [
    "speed"
  ],
  "fixes": [],
  "impact": 3,
  "relatedSettings": [
    "normal-printing-accel",
    "print-speed"
  ]
},
  {
  "name": "Sequential Printing",
  "recommendedValue": "Enable for batches",
  "notes": "Prints objects one at a time to completion. Reduces stringing between parts and allows partial batch recovery if failure occurs. Requires clearance calculation.",
  "example": "Small parts: Enable",
  "reference": "https://github.com/SoftFever/OrcaSlicer/wiki",
  "tags": [
    "workflow",
    "batch",
    "advanced"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "All"
  ],
  "critical": false,
  "category": "Process Settings",
  "subCategory": "Advanced Features",
  "id": "sequential-printing",
  "problemKeywords": [
    "stringing"
  ],
  "fixes": [
    "stringing between parts and allows partial batch recovery if failure occurs"
  ],
  "impact": 2,
  "relatedSettings": [
    "print-sequence",
    "clearance"
  ]
},
  {
  "name": "Prime Tower",
  "recommendedValue": "Enable for multi-material",
  "notes": "Purges material during color/material changes. Syncs with object height to minimize waste. Essential for clean color transitions in multi-material prints.",
  "example": "Multi-color: Enable",
  "reference": "https://wiki.bambulab.com/en/software/bambu-studio/parameter/prime-tower",
  "tags": [
    "multi-material",
    "quality"
  ],
  "printers": [
    "AMS",
    "MMU",
    "IDEX"
  ],
  "materials": [
    "All"
  ],
  "critical": false,
  "new": "2.3.0",
  "category": "Process Settings",
  "subCategory": "Advanced Features",
  "id": "prime-tower",
  "problemKeywords": [],
  "fixes": [],
  "impact": 5,
  "relatedSettings": [
    "purge-volume",
    "tool-change-temp"
  ]
},
  {
  "name": "Avoid Crossing Walls",
  "recommendedValue": "Enable for TPU",
  "notes": "Minimizes travel moves across walls to reduce stringing. Essential for flexible materials. Increases print time but dramatically improves quality.",
  "example": "TPU/Nylon: Enable",
  "reference": "https://wiki.bambulab.com/en/knowledge-sharing/tpu-printing-guide",
  "tags": [
    "stringing",
    "quality",
    "travel"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "TPU",
    "Nylon"
  ],
  "critical": false,
  "category": "Process Settings",
  "subCategory": "Advanced Features",
  "id": "avoid-crossing-walls",
  "problemKeywords": [
    "stringing",
    "speed"
  ],
  "fixes": [
    "stringing",
    "quality"
  ],
  "impact": 5,
  "relatedSettings": [
    "retraction",
    "z-hop"
  ]
},
  {
  "name": "Temperature Tower Test",
  "recommendedValue": "5°C increments",
  "notes": "OrcaSlicer's built-in test for finding optimal nozzle temperature. Prints tower with blocks at different temperatures. Examine for stringing, layer adhesion, warping, and surface quality. First calibration to perform.",
  "example": "PLA: 190-230°C range",
  "reference": "https://github.com/SoftFever/OrcaSlicer/wiki/temp-calib",
  "tags": [
    "calibration",
    "temperature",
    "quality",
    "critical"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "All"
  ],
  "critical": true,
  "category": "Process Settings",
  "subCategory": "Calibration Tests",
  "id": "temperature-tower-test",
  "problemKeywords": [
    "stringing",
    "warping",
    "adhesion",
    "quality"
  ],
  "fixes": [],
  "impact": 5,
  "calibrationTool": "temperature",
  "relatedSettings": [
    "nozzle-temp",
    "first-layer-temp"
  ]
},
  {
  "name": "VFA Speed Test",
  "recommendedValue": "40-300mm/s range",
  "notes": "Vertical Fine Artifacts test identifies resonance speeds and motion system limitations. Prints curved wall tower at increasing speeds to find where artifacts appear. Different from volumetric speed limits.",
  "example": "Start: 40mm/s, End: 200mm/s, Step: 10mm/s",
  "reference": "https://github.com/SoftFever/OrcaSlicer/wiki/Calibration",
  "tags": [
    "calibration",
    "speed",
    "quality",
    "resonance"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "All"
  ],
  "critical": false,
  "category": "Process Settings",
  "subCategory": "Calibration Tests",
  "id": "vfa-speed-test",
  "problemKeywords": [
    "quality",
    "speed"
  ],
  "fixes": [],
  "impact": 3,
  "relatedSettings": [
    "print-speed",
    "normal-printing-accel"
  ]
},
  {
  "name": "Tolerance Test",
  "recommendedValue": "0.1-0.5mm gaps",
  "notes": "Tests dimensional accuracy for parts that fit together. Prints hexagonal test with varying gap sizes. Result informs CAD design tolerances, not slicer settings. Critical for mechanical parts.",
  "example": "Best result: 0.2mm gap",
  "reference": "https://github.com/SoftFever/OrcaSlicer/wiki/tolerance-calib",
  "tags": [
    "calibration",
    "precision",
    "tolerance",
    "mechanical"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "All"
  ],
  "critical": false,
  "category": "Process Settings",
  "subCategory": "Calibration Tests",
  "id": "tolerance-test",
  "problemKeywords": [
    "accuracy"
  ],
  "fixes": [],
  "impact": 5,
  "relatedSettings": [
    "xy-compensation",
    "precise-wall"
  ]
},
  {
  "name": "Cornering Calibration",
  "recommendedValue": "JD: 0.01-0.25mm",
  "notes": "Tests optimal jerk/junction deviation for corner quality. Prints test pattern to find best balance between speed and corner bulging. Use high acceleration (2000mm/s²) during test.",
  "example": "Start: 0.01, End: 0.08, find sharpest corners",
  "reference": "https://github.com/SoftFever/OrcaSlicer/wiki/cornering-calib",
  "tags": [
    "calibration",
    "corners",
    "quality",
    "speed"
  ],
  "printers": [
    "All"
  ],
  "materials": [
    "All"
  ],
  "critical": false,
  "category": "Process Settings",
  "subCategory": "Calibration Tests",
  "id": "cornering-calibration",
  "problemKeywords": [
    "corners",
    "speed"
  ],
  "fixes": [],
  "impact": 3,
  "relatedSettings": [
    "junction-deviation",
    "xy-jerk"
  ]
},
  {
  "name": "Input Shaping Test",
  "recommendedValue": "10-150Hz range",
  "notes": "Advanced calibration for Klipper/Marlin to find resonance frequencies. Requires high acceleration and speed during test. Measures X/Y frequencies separately for optimal damping.",
  "example": "X: 40Hz, Y: 35Hz typical",
  "reference": "https://github.com/SoftFever/OrcaSlicer/wiki/input-shaping-calib",
  "tags": [
    "calibration",
    "advanced",
    "klipper",
    "resonance"
  ],
  "printers": [
    "Klipper",
    "Marlin"
  ],
  "materials": [
    "All"
  ],
  "critical": false,
  "category": "Process Settings",
  "subCategory": "Calibration Tests",
  "id": "input-shaping-test",
  "problemKeywords": [
    "speed"
  ],
  "fixes": [],
  "impact": 3,
  "relatedSettings": [
    "input-shaping",
    "normal-printing-accel"
  ]
}
];
