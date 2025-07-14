#!/bin/bash

# Create image directories
mkdir -p docs/orca-slicer/images/{calibration,flow-rate,input-shaping,junction-deviation,mvf,pa,retraction,temp-calib,tolerance,vfa,profiles}

# Function to download image
download_image() {
    local url=$1
    local output_path=$2
    echo "Downloading: $url"
    curl -L -s -o "$output_path" "$url"
}

# Main calibration image
download_image "https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/calibration.png?raw=true" "docs/orca-slicer/images/calibration/calibration.png"

# Flow Rate images
download_image "https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/Flow-Rate/flow-calibration.gif?raw=true" "docs/orca-slicer/images/flow-rate/flow-calibration.gif"
download_image "https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/Flow-Rate/flowcalibration_update_flowrate.png?raw=true" "docs/orca-slicer/images/flow-rate/flowcalibration_update_flowrate.png"
download_image "https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/Flow-Rate/flowrate-0-5.jpg?raw=true" "docs/orca-slicer/images/flow-rate/flowrate-0-5.jpg"
download_image "https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/Flow-Rate/flowrate-6.jpg?raw=true" "docs/orca-slicer/images/flow-rate/flowrate-6.jpg"
download_image "https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/Flow-Rate/flowrate-Bambulab-uncheck.png?raw=true" "docs/orca-slicer/images/flow-rate/flowrate-Bambulab-uncheck.png"
download_image "https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/Flow-Rate/flowrate-pass1.jpg?raw=true" "docs/orca-slicer/images/flow-rate/flowrate-pass1.jpg"
download_image "https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/Flow-Rate/flowrate-pass2.jpg?raw=true" "docs/orca-slicer/images/flow-rate/flowrate-pass2.jpg"

# Input Shaping images
download_image "https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/InputShaping/IS_damp_klipper_print_measure.jpg?raw=true" "docs/orca-slicer/images/input-shaping/IS_damp_klipper_print_measure.jpg"
download_image "https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/InputShaping/IS_damp_klipper_slicer_measure.png?raw=true" "docs/orca-slicer/images/input-shaping/IS_damp_klipper_slicer_measure.png"
download_image "https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/InputShaping/IS_damp_marlin_print_measure.jpg?raw=true" "docs/orca-slicer/images/input-shaping/IS_damp_marlin_print_measure.jpg"
download_image "https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/InputShaping/IS_damp_marlin_slicer_measure.png?raw=true" "docs/orca-slicer/images/input-shaping/IS_damp_marlin_slicer_measure.png"
download_image "https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/InputShaping/IS_damp_menu.png?raw=true" "docs/orca-slicer/images/input-shaping/IS_damp_menu.png"
download_image "https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/InputShaping/IS_freq_klipper_slicer_measure.png?raw=true" "docs/orca-slicer/images/input-shaping/IS_freq_klipper_slicer_measure.png"
download_image "https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/InputShaping/IS_freq_marlin_print_measure.jpg?raw=true" "docs/orca-slicer/images/input-shaping/IS_freq_marlin_print_measure.jpg"
download_image "https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/InputShaping/IS_freq_marlin_slicer_measure.png?raw=true" "docs/orca-slicer/images/input-shaping/IS_freq_marlin_slicer_measure.png"
download_image "https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/InputShaping/IS_freq_menu.png?raw=true" "docs/orca-slicer/images/input-shaping/IS_freq_menu.png"

# Junction Deviation images
download_image "https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/JunctionDeviation/jd_first_menu.png?raw=true" "docs/orca-slicer/images/junction-deviation/jd_first_menu.png"
download_image "https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/JunctionDeviation/jd_first_print_measure.jpg?raw=true" "docs/orca-slicer/images/junction-deviation/jd_first_print_measure.jpg"
download_image "https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/JunctionDeviation/jd_first_slicer_measure.png?raw=true" "docs/orca-slicer/images/junction-deviation/jd_first_slicer_measure.png"
download_image "https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/JunctionDeviation/jd_printer_jerk_limitation.png?raw=true" "docs/orca-slicer/images/junction-deviation/jd_printer_jerk_limitation.png"
download_image "https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/JunctionDeviation/jd_second_menu.png?raw=true" "docs/orca-slicer/images/junction-deviation/jd_second_menu.png"
download_image "https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/JunctionDeviation/jd_second_print_measure.jpg?raw=true" "docs/orca-slicer/images/junction-deviation/jd_second_print_measure.jpg"
download_image "https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/JunctionDeviation/jd_second_slicer_measure.png?raw=true" "docs/orca-slicer/images/junction-deviation/jd_second_slicer_measure.png"

# PA (Pressure Advance) images
download_image "https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/pa/apa-expected-results.jpg?raw=true" "docs/orca-slicer/images/pa/apa-expected-results.jpg"
download_image "https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/pa/apa-expected-seam.jpg?raw=true" "docs/orca-slicer/images/pa/apa-expected-seam.jpg"
download_image "https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/pa/apa-expected-solid-infill.jpg?raw=true" "docs/orca-slicer/images/pa/apa-expected-solid-infill.jpg"
download_image "https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/pa/apa-identify-optimal.jpg?raw=true" "docs/orca-slicer/images/pa/apa-identify-optimal.jpg"
download_image "https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/pa/apa-identify-too-high.jpg?raw=true" "docs/orca-slicer/images/pa/apa-identify-too-high.jpg"
download_image "https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/pa/apa-identify-too-low.jpg?raw=true" "docs/orca-slicer/images/pa/apa-identify-too-low.jpg"
download_image "https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/pa/apa-material-config.png?raw=true" "docs/orca-slicer/images/pa/apa-material-config.png"
download_image "https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/pa/apa-profile.png?raw=true" "docs/orca-slicer/images/pa/apa-profile.png"
download_image "https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/pa/apa-setup-result-acceleration-jerk.png?raw=true" "docs/orca-slicer/images/pa/apa-setup-result-acceleration-jerk.png"
download_image "https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/pa/apa-setup-result-speed.png?raw=true" "docs/orca-slicer/images/pa/apa-setup-result-speed.png"
download_image "https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/pa/apa-test.png?raw=true" "docs/orca-slicer/images/pa/apa-test.png"
download_image "https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/pa/apa-test210.png?raw=true" "docs/orca-slicer/images/pa/apa-test210.png"
download_image "https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/pa/apa-unexpected-solid-infill.jpg?raw=true" "docs/orca-slicer/images/pa/apa-unexpected-solid-infill.jpg"
download_image "https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/pa/pa-pattern-batch.png?raw=true" "docs/orca-slicer/images/pa/pa-pattern-batch.png"
download_image "https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/pa/pa-pattern-general.png?raw=true" "docs/orca-slicer/images/pa/pa-pattern-general.png"
download_image "https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/pa/pa-tower.jpg?raw=true" "docs/orca-slicer/images/pa/pa-tower.jpg"

# Other calibration images
download_image "https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/MVF/mvf_measurement_point.jpg?raw=true" "docs/orca-slicer/images/mvf/mvf_measurement_point.jpg"
download_image "https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/retraction/retraction_test_print.jpg?raw=true" "docs/orca-slicer/images/retraction/retraction_test_print.jpg"
download_image "https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/Temp-calib/temp-tower.jpg?raw=true" "docs/orca-slicer/images/temp-calib/temp-tower.jpg"
download_image "https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/Tolerance/OrcaToleranceTes_m6.jpg?raw=true" "docs/orca-slicer/images/tolerance/OrcaToleranceTes_m6.jpg"
download_image "https://github.com/SoftFever/OrcaSlicer/raw/main/doc/images/vfa/vfa_test_print.jpg?raw=true" "docs/orca-slicer/images/vfa/vfa_test_print.jpg"

echo "All images downloaded successfully!"