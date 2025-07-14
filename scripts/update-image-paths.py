#!/usr/bin/env python3
import os
import re

# Define the image path mappings
image_mappings = {
    # Main calibration
    'https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/calibration.png?raw=true': '../images/calibration/calibration.png',
    
    # Flow Rate
    'https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/Flow-Rate/flow-calibration.gif?raw=true': '../images/flow-rate/flow-calibration.gif',
    'https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/Flow-Rate/flowcalibration_update_flowrate.png?raw=true': '../images/flow-rate/flowcalibration_update_flowrate.png',
    'https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/Flow-Rate/flowrate-0-5.jpg?raw=true': '../images/flow-rate/flowrate-0-5.jpg',
    'https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/Flow-Rate/flowrate-6.jpg?raw=true': '../images/flow-rate/flowrate-6.jpg',
    'https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/Flow-Rate/flowrate-Bambulab-uncheck.png?raw=true': '../images/flow-rate/flowrate-Bambulab-uncheck.png',
    'https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/Flow-Rate/flowrate-pass1.jpg?raw=true': '../images/flow-rate/flowrate-pass1.jpg',
    'https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/Flow-Rate/flowrate-pass2.jpg?raw=true': '../images/flow-rate/flowrate-pass2.jpg',
    'https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/Flow-Rate/flowrate-6.jpg?raw=true': '../images/flow-rate/flowrate-6.jpg',
    
    # Input Shaping
    'https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/InputShaping/IS_damp_klipper_print_measure.jpg?raw=true': '../images/input-shaping/IS_damp_klipper_print_measure.jpg',
    'https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/InputShaping/IS_damp_klipper_slicer_measure.png?raw=true': '../images/input-shaping/IS_damp_klipper_slicer_measure.png',
    'https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/InputShaping/IS_damp_marlin_print_measure.jpg?raw=true': '../images/input-shaping/IS_damp_marlin_print_measure.jpg',
    'https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/InputShaping/IS_damp_marlin_slicer_measure.png?raw=true': '../images/input-shaping/IS_damp_marlin_slicer_measure.png',
    'https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/InputShaping/IS_damp_menu.png?raw=true': '../images/input-shaping/IS_damp_menu.png',
    'https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/InputShaping/IS_freq_klipper_slicer_measure.png?raw=true': '../images/input-shaping/IS_freq_klipper_slicer_measure.png',
    'https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/InputShaping/IS_freq_marlin_print_measure.jpg?raw=true': '../images/input-shaping/IS_freq_marlin_print_measure.jpg',
    'https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/InputShaping/IS_freq_marlin_slicer_measure.png?raw=true': '../images/input-shaping/IS_freq_marlin_slicer_measure.png',
    'https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/InputShaping/IS_freq_menu.png?raw=true': '../images/input-shaping/IS_freq_menu.png',
    
    # Junction Deviation
    'https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/JunctionDeviation/jd_first_menu.png?raw=true': '../images/junction-deviation/jd_first_menu.png',
    'https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/JunctionDeviation/jd_first_print_measure.jpg?raw=true': '../images/junction-deviation/jd_first_print_measure.jpg',
    'https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/JunctionDeviation/jd_first_slicer_measure.png?raw=true': '../images/junction-deviation/jd_first_slicer_measure.png',
    'https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/JunctionDeviation/jd_printer_jerk_limitation.png?raw=true': '../images/junction-deviation/jd_printer_jerk_limitation.png',
    'https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/JunctionDeviation/jd_second_menu.png?raw=true': '../images/junction-deviation/jd_second_menu.png',
    'https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/JunctionDeviation/jd_second_print_measure.jpg?raw=true': '../images/junction-deviation/jd_second_print_measure.jpg',
    'https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/JunctionDeviation/jd_second_slicer_measure.png?raw=true': '../images/junction-deviation/jd_second_slicer_measure.png',
    
    # Pressure Advance
    'https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/pa/apa-expected-results.jpg?raw=true': '../images/pa/apa-expected-results.jpg',
    'https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/pa/apa-expected-seam.jpg?raw=true': '../images/pa/apa-expected-seam.jpg',
    'https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/pa/apa-expected-solid-infill.jpg?raw=true': '../images/pa/apa-expected-solid-infill.jpg',
    'https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/pa/apa-identify-optimal.jpg?raw=true': '../images/pa/apa-identify-optimal.jpg',
    'https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/pa/apa-identify-too-high.jpg?raw=true': '../images/pa/apa-identify-too-high.jpg',
    'https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/pa/apa-identify-too-low.jpg?raw=true': '../images/pa/apa-identify-too-low.jpg',
    'https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/pa/apa-material-config.png?raw=true': '../images/pa/apa-material-config.png',
    'https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/pa/apa-profile.png?raw=true': '../images/pa/apa-profile.png',
    'https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/pa/apa-setup-result-acceleration-jerk.png?raw=true': '../images/pa/apa-setup-result-acceleration-jerk.png',
    'https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/pa/apa-setup-result-speed.png?raw=true': '../images/pa/apa-setup-result-speed.png',
    'https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/pa/apa-test.png?raw=true': '../images/pa/apa-test.png',
    'https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/pa/apa-test210.png?raw=true': '../images/pa/apa-test210.png',
    'https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/pa/apa-unexpected-solid-infill.jpg?raw=true': '../images/pa/apa-unexpected-solid-infill.jpg',
    'https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/pa/pa-pattern-batch.png?raw=true?raw=true': '../images/pa/pa-pattern-batch.png',
    'https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/pa/pa-pattern-batch.png?raw=true': '../images/pa/pa-pattern-batch.png',
    'https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/pa/pa-pattern-general.png?raw=true': '../images/pa/pa-pattern-general.png',
    'https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/pa/pa-tower.jpg?raw=true': '../images/pa/pa-tower.jpg',
    
    # Other calibrations
    'https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/MVF/mvf_measurement_point.jpg?raw=true': '../images/mvf/mvf_measurement_point.jpg',
    'https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/retraction/retraction_test_print.jpg?raw=true': '../images/retraction/retraction_test_print.jpg',
    'https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/Temp-calib/temp-tower.jpg?raw=true': '../images/temp-calib/temp-tower.jpg',
    'https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/Tolerance/OrcaToleranceTes_m6.jpg?raw=true': '../images/tolerance/OrcaToleranceTes_m6.jpg',
    'https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/vfa/vfa_test_print.jpg?raw=true': '../images/vfa/vfa_test_print.jpg',
}

def update_markdown_file(filepath):
    """Update image URLs in a markdown file"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Replace each image URL
    for old_url, new_path in image_mappings.items():
        # Escape special regex characters in URL
        escaped_url = re.escape(old_url)
        # Find and replace markdown image syntax
        pattern = f'!\\[([^\\]]*)\\]\\({escaped_url}\\)'
        replacement = f'![\\1]({new_path})'
        content = re.sub(pattern, replacement, content)
    
    # Write back if changed
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated: {filepath}")
    else:
        print(f"No changes needed: {filepath}")

def main():
    # Process all markdown files in the calibration directory
    calibration_dir = 'docs/orca-slicer/calibration'
    for filename in os.listdir(calibration_dir):
        if filename.endswith('.md'):
            filepath = os.path.join(calibration_dir, filename)
            update_markdown_file(filepath)

if __name__ == '__main__':
    main()