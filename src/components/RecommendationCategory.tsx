import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import RecommendationCard from './RecommendationCard';
import type { Setting } from '@/data/recommendationsData';

interface RecommendationCategoryProps {
  categoryName: string;
  subCategories: Map<string, Setting[]>;
  defaultOpen?: boolean;
  onNavigate?: (tool: string) => void;
}

export default function RecommendationCategory({ 
  categoryName, 
  subCategories, 
  defaultOpen = false,
  onNavigate 
}: RecommendationCategoryProps) {
  const totalSettings = Array.from(subCategories.values()).reduce((sum, settings) => sum + settings.length, 0);
  
  return (
    <Accordion 
      type="single" 
      collapsible
      defaultValue={defaultOpen ? categoryName : undefined}
      className="w-full"
    >
      <AccordionItem value={categoryName} className="border rounded-lg">
        <AccordionTrigger className="px-4 hover:no-underline hover:bg-muted/30">
          <div className="flex items-center justify-between w-full pr-4">
            <h2 className="text-lg font-semibold">{categoryName}</h2>
            <span className="text-sm text-muted-foreground">
              {totalSettings} settings
            </span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4">
          <div className="space-y-6">
            {Array.from(subCategories.entries()).map(([subCategory, settings]) => (
              <div key={subCategory} className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground pl-1">
                  {subCategory}
                </h3>
                <div className="space-y-2">
                  {settings.map((setting) => (
                    <RecommendationCard 
                      key={setting.id} 
                      setting={setting} 
                      onNavigate={onNavigate}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}