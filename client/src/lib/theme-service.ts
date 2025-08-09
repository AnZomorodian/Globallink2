export type Theme = 'light' | 'dark' | 'system' | 'auto' | 'midnight' | 'forest' | 'ocean' | 'sunset';

export interface ThemeSettings {
  theme: Theme;
  accentColor: string;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  borderRadius: 'none' | 'small' | 'medium' | 'large' | 'full';
  animations: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
  customCSS?: string;
  backgroundPattern?: 'none' | 'dots' | 'grid' | 'lines' | 'waves';
}

export type ThemeOption = 'light' | 'dark' | 'auto' | 'cosmic' | 'nature';

export class ThemeService {
  private static readonly THEME_KEY = 'globalink_theme';

  static getTheme(): ThemeOption {
    return (localStorage.getItem(this.THEME_KEY) as ThemeOption) || 'auto';
  }

  static setTheme(theme: ThemeOption): void {
    localStorage.setItem(this.THEME_KEY, theme);
    this.applyTheme(theme);
  }

  static applyTheme(theme: ThemeOption): void {
    const root = document.documentElement;

    // Remove existing theme classes
    root.classList.remove('light', 'dark', 'cosmic', 'nature');

    switch (theme) {
      case 'light':
        root.classList.add('light');
        break;
      case 'dark':
        root.classList.add('dark');
        break;
      case 'auto':
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.classList.add(prefersDark ? 'dark' : 'light');
        break;
      case 'cosmic':
        root.classList.add('cosmic');
        this.applyCosmicTheme();
        break;
      case 'nature':
        root.classList.add('nature');
        this.applyNatureTheme();
        break;
    }
  }

  private static applyCosmicTheme(): void {
    const root = document.documentElement;
    root.style.setProperty('--primary', '219 100% 62%'); // Cosmic blue
    root.style.setProperty('--primary-foreground', '210 20% 98%');
    root.style.setProperty('--background', '224 71% 4%'); // Dark cosmic background
    root.style.setProperty('--foreground', '210 20% 98%');
    root.style.setProperty('--muted', '215 27% 17%');
    root.style.setProperty('--accent', '264 100% 82%'); // Purple accent
    root.style.setProperty('--border', '215 27% 17%');
  }

  private static applyNatureTheme(): void {
    const root = document.documentElement;
    root.style.setProperty('--primary', '142 76% 36%'); // Nature green
    root.style.setProperty('--primary-foreground', '355 20% 98%');
    root.style.setProperty('--background', '138 100% 96%'); // Light green background
    root.style.setProperty('--foreground', '142 100% 8%');
    root.style.setProperty('--muted', '138 20% 85%');
    root.style.setProperty('--accent', '48 96% 53%'); // Yellow accent
    root.style.setProperty('--border', '138 20% 82%');
  }

  static initializeTheme(): void {
    const savedTheme = this.getTheme();
    this.applyTheme(savedTheme);

    // Listen for system theme changes when auto is selected
    if (savedTheme === 'auto') {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (this.getTheme() === 'auto') {
          this.applyTheme('auto');
        }
      });
    }
  }
}