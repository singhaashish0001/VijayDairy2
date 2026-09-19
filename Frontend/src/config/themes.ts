export type ThemeId = 'dairy' | 'ocean' | 'emerald' | 'navy' | 'burgundy';

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  description: string;
  swatch: [string, string];
  vars: Record<string, string>;
}

export const themes: ThemeDefinition[] = [
  {
    id: 'dairy',
    name: 'Fresh Dairy',
    description: 'Pasture green with cream and butter-gold accent.',
    swatch: ['#166534', '#ca8a04'],
    vars: {
      '--color-primary': '#166534',
      '--color-primary-dark': '#14532d',
      '--color-primary-light': '#dcfce7',
      '--color-primary-mid': '#16a34a',
      '--color-primary-rgb': '22, 101, 52',
      '--color-accent': '#ca8a04',
      '--color-accent-dark': '#a16207',
      '--color-accent-mid': '#eab308',
      '--color-accent-light': '#fef9c3',
      '--color-accent-rgb': '202, 138, 4',
      '--color-page-bg': '#fbfaf5',
    },
  },
  {
    id: 'ocean',
    name: 'Ocean Blue',
    description: 'Deep sky blue with warm amber accent.',
    swatch: ['#0369a1', '#d97706'],
    vars: {
      '--color-primary': '#0369a1',
      '--color-primary-dark': '#075985',
      '--color-primary-light': '#e0f2fe',
      '--color-primary-mid': '#0ea5e9',
      '--color-primary-rgb': '3, 105, 161',
      '--color-accent': '#d97706',
      '--color-accent-dark': '#b45309',
      '--color-accent-mid': '#f59e0b',
      '--color-accent-light': '#fef3c7',
      '--color-accent-rgb': '217, 119, 6',
      '--color-page-bg': '#f6f8fb',
    },
  },
  {
    id: 'emerald',
    name: 'Emerald & Gold',
    description: 'Premium emerald green with rich gold accent.',
    swatch: ['#065f46', '#ca8a04'],
    vars: {
      '--color-primary': '#065f46',
      '--color-primary-dark': '#064e3b',
      '--color-primary-light': '#d1fae5',
      '--color-primary-mid': '#10b981',
      '--color-primary-rgb': '6, 95, 70',
      '--color-accent': '#ca8a04',
      '--color-accent-dark': '#a16207',
      '--color-accent-mid': '#eab308',
      '--color-accent-light': '#fef9c3',
      '--color-accent-rgb': '202, 138, 4',
      '--color-page-bg': '#f7f8f5',
    },
  },
  {
    id: 'navy',
    name: 'Navy & Gold',
    description: 'Classic deep navy with metallic gold accent.',
    swatch: ['#0b3d66', '#b8860b'],
    vars: {
      '--color-primary': '#0b3d66',
      '--color-primary-dark': '#082c4a',
      '--color-primary-light': '#dbeafe',
      '--color-primary-mid': '#1d5c94',
      '--color-primary-rgb': '11, 61, 102',
      '--color-accent': '#b8860b',
      '--color-accent-dark': '#8a6508',
      '--color-accent-mid': '#d4af37',
      '--color-accent-light': '#fdf6e3',
      '--color-accent-rgb': '184, 134, 11',
      '--color-page-bg': '#f5f6f8',
    },
  },
  {
    id: 'burgundy',
    name: 'Burgundy & Cream',
    description: 'Boutique wine burgundy with warm amber accent.',
    swatch: ['#7f1d1d', '#b45309'],
    vars: {
      '--color-primary': '#7f1d1d',
      '--color-primary-dark': '#601515',
      '--color-primary-light': '#fee2e2',
      '--color-primary-mid': '#9f2c2c',
      '--color-primary-rgb': '127, 29, 29',
      '--color-accent': '#b45309',
      '--color-accent-dark': '#92400e',
      '--color-accent-mid': '#d97706',
      '--color-accent-light': '#fef3e2',
      '--color-accent-rgb': '180, 83, 9',
      '--color-page-bg': '#faf7f2',
    },
  },
];

export const defaultThemeId: ThemeId = 'dairy';

export function getTheme(id: ThemeId): ThemeDefinition {
  return themes.find((t) => t.id === id) ?? themes[0];
}
