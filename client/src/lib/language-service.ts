
export type LanguageOption = 'en' | 'fa' | 'ar' | 'es' | 'fr' | 'de' | 'zh' | 'ja';

export interface LanguageInfo {
  code: LanguageOption;
  name: string;
  nativeName: string;
  flag: string;
}

export const LANGUAGE_OPTIONS: LanguageInfo[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی', flag: '🇮🇷' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
];

export class LanguageService {
  private static readonly LANGUAGE_KEY = 'globalink_language';

  static getLanguage(): LanguageOption {
    return (localStorage.getItem(this.LANGUAGE_KEY) as LanguageOption) || 'en';
  }

  static setLanguage(language: LanguageOption): void {
    localStorage.setItem(this.LANGUAGE_KEY, language);
    document.documentElement.lang = language;
    
    // Apply RTL for Arabic and Persian
    if (language === 'ar' || language === 'fa') {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }
  }

  static getLanguageInfo(code: LanguageOption): LanguageInfo | undefined {
    return LANGUAGE_OPTIONS.find(lang => lang.code === code);
  }

  static initializeLanguage(): void {
    const savedLanguage = this.getLanguage();
    this.setLanguage(savedLanguage);
  }
}
