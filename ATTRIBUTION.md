# Attribution

## AutoTowersGenerator

The STL templates and tower generation concepts in this project are based on:

- **AutoTowersGenerator** by Brad Kartchner
- GitHub: https://github.com/kartchnb/AutoTowersGenerator
- Cura Plugin: https://marketplace.ultimaker.com/app/cura/plugins/kartchnb/AutoTowersGenerator
- License: Check the original repository for license details

The STL templates in `/public/templates/` were derived from AutoTowersGenerator's validated calibration models, which have been tested extensively by the 3D printing community.

### What We Used

1. **STL Templates**: Professional-grade calibration tower geometries
2. **Post-Processing Concepts**: G-code injection techniques for parameter changes at specific heights
3. **Tower Types**: Temperature, Fan Speed, Flow Rate, Retraction, and Speed tower concepts

### Our Enhancements

- Converted to TypeScript/React implementation
- Added 3MF export functionality for OrcaSlicer
- Enhanced with multi-firmware support (Marlin, Klipper, RepRapFirmware)
- Integrated with web-based UI for easier access
- Added ASCII STL format for better version control

## OrcaSlicer

This project is designed specifically for use with:

- **OrcaSlicer** by SoftFever
- GitHub: https://github.com/SoftFever/OrcaSlicer
- Wiki: https://github.com/SoftFever/OrcaSlicer/wiki

## Thank You

Special thanks to the open-source 3D printing community for their continuous contributions and improvements to calibration methodologies.