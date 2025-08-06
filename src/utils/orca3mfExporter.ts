/**
 * OrcaSlicer 3MF Exporter
 * Generates 3MF project files with embedded settings and modifier meshes
 */

import JSZip from 'jszip';
import { create } from 'xmlbuilder2';
import { ParsedSTL, Triangle, Vertex } from './asciiStlUtils';
import { GeneratedTower, OrcaSlicerSettings } from './orcaTowerGenerator';

export interface ThreeMFExportOptions {
  projectName: string;
  towerType: string;
  mainSTL: ParsedSTL;
  modifierSTLs?: ParsedSTL[];
  orcaSettings: OrcaSlicerSettings;
  metadata?: Record<string, any>;
}

export interface OrcaSlicerProject {
  file: Blob;
  filename: string;
}

/**
 * Generate a 3MF project file compatible with OrcaSlicer
 */
export class Orca3MFExporter {
  private zip: JSZip;
  private objectId: number = 1;

  constructor() {
    this.zip = new JSZip();
  }

  /**
   * Export a tower with all its components as a 3MF file
   */
  async exportTower(tower: GeneratedTower, options: Partial<ThreeMFExportOptions>): Promise<OrcaSlicerProject> {
    const projectName = options.projectName || 'CalibrationTower';
    const towerType = options.towerType || 'calibration';
    
    // Initialize 3MF structure
    this.initializeStructure();
    
    // Add content types
    this.addContentTypes();
    
    // Add relationships
    this.addRelationships();
    
    // Convert tower STLs to parsed format for 3MF
    const mainSTLContent = await tower.mainSTL.text();
    const mainSTL = this.parseSTLBlob(mainSTLContent);
    
    // Add 3D model with main tower and modifier meshes
    await this.add3DModel(mainSTL, tower, options.orcaSettings);
    
    // Add OrcaSlicer-specific config
    if (options.orcaSettings) {
      this.addOrcaSlicerConfig(options.orcaSettings, towerType);
    }
    
    // Add metadata
    this.addMetadata({
      ...options.metadata,
      generator: 'OrcaSlicer Calibration Tool',
      towerType: towerType,
      timestamp: new Date().toISOString()
    });
    
    // Generate the 3MF file
    const blob = await this.zip.generateAsync({ type: 'blob' });
    
    return {
      file: blob,
      filename: `${projectName}_${towerType}.3mf`
    };
  }

  /**
   * Initialize basic 3MF structure
   */
  private initializeStructure() {
    // Create required directories
    this.zip.folder('3D');
    this.zip.folder('_rels');
    this.zip.folder('Metadata');
  }

  /**
   * Add content types definition
   */
  private addContentTypes() {
    const contentTypes = create({ encoding: 'UTF-8' })
      .ele('Types', { 
        xmlns: 'http://schemas.openxmlformats.org/package/2006/content-types' 
      })
      .ele('Default', { Extension: 'rels', ContentType: 'application/vnd.openxmlformats-package.relationships+xml' }).up()
      .ele('Default', { Extension: 'model', ContentType: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' }).up()
      .ele('Default', { Extension: 'png', ContentType: 'image/png' }).up()
      .ele('Default', { Extension: 'json', ContentType: 'application/json' }).up()
      .end({ prettyPrint: true });

    this.zip.file('[Content_Types].xml', contentTypes);
  }

  /**
   * Add relationships
   */
  private addRelationships() {
    const rels = create({ encoding: 'UTF-8' })
      .ele('Relationships', { 
        xmlns: 'http://schemas.openxmlformats.org/package/2006/relationships' 
      })
      .ele('Relationship', {
        Id: 'rel0',
        Type: 'http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel',
        Target: '/3D/3dmodel.model'
      }).up()
      .ele('Relationship', {
        Id: 'rel1',
        Type: 'http://schemas.openxmlformats.org/package/2006/relationships/metadata/thumbnail',
        Target: '/Metadata/thumbnail.png'
      })
      .end({ prettyPrint: true });

    this.zip.file('_rels/.rels', rels);
  }

  /**
   * Add 3D model with geometry and components
   */
  private async add3DModel(mainSTL: ParsedSTL, tower: GeneratedTower, settings?: OrcaSlicerSettings) {
    const model = create({ encoding: 'UTF-8' })
      .ele('model', {
        unit: 'millimeter',
        'xml:lang': 'en-US',
        xmlns: 'http://schemas.microsoft.com/3dmanufacturing/core/2015/02',
        'xmlns:slic3rpe': 'http://schemas.slic3r.org/3mf/2017/06'
      });

    const resources = model.ele('resources');
    const build = model.ele('build');

    // Add main tower object
    const mainObject = resources.ele('object', {
      id: this.objectId++,
      type: 'model',
      name: mainSTL.name || 'MainTower'
    });

    // Add mesh data
    const mesh = mainObject.ele('mesh');
    const vertices = mesh.ele('vertices');
    const triangles = mesh.ele('triangles');

    // Build vertex map and add vertices
    const vertexMap = new Map<string, number>();
    let vertexIndex = 0;

    mainSTL.triangles.forEach(tri => {
      tri.vertices.forEach(v => {
        const key = `${v.x},${v.y},${v.z}`;
        if (!vertexMap.has(key)) {
          vertices.ele('vertex', { x: v.x, y: v.y, z: v.z });
          vertexMap.set(key, vertexIndex++);
        }
      });
    });

    // Add triangles
    mainSTL.triangles.forEach(tri => {
      const indices = tri.vertices.map(v => {
        const key = `${v.x},${v.y},${v.z}`;
        return vertexMap.get(key)!;
      });
      triangles.ele('triangle', { v1: indices[0], v2: indices[1], v3: indices[2] });
    });

    // Add modifier meshes if present
    if (tower.modifierMeshes && settings) {
      for (let i = 0; i < tower.modifierMeshes.length; i++) {
        const modifierBlob = tower.modifierMeshes[i];
        const modifierContent = await modifierBlob.text();
        const modifierSTL = this.parseSTLBlob(modifierContent);
        
        const modObject = resources.ele('object', {
          id: this.objectId++,
          type: 'model',
          name: `Modifier_Section_${i}`
        });

        // Add modifier settings as metadata
        if (settings.modifierSettings[i]) {
          const component = modObject.ele('components');
          component.ele('component', {
            objectid: this.objectId - 1,
            'slic3rpe:modifier': '1'
          });
          
          // Add settings for this modifier
          const modSettings = settings.modifierSettings[i].settings;
          Object.entries(modSettings).forEach(([key, value]) => {
            if (value !== undefined) {
              component.ele('slic3rpe:setting', {
                key: key,
                value: value.toString()
              });
            }
          });
        }

        // Add modifier mesh data
        const modMesh = modObject.ele('mesh');
        const modVertices = modMesh.ele('vertices');
        const modTriangles = modMesh.ele('triangles');

        const modVertexMap = new Map<string, number>();
        let modVertexIndex = 0;

        modifierSTL.triangles.forEach(tri => {
          tri.vertices.forEach(v => {
            const key = `${v.x},${v.y},${v.z}`;
            if (!modVertexMap.has(key)) {
              modVertices.ele('vertex', { x: v.x, y: v.y, z: v.z });
              modVertexMap.set(key, modVertexIndex++);
            }
          });
        });

        modifierSTL.triangles.forEach(tri => {
          const indices = tri.vertices.map(v => {
            const key = `${v.x},${v.y},${v.z}`;
            return modVertexMap.get(key)!;
          });
          modTriangles.ele('triangle', { v1: indices[0], v2: indices[1], v3: indices[2] });
        });
      }
    }

    // Add item to build
    build.ele('item', { 
      objectid: '1',
      transform: '1 0 0 0 1 0 0 0 1 0 0 0'
    });

    const modelContent = model.end({ prettyPrint: true });
    this.zip.file('3D/3dmodel.model', modelContent);
  }

  /**
   * Add OrcaSlicer-specific configuration
   */
  private addOrcaSlicerConfig(settings: OrcaSlicerSettings, towerType: string) {
    const config = {
      version: '1.0.0',
      calibrationType: settings.calibrationType,
      towerType: towerType,
      parameters: settings.parameters,
      modifierSettings: settings.modifierSettings,
      instructions: {
        setup: 'Import this 3MF file into OrcaSlicer',
        slice: 'The modifier meshes are pre-configured with calibration settings',
        print: 'Slice and print to calibrate your printer'
      }
    };

    this.zip.file('Metadata/OrcaSlicer_config.json', JSON.stringify(config, null, 2));
  }

  /**
   * Add metadata
   */
  private addMetadata(metadata: Record<string, any>) {
    const metadataXml = create({ encoding: 'UTF-8' })
      .ele('metadata', { xmlns: 'http://schemas.microsoft.com/3dmanufacturing/core/2015/02' });

    Object.entries(metadata).forEach(([key, value]) => {
      metadataXml.ele('item', { name: key }).txt(value.toString());
    });

    const content = metadataXml.end({ prettyPrint: true });
    this.zip.file('Metadata/metadata.xml', content);

    // Add a placeholder thumbnail (in production, generate actual preview)
    this.addPlaceholderThumbnail();
  }

  /**
   * Add placeholder thumbnail
   */
  private addPlaceholderThumbnail() {
    // Create a simple 1x1 transparent PNG as placeholder
    const canvas = new OffscreenCanvas(256, 256);
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Draw gradient background
      const gradient = ctx.createLinearGradient(0, 0, 256, 256);
      gradient.addColorStop(0, '#1e293b');
      gradient.addColorStop(1, '#334155');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 256, 256);
      
      // Draw text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Calibration', 128, 100);
      ctx.fillText('Tower', 128, 130);
      
      // Convert to blob and add to zip
      canvas.convertToBlob({ type: 'image/png' }).then(blob => {
        this.zip.file('Metadata/thumbnail.png', blob);
      });
    }
  }

  /**
   * Parse STL blob content to ParsedSTL format
   */
  private parseSTLBlob(content: string): ParsedSTL {
    const lines = content.split('\n');
    const triangles: Triangle[] = [];
    let name = 'Model';
    let currentNormal: { x: number; y: number; z: number } | null = null;
    let vertices: Vertex[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('solid')) {
        // Extract model name
        name = trimmed.substring(5).trim() || 'Model';
      } else if (trimmed.startsWith('facet normal')) {
        // Parse normal vector
        const matches = trimmed.match(/facet\s+normal\s+([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)\s+([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)\s+([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)/);
        if (matches) {
          currentNormal = {
            x: parseFloat(matches[1]),
            y: parseFloat(matches[2]),
            z: parseFloat(matches[3])
          };
        }
        vertices = [];
      } else if (trimmed.startsWith('vertex')) {
        // Parse vertex coordinates
        const matches = trimmed.match(/vertex\s+([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)\s+([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)\s+([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)/);
        if (matches) {
          vertices.push({
            x: parseFloat(matches[1]),
            y: parseFloat(matches[2]),
            z: parseFloat(matches[3])
          });
        }
      } else if (trimmed.startsWith('endfacet')) {
        // Complete the triangle
        if (vertices.length === 3 && currentNormal) {
          triangles.push({
            normal: currentNormal,
            vertices: vertices as [Vertex, Vertex, Vertex]
          });
        }
        currentNormal = null;
        vertices = [];
      }
    }

    return { name, triangles };
  }
}

/**
 * Convenience function to export a tower as 3MF
 */
export async function exportTowerAs3MF(
  tower: GeneratedTower,
  towerType: string,
  projectName?: string
): Promise<OrcaSlicerProject> {
  const exporter = new Orca3MFExporter();
  
  return await exporter.exportTower(tower, {
    projectName: projectName || `${towerType}_tower`,
    towerType,
    orcaSettings: tower.orcaSettings
  });
}