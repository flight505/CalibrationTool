# DOE Scoring & Best Practices

Reliable measurements are crucial for meaningful DOE results. This guide explains how to evaluate runs, log data, and troubleshoot issues during a DOE campaign.

## Measurement Principles

1. **Consistency first** – Use the same tools (calipers, microscope, camera) and the same evaluator for all runs.
2. **Quantify when possible** – Dimensional accuracy, surface roughness, and tensile strength should be numeric measurements.
3. **Qualitative scoring** – When visual grading is unavoidable, use the provided 1–5 rubric descriptors.
4. **Record anomalies** – Note warping, stringing, or failed layers in the run notes; GPT-5 uses this context in analysis.

## Recommended Metrics by Test Part

| Test Part | Primary Metric | Measurement Method |
|-----------|----------------|--------------------|
| Calibration Cube | Dimensional error (mm) | Measure all axes, use absolute deviation |
| Bridge Array | Surface / bridging score | Inspect underside, rate 1–5 based on sag |
| Overhang Ramp | Overhang quality score | Observe layer droop, assign 1–5 |
| Surface Patch | Surface roughness (subjective) | Macro photo + rubric |
| PA Tower | Seam uniformity (mm or 1–5) | Compare start/stop artifacts |

## Data Entry in DOE Workbench

- Each run row displays factor settings; click the measurement cell and enter numeric value or rubric score.
- Use decimal precision to 0.01 where appropriate.
- The notes field accepts free text (e.g., "Bridge failed – filament jam").

## Handling Missing or Failed Runs

- **Reprint when possible** – Maintain balanced datasets.
- **Mark as null** – Leave measurement blank; GPT-5 will warn that data is incomplete.
- **Document the reason** – Helps identify systemic issues affecting entire factor levels.

## Evaluating Results

- Inspect main effects: large swings indicate sensitive factors worth tightening.
- Check SNR: higher magnitude implies more robust performance.
- Use GPT-5 confirmation recommendations to validate final settings before updating slicer profiles.

## Troubleshooting

| Issue | Possible Cause | Mitigation |
|-------|----------------|------------|
| All runs poor quality | Incorrect baseline (wrong nozzle temp) | Re-run Phase 1 with updated constraints |
| Metric has large variance | Measurement noise, inconsistent scoring | Improve measurement tooling or add replicates |
| GPT-5 suggestions seem counterintuitive | Incomplete or noisy data | Rerun analysis after verifying scores; check notes |

Maintaining accurate measurements ensures DOE analysis reflects real printer behavior, enabling confident updates to Orca profiles.
