# Orca Slicer Calibration Suite

A comprehensive web application for calibrating 3D printer settings in Orca Slicer. Features a beautiful, modern interface with dark mode support and guided calibration workflows.

## Features

### 🎯 Calibration Tools

1. **Temperature Tower** - Find optimal printing temperature for your filament
2. **Flow Rate Calibration** - Dual methods:
   - Cube Method: Precise measurement-based calibration
   - YOLO Mode: Quick visual calibration
3. **Pressure Advance** - Tune for sharp corners and better print quality
4. **Retraction Test** - Eliminate stringing with optimal settings
5. **Max Volumetric Speed** - Find your hotend's melting limit

### 🚀 Key Features

- **Guided Calibration Sequence** - Follow the recommended order with step-by-step instructions
- **Dark Mode Support** - Easy on the eyes during late-night calibration sessions
- **Responsive Design** - Works on desktop, tablet, and mobile devices
- **Export Results** - Save calibration data for future reference
- **Material-Specific Guidance** - Tailored recommendations for PLA, PETG, ABS, TPU, and more

## Installation

```bash
# Clone the repository
git clone [your-repo-url]
cd CalibrationTool

# Install dependencies
npm install

# Start development server
npm run dev
```

## Building for Production

```bash
# Build the application
npm run build

# Preview production build
npm run preview
```

## Deployment

The project is configured for Vercel deployment:

```bash
# Deploy to Vercel
vercel --prod
```

Project ID: `prj_jV4xRdoRqKW11VxZVdi5VzFru9va`

## Usage

1. **Start with the Guide** - Open the app and follow the calibration sequence
2. **Temperature First** - Always calibrate temperature before other settings
3. **Follow the Order** - Temperature → Flow → Pressure Advance → Retraction → Max Speed
4. **Save Profiles** - Export your results and create filament profiles in Orca Slicer

## Technology Stack

- **React** with TypeScript
- **Vite** for fast builds
- **shadcn/ui** components
- **Tailwind CSS** for styling
- **Radix UI** for accessible components

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.