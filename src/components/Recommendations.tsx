import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Info, Settings } from 'lucide-react';
import RecommendationCategory from './RecommendationCategory';
import RecommendationSearch from './RecommendationSearch';
import QuickFixButtons from './QuickFixButtons';
import MaterialQuickSwitch from './MaterialQuickSwitch';
import CalibrationViewToggle from './CalibrationViewToggle';
import { recommendations, type Setting } from '@/data/recommendationsData';

interface RecommendationsProps {
  onNavigate?: (tool: string) => void;
}

export default function Recommendations({ onNavigate }: RecommendationsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedPrinterType, setSelectedPrinterType] = useState('all');
  const [selectedMaterial, setSelectedMaterial] = useState('all');
  const [selectedProblem, setSelectedProblem] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'settings' | 'calibration'>('settings');

  // Extract unique filter options
  const filterOptions = useMemo(() => {
    const categories = new Set<string>();
    const tags = new Set<string>();
    const printerTypes = new Set<string>();
    const materials = new Set<string>();

    recommendations.forEach((setting) => {
      categories.add(setting.category);
      setting.tags.forEach((tag) => tags.add(tag));
      setting.printerTypes?.forEach((type) => printerTypes.add(type));
      setting.materials?.forEach((material) => materials.add(material));
    });

    return {
      categories: Array.from(categories).sort(),
      tags: Array.from(tags).sort(),
      printerTypes: Array.from(printerTypes).sort(),
      materials: Array.from(materials).sort(),
    };
  }, []);

  // Problem phrase mappings for smart search
  const problemPhrases: Record<string, string[]> = {
    stringing: ['stringing', 'strings', 'oozing', 'filament strings', 'wisps', 'cobwebs'],
    warping: ['warping', 'lifting', 'corners lifting', 'curling', 'bed adhesion corners'],
    corners: ['corner quality', 'bulging corners', 'gaps after corners', 'corner overshoot'],
    adhesion: ['bed adhesion', 'first layer', 'not sticking', 'poor adhesion', 'detaching'],
    quality: ['overhang', 'bridging', 'sagging', 'drooping', 'surface quality'],
    surface: ['surface finish', 'rough surface', 'layer lines', 'artifacts', 'blobs'],
    speed: ['too slow', 'print time', 'speed up', 'faster printing'],
    accuracy: ['dimensional accuracy', 'tolerance', 'size wrong', 'doesn\'t fit', 'too small', 'too big']
  };

  // Filter settings based on all criteria
  const filteredSettings = useMemo(() => {
    return recommendations.filter((setting) => {
      // Problem filter (highest priority)
      if (selectedProblem) {
        const hasProblemKeyword = setting.problemKeywords?.includes(selectedProblem);
        const hasRelatedTag = setting.tags.some(tag => 
          problemPhrases[selectedProblem]?.some(phrase => 
            tag.toLowerCase().includes(phrase)
          )
        );
        const hasInNotes = problemPhrases[selectedProblem]?.some(phrase => 
          setting.notes.toLowerCase().includes(phrase)
        );
        
        if (!hasProblemKeyword && !hasRelatedTag && !hasInNotes) {
          return false;
        }
      }

      // Smart search with problem phrase detection
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesName = setting.name.toLowerCase().includes(searchLower);
        const matchesNotes = setting.notes.toLowerCase().includes(searchLower);
        const matchesTags = setting.tags.some(tag => tag.toLowerCase().includes(searchLower));
        
        // Check if search matches any problem phrases
        let matchesProblem = false;
        for (const [problem, phrases] of Object.entries(problemPhrases)) {
          if (phrases.some(phrase => searchLower.includes(phrase))) {
            matchesProblem = setting.problemKeywords?.includes(problem) || false;
            if (matchesProblem) break;
          }
        }
        
        if (!matchesName && !matchesNotes && !matchesTags && !matchesProblem) {
          return false;
        }
      }

      // Category filter
      if (selectedCategory !== 'all' && setting.category !== selectedCategory) {
        return false;
      }

      // Tag filter (special handling for "new" tag)
      if (selectedTags.length > 0) {
        const hasMatchingTag = selectedTags.some((tag) => {
          if (tag === 'new') {
            // For "new" tag, check if setting has a new field with version info
            return setting.new && setting.new.trim() !== '';
          }
          return setting.tags.includes(tag);
        });
        if (!hasMatchingTag) {
          return false;
        }
      }

      // Printer type filter
      if (selectedPrinterType !== 'all' && 
          (!setting.printerTypes || !setting.printerTypes.includes(selectedPrinterType))) {
        return false;
      }

      // Material filter
      if (selectedMaterial !== 'all' && 
          (!setting.materials || !setting.materials.includes(selectedMaterial))) {
        return false;
      }

      return true;
    });
  }, [searchTerm, selectedCategory, selectedTags, selectedPrinterType, selectedMaterial, selectedProblem]);

  // Group filtered settings by category and subcategory
  const groupedSettings = useMemo(() => {
    const grouped = new Map<string, Map<string, Setting[]>>();

    filteredSettings.forEach((setting) => {
      if (!grouped.has(setting.category)) {
        grouped.set(setting.category, new Map());
      }
      
      const categoryMap = grouped.get(setting.category)!;
      if (!categoryMap.has(setting.subCategory)) {
        categoryMap.set(setting.subCategory, []);
      }
      
      categoryMap.get(setting.subCategory)!.push(setting);
    });

    return grouped;
  }, [filteredSettings]);

  // Group settings by calibration tool
  const calibrationGroups = useMemo(() => {
    if (viewMode !== 'calibration') return null;
    
    const groups: Record<string, Setting[]> = {
      'flow': [],
      'temperature': [],
      'pressure': [],
      'retraction': [],
      'maxspeed': [],
      'none': []
    };
    
    filteredSettings.forEach(setting => {
      const tool = setting.calibrationTool || 'none';
      if (!groups[tool]) groups[tool] = [];
      groups[tool].push(setting);
    });
    
    return groups;
  }, [filteredSettings, viewMode]);

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedTags([]);
    setSelectedPrinterType('all');
    setSelectedMaterial('all');
    setSelectedProblem(null);
  };

  const hasActiveFilters = searchTerm !== '' || 
    selectedCategory !== 'all' || 
    selectedTags.length > 0 || 
    selectedPrinterType !== 'all' || 
    selectedMaterial !== 'all' ||
    selectedProblem !== null;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-primary" />
            <div>
              <CardTitle>OrcaSlicer Settings Recommendations</CardTitle>
              <CardDescription className="mt-1">
                Comprehensive guide to optimal 3D printer settings for Orca Slicer
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Quick Reference Guide</AlertTitle>
            <AlertDescription>
              Browse {recommendations.length} carefully curated settings organized by category. 
              Use filters to find settings for your specific printer, material, or problem. 
              Settings marked as "Critical" are essential for print success.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Quick Problem Fixes */}
      <Card>
        <CardContent className="pt-6">
          <QuickFixButtons 
            selectedProblem={selectedProblem}
            onProblemSelect={setSelectedProblem}
          />
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              {/* Material Quick Switch */}
              <MaterialQuickSwitch
                selectedMaterial={selectedMaterial}
                onMaterialChange={setSelectedMaterial}
                availableMaterials={filterOptions.materials}
              />
              
              {/* View Mode Toggle */}
              <CalibrationViewToggle
                viewMode={viewMode}
                onViewModeChange={setViewMode}
              />
            </div>
            
            {/* Main Search and Filters */}
            <RecommendationSearch
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              selectedTags={selectedTags}
              onTagToggle={handleTagToggle}
              selectedPrinterType={selectedPrinterType}
              onPrinterTypeChange={setSelectedPrinterType}
              selectedMaterial={selectedMaterial}
              onMaterialChange={setSelectedMaterial}
              filterOptions={filterOptions}
              onClearFilters={handleClearFilters}
              hasActiveFilters={hasActiveFilters}
            />
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      {hasActiveFilters && (
        <div className="text-sm text-muted-foreground">
          Found {filteredSettings.length} settings matching your filters
        </div>
      )}

      {/* Settings Display */}
      <div className="space-y-4">
        {viewMode === 'settings' ? (
          // Settings by Category
          Array.from(groupedSettings.entries()).map(([category, subCategories]) => (
            <RecommendationCategory
              key={category}
              categoryName={category}
              subCategories={subCategories}
              defaultOpen={hasActiveFilters}
              onNavigate={onNavigate}
            />
          ))
        ) : (
          // Settings by Calibration Tool
          calibrationGroups && (
            <>
              {Object.entries(calibrationGroups).map(([tool, settings]) => {
                if (settings.length === 0) return null;
                
                const toolNames: Record<string, string> = {
                  'flow': 'Flow Rate Calibration',
                  'temperature': 'Temperature Tower',
                  'pressure': 'Pressure Advance',
                  'retraction': 'Retraction Test',
                  'maxspeed': 'Max Volumetric Speed',
                  'none': 'Other Settings'
                };
                
                return (
                  <Card key={tool}>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {toolNames[tool]} ({settings.length})
                      </CardTitle>
                      {tool !== 'none' && (
                        <CardDescription>
                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-primary"
                            onClick={() => onNavigate?.(tool)}
                          >
                            Go to {toolNames[tool]} →
                          </Button>
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {settings.map(setting => (
                          <div key={setting.id} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="font-medium">{setting.name}</div>
                            <div className="text-sm text-muted-foreground mt-1">{setting.notes}</div>
                            {setting.critical && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-500 mt-2">
                                Critical
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </>
          )
        )}
      </div>

      {/* No Results */}
      {filteredSettings.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-muted-foreground">
              No settings found matching your filters.
            </p>
            <button
              onClick={handleClearFilters}
              className="mt-4 text-sm text-primary hover:underline"
            >
              Clear all filters
            </button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}