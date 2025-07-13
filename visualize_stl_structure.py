#!/usr/bin/env python3
"""
Create ASCII visualization of the STL structure cross-sections
"""

def create_cross_section_visualization():
    """Create visual representations of the cube structure"""
    
    print("=== FLOW CALIBRATION CUBE STRUCTURE ===\n")
    print("Dimensions: 20mm x 20mm x 18.8mm")
    print("Origin: (118, 118, 0)\n")
    
    # Top view at different Z levels
    print("TOP VIEW - Cross sections at different heights:\n")
    
    # Z = 0.0 to 0.8 (solid base)
    print("Z = 0.0 to 0.8mm (Solid base):")
    print("┌────────────────────┐")
    print("│████████████████████│")
    print("│████████████████████│")
    print("│████████████████████│")
    print("│████████████████████│")
    print("│████████████████████│")
    print("└────────────────────┘")
    print("  20mm x 20mm solid\n")
    
    # Z = 0.8 to 8.8 (single wall)
    print("Z = 0.8 to 8.8mm (Single wall, 1.2mm thick):")
    print("┌────────────────────┐")
    print("│████████████████████│")
    print("│█┌────────────────┐█│")
    print("│█│                │█│ ← 1.2mm wall")
    print("│█│   17.6 x 17.6  │█│")
    print("│█│     cavity     │█│")
    print("│█└────────────────┘█│")
    print("│████████████████████│")
    print("└────────────────────┘\n")
    
    # Z = 8.8 to 18.8 (double wall)
    print("Z = 8.8 to 18.8mm (Double wall structure):")
    print("┌────────────────────┐ ← Outer edge (138mm)")
    print("│░░░░░░░░░░░░░░░░░░░│ ← 0.4mm outer wall")
    print("│░┌────────────────┐░│ ← Outer wall inner edge (137.6mm)")
    print("│░│                │░│ ← 0.8mm air gap")
    print("│░│ ┌────────────┐ │░│ ← Inner wall outer edge (119.2mm)")
    print("│░│ │████████████│ │░│ ← 0.4mm inner wall")
    print("│░│ │█          █│ │░│")
    print("│░│ │█  17.6mm  █│ │░│")
    print("│░│ │█  cavity  █│ │░│")
    print("│░│ │████████████│ │░│")
    print("│░│ └────────────┘ │░│ ← Inner wall inner edge (136.8mm)")
    print("│░└────────────────┘░│")
    print("│░░░░░░░░░░░░░░░░░░░│")
    print("└────────────────────┘\n")
    
    # Side view
    print("\nSIDE VIEW - Vertical cross section:\n")
    print("      0.4  0.8     17.6mm    0.8  0.4")
    print("     ┌───┬───┬─────────────┬───┬───┐ ← 18.8mm (top)")
    print("     │░░░│   │             │   │░░░│")
    print("     │░░░│0.4│   cavity    │0.4│░░░│ ← Double wall")
    print("10mm │░░░│mm │             │mm │░░░│   section")
    print("     │░░░│   │             │   │░░░│")
    print("     │░░░│   │             │   │░░░│")
    print("     ├───┴───┴─────────────┴───┴───┤ ← 8.8mm")
    print("     │█████████████████████████████│")
    print(" 8mm │█┌─────────────────────────┐█│ ← Single wall")
    print("     │█│                         │█│   section")
    print("     │█│       17.6 x 17.6       │█│   (1.2mm walls)")
    print("     │█│        cavity           │█│")
    print("     │█└─────────────────────────┘█│")
    print("     ├─────────────────────────────┤ ← 0.8mm")
    print("0.8mm│█████████████████████████████│ ← Solid base")
    print("     └─────────────────────────────┘ ← 0mm\n")
    
    # Legend
    print("LEGEND:")
    print("█ = Solid material (single wall)")
    print("░ = Solid material (outer wall of double wall)")
    print("│─ = Boundaries/edges")
    print("  = Air/cavity\n")
    
    # Summary of measurements
    print("KEY MEASUREMENTS:")
    print("- Total size: 20 x 20 x 18.8mm")
    print("- Base thickness: 0.8mm")
    print("- Single wall thickness: 1.2mm (from Z=0.8 to Z=8.8)")
    print("- Double wall structure (from Z=8.8 to Z=18.8):")
    print("  - Outer wall: 0.4mm thick")
    print("  - Air gap: 0.8mm")
    print("  - Inner wall: 0.4mm thick")
    print("  - Total wall thickness: 1.6mm")
    print("- Interior cavity: 17.6 x 17.6mm")

if __name__ == "__main__":
    create_cross_section_visualization()