# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview
This is a comprehensive 3D printing calibration suite for Orca Slicer, implemented as a React web application. The suite provides multiple calibration tools including temperature analysis, flow rate calibration, pressure advance calculation, retraction testing, and maximum volumetric speed determination.

## Recent Updates (2025-01-16)
- Enhanced recommendations page with problem-solving interface:
  - Added Quick Fix buttons for 8 common 3D printing problems (stringing, warping, corners, adhesion, etc.)
  - Implemented Material Quick Switch with color-coded badges for easy material filtering
  - Created Calibration-First view toggle to group settings by calibration tool
  - Added visual problem indicators to settings cards (using Lucide icons)
  - Smart search with problem phrase detection and synonym recognition
  - Updated parser to capture all 107 settings from OrcaSlicer Comprehensive Settings.md
  - Fixed critical field parsing (28 critical settings now properly identified)
  - Converted Quick Fix buttons to compact badges to reduce vertical space

## Recent Updates (2025-01-14)
- Enhanced retraction calibration documentation with comprehensive guide including:
  - Detailed cause-and-effect relationships between print issues and retraction settings
  - Step-by-step calibration process with visual aids
  - Material-specific test ranges for both Direct Drive and Bowden extruders
  - Troubleshooting section for common issues
  - Added retraction calibration to documentation TOC for better accessibility

## TODO
- [ ] The retraction tower is not working exactly as the original STL then two tower were solid during last print and the small ridges on the towers seems to be slightly different than the original STL, that is a big problem as values read from the tower might not be accurate to the original STL.
- [ ] The calibration cube uses another method for the STL generation. We should use similar method as the retraction tower. I need to create a ASCII STL for the flow calibration cube and add it to the project. then update the flow calibration cube to use a similar method.

- [ ] Add a dashboard with graph of all the calibrations such that the user can see how well their calibrations are doing. We need to think hard about how we could do this in a way that is not too complex and not too simple. But still useful for the user. We might have baseline or target values.
- [ ] Add a way to save/export calibration settings to a file
- [ ] Add a way to load/import calibration settings from a file
- [ ] Add a way to share calibration settings with others (possibly via URL or QR code)
- [ ] Create comprehensive documentation for Temperature Tower calibration
- [ ] Create comprehensive documentation for Max Volumetric Speed calibration
- [ ] Add visual preview of calibration models before STL generation
- [ ] Implement calibration history tracking
## Project Structure
```
src/
├── components/
│   ├── ui/                      # shadcn/ui components
│   │   ├── badge.tsx            # Badge component for compact labels
│   │   ├── toggle.tsx           # Toggle component
│   │   ├── toggle-group.tsx     # Toggle group for view switching
│   │   └── ...                  # (buttons, cards, alerts, etc.)
│   ├── CalibrationGuide.tsx     # Main guide with calibration sequence
│   ├── DocumentationLayout.tsx  # Documentation navigation and structure
│   ├── DocumentationViewer.tsx  # Markdown documentation renderer
│   ├── FlowRateCalibration.tsx  # Flow calibration with two methods
│   ├── OrcaFlowCalibration.tsx  # Orca cube-based flow calibration
│   ├── YoloMethod.tsx           # Quick visual flow calibration
│   ├── TemperatureTower.tsx     # Temperature optimization
│   ├── PressureAdvance.tsx      # PA value calculator
│   ├── RetractionTest.tsx       # Retraction length calculator with STL generation
│   ├── MaxVolumetricSpeed.tsx   # Hotend capacity testing
│   ├── Recommendations.tsx      # Settings recommendations with filtering
│   ├── QuickFixButtons.tsx      # Problem-based quick filters
│   ├── MaterialQuickSwitch.tsx  # Material filter badges
│   ├── CalibrationViewToggle.tsx # Toggle between settings/calibration views
│   └── HelpButton.tsx           # Documentation link helper component
├── data/
│   └── recommendationsData.ts   # Generated settings database (107 settings)
├── utils/
│   └── stlGenerator.ts          # Three.js-based STL file generation
├── App.tsx                      # Main app with routing and theme
└── main.tsx                     # Entry point

scripts/
└── parseSettings.js             # Markdown parser for settings table

OrcaSlicer Comprehensive Settings.md  # Source data for recommendations (107 settings)

public/
├── docs/
│   └── orca-slicer/
│       ├── calibration/         # All calibration documentation
│       │   ├── retraction-calibration.md  # Comprehensive retraction guide
│       │   ├── flow-rate-calibration.md   # Flow rate calibration guide
│       │   └── ...              # Other calibration docs
│       └── images/              # Documentation images
└── templates/                   # STL templates
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
8. **Comprehensive Settings Database** - 107+ curated OrcaSlicer settings with problem-solving interface

### Recommendations System
The recommendations page provides a comprehensive database of OrcaSlicer settings with advanced filtering and problem-solving features:

#### Data Source
- Settings are parsed from `OrcaSlicer Comprehensive Settings.md` using `scripts/parseSettings.js`
- Contains 107 settings across 3 categories: Printer Settings (21), Filament Settings (34), Process Settings (52)
- 28 critical settings marked for essential configuration
- Each setting includes: recommended values, detailed notes, examples, references, tags, and relationships

#### Problem-Solving Interface
- **Quick Fix Buttons**: 8 common problem badges (stringing, warping, corners, adhesion, overhangs, surface, speed, accuracy)
- **Material Quick Switch**: Color-coded material badges with temperature ranges
- **Smart Search**: Detects problem phrases and synonyms (e.g., "strings" finds stringing-related settings)
- **Visual Indicators**: Icons show which problems each setting helps fix
- **Impact Levels**: Critical settings marked with alert icons

#### View Modes
- **Settings View**: Traditional category/subcategory organization
- **Calibration View**: Groups settings by calibration tool (flow, temperature, pressure advance, etc.)

#### Filtering Capabilities
- Search by setting name or description
- Filter by category, printer type, material
- Quick problem-based filtering
- Tag-based filtering (critical, calibration, quality, speed, etc.)

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

## Documentation System
- Documentation is stored in `public/docs/orca-slicer/`
- Each calibration tool has a help button linking to relevant documentation
- Documentation viewer supports:
  - GitHub Flavored Markdown
  - Relative image paths (automatically converted)
  - Responsive tables
  - Code highlighting
  - External link handling
- All calibration guides are accessible through the Documentation section in the app
- Images should be placed in appropriate subdirectories under `public/docs/orca-slicer/images/`

## Best Practices
1. When adding new calibration tools, create corresponding documentation
2. Include visual aids and step-by-step instructions in documentation
3. Test documentation links and image paths before committing
4. Keep calculator formulas and precision consistent with Orca Slicer
5. Maintain material-specific recommendations for each calibration type