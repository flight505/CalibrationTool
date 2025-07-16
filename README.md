# Orca Slicer Calibration Suite

A comprehensive web-based calibration tool suite for Orca Slicer users to optimize their 3D printing settings through systematic testing, calculation, and intelligent recommendations.

![Calibration Suite](https://img.shields.io/badge/Orca_Slicer-Calibration-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-blue)
![React](https://img.shields.io/badge/React-18.3+-61DAFB)
![Vite](https://img.shields.io/badge/Vite-5.4+-646CFF)

## 🎯 Overview

This tool suite provides interactive calculators and guides for calibrating various 3D printer settings in Orca Slicer. It helps users achieve optimal print quality by systematically testing and calculating the best values for their specific printer and filament combinations.

## ✨ Features

### Calibration Tools

1. **Temperature Tower Analysis**
   - Find optimal printing temperature for any filament
   - Material-specific recommendations (PLA, PETG, ABS, TPU, PA-CF)
   - First layer temperature calculations

2. **Flow Rate Calibration** 
   - Two methods: Orca Flow Calibration and YOLO Method
   - Generate custom STL calibration cubes
   - Precise flow rate calculations based on wall measurements

3. **Pressure Advance Calculator**
   - Calculate optimal pressure advance values
   - Eliminate corner bulging and improve print quality
   - 4 decimal precision for fine-tuning

4. **Retraction Test Manager**
   - Calculate retraction length from tower tests
   - Material and extruder-specific recommendations
   - 5 decimal precision for accuracy

5. **Maximum Volumetric Speed**
   - Determine hotend melting capacity
   - Prevent under-extrusion at high speeds
   - Material-specific adjustments

6. **OrcaSlicer Settings Recommendations** 🆕
   - 119 curated settings with detailed explanations
   - Problem-solving interface with Quick Fix buttons
   - Smart search with problem phrase detection
   - Material and printer-specific filtering
   - Calibration tool integration
   - Visual indicators for critical settings

### Additional Features

- 🌓 Dark/Light theme support (defaults to dark mode)
- ✨ Interactive hover effects on calibration cards
- 📱 Responsive design for all devices
- 📊 Step-by-step calibration guide
- 🎯 Recommended calibration sequence
- 🔍 Advanced filtering and search capabilities
- 🏷️ Tag-based organization
- 🎨 Material-specific recommendations

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/flight505/CalibrationTool.git
cd CalibrationTool
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## 🛠️ Technology Stack

- **Frontend Framework**: React 18.3 with TypeScript
- **Build Tool**: Vite 5.4
- **UI Components**: shadcn/ui with Radix UI
- **Styling**: Tailwind CSS
- **3D File Generation**: Three.js (for STL generation)
- **Icons**: Lucide React

## 📖 Usage Guide

### Recommended Calibration Order

1. **Temperature Calibration** - Start here to find optimal printing temperature
2. **Flow Rate Calibration** - Ensure accurate extrusion
3. **Pressure Advance** - Fine-tune corner quality
4. **Retraction Settings** - Eliminate stringing
5. **Max Volumetric Speed** - Optimize for high-speed printing

### Using the Recommendations System

The recommendations page helps you find the right settings for your specific problems:

#### Quick Problem Fixes
- Click problem badges to instantly filter relevant settings
- Common problems: Stringing, Warping, Poor Corners, Bad Adhesion, etc.
- Each setting shows which problems it helps solve

#### Material Filtering
- Use the color-coded material badges to filter settings
- Shows temperature ranges for each material
- Quickly switch between PLA, PETG, ABS, TPU, and more

#### View Modes
- **Settings View**: Browse by category (Printer, Filament, Process)
- **Calibration View**: Group settings by calibration tool

#### Smart Search
- Type problem descriptions (e.g., "corners lifting", "strings")
- Automatically finds related settings
- Searches names, descriptions, and tags

### Flow Calibration Methods

#### Orca Flow Calibration
1. Generate and print the calibration cube (20×20×18.8mm)
2. Measure wall thickness at specific heights
3. Input measurements to calculate flow rate

#### YOLO Method
1. Print a single-wall cube
2. Measure the actual wall thickness
3. Quick calculation for flow rate adjustment

## 🔧 Development

### Project Structure

```
src/
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── CalibrationGuide.tsx
│   ├── FlowRateCalibration.tsx
│   ├── OrcaFlowCalibration.tsx
│   ├── YoloMethod.tsx
│   ├── TemperatureTower.tsx
│   ├── PressureAdvance.tsx
│   ├── RetractionTest.tsx
│   └── MaxVolumetricSpeed.tsx
├── utils/
│   └── stlGenerator.ts  # STL file generation
├── App.tsx
└── main.tsx
```

### Key Features Implementation

- **STL Generation**: Uses Three.js to create calibration cube geometry
- **Theme System**: Persistent theme selection with system preference support
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Component Architecture**: Modular design with reusable UI components

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Orca Slicer team for the excellent slicer software
- The 3D printing community for testing and feedback
- shadcn/ui for the beautiful component library

## 📞 Support

If you encounter any issues or have questions:
- Open an issue on GitHub
- Check the documentation in the app
- Join our community discussions

---

Made with ❤️ for the 3D printing community