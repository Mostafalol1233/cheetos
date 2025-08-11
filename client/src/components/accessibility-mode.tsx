import { createContext, useContext, useState, useEffect } from 'react';
import { Monitor, Sun, Moon, Eye, EyeOff, Type, Contrast } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

interface AccessibilitySettings {
  highContrast: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'xl';
  reducedMotion: boolean;
  focusIndicators: boolean;
  colorBlindFriendly: boolean;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSettings: (settings: Partial<AccessibilitySettings>) => void;
  resetSettings: () => void;
}

const defaultSettings: AccessibilitySettings = {
  highContrast: false,
  fontSize: 'medium',
  reducedMotion: false,
  focusIndicators: true,
  colorBlindFriendly: false
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    const saved = localStorage.getItem('accessibility-settings');
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  });

  const updateSettings = (newSettings: Partial<AccessibilitySettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem('accessibility-settings', JSON.stringify(updated));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem('accessibility-settings');
  };

  // Apply accessibility settings to document
  useEffect(() => {
    const root = document.documentElement;
    
    // High contrast mode
    if (settings.highContrast) {
      root.classList.add('accessibility-high-contrast');
    } else {
      root.classList.remove('accessibility-high-contrast');
    }

    // Font size
    root.classList.remove('text-small', 'text-medium', 'text-large', 'text-xl');
    root.classList.add(`text-${settings.fontSize}`);

    // Reduced motion
    if (settings.reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }

    // Focus indicators
    if (settings.focusIndicators) {
      root.classList.add('enhanced-focus');
    } else {
      root.classList.remove('enhanced-focus');
    }

    // Color blind friendly
    if (settings.colorBlindFriendly) {
      root.classList.add('colorblind-friendly');
    } else {
      root.classList.remove('colorblind-friendly');
    }
  }, [settings]);

  return (
    <AccessibilityContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
}

export function AccessibilityToolbar() {
  const { settings, updateSettings, resetSettings } = useAccessibility();

  const fontSizeOptions = [
    { value: 'small', label: 'Small', size: '14px' },
    { value: 'medium', label: 'Medium', size: '16px' },
    { value: 'large', label: 'Large', size: '18px' },
    { value: 'xl', label: 'Extra Large', size: '20px' }
  ] as const;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Eye className="w-4 h-4" />
          <span className="hidden sm:inline">Accessibility</span>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Eye className="w-4 h-4" />
          Accessibility Settings
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* High Contrast */}
        <DropdownMenuItem
          onClick={() => updateSettings({ highContrast: !settings.highContrast })}
          className="justify-between"
        >
          <div className="flex items-center gap-2">
            <Contrast className="w-4 h-4" />
            High Contrast
          </div>
          <div className={`w-4 h-4 rounded border ${
            settings.highContrast ? 'bg-gold-primary border-gold-primary' : 'border-muted-foreground'
          }`}>
            {settings.highContrast && <span className="block w-full h-full text-xs leading-none text-center">✓</span>}
          </div>
        </DropdownMenuItem>

        {/* Font Size */}
        <DropdownMenuLabel className="text-xs text-muted-foreground mt-2">Font Size</DropdownMenuLabel>
        {fontSizeOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => updateSettings({ fontSize: option.value })}
            className="justify-between"
          >
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4" />
              <span>{option.label}</span>
            </div>
            <div className={`w-4 h-4 rounded-full border ${
              settings.fontSize === option.value ? 'bg-gold-primary border-gold-primary' : 'border-muted-foreground'
            }`} />
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        {/* Reduced Motion */}
        <DropdownMenuItem
          onClick={() => updateSettings({ reducedMotion: !settings.reducedMotion })}
          className="justify-between"
        >
          <div className="flex items-center gap-2">
            <Monitor className="w-4 h-4" />
            Reduce Motion
          </div>
          <div className={`w-4 h-4 rounded border ${
            settings.reducedMotion ? 'bg-gold-primary border-gold-primary' : 'border-muted-foreground'
          }`}>
            {settings.reducedMotion && <span className="block w-full h-full text-xs leading-none text-center">✓</span>}
          </div>
        </DropdownMenuItem>

        {/* Enhanced Focus */}
        <DropdownMenuItem
          onClick={() => updateSettings({ focusIndicators: !settings.focusIndicators })}
          className="justify-between"
        >
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Enhanced Focus
          </div>
          <div className={`w-4 h-4 rounded border ${
            settings.focusIndicators ? 'bg-gold-primary border-gold-primary' : 'border-muted-foreground'
          }`}>
            {settings.focusIndicators && <span className="block w-full h-full text-xs leading-none text-center">✓</span>}
          </div>
        </DropdownMenuItem>

        {/* Color Blind Friendly */}
        <DropdownMenuItem
          onClick={() => updateSettings({ colorBlindFriendly: !settings.colorBlindFriendly })}
          className="justify-between"
        >
          <div className="flex items-center gap-2">
            <EyeOff className="w-4 h-4" />
            Color Blind Friendly
          </div>
          <div className={`w-4 h-4 rounded border ${
            settings.colorBlindFriendly ? 'bg-gold-primary border-gold-primary' : 'border-muted-foreground'
          }`}>
            {settings.colorBlindFriendly && <span className="block w-full h-full text-xs leading-none text-center">✓</span>}
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={resetSettings} className="text-muted-foreground">
          Reset to Default
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}