import React, { useState } from "react";
import { Sidebar, SidebarBody, SidebarLink, SidebarGroup } from "@/components/ui/sidebar";
import {
  Printer, Calculator, Thermometer, Move3D, RotateCcw, Github, Gauge, BookOpen,
  Settings, MessageCircle, Layers, Wind, Droplets, FlaskConical, Beaker,
  BarChart3, FileText, ChevronLeft, ChevronRight, Grid3x3
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

interface SidebarLayoutProps {
  children: React.ReactNode;
  currentTool: string;
  onToolChange: (tool: string) => void;
}

const SidebarLayout: React.FC<SidebarLayoutProps> = ({ children, currentTool, onToolChange }) => {
  const [collapsed, setCollapsed] = useState(true);

  // Primary Tools - Standalone items at the top
  const primaryTools = [
    {
      label: "DOE Planner",
      href: "#",
      icon: <FlaskConical className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
      onClick: () => onToolChange('doe'),
      id: 'doe'
    },
    {
      label: "Calibration Guide",
      href: "#",
      icon: <BookOpen className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
      onClick: () => onToolChange('welcome'),
      id: 'welcome'
    },
  ];

  // Quick Tests (formerly Quick Calibration)
  const quickTestLinks = [
    {
      label: "First Layer",
      href: "#",
      icon: <Layers className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
      onClick: () => onToolChange('firstlayer'),
      id: 'firstlayer'
    },
    {
      label: "Temperature Tower",
      href: "#",
      icon: <Thermometer className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
      onClick: () => onToolChange('temperature'),
      id: 'temperature'
    },
    {
      label: "Flow Cube",
      href: "#",
      icon: <Calculator className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
      onClick: () => onToolChange('flow'),
      id: 'flow'
    },
    {
      label: "Flow Tower",
      href: "#",
      icon: <Droplets className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
      onClick: () => onToolChange('flowtower'),
      id: 'flowtower'
    },
    {
      label: "Fan Speed",
      href: "#",
      icon: <Wind className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
      onClick: () => onToolChange('fanspeed'),
      id: 'fanspeed'
    },
    {
      label: "Pressure Advance",
      href: "#",
      icon: <Move3D className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
      onClick: () => onToolChange('pressure'),
      id: 'pressure'
    },
    {
      label: "PA Pattern",
      href: "#",
      icon: <Grid3x3 className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
      onClick: () => onToolChange('pressure-pattern'),
      id: 'pressure-pattern'
    },
    {
      label: "PA Optimizer",
      href: "#",
      icon: <BarChart3 className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
      onClick: () => onToolChange('pressure-optimizer'),
      id: 'pressure-optimizer'
    },
    {
      label: "Retraction",
      href: "#",
      icon: <RotateCcw className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
      onClick: () => onToolChange('retraction'),
      id: 'retraction'
    },
    {
      label: "Max Volumetric Speed",
      href: "#",
      icon: <Gauge className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
      onClick: () => onToolChange('maxspeed'),
      id: 'maxspeed'
    },
  ];

  // DOE Analysis Tools
  const doeAnalysisLinks = [
    {
      label: "Experiment Templates",
      href: "#",
      icon: <Beaker className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
      onClick: () => onToolChange('doe-templates'),
      id: 'doe-templates'
    },
    {
      label: "Results Analysis",
      href: "#",
      icon: <BarChart3 className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
      onClick: () => onToolChange('doe-analysis'),
      id: 'doe-analysis'
    },
  ];

  // Resources
  const resourcesLinks = [
    {
      label: "AI Assistant",
      href: "#",
      icon: <MessageCircle className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
      onClick: () => onToolChange('chat'),
      id: 'chat'
    },
    {
      label: "Recommendations",
      href: "#",
      icon: <Settings className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
      onClick: () => onToolChange('recommendations'),
      id: 'recommendations'
    },
    {
      label: "Documentation",
      href: "#",
      icon: <FileText className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
      onClick: () => onToolChange('documentation'),
      id: 'documentation'
    },
  ];

  return (
    <div className={cn(
      "flex h-screen bg-gray-100 dark:bg-neutral-900 w-full overflow-hidden"
    )}>
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed}>
        <SidebarBody className="justify-between gap-6 border-r border-neutral-200 dark:border-neutral-700">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            {/* Logo Section */}
            <div className={cn("mb-6 flex items-center", collapsed ? "justify-center" : "justify-between")}>
              {collapsed ? <LogoIcon /> : <Logo />}
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-8 w-8", collapsed && "hidden")}
                onClick={() => setCollapsed(true)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>

            {/* Navigation Groups */}
            <div className="flex flex-col gap-2">
              {/* Primary Tools - Standalone */}
              {primaryTools.map((link, idx) => (
                <SidebarLink
                  key={idx}
                  link={link}
                  isActive={currentTool === link.id}
                />
              ))}

              <div className="border-t border-neutral-200 dark:border-neutral-700 mt-2 pt-2" />

              {/* Quick Tests Group */}
              <SidebarGroup title="Quick Tests">
                {quickTestLinks.map((link, idx) => (
                  <SidebarLink
                    key={idx}
                    link={link}
                    isActive={currentTool === link.id}
                  />
                ))}
              </SidebarGroup>

              {/* DOE Analysis Group */}
              <SidebarGroup title="DOE Analysis">
                {doeAnalysisLinks.map((link, idx) => (
                  <SidebarLink
                    key={idx}
                    link={link}
                    isActive={currentTool === link.id}
                  />
                ))}
              </SidebarGroup>

              {/* Resources Group */}
              <SidebarGroup title="Resources">
                {resourcesLinks.map((link, idx) => (
                  <SidebarLink
                    key={idx}
                    link={link}
                    isActive={currentTool === link.id}
                  />
                ))}
              </SidebarGroup>
            </div>
          </div>

          {/* Footer Section */}
          <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4 space-y-2">
            {collapsed && (
              <div className="flex justify-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCollapsed(false)}
                  className="h-10 w-10"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
            <div className={cn("flex items-center gap-2", collapsed ? "justify-center flex-col" : "justify-between px-2")}>
              <ThemeToggle />
              <Button variant="ghost" size="icon" asChild>
                <a href="https://github.com/flight505/CalibrationTool" target="_blank" rel="noopener noreferrer">
                  <Github className="w-5 h-5" />
                </a>
              </Button>
            </div>
          </div>
        </SidebarBody>
      </Sidebar>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
              {getToolName(currentTool)}
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('https://github.com/SoftFever/OrcaSlicer', '_blank')}
            >
              OrcaSlicer
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto bg-white dark:bg-neutral-900">
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to get tool name
const getToolName = (toolId: string): string => {
  const toolNames: Record<string, string> = {
    'welcome': 'OrcaSlicer Calibration Suite',
    'firstlayer': 'First Layer Calibration',
    'temperature': 'Temperature Tower',
    'flow': 'Flow Cube Calibration',
    'flowtower': 'Flow Tower',
    'fanspeed': 'Fan Speed Optimization',
    'pressure': 'Pressure Advance',
    'pressure-pattern': 'PA Pattern Calibration',
    'retraction': 'Retraction Test',
    'maxspeed': 'Max Volumetric Speed',
    'doe': 'DOE Planner',
    'doe-templates': 'Experiment Templates',
    'doe-analysis': 'Results Analysis',
    'chat': 'AI Assistant',
    'recommendations': 'Recommendations',
    'documentation': 'Documentation',
  };
  return toolNames[toolId] || 'Calibration Suite';
};

// Logo components
export const Logo = () => {
  return (
    <div className="font-normal flex space-x-2 items-center text-sm py-1 relative z-20">
      <Printer className="h-6 w-6 text-primary flex-shrink-0" />
      <span className="font-medium text-neutral-900 dark:text-neutral-100 whitespace-nowrap">
        OrcaSlicer
      </span>
    </div>
  );
};

export const LogoIcon = () => {
  return (
    <div className="font-normal flex items-center justify-center text-sm py-1 relative z-20">
      <Printer className="h-6 w-6 text-primary flex-shrink-0" />
    </div>
  );
};

export default SidebarLayout;
