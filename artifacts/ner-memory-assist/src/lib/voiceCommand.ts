import type { Lang } from './i18n';

const commandAliases: Record<Lang, Record<string, string>> = {
  en: { help:'HELP', repeat:'REPEAT', start:'START', pause:'PAUSE', stop:'STOP', continue:'CONTINUE', home:'HOME', easier:'EASIER', harder:'HARDER', games:'OPEN_GAMES', 'open games':'OPEN_GAMES', 'go to games':'OPEN_GAMES', 'show games':'OPEN_GAMES', medicine:'OPEN_MEDICINE', 'open medicine':'OPEN_MEDICINE', 'go to medicine':'OPEN_MEDICINE', 'show medicine':'OPEN_MEDICINE', music:'OPEN_MUSIC', 'open music':'OPEN_MUSIC', memories:'OPEN_MEMORIES', 'open memories':'OPEN_MEMORIES', 'go to memories':'OPEN_MEMORIES', 'show memories':'OPEN_MEMORIES', progress:'OPEN_PROGRESS', 'open progress':'OPEN_PROGRESS', 'go to progress':'OPEN_PROGRESS', 'show progress':'OPEN_PROGRESS', settings:'OPEN_SETTINGS', 'open settings':'OPEN_SETTINGS', 'go to settings':'OPEN_SETTINGS' },
  ta: { 'உதவி':'HELP', 'மீண்டும்':'REPEAT', 'தொடங்கு':'START', 'இடைநிறுத்து':'PAUSE', 'நிறுத்து':'STOP', 'தொடரவும்':'CONTINUE', 'முகப்பு':'HOME', 'எளிதாக':'EASIER', 'கடினமாக':'HARDER', 'விளையாட்டுகள்':'OPEN_GAMES', 'மருந்து':'OPEN_MEDICINE', 'இசை':'OPEN_MUSIC', 'நினைவுகள்':'OPEN_MEMORIES', 'முன்னேற்றம்':'OPEN_PROGRESS', 'அமைப்புகள்':'OPEN_SETTINGS' },
  hi: { 'मदद':'HELP', 'दोहराएं':'REPEAT', 'शुरू':'START', 'रोकें':'PAUSE', 'बंद':'STOP', 'जारी':'CONTINUE', 'होम':'HOME', 'आसान':'EASIER', 'कठिन':'HARDER', 'गेम':'OPEN_GAMES', 'दवा':'OPEN_MEDICINE', 'संगीत':'OPEN_MUSIC', 'यादें':'OPEN_MEMORIES', 'प्रगति':'OPEN_PROGRESS', 'सेटिंग्स':'OPEN_SETTINGS' },
  as: { 'সহায়':'HELP', 'সহায়তা':'HELP', 'পুনৰাবৃত্তি':'REPEAT', 'আৰম্ভ':'START', 'ৰখাওক':'PAUSE', 'বন্ধ':'STOP', 'আগবাঢ়ক':'CONTINUE', 'ঘৰ':'HOME', 'সহজ':'EASIER', 'কঠিন':'HARDER', 'খেল':'OPEN_GAMES', 'ঔষধ':'OPEN_MEDICINE', 'সংগীত':'OPEN_MUSIC', 'স্মৃতি':'OPEN_MEMORIES', 'অগ্ৰগতি':'OPEN_PROGRESS', 'ছেটিংছ':'OPEN_SETTINGS' },
  bn: { 'সাহায্য':'HELP', 'আবার':'REPEAT', 'শুরু':'START', 'বিরতি':'PAUSE', 'থামুন':'STOP', 'চালিয়ে':'CONTINUE', 'হোম':'HOME', 'সহজ':'EASIER', 'কঠিন':'HARDER', 'খেলা':'OPEN_GAMES', 'ওষুধ':'OPEN_MEDICINE', 'সঙ্গীত':'OPEN_MUSIC', 'স্মৃতি':'OPEN_MEMORIES', 'অগ্রগতি':'OPEN_PROGRESS', 'সেটিংস':'OPEN_SETTINGS' },
  brx: { 'मदद':'HELP', 'सहायता':'HELP', 'शुरु':'START', 'बन्द':'STOP', 'खेल':'OPEN_GAMES', 'दवा':'OPEN_MEDICINE', 'संगीत':'OPEN_MUSIC', 'स्मृति':'OPEN_MEMORIES', 'प्रगति':'OPEN_PROGRESS' },
  mni: { 'ꯑꯗꯨꯕ':'HELP', 'ꯍꯧꯖꯤꯛ':'START', 'ꯂꯩꯔꯤ':'STOP', 'ꯏꯁꯥꯏ':'OPEN_MUSIC', 'ꯁꯤꯟꯖꯤꯅꯕ':'OPEN_MEMORIES' },
  kha: { ' jingïarap':'HELP', 'sdang':'START', 'sangeit':'OPEN_MUSIC', 'kynkynmaw':'OPEN_MEMORIES' },
  lus: { 'tanpui':'HELP', 'tawp':'STOP', 'music':'OPEN_MUSIC', 'theihhlimna':'OPEN_MEMORIES' },
  ne: { 'मद्दत':'HELP', 'सहायता':'HELP', 'दोहोऱ्याउनुहोस्':'REPEAT', 'सुरु':'START', 'रोक्नुहोस्':'PAUSE', 'बन्द':'STOP', 'जारी':'CONTINUE', 'गृह':'HOME', 'सजिलो':'EASIER', 'गाह्रो':'HARDER', 'खेल':'OPEN_GAMES', 'औषधि':'OPEN_MEDICINE', 'संगीत':'OPEN_MUSIC', 'स्मृति':'OPEN_MEMORIES', 'प्रगति':'OPEN_PROGRESS', 'सेटिङ':'OPEN_SETTINGS' },
};

const normalize = (value: string) => value
  .normalize('NFKC')
  .toLocaleLowerCase()
  .replace(/[.,!?;:()[\]{}]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const matchesPhrase = (text: string, phrase: string) =>
  text === phrase || text.startsWith(phrase + ' ') || text.endsWith(' ' + phrase) || text.includes(' ' + phrase + ' ');

export function resolveMultilingualVoiceCommand(lang: Lang, transcript: string): string | undefined {
  const text = normalize(transcript);
  if (!text) return undefined;
  const aliases = { ...commandAliases.en, ...(commandAliases[lang] ?? {}) };
  const ordered = Object.entries(aliases).sort(([a], [b]) => b.length - a.length);
  for (const [phrase, command] of ordered) {
    if (matchesPhrase(text, normalize(phrase))) return command;
  }

  // Speech recognition often adds polite/filler words such as
  // "please", "open", "show", or "go to". Strip those and match the
  // destination itself so natural spoken commands still work.
  const cleaned = text
    .replace(/^(please|can you|could you|i want to|open|show|go to|navigate to|take me to)\s+/i, '')
    .trim();
  if (cleaned && cleaned !== text) {
    for (const [phrase, command] of ordered) {
      if (cleaned === normalize(phrase)) return command;
    }
  }

  return undefined;
}
