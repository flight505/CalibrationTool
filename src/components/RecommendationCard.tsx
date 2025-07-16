import { useState } from 'react';
import { ChevronDown, ExternalLink, Copy, Check, ArrowRight, AlertCircle, Zap, Network, Flame, Square, Target, Mountain, Wind, Wrench, Shield } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Setting } from '@/data/recommendationsData';
import type { LucideIcon } from 'lucide-react';

interface RecommendationCardProps {
  setting: Setting;
  onNavigate?: (tool: string) => void;
}

export default function RecommendationCard({ setting, onNavigate }: RecommendationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getBadgeColor = (tag: string) => {
    const colorMap: Record<string, string> = {
      critical: 'bg-red-500/10 text-red-500 border-red-500/20',
      calibration: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      quality: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      speed: 'bg-green-500/10 text-green-500 border-green-500/20',
      adhesion: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      temperature: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      advanced: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
    };
    return colorMap[tag] || 'bg-muted text-muted-foreground';
  };

  const problemIcons: Record<string, LucideIcon> = {
    stringing: Network,
    warping: Flame,
    corners: Square,
    adhesion: Target,
    quality: Mountain,
    surface: Wind,
    speed: Zap,
    accuracy: Wrench,
    strength: Shield
  };


  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-md">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3 flex-1">
          <ChevronDown
            className={cn(
              "w-4 h-4 transition-transform duration-200 text-muted-foreground",
              isExpanded && "rotate-180"
            )}
          />
          <h3 className="font-medium text-base">{setting.name}</h3>
          
          {/* Problem indicators */}
          {setting.problemKeywords && setting.problemKeywords.length > 0 && (
            <div className="flex items-center gap-1.5">
              {setting.problemKeywords.slice(0, 3).map(problem => {
                const Icon = problemIcons[problem];
                return Icon ? (
                  <Icon 
                    key={problem} 
                    className="w-4 h-4 text-muted-foreground" 
                    title={`Fixes ${problem}`}
                  />
                ) : null;
              })}
            </div>
          )}
          
          {/* Impact indicator */}
          {setting.impact && setting.impact >= 4 && (
            <div className="flex items-center gap-1" title={`Impact level: ${setting.impact}/5`}>
              {setting.impact === 5 ? (
                <AlertCircle className="w-4 h-4 text-red-500" />
              ) : (
                <Zap className="w-4 h-4 text-orange-500" />
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
            {setting.recommendedValue}
          </span>
          
          {setting.critical && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20">
              Critical
            </span>
          )}
          
          {setting.calibrationTool && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20">
              Calibration Available
            </span>
          )}
          
          {setting.new && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
              New ({setting.new})
            </span>
          )}
          
          {setting.reference && (
            <a
              href={setting.reference}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="border-t px-4 pb-4">
          <div className="pt-4 space-y-4">
            {/* Notes */}
            <div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {setting.notes}
              </p>
            </div>

            {/* Fixes */}
            {setting.fixes && setting.fixes.length > 0 && (
              <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3">
                <h4 className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">This setting helps fix:</h4>
                <ul className="text-sm text-muted-foreground space-y-0.5">
                  {setting.fixes.map((fix, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-green-600 dark:text-green-400">•</span>
                      <span>{fix}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Example */}
            {setting.example && (
              <div>
                <h4 className="text-sm font-medium mb-2">Example:</h4>
                <div className="relative group">
                  <pre className="bg-muted/50 rounded-md p-3 text-sm font-mono overflow-x-auto">
                    {setting.example}
                  </pre>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleCopy(setting.example)}
                  >
                    {copied ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {setting.tags.map((tag) => (
                <span
                  key={tag}
                  className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
                    getBadgeColor(tag)
                  )}
                >
                  {tag}
                </span>
              ))}
              
              {setting.materials?.map((material) => (
                <span
                  key={material}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-teal-500/10 text-teal-500 border border-teal-500/20"
                >
                  {material}
                </span>
              ))}
              
              {setting.printerTypes?.map((type) => (
                <span
                  key={type}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-pink-500/10 text-pink-500 border border-pink-500/20"
                >
                  {type}
                </span>
              ))}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-2">
              {setting.calibrationTool && onNavigate && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onNavigate(setting.calibrationTool!)}
                  className="gap-2"
                >
                  Go to Calibration
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
              
              {setting.reference && (
                <Button
                  size="sm"
                  variant="outline"
                  asChild
                >
                  <a
                    href={setting.reference}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="gap-2"
                  >
                    View Documentation
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
              )}
            </div>

            {/* Related Settings */}
            {setting.relatedSettings && setting.relatedSettings.length > 0 && (
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">Related:</span> {setting.relatedSettings.join(', ')}
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}