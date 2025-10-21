# Taguchi DOE Math Reference

This appendix summarizes the equations and decision criteria used inside CalibrationTool’s DOE analysis.

## Orthogonal Arrays

CalibrationTool uses the standard Taguchi orthogonal arrays for three-level factors:

| Array | Runs | Max Factors | Structure |
|-------|------|-------------|-----------|
| L9    | 9    | 4 (3-level) | 3³ | 2-level columns available via linear graphs |
| L18   | 18   | 1 × 2-level + 7 × 3-level (or combinations) |
| L27   | 27   | 13 (3-level) |

Orthogonality ensures balanced sampling of factor levels. When more than four factors are needed with L9, columns can be combined according to Taguchi linear graphs.

## Signal-to-Noise (SNR) Ratios

Taguchi classifies responses based on optimization goal:

- **Larger-is-Better (LB):**
  $$
  SNR_{LB} = -10 \log_{10}\left( \frac{1}{n} \sum_{i=1}^{n} \frac{1}{y_i^2} \right)
  $$
- **Smaller-is-Better (SB):**
  $$
  SNR_{SB} = -10 \log_{10}\left( \frac{1}{n} \sum_{i=1}^{n} y_i^2 \right)
  $$
- **Nominal-is-Best (NB):**
  $$
  SNR_{NB} = 10 \log_{10}\left( \frac{\bar{y}^2}{s^2} \right)
  $$

Where $ y_i $ are measured responses, $ \bar{y} $ is the mean, and $ s^2 $ is the variance. DOEWorkbench computes the appropriate SNR per metric definition.

## Main Effects

For each factor level $ L_j $:

$$
ME_{L_j} = \frac{1}{n_j} \sum_{i \in L_j} y_i
$$

`n_j` is the number of runs where the factor takes level $ L_j $. Plotting main effects reveals which levels improve the target metric.

## Analysis of Variance (ANOVA)

ANOVA quantifies contributions:

1. **Sum of Squares**
   $$
   SS_F = \sum_{j=1}^{k} n_j (\bar{y}_{L_j} - \bar{y})^2
   $$
2. **Degrees of Freedom**: $ df_F = k - 1 $
3. **Mean Square**: $ MS_F = SS_F / df_F $
4. **F-Value**: $ F = MS_F / MS_{error} $
5. **Contribution**: $ C = (SS_F / SS_{total}) \times 100\% $

CalibrationTool reports contribution percentages and F-values when enough degrees of freedom remain for error estimation.

## Confirmation Run Prediction

After selecting optimal levels, the predicted response is:

$$
\hat{y} = \bar{y} + \sum_{f=1}^{m} (\bar{y}_{f, \text{opt}} - \bar{y})
$$

where $ \bar{y}_{f, \text{opt}} $ is the mean response for the chosen factor level. Confidence intervals can be constructed using pooled error variance when replicate data is available (roadmap item).

## References

- Genichi Taguchi, "Introduction to Quality Engineering"
- Roy, "Design of Experiments Using the Taguchi Approach"
- ASME 2016 – DOE for additive manufacturing quality optimization
