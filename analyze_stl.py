#!/usr/bin/env python3
"""
Analyze the structure of a binary STL file to understand the geometry
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
        print(f"Number of triangles: {num_triangles}")
        
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

def analyze_geometry(triangles):
    """Analyze the geometry to understand the structure"""
    # Extract all unique vertices
    vertex_set = set()
    for triangle in triangles:
        for vertex in triangle['vertices']:
            vertex_set.add(tuple(round(v, 6) for v in vertex))
    
    vertices = sorted(list(vertex_set))
    print(f"\nNumber of unique vertices: {len(vertices)}")
    
    # Find bounding box
    x_coords = [v[0] for v in vertices]
    y_coords = [v[1] for v in vertices]
    z_coords = [v[2] for v in vertices]
    
    print(f"\nBounding box:")
    print(f"X: {min(x_coords):.2f} to {max(x_coords):.2f} (width: {max(x_coords) - min(x_coords):.2f})")
    print(f"Y: {min(y_coords):.2f} to {max(y_coords):.2f} (depth: {max(y_coords) - min(y_coords):.2f})")
    print(f"Z: {min(z_coords):.2f} to {max(z_coords):.2f} (height: {max(z_coords) - min(z_coords):.2f})")
    
    # Group vertices by Z coordinate to understand layers
    z_groups = defaultdict(list)
    for v in vertices:
        z_groups[round(v[2], 2)].append(v)
    
    print(f"\nZ-layers found: {len(z_groups)}")
    for z, verts in sorted(z_groups.items()):
        print(f"  Z={z:.2f}: {len(verts)} vertices")
    
    # Analyze unique X and Y coordinates
    unique_x = sorted(set(round(v[0], 2) for v in vertices))
    unique_y = sorted(set(round(v[1], 2) for v in vertices))
    
    print(f"\nUnique X coordinates: {unique_x}")
    print(f"Unique Y coordinates: {unique_y}")
    
    # Analyze triangles by their normal direction
    normal_groups = defaultdict(list)
    for i, triangle in enumerate(triangles):
        normal = tuple(round(n, 2) for n in triangle['normal'])
        normal_groups[normal].append(i)
    
    print(f"\nTriangle normal directions:")
    for normal, indices in sorted(normal_groups.items()):
        print(f"  {normal}: {len(indices)} triangles")
    
    # Print all vertices for detailed analysis
    print(f"\nAll unique vertices:")
    for i, v in enumerate(vertices):
        print(f"  {i}: ({v[0]:.2f}, {v[1]:.2f}, {v[2]:.2f})")
    
    return vertices, triangles

def visualize_structure(vertices, triangles):
    """Create a simple ASCII visualization of the structure"""
    # Group vertices by Z level
    z_groups = defaultdict(list)
    for v in vertices:
        z_groups[round(v[2], 1)].append(v)
    
    print("\n=== Structure Analysis ===")
    
    # For each Z level, show the XY pattern
    for z in sorted(z_groups.keys()):
        verts = z_groups[z]
        x_coords = sorted(set(round(v[0], 1) for v in verts))
        y_coords = sorted(set(round(v[1], 1) for v in verts))
        
        print(f"\nZ={z:.1f} layer:")
        print(f"  X coordinates: {x_coords}")
        print(f"  Y coordinates: {y_coords}")
        
        # Create a simple grid visualization
        if len(x_coords) <= 10 and len(y_coords) <= 10:
            grid = [[' ' for _ in range(len(x_coords))] for _ in range(len(y_coords))]
            
            for v in verts:
                x_idx = x_coords.index(round(v[0], 1))
                y_idx = y_coords.index(round(v[1], 1))
                grid[y_idx][x_idx] = '*'
            
            print("  Pattern:")
            for row in reversed(grid):
                print("  " + ''.join(row))

if __name__ == "__main__":
    filename = "FlowCalibrationCube.stl"
    
    print(f"Analyzing {filename}...")
    triangles = read_binary_stl(filename)
    vertices, triangles = analyze_geometry(triangles)
    visualize_structure(vertices, triangles)