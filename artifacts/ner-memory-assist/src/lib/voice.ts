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
  const prefix = languagePrefix(locale);

  // Never silently use an unrelated English voice for a non-English language.
  if (!matchingVoice && prefix !== 'en') return false;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = matchingVoice?.lang ?? locale;
  if (matchingVoice) utterance.voice = matchingVoice;
  utterance.rate = 0.85;
  utterance.pitch = 1;
  utterance.volume = 1;
  synthesis.speak(utterance);
  return true;
}

/**
 * Speak in the currently selected language. The locale comes from the same
 * language map used by speech recognition, so output cannot silently fall
 * back to an unrelated language. Browser/device voice availability still
 * determines which languages can actually be spoken.
 */
export function speakText(text: string, lang: Lang): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  const cleanText = text.trim();
  if (!cleanText) return false;

  const speechLocale = getSpeechRecognitionLocale(lang);
  const synthesis = window.speechSynthesis;

  try {
    synthesis.cancel();

    if (speakNow(cleanText, speechLocale)) return true;

    // Some browsers populate voices asynchronously after page load.
    let handled = false;
    const retry = () => {
      if (handled) return;
      handled = true;
      synthesis.removeEventListener('voiceschanged', retry);
      try {
        speakNow(cleanText, speechLocale);
      } catch {
        // Ignore browser-specific synthesis errors.
      }
    };

    synthesis.addEventListener('voiceschanged', retry, { once: true });
    window.setTimeout(() => {
      if (!handled) {
        handled = true;
        synthesis.removeEventListener('voiceschanged', retry);
      }
    }, 2500);

    return false;
  } catch {
    return false;
  }
}

export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
