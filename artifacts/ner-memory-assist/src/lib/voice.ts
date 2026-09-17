import type { Lang } from './i18n';
import { getSpeechRecognitionLocale } from './voiceLocales';

function languagePrefix(locale: string): string {
  return locale.toLowerCase().split('-')[0];
}

function findMatchingVoice(locale: string): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  const normalized = locale.toLowerCase();
  const prefix = languagePrefix(locale);

  return voices.find((voice) => voice.lang.toLowerCase() === normalized)
    ?? voices.find((voice) => languagePrefix(voice.lang) === prefix);
}

function speakNow(text: string, locale: string): boolean {
  const synthesis = window.speechSynthesis;
  const matchingVoice = findMatchingVoice(locale);

  // Let the browser choose a voice for the requested locale when an exact
  // installed voice is not exposed. Refusing here made Tamil/Hindi silently
  // fail on devices where the browser can still route the locale correctly.
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = matchingVoice?.lang ?? locale;
  if (matchingVoice) utterance.voice = matchingVoice;
  utterance.rate = 0.85;
  utterance.pitch = 1;
  utterance.volume = 1;
  synthesis.speak(utterance);
  return true;
}

/** Speak using the currently selected language/locale. */
export function speakText(text: string, lang: Lang): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  const cleanText = text.trim();
  if (!cleanText) return false;

  const speechLocale = getSpeechRecognitionLocale(lang);
  const synthesis = window.speechSynthesis;

  try {
    synthesis.cancel();

    if (speakNow(cleanText, speechLocale)) return true;

    const retry = () => {
      synthesis.removeEventListener('voiceschanged', retry);
      try {
        synthesis.cancel();
        speakNow(cleanText, speechLocale);
      } catch {
        // Ignore browser-specific synthesis errors.
      }
    };

    synthesis.addEventListener('voiceschanged', retry, { once: true });
    window.setTimeout(() => synthesis.removeEventListener('voiceschanged', retry), 2500);
    return true;
  } catch {
    return false;
  }
}

export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
