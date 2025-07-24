import React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Switch } from '../ui/switch'; // Assuming you have a Switch component

interface SettingsItemProps {
  icon: React.ElementType;
  label: string;
  value?: string;
  onClick?: () => void;
  isLast?: boolean;
  type?: 'button' | 'toggle'; // Mantener toggle solo para theme
  disabled?: boolean;
  toggleState?: boolean;
  onToggleChange?: (checked: boolean) => void;
}

const SettingsItem = ({
  icon: Icon,
  label,
  value,
  onClick,
  isLast = false,
  type = 'button',
  disabled = false,
  toggleState = false,
  onToggleChange,
}: SettingsItemProps) => {
  const switchId = React.useId();

  const content = (
    <>
      <div className="flex items-center gap-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background">
          <Icon size={18} className="text-muted-foreground" />
        </div>
        <span className="font-medium text-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {type === 'button' && (
          <>
            {value && <span className="text-sm text-muted-foreground">{value}</span>}
            <ChevronRight size={16} className="text-muted-foreground/50" />
          </>
        )}
        {type === 'toggle' && (
          <Switch
            id={switchId}
            checked={toggleState}
            onCheckedChange={onToggleChange}
            aria-label={label}
          />
        )}
      </div>
    </>
  );

  const itemClasses = cn(
    'flex w-full items-center justify-between p-3 text-left',
    !isLast && 'border-b border-background',
    onClick && 'transition-colors hover:bg-background/50'
  );

  if (type === 'button') {
    return (
      <button onClick={onClick} className={itemClasses} disabled={disabled}>
        {content}
      </button>
    );
  }

  return (
    <label htmlFor={switchId} className={cn(itemClasses, 'cursor-pointer')}>
      {content}
    </label>
  );
};

export default SettingsItem; 