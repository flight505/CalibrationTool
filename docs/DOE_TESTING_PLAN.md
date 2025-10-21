# DOE 3MF Generation - Testing Plan

**Date Created**: 2025-01-21
**Implementation Status**: Complete (95%)
**Next Step**: Testing & Validation

---

## What Was Completed

### ✅ Implementation (2025-01-21)

1. **Test Model Path Updates**
   - Updated all 5 DOE test models in `src/utils/doe/testModels.ts`
   - Changed paths from `/templates/doe/` to `/ascii_stl/`
   - Models updated: bridge_array, overhang_test, clearance_test, surface_patch, calibration_cube

2. **Batch ZIP Download**
   - Enhanced `ExperimentPlanner.createBatchDownload()` in `src/utils/doe/experimentPlanner.ts`
   - Uses JSZip to bundle all 3MF files, CSV manifest, and README
   - DEFLATE compression level 6 for optimal size/speed

3. **UI Integration**
   - Added `handleBatchDownload()` function in `src/components/DOEWorkbench.tsx`
   - "Download All Files (ZIP)" button with loading states
   - Shows file count and helpful description

4. **Documentation Updates**
   - Updated `CLAUDE.md` with 95% completion status
   - Updated `docs/LLM_ASSISTED_DOE_REVISED.md` with current status and next steps
   - Updated `docs/DOE_PARTS_LIBRARY_SPEC.md` with implementation status

### Build Verification
- ✅ TypeScript: No errors (`npx tsc --noEmit`)
- ✅ Build: Successful (`npm run build`)
- ✅ Linting: Pre-existing warnings only (not related to changes)

---

## Testing Procedure

### Test 1: Basic L9 Experiment Generation

**Goal**: Verify 3MF files generate and download correctly

**Steps**:
1. Start dev server: `npm run dev`
2. Navigate to DOE Workbench in the app
3. Create a new experiment:
   - **Name**: "Test L9 PLA Calibration"
   - **Description**: "Testing 3MF generation"
   - **Array Type**: L9
   - **Test Model**: Calibration Cube
4. Add 4 factors (for full L9 array):
   - Temperature: 190, 205, 220°C
   - Fan Speed: 50, 75, 100%
   - Print Speed: 40, 60, 80 mm/s
   - Layer Height: 0.1, 0.2, 0.3 mm
5. Click "Generate Experiment Files"
6. Wait for 9 3MF files to generate
7. Click "Download All Files (ZIP)"

**Expected Results**:
- ZIP file downloads successfully
- Filename format: `Test_L9_PLA_Calibration_L9_Complete.zip`
- ZIP contains:
  - 9 3MF files (one per run)
  - `L9_experiment_design.csv`
  - `README.txt`

### Test 2: OrcaSlicer Validation

**Goal**: Verify 3MF files work correctly in OrcaSlicer

**Steps**:
1. Extract the ZIP file from Test 1
2. Open `README.txt` and verify:
   - Experiment name and description are correct
   - Factor list matches what you configured
   - Estimated print time is shown
3. Open CSV file and verify:
   - 9 runs listed (for L9)
   - Factor values match expected Taguchi array
   - Filenames match the 3MF files in the ZIP
4. Open **first** 3MF file in OrcaSlicer:
   - File: `DOE_L9_Run01_T190_F50_S40_L01.3mf`
5. Verify geometry:
   - Calibration cube (20mm) loads correctly
   - No geometry errors or warnings
6. Check embedded settings:
   - Open OrcaSlicer settings panel
   - Verify Temperature = 190°C (matches Run 1 in CSV)
   - Verify Fan Speed = 50% (matches Run 1 in CSV)
   - Verify Print Speed = 40 mm/s (matches Run 1 in CSV)
   - Verify Layer Height = 0.1 mm (matches Run 1 in CSV)
7. Slice the model:
   - No errors during slicing
   - G-code preview looks correct
   - Estimated print time is reasonable

### Test 3: Multiple Test Models

**Goal**: Verify different test models work correctly

**Steps**:
1. Create L9 experiment with **Bridge Array** test model
2. Generate files and download ZIP
3. Open one 3MF file in OrcaSlicer
4. Verify:
   - Bridge array geometry loads correctly
   - Settings are embedded properly
   - Model slices without errors

### Test 4: Different Array Sizes

**Goal**: Verify L18 and L27 arrays work

**Steps**:
1. Create **L18** experiment with 6-7 factors
2. Generate files - should create 18 3MF files
3. Verify ZIP contains all 18 files + CSV + README
4. Repeat for **L27** (27 files)

### Test 5: Error Handling

**Goal**: Verify graceful error handling

**Steps**:
1. Create experiment with invalid configuration (if possible)
2. Verify error messages are clear
3. Try downloading ZIP before generating files
4. Verify appropriate error/disabled state

---

## Expected File Structures

### ZIP Archive Contents
```
Test_L9_PLA_Calibration_L9_Complete.zip
├── README.txt                           # Experiment summary
├── L9_experiment_design.csv            # Parameter matrix
├── DOE_L9_Run01_T190_F50_S40_L01.3mf
├── DOE_L9_Run02_T190_F75_S60_L02.3mf
├── DOE_L9_Run03_T190_F100_S80_L03.3mf
├── DOE_L9_Run04_T205_F50_S60_L03.3mf
├── DOE_L9_Run05_T205_F75_S80_L01.3mf
├── DOE_L9_Run06_T205_F100_S40_L02.3mf
├── DOE_L9_Run07_T220_F50_S80_L02.3mf
├── DOE_L9_Run08_T220_F75_S40_L03.3mf
└── DOE_L9_Run09_T220_F100_S60_L01.3mf
```

### README.txt Format
```
Experiment: Test L9 PLA Calibration
Description: Testing 3MF generation
Array Type: L9 (9 runs)
Test Model: 20mm Calibration Cube
Estimated Total Print Time: 135 minutes

Factors:
  - Temperature: 190, 205, 220 °C
  - Fan Speed: 50, 75, 100 %
  - Print Speed: 40, 60, 80 mm/s
  - Layer Height: 0.1, 0.2, 0.3 mm
```

### CSV Format
```csv
Run Number,Temperature (°C),Fan Speed (%),Print Speed (mm/s),Layer Height (mm),File Name
1,190,50,40,0.1,DOE_L9_Run01_T190_F50_S40_L01.3mf
2,190,75,60,0.2,DOE_L9_Run02_T190_F75_S60_L02.3mf
...
```

---

## Known Issues to Watch For

1. **Parameter Embedding**: Ensure OrcaSlicer settings actually use the embedded values
2. **File Paths**: Verify ASCII STL files load correctly from `ascii_stl/` folder
3. **ZIP Compression**: Check file sizes are reasonable (not bloated)
4. **Filename Sanitization**: Test with experiment names containing special characters

---

## Success Criteria

- [ ] ZIP file downloads successfully
- [ ] ZIP contains correct number of files (9 for L9, 18 for L18, 27 for L27)
- [ ] README and CSV are present and correctly formatted
- [ ] 3MF files open in OrcaSlicer without errors
- [ ] Test model geometry loads correctly
- [ ] Parameter values are embedded in 3MF settings
- [ ] Embedded parameters match CSV manifest
- [ ] Files slice successfully in OrcaSlicer
- [ ] All array types work (L9, L18, L27)
- [ ] Multiple test models work (calibration_cube, bridge_array, etc.)

---

## Bug Reporting Template

If issues are found, report using this format:

```
**Test**: [Test number/name]
**Step**: [Step where issue occurred]
**Expected**: [What should have happened]
**Actual**: [What actually happened]
**Screenshot**: [If applicable]
**Console Errors**: [Browser console or terminal errors]
```

---

## Next Steps After Testing

1. **If All Tests Pass**:
   - Mark DOE implementation as 100% complete
   - Update documentation with confirmed working status
   - Begin work on persistence/polish features

2. **If Issues Found**:
   - Document all issues in bug report format
   - Prioritize fixes based on severity
   - Re-test after fixes applied

---

## Additional Notes

- Test with Chrome/Firefox/Safari to ensure cross-browser compatibility
- Test on different OS (macOS/Windows/Linux) if possible
- Consider testing with large array (L27) to check performance
- Verify memory usage doesn't spike during ZIP generation
