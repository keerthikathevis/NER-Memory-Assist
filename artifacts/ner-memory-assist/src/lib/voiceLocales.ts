import type { Lang } from './i18n';

/**
 * Preferred browser SpeechRecognition locales. Browsers may support only a
 * subset of these languages; we do not silently map an unsupported language
 * to an unrelated English/Hindi/Bengali recognizer.
 */
export const speechRecognitionLocales: Record<Lang, string[]> = {
  en: ['en-IN', 'en-US', 'en'],
  ta: ['ta-IN', 'ta'],
  hi: ['hi-IN', 'hi'],
  as: ['as-IN', 'as'],
  bn: ['bn-IN', 'bn-BD', 'bn'],
  brx: ['brx-IN', 'brx'],
  mni: ['mni-IN', 'mni'],
  kha: ['kha-IN', 'kha'],
  lus: ['lus-IN', 'lus'],
  ne: ['ne-IN', 'ne-NP', 'ne'],
};

export function getSpeechRecognitionLocale(lang: Lang): string {
  return speechRecognitionLocales[lang]?.[0] ?? 'en-IN';
}
