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
This project currently lacks standard React tooling. To make it functional:

1. **Create a React project structure**:
   ```bash
   npx create-react-app . --template typescript
   # or
   npm create vite@latest . -- --template react
   ```

2. **Install required dependencies**:
   ```bash
   npm install lucide-react
   npm install -D tailwindcss postcss autoprefixer
   ```

3. **Rename and move the component**:
   ```bash
   mv code src/OrcaFlowCalibration.jsx
   ```

4. **Configure Tailwind CSS** following standard setup procedures

## Common Tasks

### Running the Application
Currently no build system is configured. After setting up the project:
```bash
npm start  # for Create React App
npm run dev  # for Vite
```

### Testing
No test framework is currently implemented. Consider adding:
- Jest + React Testing Library for unit tests
- Cypress or Playwright for E2E tests

### Code Quality
No linting or formatting tools are configured. Consider adding:
- ESLint with React configuration
- Prettier for code formatting

## Important Notes
- The component expects Tailwind CSS to be properly configured for styling
- All calculations are done client-side with no backend dependencies
- The tool is designed to work with Orca Slicer specifically
- Measurement precision is critical - the tool expects 0.01mm precision inputs