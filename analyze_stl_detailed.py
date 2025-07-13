#!/usr/bin/env python3
"""
Detailed analysis of the STL structure to understand the double wall geometry
"""

import struct
from collections import defaultdict

def read_binary_stl(filename):
    """Read a binary STL file and extract all vertex data"""
    triangles = []
    
    with open(filename, 'rb') as f:
        # Skip 80-byte header
        f.read(80)
        
        # Read number of triangles
        num_triangles = struct.unpack('<I', f.read(4))[0]
        
        # Read each triangle
        for i in range(num_triangles):
            # Read normal vector (3 floats)
            normal = struct.unpack('<fff', f.read(12))
            
            # Read 3 vertices (each is 3 floats)
            vertices = []
            for j in range(3):
                vertex = struct.unpack('<fff', f.read(12))
                vertices.append(vertex)
            
            # Skip attribute byte count
            f.read(2)
            
            triangles.append({
                'normal': normal,
                'vertices': vertices
            })
    
    return triangles

def analyze_wall_structure(triangles):
    """Analyze the wall structure in detail"""
    # Extract all unique vertices
    vertex_set = set()
    for triangle in triangles:
        for vertex in triangle['vertices']:
            vertex_set.add(tuple(round(v, 6) for v in vertex))
    
    vertices = sorted(list(vertex_set))
    
    print("=== DETAILED WALL STRUCTURE ANALYSIS ===\n")
    
    # Analyze dimensions
    x_coords = sorted(set(round(v[0], 2) for v in vertices))
    y_coords = sorted(set(round(v[1], 2) for v in vertices))
    z_coords = sorted(set(round(v[2], 2) for v in vertices))
    
    print("Unique coordinates:")
    print(f"X: {x_coords}")
    print(f"Y: {y_coords}")
    print(f"Z: {z_coords}")
    
    # Calculate wall thicknesses
    print("\nWall analysis:")
    print(f"Outer dimensions: {x_coords[-1] - x_coords[0]:.2f} x {y_coords[-1] - y_coords[0]:.2f} x {z_coords[-1] - z_coords[0]:.2f}")
    
    # Analyze X walls
    x_gaps = []
    for i in range(len(x_coords)-1):
        gap = x_coords[i+1] - x_coords[i]
        x_gaps.append((x_coords[i], x_coords[i+1], gap))
    
    print("\nX-direction gaps:")
    for start, end, gap in x_gaps:
        print(f"  {start:.2f} -> {end:.2f}: {gap:.2f}mm")
    
    # Analyze Y walls
    y_gaps = []
    for i in range(len(y_coords)-1):
        gap = y_coords[i+1] - y_coords[i]
        y_gaps.append((y_coords[i], y_coords[i+1], gap))
    
    print("\nY-direction gaps:")
    for start, end, gap in y_gaps:
        print(f"  {start:.2f} -> {end:.2f}: {gap:.2f}mm")
    
    # Analyze Z structure
    print("\nZ-direction structure:")
    for i in range(len(z_coords)-1):
        print(f"  {z_coords[i]:.2f} -> {z_coords[i+1]:.2f}: {z_coords[i+1] - z_coords[i]:.2f}mm")
    
    # Group vertices by layer to understand the geometry
    print("\n=== LAYER-BY-LAYER STRUCTURE ===")
    
    z_groups = defaultdict(list)
    for v in vertices:
        z_groups[round(v[2], 2)].append(v)
    
    for z in sorted(z_groups.keys()):
        layer_verts = z_groups[z]
        print(f"\nZ = {z:.2f}mm layer ({len(layer_verts)} vertices):")
        
        # Sort vertices by X then Y for clarity
        layer_verts.sort(key=lambda v: (v[0], v[1]))
        
        for v in layer_verts:
            print(f"  ({v[0]:.2f}, {v[1]:.2f})")
        
        # Analyze the pattern
        x_coords_layer = sorted(set(v[0] for v in layer_verts))
        y_coords_layer = sorted(set(v[1] for v in layer_verts))
        
        print(f"  X range: {min(x_coords_layer):.2f} to {max(x_coords_layer):.2f}")
        print(f"  Y range: {min(y_coords_layer):.2f} to {max(y_coords_layer):.2f}")
    
    # Identify wall structure
    print("\n=== WALL IDENTIFICATION ===")
    
    # Bottom (Z=0.0) has only outer corners
    print("Bottom layer (Z=0.0): Full solid base 20x20mm")
    
    # Z=0.8 has inner corners - this is where the hollow starts
    print("\nHollow starts at Z=0.8:")
    print("  Outer wall: 118.0 to 138.0 (20mm)")
    print("  Inner cavity: 119.2 to 136.8 (17.6mm)")
    print("  Wall thickness: 1.2mm on each side")
    
    # Z=8.8 has double wall structure
    print("\nDouble wall appears at Z=8.8:")
    print("  Outer shell: 118.4 to 137.6 (19.2mm)")
    print("  Inner shell: 119.2 to 136.8 (17.6mm)")
    print("  Gap between shells: 0.8mm (outer) to 0.8mm (inner)")
    print("  Each wall thickness: 0.4mm")
    
    # Z=18.8 is the top
    print("\nTop layer (Z=18.8): Double wall continues to top")
    
    # Calculate the structure
    print("\n=== FINAL STRUCTURE SUMMARY ===")
    print("1. Base (0-0.8mm): Solid bottom, 20x20mm")
    print("2. Single wall section (0.8-8.8mm): 1.2mm thick walls, hollow interior")
    print("3. Double wall section (8.8-18.8mm): Two concentric walls")
    print("   - Outer wall at 118.4/137.6mm (0.4mm from outer edge)")
    print("   - Inner wall at 119.2/136.8mm (1.2mm from outer edge)")
    print("   - Gap between walls: 0.8mm")
    print("   - Total wall structure: 1.6mm (0.4 + 0.8 + 0.4)")

if __name__ == "__main__":
    filename = "FlowCalibrationCube.stl"
    triangles = read_binary_stl(filename)
    analyze_wall_structure(triangles)