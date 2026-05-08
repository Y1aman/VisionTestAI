import { create } from 'zustand';
import { translations, Language, TranslationKey } from '../i18n/translations';

interface AuthState {
  token: string | null;
  user: { id: string; email: string; fullName: string; role: string; tenantId: string; tenantName: string; preferredLanguage: string } | null;
  language: Language;
  setAuth: (token: string, user: AuthState['user']) => void;
  setLanguage: (lang: Language) => void;
  logout: () => void;
  t: (key: TranslationKey) => string;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('vt_token'),
  user: JSON.parse(localStorage.getItem('vt_user') || 'null'),
  language: (localStorage.getItem('vt_lang') as Language) || 'en',

  setAuth: (token, user) => {
    localStorage.setItem('vt_token', token);
    localStorage.setItem('vt_user', JSON.stringify(user));
    if (user?.preferredLanguage) {
      localStorage.setItem('vt_lang', user.preferredLanguage as Language);
      set({ token, user, language: user.preferredLanguage as Language });
    } else {
      set({ token, user });
    }
  },

  setLanguage: (lang) => {
    localStorage.setItem('vt_lang', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    set({ language: lang });
  },

  logout: () => {
    localStorage.removeItem('vt_token');
    localStorage.removeItem('vt_user');
    set({ token: null, user: null });
  },

  t: (key) => {
    const lang = get().language;
    return translations[lang]?.[key] ?? translations.en[key] ?? key;
  },
}));
