# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview
This is a 3D printing calibration tool for Orca Slicer, implemented as a standalone React component. The tool helps users calibrate their 3D printer's flow rate using a dual-wall measurement cube methodology.

## Project Structure
- `code` - Main React component file containing the OrcaFlowCalibration tool
- `guid.md` - Documentation about the dual-wall cube design and calibration methodology

## Key Technical Details

### React Component Architecture
- Single-file React component using functional components and hooks (useState, useEffect)
- Uses Lucide React for icons
- Styled with Tailwind CSS classes
- No external state management or routing

### Calibration Methodology
The tool implements a dual-wall cube calibration approach:
- **Single wall measurements** (0.4mm target) - Tests fine extrusion control
- **Triple wall measurements** (1.2mm target) - Verifies consistency at higher volumes
- Uses formula: `New Flow = Current Flow × (Expected / Measured)`
- Averages both measurement types for optimal accuracy

### Component Features
1. Dynamic nozzle size selection (0.2mm, 0.4mm, 0.6mm, 0.8mm)
2. Measurement input for 4 sides of each wall type
3. Automatic flow rate calculation
4. Results export to text file
5. Visual guidance with SVG diagram
6. Collapsible instructions panel

## Development Setup
The project is set up with Vite, React, TypeScript, and shadcn/ui for a modern development experience.

### Dependencies
- React 18 with TypeScript
- Vite for fast builds and HMR
- Tailwind CSS for styling
- shadcn/ui components with Radix UI
- Lucide React for icons

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
npm run lint    # Run ESLint
npm run build   # TypeScript type checking happens during build
```

## Important Notes
- The component expects Tailwind CSS to be properly configured for styling
- All calculations are done client-side with no backend dependencies
- The tool is designed to work with Orca Slicer specifically
- Measurement precision is critical - the tool expects 0.01mm precision inputs