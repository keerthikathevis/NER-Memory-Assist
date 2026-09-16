import type { Lang } from './i18n';

/**
 * Browser SpeechRecognition locale candidates. Some browsers expose only a
 * subset of Indic languages, so we keep ordered candidates and let the
 * browser select the first supported locale it can use.
 */
export const speechRecognitionLocales: Record<Lang, string[]> = {
  en: ['en-IN', 'en-US', 'en'],
  ta: ['ta-IN', 'ta'],
  hi: ['hi-IN', 'hi'],
  as: ['as-IN', 'as'],
  bn: ['bn-IN', 'bn-BD', 'bn'],
  brx: ['brx-IN', 'brx', 'hi-IN', 'hi'],
  mni: ['mni-IN', 'mni', 'bn-IN', 'bn'],
  kha: ['kha-IN', 'kha', 'en-IN', 'en'],
  lus: ['lus-IN', 'lus', 'en-IN', 'en'],
  ne: ['ne-NP', 'ne-IN', 'ne'],
};

export function getSpeechRecognitionLocale(lang: Lang): string {
  return speechRecognitionLocales[lang]?.[0] ?? 'en-IN';
}
