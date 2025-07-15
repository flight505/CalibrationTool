import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, Settings } from 'lucide-react';
import RecommendationCategory from './RecommendationCategory';
import RecommendationSearch from './RecommendationSearch';
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

  // Filter settings based on all criteria
  const filteredSettings = useMemo(() => {
    return recommendations.filter((setting) => {
      // Search filter
      if (searchTerm && !setting.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !setting.notes.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && setting.category !== selectedCategory) {
        return false;
      }

      // Tag filter
      if (selectedTags.length > 0 && !selectedTags.some((tag) => setting.tags.includes(tag))) {
        return false;
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
  }, [searchTerm, selectedCategory, selectedTags, selectedPrinterType, selectedMaterial]);

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
  };

  const hasActiveFilters = searchTerm !== '' || 
    selectedCategory !== 'all' || 
    selectedTags.length > 0 || 
    selectedPrinterType !== 'all' || 
    selectedMaterial !== 'all';

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

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
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
        </CardContent>
      </Card>

      {/* Results Summary */}
      {hasActiveFilters && (
        <div className="text-sm text-muted-foreground">
          Found {filteredSettings.length} settings matching your filters
        </div>
      )}

      {/* Settings by Category */}
      <div className="space-y-4">
        {Array.from(groupedSettings.entries()).map(([category, subCategories], index) => (
          <RecommendationCategory
            key={category}
            categoryName={category}
            subCategories={subCategories}
            defaultOpen={hasActiveFilters}
            onNavigate={onNavigate}
          />
        ))}
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