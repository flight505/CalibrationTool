# DOE Planner Documentation Outline (Draft)

## 1. Introduction to Design of Experiments (DOE)
- Overview of DOE philosophy and benefits compared to one-factor-at-a-time
- Taguchi methodology focus (orthogonal arrays, SNR)
- Why DOE matters for FDM 3D printing calibration

## 2. DOE in CalibrationTool
- High-level workflow (Phase 1 planning → printing → Phase 2 analysis)
- Role of GPT-5 assistance and when it is used vs manual controls
- Data persistence, experiment sessions, and limitations

## 3. DOE Fundamentals Refresher
- Factors, levels, responses, noise factors
- Orthogonal arrays (L9, L18, L27) characteristics
- Taguchi signal-to-noise ratio types and formulas
- Main effects, ANOVA, interaction considerations

## 4. 3D Printing Use Cases
- Mapping common printer/filament variables to DOE factors
- Typical metrics (dimensional accuracy, surface quality, strength) and how they map to responses
- Example experiments for PLA, PETG, engineering filaments

## 5. Using the DOE Planner (UI Guide)
- Navigation and prerequisites
- Configuring experiment metadata (name, array selection)
- Adding factors manually vs applying GPT-5 proposals
- Generating experiment batch (3MF, CSV)

## 6. Printing & Scoring Workflow
- Running the generated prints
- Using scoring rubric and measurement best practices
- Recording results inside CalibrationTool (data entry tips)

## 7. Phase 2 Analysis & Interpretation
- Manual analysis outputs (main effects, SNR, ANOVA)
- GPT-5 assisted analysis view and how to interpret recommendations
- Confirmation runs and refining factors

## 8. Best Practices & Troubleshooting
- Ensuring reliable data (repeatability, measurement accuracy)
- Handling failed prints or missing data
- When to re-run or extend experiments

## 9. Advanced Topics & Future Enhancements
- Adaptive follow-up experiments (sequential DOE)
- Integration with Orca profiles/export
- Known limitations and roadmap items

## 10. Reference Material
- Glossary of DOE terms
- Math formula appendix
- Links to DOE research papers and recommended reading

