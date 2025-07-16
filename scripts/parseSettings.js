#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to markdown file
const mdPath = path.join(__dirname, '..', 'OrcaSlicer Comprehensive Settings.md');
const outputPath = path.join(__dirname, '..', 'src', 'data', 'recommendationsData.ts');

// Read markdown file
const markdown = fs.readFileSync(mdPath, 'utf8');

// Parse settings from markdown table
function parseMarkdownTable(markdown) {
  const settings = [];
  const lines = markdown.split('\n');
  
  let currentCategory = '';
  let currentSubCategory = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Detect category headers
    if (line.startsWith('## ')) {
      currentCategory = line.replace('## ', '').trim();
      currentSubCategory = ''; // Reset subcategory
      continue;
    }
    
    // Parse table rows - look for pipes
    if (line.startsWith('|') && line.includes('|')) {
      const cells = line.split('|').map(cell => cell.trim());
      
      // Remove empty first and last cells from split
      if (cells[0] === '') cells.shift();
      if (cells[cells.length - 1] === '') cells.pop();
      
      // Skip header rows
      if (cells[0] === 'Setting' || cells[0]?.includes('---')) {
        continue;
      }
      
      // Check if this is a subcategory header (bold text)
      if (cells.length === 1 || (cells[0].startsWith('**') && cells[0].endsWith('**'))) {
        currentSubCategory = cells[0].replace(/\*\*/g, '');
        continue;
      }
      
      // Parse settings row - must have at least 10 cells
      if (cells.length >= 10) {
        const setting = {
          name: cells[0],
          recommendedValue: cells[1] || '',
          notes: cells[2] || '',
          example: cells[3] || '',
          reference: cells[4] || '',
          tags: parseArray(cells[5] || ''),
          printers: parseArray(cells[6] || ''),
          materials: parseArray(cells[7] || ''),
          related: parseArray(cells[8] || ''),
          critical: (cells[9] || '').trim().toLowerCase() === 'yes',
          new: cells[10] || undefined,
          category: currentCategory,
          subCategory: currentSubCategory
        };
        
        // Skip empty settings
        if (!setting.name || setting.name === '') continue;
        
        // Generate ID from name
        setting.id = generateId(setting.name);
        
        // Add problem keywords and fixes based on tags and notes
        setting.problemKeywords = extractProblemKeywords(setting);
        setting.fixes = extractFixes(setting);
        setting.impact = determineImpact(setting);
        
        settings.push(setting);
      }
    }
  }
  
  return settings;
}

// Parse array format from markdown
function parseArray(str) {
  if (!str || str.trim() === '') return [];
  
  // Remove "Tags:", "Printers:", etc. prefixes
  str = str.replace(/^(Tags|Printers|Materials|Related|Critical|New):\s*/i, '');
  
  // Handle bracketed arrays
  const match = str.match(/\[(.*?)\]/);
  if (match) {
    return match[1]
      .split(',')
      .map(s => s.trim())
      .filter(s => s && s !== '');
  }
  
  // Handle special cases
  if (str.toLowerCase() === 'all') return undefined; // All is default, so we don't store it
  
  // Single value
  if (str.trim()) return [str.trim()];
  
  return [];
}

// Generate ID from name
function generateId(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim();
}

// Extract problem keywords from notes and tags
function extractProblemKeywords(setting) {
  const keywords = new Set();
  const notes = setting.notes.toLowerCase();
  const tags = setting.tags.join(' ').toLowerCase();
  
  // Common problem patterns
  const problemPatterns = {
    stringing: ['stringing', 'strings', 'oozing', 'wisps', 'filament strings'],
    warping: ['warping', 'warps', 'lifting', 'curling', 'corners lifting'],
    adhesion: ['adhesion', 'stick', 'first layer', 'bed adhesion', 'poor adhesion'],
    corners: ['corner', 'bulging', 'gaps after corners', 'corner quality'],
    quality: ['surface quality', 'surface finish', 'artifacts', 'poor quality'],
    speed: ['slow', 'print time', 'speed', 'too fast', 'too slow'],
    strength: ['weak', 'delamination', 'layer bonding', 'part strength'],
    accuracy: ['dimensional', 'tolerance', 'precision', 'accuracy']
  };
  
  // Check both notes and tags
  const searchText = notes + ' ' + tags;
  
  for (const [problem, patterns] of Object.entries(problemPatterns)) {
    if (patterns.some(pattern => searchText.includes(pattern))) {
      keywords.add(problem);
    }
  }
  
  return Array.from(keywords);
}

// Extract what the setting fixes
function extractFixes(setting) {
  const fixes = [];
  const notes = setting.notes.toLowerCase();
  
  // Extract "prevents", "reduces", "eliminates", "fixes" phrases
  const fixPatterns = [
    /prevents? ([^.]+)/g,
    /reduces? ([^.]+)/g,
    /eliminates? ([^.]+)/g,
    /fixes? ([^.]+)/g,
    /improves? ([^.]+)/g,
    /ensures? ([^.]+)/g
  ];
  
  for (const pattern of fixPatterns) {
    const matches = notes.matchAll(pattern);
    for (const match of matches) {
      const fix = match[1].trim();
      if (fix.length < 100) { // Avoid super long descriptions
        fixes.push(fix);
      }
    }
  }
  
  return fixes;
}

// Determine impact level (1-5)
function determineImpact(setting) {
  if (setting.critical) return 5;
  
  const tags = setting.tags.join(' ').toLowerCase();
  const notes = setting.notes.toLowerCase();
  
  // High impact keywords
  if (notes.includes('critical') || notes.includes('essential') || 
      notes.includes('most important') || notes.includes('fundamental')) {
    return 5;
  }
  
  // Critical tags
  if (tags.includes('critical') || tags.includes('fundamental')) {
    return 5;
  }
  
  // Medium-high impact
  if (notes.includes('important') || notes.includes('significant') || 
      notes.includes('greatly affects')) {
    return 4;
  }
  
  // Calibration settings are generally important
  if (tags.includes('calibration')) {
    return 3;
  }
  
  // Advanced features might be lower impact for most users
  if (tags.includes('advanced')) {
    return 2;
  }
  
  return 3; // Default medium impact
}

// Map calibration tools
function mapCalibrationTool(setting) {
  const calibrationMap = {
    'flow ratio': 'flow',
    'flow rate': 'flow',
    'pressure advance': 'pressure',
    'retraction': 'retraction',
    'temperature': 'temperature',
    'nozzle temp': 'temperature',
    'max volumetric': 'maxspeed',
    'volumetric speed': 'maxspeed'
  };
  
  const nameLower = setting.name.toLowerCase();
  const tagsLower = setting.tags.join(' ').toLowerCase();
  
  for (const [key, tool] of Object.entries(calibrationMap)) {
    if (nameLower.includes(key) || tagsLower.includes(key)) {
      return tool;
    }
  }
  
  return undefined;
}

// Generate TypeScript file
function generateTypeScriptFile(settings) {
  let content = `// Auto-generated from OrcaSlicer Comprehensive Settings.md
// Generated on: ${new Date().toISOString()}
// Total settings: ${settings.length}

export interface Setting {
  id: string;
  category: string;
  subCategory: string;
  name: string;
  recommendedValue: string;
  notes: string;
  example: string;
  reference: string;
  tags: string[];
  printerTypes?: string[];
  materials?: string[];
  relatedSettings?: string[];
  calibrationTool?: string;
  critical?: boolean;
  new?: string;
  problemKeywords?: string[];
  fixes?: string[];
  impact?: 1 | 2 | 3 | 4 | 5;
}

export const recommendations: Setting[] = [
`;

  settings.forEach((setting, index) => {
    // Map calibration tool
    setting.calibrationTool = mapCalibrationTool(setting);
    
    // Convert related settings to IDs
    if (setting.related && setting.related.length > 0) {
      setting.relatedSettings = setting.related
        .filter(r => r !== '')
        .map(r => generateId(r));
      delete setting.related;
    }
    
    // Clean up new field
    if (setting.new) {
      setting.new = setting.new.replace(/^New:\s*/i, '').trim();
    }
    
    content += `  ${JSON.stringify(setting, null, 2)}`;
    if (index < settings.length - 1) {
      content += ',';
    }
    content += '\n';
  });

  content += '];\n';
  
  return content;
}

// Main execution
console.log('Parsing OrcaSlicer Comprehensive Settings.md...');
const settings = parseMarkdownTable(markdown);
console.log(`Found ${settings.length} settings`);

// Generate TypeScript file
const tsContent = generateTypeScriptFile(settings);
fs.writeFileSync(outputPath, tsContent);
console.log(`Generated ${outputPath}`);

// Summary
const categories = [...new Set(settings.map(s => s.category))];
const subCategories = [...new Set(settings.filter(s => s.subCategory).map(s => s.subCategory))];
const criticalCount = settings.filter(s => s.critical).length;
const newCount = settings.filter(s => s.new).length;
const calibrationCount = settings.filter(s => s.calibrationTool).length;

console.log('\nSummary:');
console.log(`- Categories: ${categories.join(', ')}`);
console.log(`- Sub-categories: ${subCategories.length}`);
console.log(`- Critical settings: ${criticalCount}`);
console.log(`- New settings: ${newCount}`);
console.log(`- Settings with calibration tools: ${calibrationCount}`);
console.log(`- Total settings: ${settings.length}`);