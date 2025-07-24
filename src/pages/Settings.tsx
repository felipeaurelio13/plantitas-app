import React from 'react';
import {
  User, LogOut, Sun, Moon, Bell, Download, Trash2, HelpCircle, Shield, Info
} from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import { SettingsGroup, SettingsItem } from '../components/Settings';

const iconMap: { [key: string]: React.ElementType } = {
  User, LogOut, Sun, Moon, Bell, Download, Trash2, HelpCircle, Shield, Info
};

const Settings: React.FC = () => {
  const { settingsSections } = useSettings();

  return (
    <div className="p-4 space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-foreground">
          Configuración
        </h1>
        <p className="text-muted-foreground">
          Gestiona tu cuenta y preferencias de la app.
        </p>
      </header>

      {settingsSections.map((section, index) => (
        <SettingsGroup key={section.title} title={section.title} delay={index}>
          {section.items.map((item, itemIndex) => {
            const IconComponent = iconMap[item.icon as string];
            const isLast = itemIndex === section.items.length - 1;

            if (item.type === 'toggle') {
              return (
                <SettingsItem
                  key={item.id}
                  icon={IconComponent}
                  label={item.label}
                  isLast={isLast}
                  type="toggle"
                  toggleState={"toggleState" in item ? item.toggleState : false}
                  onToggleChange={"onToggleChange" in item ? item.onToggleChange : undefined}
                />
              );
            }
            
            return (
              <SettingsItem
                key={item.id}
                icon={IconComponent}
                label={item.label}
                value={"value" in item && typeof item.value === 'string' ? item.value : undefined}
                onClick={"onClick" in item ? item.onClick : undefined}
                isLast={isLast}
                type="button"
                disabled={"disabled" in item ? item.disabled : false}
              />
            );
          })}
        </SettingsGroup>
      ))}
    </div>
  );
};

export default Settings;