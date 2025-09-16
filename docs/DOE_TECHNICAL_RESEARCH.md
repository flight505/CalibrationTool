# DOE Technical Research: Taguchi Methods and Response Surface Methodology

## Executive Summary

This document provides the technical foundation for implementing Design of Experiments (DOE) in the CalibrationTool, focusing on Taguchi orthogonal arrays for screening and Response Surface Methodology (RSM) for optimization.

## Part 1: Taguchi Orthogonal Arrays

### 1.1 Theoretical Foundation

Taguchi methods use orthogonal arrays to study multiple factors simultaneously with minimal experimental runs. The key principle is that main effects can be estimated independently of interactions when using orthogonal designs.

#### Mathematical Basis
An orthogonal array L_n(l^k) where:
- L = Latin square
- n = number of experimental runs
- l = number of levels per factor
- k = number of factors

The orthogonality property ensures:
```
Σ(x_i * x_j) = 0 for all i ≠ j
```

### 1.2 Standard Orthogonal Arrays for 3D Printing

#### L9 Array (3^4) - Most Common for Initial Screening
```
Run | A | B | C | D
----|---|---|---|---
1   | 1 | 1 | 1 | 1
2   | 1 | 2 | 2 | 2
3   | 1 | 3 | 3 | 3
4   | 2 | 1 | 2 | 3
5   | 2 | 2 | 3 | 1
6   | 2 | 3 | 1 | 2
7   | 3 | 1 | 3 | 2
8   | 3 | 2 | 1 | 3
9   | 3 | 3 | 2 | 1
```

**Application for 3D Printing:**
- Factor A: Temperature (Low: 190°C, Med: 210°C, High: 230°C)
- Factor B: Speed (Low: 30mm/s, Med: 50mm/s, High: 70mm/s)
- Factor C: Layer Height (Low: 0.1mm, Med: 0.2mm, High: 0.3mm)
- Factor D: Fan Speed (Low: 0%, Med: 50%, High: 100%)

#### L18 Array (2^1 × 3^7) - Mixed Levels
```
Run | A | B | C | D | E | F | G | H
----|---|---|---|---|---|---|---|---
1   | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1
2   | 1 | 1 | 2 | 2 | 2 | 2 | 2 | 2
3   | 1 | 1 | 3 | 3 | 3 | 3 | 3 | 3
... (15 more runs)
```

**Use Case:** When one factor has 2 levels (e.g., support on/off) and others have 3 levels

#### L27 Array (3^13) - Comprehensive Screening
- 27 runs for up to 13 factors at 3 levels
- Suitable for comprehensive initial studies
- Can estimate main effects and some 2-factor interactions

### 1.3 Implementation Algorithm

```typescript
class TaguchiArrayGenerator {
  /**
   * Generate L9 orthogonal array
   * Based on the construction: Column j = (i + j - 2) mod 3 + 1
   */
  generateL9(): number[][] {
    const array: number[][] = [];
    for (let run = 0; run < 9; run++) {
      const row: number[] = [];
      for (let col = 0; col < 4; col++) {
        // L9 construction algorithm
        const blockRow = Math.floor(run / 3);
        const blockCol = run % 3;
        let value: number;

        if (col === 0) {
          value = Math.floor(run / 3) + 1;
        } else {
          value = ((blockRow + (col - 1) * blockCol) % 3) + 1;
        }
        row.push(value);
      }
      array.push(row);
    }
    return array;
  }

  /**
   * Generate L18 array (2^1 × 3^7)
   */
  generateL18(): number[][] {
    // L18 has a specific structure mixing 2-level and 3-level factors
    const base = [
      [1,1,1,1,1,1,1,1],
      [1,1,2,2,2,2,2,2],
      [1,1,3,3,3,3,3,3],
      [1,2,1,1,2,2,3,3],
      [1,2,2,2,3,3,1,1],
      [1,2,3,3,1,1,2,2],
      [1,3,1,2,1,3,2,3],
      [1,3,2,3,2,1,3,1],
      [1,3,3,1,3,2,1,2],
      [2,1,1,3,3,2,2,1],
      [2,1,2,1,1,3,3,2],
      [2,1,3,2,2,1,1,3],
      [2,2,1,2,3,1,3,2],
      [2,2,2,3,1,2,1,3],
      [2,2,3,1,2,3,2,1],
      [2,3,1,3,2,3,1,2],
      [2,3,2,1,3,1,2,3],
      [2,3,3,2,1,2,3,1]
    ];
    return base;
  }
}
```

### 1.4 Signal-to-Noise Ratio Analysis

Taguchi uses S/N ratios to identify robust parameter settings:

#### Nominal-the-Best
```
S/N = 10 * log10(μ² / σ²)
```

#### Smaller-the-Better (e.g., stringing)
```
S/N = -10 * log10(Σy² / n)
```

#### Larger-the-Better (e.g., strength)
```
S/N = -10 * log10(Σ(1/y²) / n)
```

### 1.5 Main Effects Calculation

```typescript
interface MainEffect {
  factor: string;
  levels: LevelEffect[];
  optimalLevel: number;
}

interface LevelEffect {
  level: number;
  averageResponse: number;
  snRatio: number;
}

function calculateMainEffects(
  data: number[][],
  responses: number[]
): MainEffect[] {
  const effects: MainEffect[] = [];
  const numFactors = data[0].length;

  for (let factor = 0; factor < numFactors; factor++) {
    const levelSums = new Map<number, number[]>();

    // Group responses by factor level
    data.forEach((run, idx) => {
      const level = run[factor];
      if (!levelSums.has(level)) {
        levelSums.set(level, []);
      }
      levelSums.get(level)!.push(responses[idx]);
    });

    // Calculate average for each level
    const levels: LevelEffect[] = [];
    levelSums.forEach((values, level) => {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const snRatio = calculateSNRatio(values, 'nominal');
      levels.push({ level, averageResponse: avg, snRatio });
    });

    // Find optimal level
    const optimal = levels.reduce((best, current) =>
      current.snRatio > best.snRatio ? current : best
    );

    effects.push({
      factor: `Factor${factor + 1}`,
      levels,
      optimalLevel: optimal.level
    });
  }

  return effects;
}
```

## Part 2: Response Surface Methodology (RSM)

### 2.1 Central Composite Design (CCD)

CCD is the most popular RSM design, consisting of:
1. Factorial points (corners of the design space)
2. Axial/star points (along each axis)
3. Center points (for estimating pure error)

#### Design Matrix Generation
```typescript
class CCDGenerator {
  generate(numFactors: number, alpha: number = 1.414): Design {
    const points: Point[] = [];

    // 1. Factorial points (2^k)
    for (let i = 0; i < Math.pow(2, numFactors); i++) {
      const point: number[] = [];
      for (let j = 0; j < numFactors; j++) {
        point.push((i >> j) & 1 ? 1 : -1);
      }
      points.push(point);
    }

    // 2. Axial points (2k)
    for (let i = 0; i < numFactors; i++) {
      const pointPos = new Array(numFactors).fill(0);
      const pointNeg = new Array(numFactors).fill(0);
      pointPos[i] = alpha;
      pointNeg[i] = -alpha;
      points.push(pointPos, pointNeg);
    }

    // 3. Center points (typically 3-5)
    for (let i = 0; i < 5; i++) {
      points.push(new Array(numFactors).fill(0));
    }

    return { points, type: 'CCD' };
  }
}
```

#### Alpha Values for Different Properties
- **Spherical (α = √k)**: Equal prediction variance on sphere
- **Rotatable (α = (2^k)^0.25)**: Equal prediction variance at equal distances
- **Face-centered (α = 1)**: Axial points on cube faces
- **Practical (α = 1.5-2)**: Extends slightly beyond factorial space

### 2.2 Box-Behnken Design

Box-Behnken designs are rotatable and require fewer runs than CCD:

```typescript
class BoxBehnkenGenerator {
  generate(numFactors: number): Design {
    // Box-Behnken for 3 factors
    if (numFactors === 3) {
      return {
        points: [
          [-1, -1,  0],
          [ 1, -1,  0],
          [-1,  1,  0],
          [ 1,  1,  0],
          [-1,  0, -1],
          [ 1,  0, -1],
          [-1,  0,  1],
          [ 1,  0,  1],
          [ 0, -1, -1],
          [ 0,  1, -1],
          [ 0, -1,  1],
          [ 0,  1,  1],
          [ 0,  0,  0],
          [ 0,  0,  0],
          [ 0,  0,  0]
        ],
        type: 'BoxBehnken'
      };
    }
    // Add more factor combinations as needed
  }
}
```

### 2.3 Response Surface Modeling

#### Second-Order Polynomial Model
```
Y = β₀ + Σβᵢxᵢ + Σβᵢᵢxᵢ² + ΣΣβᵢⱼxᵢxⱼ + ε
```

#### Implementation
```typescript
class ResponseSurfaceModel {
  private coefficients: Map<string, number> = new Map();

  fit(X: number[][], y: number[]): void {
    // Create design matrix with quadratic and interaction terms
    const designMatrix = this.createDesignMatrix(X);

    // Use least squares to estimate coefficients
    // β = (X'X)^(-1)X'y
    const Xt = transpose(designMatrix);
    const XtX = multiply(Xt, designMatrix);
    const XtXinv = inverse(XtX);
    const Xty = multiply(Xt, y);
    const beta = multiply(XtXinv, Xty);

    this.storeCoefficients(beta);
  }

  predict(x: number[]): number {
    let prediction = this.coefficients.get('intercept') || 0;

    // Linear terms
    x.forEach((val, i) => {
      prediction += (this.coefficients.get(`x${i}`) || 0) * val;
    });

    // Quadratic terms
    x.forEach((val, i) => {
      prediction += (this.coefficients.get(`x${i}^2`) || 0) * val * val;
    });

    // Interaction terms
    for (let i = 0; i < x.length; i++) {
      for (let j = i + 1; j < x.length; j++) {
        prediction += (this.coefficients.get(`x${i}*x${j}`) || 0) * x[i] * x[j];
      }
    }

    return prediction;
  }
}
```

### 2.4 ANOVA for Response Surface

```typescript
interface ANOVATable {
  source: string;
  sumSquares: number;
  degreesOfFreedom: number;
  meanSquare: number;
  fValue: number;
  pValue: number;
}

function performANOVA(
  model: ResponseSurfaceModel,
  data: number[][],
  responses: number[]
): ANOVATable[] {
  const predictions = data.map(x => model.predict(x));
  const mean = responses.reduce((a, b) => a + b, 0) / responses.length;

  // Sum of Squares
  const SST = responses.reduce((sum, y) => sum + Math.pow(y - mean, 2), 0);
  const SSR = predictions.reduce((sum, pred) => sum + Math.pow(pred - mean, 2), 0);
  const SSE = responses.reduce((sum, y, i) => sum + Math.pow(y - predictions[i], 2), 0);

  // Degrees of freedom
  const dfR = getModelParameters(model) - 1;
  const dfE = responses.length - getModelParameters(model);
  const dfT = responses.length - 1;

  return [
    {
      source: 'Regression',
      sumSquares: SSR,
      degreesOfFreedom: dfR,
      meanSquare: SSR / dfR,
      fValue: (SSR / dfR) / (SSE / dfE),
      pValue: calculatePValue(fValue, dfR, dfE)
    },
    {
      source: 'Residual',
      sumSquares: SSE,
      degreesOfFreedom: dfE,
      meanSquare: SSE / dfE,
      fValue: null,
      pValue: null
    },
    {
      source: 'Total',
      sumSquares: SST,
      degreesOfFreedom: dfT,
      meanSquare: null,
      fValue: null,
      pValue: null
    }
  ];
}
```

## Part 3: Optimization Algorithms

### 3.1 Desirability Function Approach

```typescript
interface DesirabilityFunction {
  type: 'minimize' | 'maximize' | 'target';
  lower: number;
  upper: number;
  target?: number;
  weight: number;
}

function calculateDesirability(
  value: number,
  spec: DesirabilityFunction
): number {
  switch (spec.type) {
    case 'minimize':
      if (value <= spec.lower) return 1;
      if (value >= spec.upper) return 0;
      return Math.pow((spec.upper - value) / (spec.upper - spec.lower), spec.weight);

    case 'maximize':
      if (value >= spec.upper) return 1;
      if (value <= spec.lower) return 0;
      return Math.pow((value - spec.lower) / (spec.upper - spec.lower), spec.weight);

    case 'target':
      if (value === spec.target) return 1;
      if (value <= spec.lower || value >= spec.upper) return 0;
      if (value < spec.target!) {
        return Math.pow((value - spec.lower) / (spec.target! - spec.lower), spec.weight);
      } else {
        return Math.pow((spec.upper - value) / (spec.upper - spec.target!), spec.weight);
      }
  }
}

function overallDesirability(
  responses: Map<string, number>,
  specifications: Map<string, DesirabilityFunction>
): number {
  let product = 1;
  let count = 0;

  responses.forEach((value, name) => {
    const spec = specifications.get(name);
    if (spec) {
      product *= calculateDesirability(value, spec);
      count++;
    }
  });

  return Math.pow(product, 1 / count); // Geometric mean
}
```

### 3.2 Gradient-Based Optimization

```typescript
class GradientOptimizer {
  optimize(
    model: ResponseSurfaceModel,
    constraints: Constraint[],
    initialPoint: number[],
    learningRate: number = 0.01,
    maxIterations: number = 1000
  ): number[] {
    let current = [...initialPoint];

    for (let iter = 0; iter < maxIterations; iter++) {
      // Calculate gradient
      const gradient = this.calculateGradient(model, current);

      // Update position
      const next = current.map((val, i) => val + learningRate * gradient[i]);

      // Apply constraints
      const constrained = this.applyConstraints(next, constraints);

      // Check convergence
      if (this.hasConverged(current, constrained)) {
        break;
      }

      current = constrained;
    }

    return current;
  }

  private calculateGradient(model: ResponseSurfaceModel, point: number[]): number[] {
    const epsilon = 0.0001;
    const gradient: number[] = [];

    for (let i = 0; i < point.length; i++) {
      const pointPlus = [...point];
      const pointMinus = [...point];
      pointPlus[i] += epsilon;
      pointMinus[i] -= epsilon;

      const fPlus = model.predict(pointPlus);
      const fMinus = model.predict(pointMinus);

      gradient.push((fPlus - fMinus) / (2 * epsilon));
    }

    return gradient;
  }
}
```

## Part 4: 3D Printing-Specific Considerations

### 4.1 Factor Selection for 3D Printing

#### Primary Factors (Always Consider)
1. **Temperature**: Affects adhesion, flow, stringing
2. **Speed**: Impacts quality, cooling, vibrations
3. **Layer Height**: Resolution vs. time trade-off
4. **Flow Ratio**: Dimensional accuracy, surface quality

#### Secondary Factors (Application-Specific)
5. **Fan Speed**: Cooling, overhangs, warping
6. **Retraction**: Stringing control
7. **Pressure Advance**: Corner quality
8. **Z-offset**: First layer adhesion

#### Advanced Factors
9. **Acceleration**: Print time, quality
10. **Jerk**: Corner behavior
11. **Line Width**: Wall strength, detail

### 4.2 Response Metrics for 3D Printing

```typescript
interface PrintQualityMetrics {
  // Dimensional
  dimensionalAccuracy: number;  // mm deviation

  // Surface Quality
  surfaceRoughness: number;     // 1-10 scale
  layerAdhesion: number;        // 1-10 scale

  // Features
  overhangQuality: number;      // max angle achieved
  bridgingQuality: number;      // 1-10 scale
  cornerSharpness: number;      // 1-10 scale

  // Defects
  stringingCount: number;       // number of strings
  blobCount: number;            // number of blobs
  warpingAmount: number;        // mm of lift

  // Performance
  printTime: number;            // minutes
  materialUsed: number;         // grams
}
```

### 4.3 Interaction Effects in 3D Printing

Common significant interactions:
1. **Temperature × Speed**: Higher temps allow faster printing
2. **Layer Height × Speed**: Thicker layers need slower speeds
3. **Temperature × Fan Speed**: Balance between cooling and adhesion
4. **Flow × Temperature**: Temperature affects material viscosity

### 4.4 Robust Parameter Design

Apply Taguchi's philosophy for robust 3D printing:

```typescript
interface RobustDesign {
  controlFactors: Factor[];      // Adjustable parameters
  noiseFactors: Factor[];        // Environmental variations
  signalFactor?: Factor;         // Target dimension/quality
}

// Example noise factors in 3D printing
const noiseFactors = [
  { name: 'Ambient Temperature', levels: [18, 22, 26] },  // °C
  { name: 'Filament Diameter', levels: [1.70, 1.75, 1.80] }, // mm
  { name: 'Humidity', levels: [30, 50, 70] }  // %
];
```

## Part 5: Implementation Roadmap

### Phase 1: Basic Infrastructure (Week 1-2)
1. Implement orthogonal array generators (L9, L18, L27)
2. Create factor-level mapping system
3. Build experiment matrix display
4. Generate basic experimental run sheets

### Phase 2: Response Surface Methods (Week 3-4)
1. Implement CCD and Box-Behnken generators
2. Build polynomial regression fitting
3. Create ANOVA analysis tools
4. Implement model validation (R², adjusted R², lack of fit)

### Phase 3: Optimization Tools (Week 5-6)
1. Implement desirability functions
2. Build gradient-based optimizer
3. Create constraint handling system
4. Generate optimal parameter predictions

### Phase 4: Visualization (Week 7-8)
1. Main effects plots
2. Interaction plots
3. 3D response surfaces
4. Contour plots
5. Optimization path visualization

### Phase 5: Integration (Week 9-10)
1. Connect to G-code generation
2. Link with existing calibration tools
3. Create experiment tracking database
4. Build reporting system

## Conclusion

This technical foundation provides the mathematical and algorithmic basis for implementing DOE in the CalibrationTool. The combination of Taguchi methods for screening and RSM for optimization creates a powerful framework for systematic 3D printer calibration.

Key implementation priorities:
1. Start with L9 Taguchi array for quick wins
2. Focus on 4-5 primary factors initially
3. Use simple quality metrics (1-10 scales)
4. Gradually add advanced features (RSM, optimization)
5. Validate against manual calibration results