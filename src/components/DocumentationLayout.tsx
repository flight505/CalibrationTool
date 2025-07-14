import React, { useState } from 'react';
import { ChevronRight, Menu, X, BookOpen, FileText, Home } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DocumentationViewer } from './DocumentationViewer';
import { cn } from '@/lib/utils';

interface DocSection {
  title: string;
  path?: string;
  children?: DocSection[];
  icon?: React.ReactNode;
}

const docStructure: DocSection[] = [
  {
    title: 'Overview',
    path: '/docs/orca-slicer/README.md',
    icon: <Home className="w-4 h-4" />,
  },
  {
    title: 'Profile Management',
    icon: <FileText className="w-4 h-4" />,
    children: [
      {
        title: 'Comprehensive Guide',
        path: '/docs/orca-slicer/profiles/profile-management-guide.md',
      },
    ],
  },
  {
    title: 'Calibration Guides',
    icon: <BookOpen className="w-4 h-4" />,
    children: [
      {
        title: 'Calibration Overview',
        path: '/docs/orca-slicer/calibration/calibration-guide.md',
      },
      {
        title: 'Flow Rate Calibration',
        path: '/docs/orca-slicer/calibration/flow-rate-calibration.md',
      },
      {
        title: 'Cornering Calibration',
        path: '/docs/orca-slicer/calibration/cornering-calibration.md',
      },
      {
        title: 'Input Shaping',
        path: '/docs/orca-slicer/calibration/input-shaping-calibration.md',
      },
      {
        title: 'Adaptive Pressure Advance',
        path: '/docs/orca-slicer/calibration/adaptive-pressure-advance-calibration.md',
      },
    ],
  },
];

interface DocumentationLayoutProps {
  onBack?: () => void;
  initialPath?: string;
}

export const DocumentationLayout: React.FC<DocumentationLayoutProps> = ({ onBack, initialPath }) => {
  const [selectedPath, setSelectedPath] = useState<string>(initialPath || docStructure[0].path || '');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(['Calibration Guides']);

  const toggleSection = (title: string) => {
    setExpandedSections(prev =>
      prev.includes(title)
        ? prev.filter(t => t !== title)
        : [...prev, title]
    );
  };

  const renderSidebarItem = (section: DocSection, level = 0) => {
    const hasChildren = section.children && section.children.length > 0;
    const isExpanded = expandedSections.includes(section.title);
    const isSelected = selectedPath === section.path;

    return (
      <div key={section.title}>
        <button
          onClick={() => {
            if (section.path) {
              setSelectedPath(section.path);
              setSidebarOpen(false);
            } else if (hasChildren) {
              toggleSection(section.title);
            }
          }}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors",
            "hover:bg-accent hover:text-accent-foreground",
            isSelected && "bg-accent text-accent-foreground font-medium",
            level > 0 && "ml-4"
          )}
        >
          {section.icon}
          <span className="flex-1 text-left">{section.title}</span>
          {hasChildren && (
            <ChevronRight
              className={cn(
                "w-4 h-4 transition-transform",
                isExpanded && "rotate-90"
              )}
            />
          )}
        </button>
        {hasChildren && isExpanded && (
          <div className="mt-1">
            {section.children!.map(child => renderSidebarItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] relative">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden absolute top-4 left-4 z-50"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X /> : <Menu />}
      </Button>

      {/* Sidebar */}
      <aside
        className={cn(
          "w-64 bg-card border-r border-border p-4 overflow-y-auto",
          "lg:relative lg:translate-x-0",
          "absolute inset-y-0 left-0 z-40 transform transition-transform duration-200",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Documentation
          </h2>
        </div>
        
        <nav className="space-y-1">
          {docStructure.map(section => renderSidebarItem(section))}
        </nav>

        {onBack && (
          <div className="mt-8 pt-8 border-t border-border">
            <Button
              variant="outline"
              onClick={onBack}
              className="w-full"
            >
              Back to Tools
            </Button>
          </div>
        )}
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Card className="m-4 lg:m-8">
          <div className="p-6 lg:p-8">
            <DocumentationViewer filePath={selectedPath} />
          </div>
        </Card>
      </main>
    </div>
  );
};