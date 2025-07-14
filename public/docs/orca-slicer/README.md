# OrcaSlicer Documentation

This directory contains comprehensive documentation scraped from official OrcaSlicer sources to provide reference material for the calibration suite.

## Table of Contents

### Profile Management
- [Comprehensive Profile Management Guide](profiles/profile-management-guide.md)
  - Understanding OrcaSlicer profile architecture
  - Profile types and inheritance
  - Storage locations across operating systems
  - Naming conventions and organization
  - Creating custom filament profiles
  - Backup and migration strategies
  - Troubleshooting disappearing profiles
  - Community preset repositories

### Calibration Guides

#### Overview
- [Main Calibration Guide](calibration/calibration-guide.md)
  - Recommended calibration order
  - Overview of all calibration types
  - Credits and acknowledgments

#### Specific Calibrations
1. [Flow Rate Calibration](calibration/flow-rate-calibration.md)
   - Pass 1 and Pass 2 methodology
   - YOLO method (recommended)
   - Formula differences and calculations
   - Tips for Bambulab printers

2. [Cornering Calibration](calibration/cornering-calibration.md)
   - Junction Deviation settings
   - Jerk calibration (coming soon)
   - Test procedures and measurements
   - Saving settings via G-code or firmware

3. [Input Shaping Calibration](calibration/input-shaping-calibration.md)
   - Klipper Resonance Compensation
   - Marlin ZV Input Shaping
   - Frequency and damping tests
   - Fixed-Time Motion (coming soon)

4. [Adaptive Pressure Advance Calibration](calibration/adaptive-pressure-advance-calibration.md)
   - Dynamic PA adjustment based on flow and acceleration
   - Prerequisites and Klipper firmware requirements
   - Defining calibration sets
   - Running batch tests in OrcaSlicer 2.3.0+
   - Processing results and creating PA profiles

## Additional Resources

### Images
All images referenced in the documentation are hosted on the official OrcaSlicer GitHub repository. Links are preserved in the markdown files to ensure access to the most up-to-date visual guides.

### Source Links
- [OrcaSlicer GitHub Wiki](https://github.com/SoftFever/OrcaSlicer/wiki)
- [Obico Blog - Profile Management](https://www.obico.io/blog/orcaslicer-comprehensive-profile-management-guide/)

### Related Projects
- [OrcaSlicer Repository](https://github.com/SoftFever/OrcaSlicer)
- [Orca Slicer Assistant](https://github.com/ItsDeidara/Orca-Slicer-Assistant) - Flow rate calculation helper

## Usage Notes

This documentation is provided as reference material for users of the OrcaSlicer Calibration Suite. It covers:
- Best practices for profile management
- Detailed calibration procedures
- Troubleshooting common issues
- Advanced features like adaptive pressure advance

The documentation is structured to complement the calibration tools provided in the web application, offering deeper insights into the theory and practice behind each calibration type.