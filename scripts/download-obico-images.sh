#!/bin/bash

# Download Obico blog images
echo "Downloading Obico blog images..."

# Base URL for Obico website
BASE_URL="https://www.obico.io"

# Download profile management images
download_image() {
    local url=$1
    local output_path=$2
    echo "Downloading: $url"
    curl -L -s -o "$output_path" "$url"
}

# Profile inheritance diagrams
download_image "${BASE_URL}/assets/images/profile-inheritance-1-f99f61ba85305f8d86561ba24decfdfd.png" "docs/orca-slicer/images/profiles/profile-inheritance-1.png"
download_image "${BASE_URL}/assets/images/profile-inheritance-2-3b6c3c902e55d3b4781c820774b3022e.png" "docs/orca-slicer/images/profiles/profile-inheritance-2.png"

# File explorer screenshots
download_image "${BASE_URL}/assets/images/finder-window-user-directory-98bee27b22995a3e5e97453b709d6cf9.png" "docs/orca-slicer/images/profiles/finder-window-user-directory.png"

# Settings windows
download_image "${BASE_URL}/assets/images/filament-settings-window-user-preset-ddf4e91c7c996f2cd7e9fc3c20806cf7.png" "docs/orca-slicer/images/profiles/filament-settings-window-user-preset.png"

# Export/Import dialogs
download_image "${BASE_URL}/assets/images/export-preset-bundle-98192571d62fa344295e7995aa14ea9c.png" "docs/orca-slicer/images/profiles/export-preset-bundle.png"
download_image "${BASE_URL}/assets/images/import-configs-dialog-b31745db0a6bcf52d175289e97602e1f.png" "docs/orca-slicer/images/profiles/import-configs-dialog.png"

# Auto sync option
download_image "${BASE_URL}/assets/images/auto-sync-user-presets-a8b4ff6a27524267de1180d4d23beb27.png" "docs/orca-slicer/images/profiles/auto-sync-user-presets.png"

echo "All Obico images downloaded successfully!"