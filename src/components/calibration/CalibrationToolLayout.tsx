import React from 'react';
import { cn } from '@/lib/utils';
import { HelpButton } from '@/components/HelpButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Info, CheckCircle2, AlertCircle, Lightbulb } from 'lucide-react';

interface CalibrationToolLayoutProps {
  children: React.ReactNode;
  icon: React.ReactNode;
  title: string;
  description: string;
  docPath?: string;
  onNavigate?: (tool: string, path?: string) => void;
  badge?: {
    text: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  };
}

export const CalibrationToolLayout: React.FC<CalibrationToolLayoutProps> = ({
  children,
  icon,
  title,
  description,
  docPath,
  onNavigate,
  badge,
}) => {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="text-primary">{icon}</div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold">{title}</h1>
              {badge && (
                <Badge variant={badge.variant || 'secondary'}>{badge.text}</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
        </div>
        {docPath && onNavigate && (
          <HelpButton
            docPath={docPath}
            tooltip={`View ${title.toLowerCase()} documentation`}
            onNavigate={onNavigate}
          />
        )}
      </div>

      {/* Main Content */}
      <div>{children}</div>
    </div>
  );
};

interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

export const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  children,
  className,
  icon,
}) => {
  return (
    <Card className={cn('border-muted', className)}>
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          {icon && <span className="text-muted-foreground">{icon}</span>}
          {title}
        </CardTitle>
        {description && (
          <CardDescription className="text-sm">{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
};

interface InfoCardProps {
  title?: string;
  children: React.ReactNode;
  variant?: 'default' | 'info' | 'success' | 'warning' | 'tip';
  className?: string;
}

// Minimal "Scale" theme - unified neutral styling without color variety
const variantStyles = {
  default: {
    icon: <Info className="h-4 w-4" />,
    className: 'bg-muted/30 border-border',
  },
  info: {
    icon: <Info className="h-4 w-4" />,
    className: 'bg-muted/30 border-border',
  },
  success: {
    icon: <CheckCircle2 className="h-4 w-4" />,
    className: 'bg-muted/30 border-border',
  },
  warning: {
    icon: <AlertCircle className="h-4 w-4" />,
    className: 'bg-muted/30 border-border',
  },
  tip: {
    icon: <Lightbulb className="h-4 w-4" />,
    className: 'bg-muted/30 border-border',
  },
};

export const InfoCard: React.FC<InfoCardProps> = ({
  title,
  children,
  variant = 'default',
  className,
}) => {
  const style = variantStyles[variant];

  return (
    <Card className={cn('border', style.className, className)}>
      <CardContent className="pt-4">
        <div className="flex gap-2">
          <div className="flex-shrink-0 mt-0.5">{style.icon}</div>
          <div className="space-y-1 flex-1">
            {title && <p className="text-sm font-medium">{title}</p>}
            <div className="text-sm text-muted-foreground">{children}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface ActionSectionProps {
  children: React.ReactNode;
  className?: string;
}

export const ActionSection: React.FC<ActionSectionProps> = ({
  children,
  className,
}) => {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      {children}
    </div>
  );
};

interface ResultCardProps {
  title: string;
  value: string | number;
  description?: string;
  variant?: 'default' | 'success' | 'warning' | 'error';
  className?: string;
  icon?: React.ReactNode;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  title,
  value,
  description,
  variant = 'default',
  className,
  icon,
}) => {
  const variantClasses = {
    default: 'bg-muted/50 border-muted-foreground/20',
    success: 'bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800',
    warning: 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800',
    error: 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-800',
  };

  return (
    <Card className={cn('border', variantClasses[variant], className)}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          {icon && <div className="text-primary mt-1">{icon}</div>}
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-semibold mt-1">{value}</p>
            {description && (
              <p className="text-sm text-muted-foreground mt-2">{description}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface TwoColumnLayoutProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  sidebarPosition?: 'left' | 'right';
  className?: string;
}

export const TwoColumnLayout: React.FC<TwoColumnLayoutProps> = ({
  children,
  sidebar,
  sidebarPosition = 'right',
  className,
}) => {
  return (
    <div className={cn('grid gap-6 lg:grid-cols-12', className)}>
      {sidebarPosition === 'left' ? (
        <>
          <div className="lg:col-span-4">{sidebar}</div>
          <div className="lg:col-span-8">{children}</div>
        </>
      ) : (
        <>
          <div className="lg:col-span-8">{children}</div>
          <div className="lg:col-span-4">{sidebar}</div>
        </>
      )}
    </div>
  );
};