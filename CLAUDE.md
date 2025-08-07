# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview
This is a comprehensive 3D printing calibration suite for Orca Slicer, implemented as a React web application. The suite provides multiple calibration tools including temperature analysis, flow ratio calibration, pressure advance calculation, retraction testing, and maximum volumetric speed determination.

## Recent Updates (2025-01-16) - Flow Calibration Improvements
- Fixed Flow Calibration terminology and format issues:
  - Changed all references from "Flow Rate" to "Flow Ratio" to match OrcaSlicer
  - Converted from percentage format (100%) to decimal format (1.00)
  - Added clear location instructions: "Material settings → Filament → Flow ratio and Pressure Advance → Flow ratio"
  - Added comprehensive print settings guide with exact menu locations
- Fixed thin wall slicing issue:
  - Changed "Detect Thin Walls" from Disabled to Enabled
  - Updated documentation to explain dual-wall design (thick walls with 2 perimeters, thin walls with 1 perimeter)
- Implemented smart format auto-detection:
  - Auto-converts percentage inputs (e.g., 98) to decimal format (0.98)
  - Added validation warnings for format conversion
  - Improved UI with clear helper text and examples

## Recent Updates (2025-01-16) - Recommendations System
- Enhanced recommendations page with problem-solving interface:
  - Added Quick Fix buttons for 8 common 3D printing problems (stringing, warping, corners, adhesion, etc.)
  - Implemented Material Quick Switch with color-coded badges for easy material filtering
  - Created Calibration-First view toggle to group settings by calibration tool
  - Added visual problem indicators to settings cards (using Lucide icons)
  - Smart search with problem phrase detection and synonym recognition
  - Updated parser to capture all 119 settings from OrcaSlicer Comprehensive Settings.md
  - Fixed critical field parsing (28 critical settings now properly identified)
  - Converted Quick Fix buttons to compact badges to reduce vertical space
  - Added 12 new settings: Line Width variations, Seam control, Precise Z Height, Wall/Infill configurations

## Recent Updates (2025-01-23) - AI Assistant Implementation
- Implemented comprehensive AI-powered chat assistant:
  - Expert OrcaSlicer assistant with specialized 3D printing knowledge
  - Real-time streaming responses using Vercel AI SDK v4.3.19
  - Markdown formatting support for professional response rendering
  - Database integration with PostgreSQL for conversation history
  - Hybrid search system combining vector and text search for context
  - Session management with UUID-based tracking
  - Graceful fallback when database is unavailable
- Fixed critical streaming and database issues:
  - Resolved foreign key constraint violations in chat_sessions/chat_messages
  - Fixed AI SDK v4 streaming format compatibility with useChat hook
  - Added transaction-based session creation for data consistency
  - Implemented proper Vercel serverless function streaming
  - Created comprehensive diagnostic endpoints for troubleshooting
- Enhanced chat UI with markdown rendering:
  - Custom styled markdown components for dark theme
  - Syntax highlighting for code blocks and inline code
  - Professional typography with proper spacing and colors
  - Interactive elements (links, tables, lists) with chat-optimized styling

## Recent Updates (2025-01-28) - Complete OrcaSlicer Tower Generation System
- Implemented comprehensive tower generation framework with 5 tower types:
  - **Temperature Tower**: Bridge and overhang tests, material presets for PLA/PETG/ABS/TPU/ASA/PC/PA
  - **Pressure Advance Tower**: Corner, line, and combined patterns for PA calibration
  - **Fan Speed Tower**: Bridging, overhang, and stringing tests for cooling optimization
  - **Flow Rate Tower**: Wall thickness and thin wall tests for flow ratio calibration
  - **Max Volumetric Speed Tower**: Spiral, zigzag, and straight patterns for hotend limits
- Advanced features:
  - **3MF Export**: Complete project files with embedded modifier meshes and settings
  - **Post-Processing Support**: Automatic G-code injection for calibration commands
  - OrcaSlicer modifier mesh generation for per-section parameter changes
  - Material-specific presets and recommendations
  - Detailed setup instructions with firmware compatibility info
  - Automatic calculation of optimal print speeds from volumetric rates
  - Dual export options: Individual STL files or complete 3MF project
- Post-Processing G-code Generation:
  - **Firmware Support**: Marlin, Klipper, RepRapFirmware (RRF), and OrcaSlicer native
  - **Smart Layer Height Calculation**: Automatically calculates correct Z heights for command injection
  - **Custom G-code Per Layer**: Generates OrcaSlicer's `custom_gcode_per_layer.xml` format
  - **Temperature Commands**: M104/M109 (Marlin), SET_HEATER_TEMPERATURE (Klipper)
  - **Fan Speed Control**: M106 with percentage to PWM conversion
  - **Flow Rate Adjustment**: M221 commands for flow ratio changes
  - **Pressure Advance**: M900 K (Marlin), SET_PRESSURE_ADVANCE (Klipper), M572 (RRF)
  - **LCD Messages**: M117 commands display current calibration values
  - **Volumetric to Linear Speed**: Automatic conversion for max volumetric testing
- Unified STL generation approach:
  - Migrated Flow Calibration to use ASCII STL templates
  - Added parametric First Layer Calibration with custom plate sizes
  - Created comprehensive ASCII STL utility functions for manipulation
  - All calibration tools now use consistent template-based approach

## Recent Updates (2025-01-14)
- Enhanced retraction calibration documentation with comprehensive guide including:
  - Detailed cause-and-effect relationships between print issues and retraction settings
  - Step-by-step calibration process with visual aids
  - Material-specific test ranges for both Direct Drive and Bowden extruders
  - Troubleshooting section for common issues
  - Added retraction calibration to documentation TOC for better accessibility

## TODO
- [x] The retraction tower is not working exactly as the original STL - RESOLVED with ASCII template approach
- [x] The calibration cube uses another method for the STL generation - RESOLVED with unified ASCII STL method
- [x] Implement OrcaSlicer tower generation system - COMPLETED with 5 tower types
- [x] Add 3MF export functionality - COMPLETED with full OrcaSlicer compatibility

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
│   │   ├── animated-ai-chat.tsx # AI chat interface with markdown support
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
│   ├── TemperatureTower.tsx     # Temperature optimization with tower generation
│   ├── PressureAdvance.tsx      # PA value calculator
│   ├── RetractionTest.tsx       # Retraction length calculator with STL generation
│   ├── FirstLayerCalibration.tsx # Parametric first layer calibration
│   ├── MaxVolumetricSpeed.tsx   # Hotend capacity testing
│   ├── Recommendations.tsx      # Settings recommendations with filtering
│   ├── QuickFixButtons.tsx      # Problem-based quick filters
│   ├── MaterialQuickSwitch.tsx  # Material filter badges
│   ├── CalibrationViewToggle.tsx # Toggle between settings/calibration views
│   └── HelpButton.tsx           # Documentation link helper component
├── data/
│   └── recommendationsData.ts   # Generated settings database (119 settings)
├── lib/
│   ├── db/
│   │   ├── pool.ts              # PostgreSQL connection pooling
│   │   └── safePool.ts          # Safe database wrapper with fallback
│   └── utils/
│       └── vectorSearch.ts      # Hybrid search implementation
├── utils/
│   ├── stlGenerator.ts          # Unified STL file generation with template support
│   ├── asciiStlUtils.ts         # ASCII STL parsing and manipulation utilities
│   ├── orcaTowerGenerator.ts    # Base tower generator for OrcaSlicer
│   ├── orcaTemperatureTower.ts  # Temperature tower implementation
│   ├── orcaPressureAdvanceTower.ts # Pressure advance tower implementation
│   ├── orcaFanSpeedTower.ts     # Fan speed tower implementation
│   ├── orcaFlowRateTower.ts     # Flow rate tower implementation
│   ├── orcaMaxVolumetricTower.ts # Max volumetric speed tower implementation
│   └── orca3mfExporter.ts       # 3MF project file exporter for OrcaSlicer
├── App.tsx                      # Main app with routing and theme
└── main.tsx                     # Entry point

api/
├── chat.ts                      # Main AI chat API with streaming support
├── upload.ts                    # File upload handler for chat attachments
├── debug.ts                     # Environment and database diagnostics
├── test-session.ts              # Session creation and constraint testing
├── test-db.ts                   # Database connection diagnostics
└── test-simple-stream.ts        # Simple streaming test endpoint

scripts/
├── parseSettings.js             # Markdown parser for settings table
├── setup-database-simple.ts    # Database schema creation
├── populate-initial-data.ts     # Initial data population for AI assistant
├── test-db-connection.ts        # Local database connection testing
├── test-chat-api.ts             # Chat API functionality testing
└── reset-sessions.ts            # Development utility to reset chat sessions

OrcaSlicer Comprehensive Settings.md  # Source data for recommendations (119 settings)

public/
├── docs/
│   └── orca-slicer/
│       ├── calibration/         # All calibration documentation
│       │   ├── retraction-calibration.md  # Comprehensive retraction guide
│       │   ├── flow-rate-calibration.md   # Flow ratio calibration guide
│       │   └── ...              # Other calibration docs
│       └── images/              # Documentation images
└── templates/                   # STL templates
    ├── flow_calibration_cube_template.stl    # Flow cube ASCII template
    ├── first_layer_calibration_ascii.stl     # First layer ASCII template
    └── retraction_tower_template.stl         # Retraction tower ASCII template
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
8. **Comprehensive Settings Database** - 119 curated OrcaSlicer settings with problem-solving interface
9. **AI-Powered Assistant** - Expert OrcaSlicer chat assistant with real-time streaming responses
10. **Advanced Search & Context** - Hybrid vector and text search for intelligent assistance
11. **Markdown Support** - Professional formatting in chat responses with syntax highlighting

### Recommendations System
The recommendations page provides a comprehensive database of OrcaSlicer settings with advanced filtering and problem-solving features:

#### Data Source
- Settings are parsed from `OrcaSlicer Comprehensive Settings.md` using `scripts/parseSettings.js`
- Contains 119 settings across 3 categories: Printer Settings, Filament Settings, Process Settings
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
- Vercel AI SDK v4.3.19 for AI chat functionality
- PostgreSQL with pg driver for database
- ReactMarkdown + remark-gfm for markdown rendering
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
No formal test framework is currently implemented, but diagnostic tools are available:
- `npm run test-db` - Test database connection locally
- `npm run test-chat` - Test chat API functionality
- `npm run reset-sessions` - Reset all chat sessions (development only)
- `/api/debug` - Production environment diagnostics
- `/api/test-session` - Session creation and constraint testing
- `/api/test-db` - Database connection diagnostics

Consider adding:
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

## AI Assistant Technical Details
- Uses Vercel AI SDK v4.3.19 with OpenAI GPT-4o-mini model
- Streaming responses compatible with useChat hook
- PostgreSQL database for conversation history and knowledge base
- Hybrid search combining vector similarity and full-text search
- Session management with UUID-based tracking and foreign key constraints
- Graceful degradation when database is unavailable
- Markdown rendering with custom components optimized for dark theme
- Transaction-based database operations for data consistency
- Comprehensive error handling and diagnostic endpoints

## Database Requirements
⚠️ **Important**: The AI Assistant requires a standard PostgreSQL database.

❌ **Prisma Accelerate URLs (db.prisma.io) are NOT supported** - Use standard PostgreSQL providers

✅ **Recommended Database Providers**:
- Vercel Postgres (Neon): https://vercel.com/postgres
- Supabase: https://supabase.com
- Railway: https://railway.app
- Render PostgreSQL: https://render.com

See [DEPLOYMENT.md](./DEPLOYMENT.md) for setup instructions or [MIGRATE_FROM_PRISMA.md](./MIGRATE_FROM_PRISMA.md) if migrating from Prisma Accelerate.

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