import { Check } from 'lucide-react';
import { themes } from '../config/themes';
import { useTheme } from '../contexts/theme-provider';

export const ThemeSwitcher = () => {
  const { themeId, setThemeId } = useTheme();

  return (
    <div className="grid grid-cols-1 gap-2.5" data-testid="theme-switcher">
      {themes.map((theme) => {
        const isActive = theme.id === themeId;
        return (
          <button
            key={theme.id}
            type="button"
            data-testid={`theme-option-${theme.id}`}
            onClick={() => setThemeId(theme.id)}
            className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
              isActive ? 'border-primary ring-2 ring-primary-light' : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <span className="flex shrink-0 -space-x-2">
              <span className="w-6 h-6 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: theme.swatch[0] }} />
              <span className="w-6 h-6 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: theme.swatch[1] }} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-slate-900">{theme.name}</span>
              <span className="block text-xs text-slate-500 truncate">{theme.description}</span>
            </span>
            {isActive && <Check size={16} className="text-primary shrink-0" />}
          </button>
        );
      })}
    </div>
  );
};

export default ThemeSwitcher;
