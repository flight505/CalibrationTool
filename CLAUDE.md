# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview
This is a comprehensive 3D printing calibration suite for Orca Slicer, implemented as a React web application. The suite provides multiple calibration tools including temperature analysis, flow rate calibration, pressure advance calculation, retraction testing, and maximum volumetric speed determination.

## Project Structure
```
src/
├── components/
│   ├── ui/                    # shadcn/ui components (buttons, cards, alerts, etc.)
│   ├── CalibrationGuide.tsx   # Main guide with calibration sequence
│   ├── FlowRateCalibration.tsx # Flow calibration with two methods
│   ├── OrcaFlowCalibration.tsx # Orca cube-based flow calibration
│   ├── YoloMethod.tsx         # Quick visual flow calibration
│   ├── TemperatureTower.tsx   # Temperature optimization
│   ├── PressureAdvance.tsx    # PA value calculator
│   ├── RetractionTest.tsx     # Retraction length calculator
│   └── MaxVolumetricSpeed.tsx # Hotend capacity testing
├── utils/
│   └── stlGenerator.ts        # Three.js-based STL file generation
├── App.tsx                    # Main app with routing and theme
└── main.tsx                   # Entry point
```

## Key Technical Details

### React Component Architecture
- Multi-page React app with functional components and hooks
- Component-based routing with state management
- Dark/Light theme support with persistent storage
- Uses Lucide React for consistent iconography
- Styled with Tailwind CSS and shadcn/ui components
- Interactive hover effects with GlowCard components

### Calibration Methodologies

#### Flow Calibration
- **Orca Method**: Uses a 20×20×18.8mm cube with varying wall thickness
  - Thick walls (1.2mm) for 0.4mm nozzle
  - Thin walls (0.4mm) for precision testing
  - Formula: `New Flow = Current Flow × (Expected / Measured)`
- **YOLO Method**: Quick single-wall visual calibration

#### Other Calculators
- **Temperature**: Analyzes tower test results with material-specific ranges
- **Pressure Advance**: `PA = Step × Measured Height` (4 decimal precision)
- **Retraction**: `Length = Start + (Height × Factor)` (5 decimal precision)
- **Max Volumetric**: `Speed = Start + (Height × Step)` (2 decimal precision)

### Key Features
1. **Guided Calibration Sequence** - Step-by-step process with progress tracking
2. **STL Generation** - Dynamic calibration cube creation for different nozzle sizes
3. **Material-Specific Guidance** - Tailored recommendations for PLA, PETG, ABS, TPU, PA-CF
4. **Dark Mode Default** - Better visibility for glow card hover effects
5. **Responsive Design** - Works on desktop, tablet, and mobile
6. **High Precision Calculations** - Decimal precision matching original Orca calculators
7. **Interactive UI** - Hover effects, animations, and visual feedback

## Development Setup
The project is set up with Vite, React, TypeScript, and shadcn/ui for a modern development experience.

### Dependencies
- React 18.3 with TypeScript 5.5
- Vite 5.4 for fast builds and HMR
- Tailwind CSS with animations
- shadcn/ui components with Radix UI
- Lucide React for icons
- Three.js for STL file generation
- Node.js 18+ required

## Common Tasks

### Running the Application
```bash
npm run dev     # Start development server
npm run build   # Build for production
npm run preview # Preview production build locally
```

### Deployment
The project is configured for Vercel deployment:
- Project ID: `prj_jV4xRdoRqKW11VxZVdi5VzFru9va`
- Automatic deployments on push to main branch
- Build command: `npm run build`
- Output directory: `dist`

### Testing
No test framework is currently implemented. Consider adding:
- Vitest for unit tests (works well with Vite)
- Playwright for E2E tests

### Code Quality
```bash
npm run lint    # Run ESLint (needs config migration to v9)
npm run build   # TypeScript type checking + production build
npx tsc --noEmit # Type check without building
```

## Important Notes
- The app defaults to dark mode for better visual appearance with glow effects
- All calculations are done client-side with no backend dependencies
- STL generation uses Three.js to create binary STL files
- Designed specifically for Orca Slicer calibration workflows
- Calculator decimal precision:
  - Pressure Advance: 4 decimal places
  - Retraction Test: 5 decimal places
  - Max Volumetric Speed: 2 decimal places
- Flow calibration cube structure:
  - Base: 0-0.8mm (solid)
  - Thick walls: 0.8-8.8mm (3× nozzle diameter)
  - Thin walls: 8.8-18.8mm (1× nozzle diameter)