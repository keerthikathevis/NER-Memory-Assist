import type { Lang } from './i18n';
import { getSpeechRecognitionLocale } from './voiceLocales';
import { resolveMultilingualVoiceCommand } from './voiceCommand';

export type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onresult: ((event: any) => void) | null;
};

export function configureRecognition(recognition: SpeechRecognitionLike, lang: Lang) {
  recognition.lang = getSpeechRecognitionLocale(lang);
  recognition.continuous = false;
  recognition.interimResults = false;
}

export function resolveCommandForLanguage(lang: Lang, transcript: string): string | undefined {
  return resolveMultilingualVoiceCommand(lang, transcript);
}
