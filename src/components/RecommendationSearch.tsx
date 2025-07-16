import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FilterOptions {
  categories: string[];
  tags: string[];
  printerTypes: string[];
  materials: string[];
}

interface RecommendationSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  selectedPrinterType: string;
  onPrinterTypeChange: (value: string) => void;
  selectedMaterial: string;
  onMaterialChange: (value: string) => void;
  filterOptions: FilterOptions;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export default function RecommendationSearch({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedTags,
  onTagToggle,
  selectedPrinterType,
  onPrinterTypeChange,
  selectedMaterial,
  onMaterialChange,
  filterOptions,
  onClearFilters,
  hasActiveFilters,
}: RecommendationSearchProps) {
  const commonTags = [
    { value: 'critical', label: 'Critical', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
    { value: 'calibration', label: 'Calibration', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
    { value: 'quality', label: 'Quality', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
    { value: 'speed', label: 'Speed', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
    { value: 'adhesion', label: 'Adhesion', color: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
    { value: 'stringing', label: 'Stringing', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
    { value: 'first-layer', label: 'First Layer', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' },
    { value: 'new', label: 'New', color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20' },
  ];

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          id="search-settings"
          name="search-settings"
          type="text"
          placeholder="Search settings..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchTerm && (
          <Button
            size="sm"
            variant="ghost"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
            onClick={() => onSearchChange('')}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap gap-2">
        {/* Category Filter */}
        <Select name="category-filter" value={selectedCategory} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {filterOptions.categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Printer Type Filter */}
        <Select name="printer-filter" value={selectedPrinterType} onValueChange={onPrinterTypeChange}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Printer Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Printers</SelectItem>
            {filterOptions.printerTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            className="gap-2"
          >
            <X className="w-4 h-4" />
            Clear Filters
          </Button>
        )}
      </div>

      {/* Tag Filters */}
      <div className="flex flex-wrap gap-2">
        {commonTags.map((tag) => (
          <button
            key={tag.value}
            onClick={() => onTagToggle(tag.value)}
            className={cn(
              "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border transition-all",
              selectedTags.includes(tag.value)
                ? tag.color
                : "bg-muted/30 text-muted-foreground border-muted hover:bg-muted/50"
            )}
          >
            {tag.label}
          </button>
        ))}
      </div>
    </div>
  );
}