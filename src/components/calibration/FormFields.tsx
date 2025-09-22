import React from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Info } from 'lucide-react';

interface FieldGroupProps {
  children: React.ReactNode;
  className?: string;
}

export const FieldGroup: React.FC<FieldGroupProps> = ({ children, className }) => {
  return (
    <div className={cn('grid gap-4 md:grid-cols-2', className)}>
      {children}
    </div>
  );
};

interface TextFieldProps {
  label: string;
  id: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: 'text' | 'number' | 'email';
  placeholder?: string;
  helperText?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  className?: string;
}

export const TextField: React.FC<TextFieldProps> = ({
  label,
  id,
  value,
  onChange,
  type = 'text',
  placeholder,
  helperText,
  error,
  disabled,
  required,
  min,
  max,
  step,
  unit,
  className,
}) => {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
      </div>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        className={cn(error && 'border-red-500')}
      />
      {(helperText || error) && (
        <p className={cn('text-xs', error ? 'text-red-500' : 'text-muted-foreground')}>
          {error || helperText}
        </p>
      )}
    </div>
  );
};

interface SelectFieldProps {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  helperText?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  id,
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  helperText,
  error,
  disabled,
  required,
  className,
}) => {
  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id={id} className={cn(error && 'border-red-500')}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {(helperText || error) && (
        <p className={cn('text-xs', error ? 'text-red-500' : 'text-muted-foreground')}>
          {error || helperText}
        </p>
      )}
    </div>
  );
};

interface SwitchFieldProps {
  label: string;
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  description?: string;
  disabled?: boolean;
  className?: string;
}

export const SwitchField: React.FC<SwitchFieldProps> = ({
  label,
  id,
  checked,
  onCheckedChange,
  description,
  disabled,
  className,
}) => {
  return (
    <div className={cn('flex items-center justify-between space-x-2', className)}>
      <div className="flex-1 space-y-0.5">
        <Label htmlFor={id} className="text-sm font-medium cursor-pointer">
          {label}
        </Label>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
    </div>
  );
};

interface SliderFieldProps {
  label: string;
  id: string;
  value: number[];
  onValueChange: (value: number[]) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  helperText?: string;
  disabled?: boolean;
  className?: string;
  showValue?: boolean;
}

export const SliderField: React.FC<SliderFieldProps> = ({
  label,
  id,
  value,
  onValueChange,
  min,
  max,
  step = 1,
  unit = '',
  helperText,
  disabled,
  className,
  showValue = true,
}) => {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
        {showValue && (
          <span className="text-sm font-medium">
            {value[0]}{unit}
          </span>
        )}
      </div>
      <Slider
        id={id}
        min={min}
        max={max}
        step={step}
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        className="w-full"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{min}{unit}</span>
        <span className="text-xs text-muted-foreground">{max}{unit}</span>
      </div>
      {helperText && (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
};

interface FieldsetProps {
  legend: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export const Fieldset: React.FC<FieldsetProps> = ({
  legend,
  description,
  children,
  className,
}) => {
  return (
    <fieldset className={cn('space-y-4', className)}>
      <div className="space-y-1">
        <legend className="text-sm font-medium">{legend}</legend>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </fieldset>
  );
};

interface InfoTooltipProps {
  content: string;
  className?: string;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({ content, className }) => {
  return (
    <div className={cn('inline-flex items-center gap-1', className)}>
      <Info className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-xs text-muted-foreground">{content}</span>
    </div>
  );
};