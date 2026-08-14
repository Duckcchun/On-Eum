/**
 * i18n - 다국어 지원 시스템
 * 
 * 사용법:
 * ```tsx
 * import { useTranslation } from '../i18n';
 * 
 * const MyComponent = () => {
 *   const { t, locale, setLocale } = useTranslation();
 *   return <Text>{t('home.title')}</Text>;
 * };
 * ```
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, NativeModules } from 'react-native';
import ko from './ko';
import en from './en';

export type Locale = 'ko' | 'en';

type TranslationMap = typeof ko;

const translations: Record<Locale, TranslationMap> = { ko, en };

const STORAGE_KEY = 'onEum_locale';

// ─── Get device locale ───
const getDeviceLocale = (): Locale => {
  try {
    const locale =
      Platform.OS === 'ios'
        ? NativeModules.SettingsManager?.settings?.AppleLocale ||
          NativeModules.SettingsManager?.settings?.AppleLanguages?.[0]
        : NativeModules.I18nManager?.localeIdentifier;

    if (locale && locale.startsWith('ko')) return 'ko';
    return 'en';
  } catch {
    return 'ko';
  }
};

// ─── Deep access helper ───
const getNestedValue = (obj: any, path: string): string => {
  const keys = path.split('.');
  let current = obj;
  for (const key of keys) {
    if (current === undefined || current === null) return path;
    current = current[key];
  }
  return typeof current === 'string' ? current : path;
};

// ─── Context ───
interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  availableLocales: { key: Locale; label: string }[];
}

const I18nContext = createContext<I18nContextType>({
  locale: 'ko',
  setLocale: () => {},
  t: (key: string) => key,
  availableLocales: [],
});

export const useTranslation = () => useContext(I18nContext);

// ─── Provider ───
export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(getDeviceLocale());

  useEffect(() => {
    loadSavedLocale();
  }, []);

  const loadSavedLocale = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved && (saved === 'ko' || saved === 'en')) {
        setLocaleState(saved as Locale);
      }
    } catch (error) {
      console.error('[i18n] Failed to load locale:', error);
    }
  };

  const setLocale = useCallback(async (newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, newLocale);
    } catch (error) {
      console.error('[i18n] Failed to save locale:', error);
    }
  }, []);

  const t = useCallback(
    (key: string): string => {
      return getNestedValue(translations[locale], key);
    },
    [locale]
  );

  const availableLocales = [
    { key: 'ko' as Locale, label: '한국어' },
    { key: 'en' as Locale, label: 'English' },
  ];

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, availableLocales }}>
      {children}
    </I18nContext.Provider>
  );
};

export default { useTranslation, I18nProvider };
