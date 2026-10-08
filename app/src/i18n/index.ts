import en from './en.json';
import fr from './fr.json';
import { extraEn, extraFr } from './extra';

export type Lang = 'en' | 'fr';
const dicts = { en: { ...en, ...extraEn }, fr: { ...fr, ...extraFr } };
export type Dict = typeof dicts.en;
export type TKey = keyof Dict;
export const dict = (lang: Lang): Dict => dicts[lang] as Dict;
