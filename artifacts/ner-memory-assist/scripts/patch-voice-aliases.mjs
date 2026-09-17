import { readFile, writeFile } from 'node:fs/promises';

const file = new URL('../src/lib/i18n.ts', import.meta.url);
const text = await readFile(file, 'utf8');

const start = "const voiceAliases: Partial<Record<Lang, Record<VoiceCommand, string[]>>> = {";
const end = "export const resolveVoiceCommand";
const startIndex = text.indexOf(start);
const endIndex = text.indexOf(end, startIndex);

if (startIndex === -1 || endIndex === -1) {
  throw new Error('Could not find the voice alias block in i18n.ts');
}

const aliases = `const voiceAliases: Partial<Record<Lang, Record<VoiceCommand, string[]>>> = {
  en: {
    play: ['play'], pause: ['pause'], next: ['next'], previous: ['previous', 'back'], stop: ['stop'], repeat: ['repeat'],
    'volume up': ['volume up', 'louder'], 'volume down': ['volume down', 'quieter'], 'play favorites': ['play favorites', 'my favorites'],
    'open music': ['open music'], 'go home': ['go home', 'home'], start: ['start', 'begin'], continue: ['continue'],
    restart: ['restart'], hint: ['hint'], easier: ['easier'], harder: ['harder'],
  },
  ta: {
    play: ['இயக்கு'], pause: ['இடைநிறுத்து'], next: ['அடுத்து'], previous: ['முந்தைய'], stop: ['நிறுத்து'], repeat: ['மீண்டும்'],
    'volume up': ['ஒலியை அதிகரிக்கவும்'], 'volume down': ['ஒலியை குறைக்கவும்'], 'play favorites': ['பிடித்தவை இயக்கு'],
    'open music': ['இசையைத் திற'], 'go home': ['முகப்பு'], start: ['தொடங்கு'], continue: ['தொடரவும்'], restart: ['மீண்டும் தொடங்கு'],
    hint: ['குறிப்பு'], easier: ['எளிதாக'], harder: ['கடினமாக'],
  },
  hi: {
    play: ['चलाएं'], pause: ['रोकें'], next: ['अगला'], previous: ['पिछला'], stop: ['रुकें', 'रोकें'], repeat: ['दोहराएं'],
    'volume up': ['आवाज़ बढ़ाएं'], 'volume down': ['आवाज़ कम करें'], 'play favorites': ['पसंदीदा चलाएं'],
    'open music': ['संगीत खोलें'], 'go home': ['होम', 'मुखपृष्ठ'], start: ['शुरू', 'शुरू करें'], continue: ['जारी रखें'], restart: ['फिर शुरू'],
    hint: ['संकेत'], easier: ['आसान'], harder: ['कठिन'],
  },
  as: {
    play: ['চলাও', 'বজাও'], pause: ['বিৰতি'], next: ['পৰৱৰ্তী'], previous: ['পূৰ্বৱৰ্তী'], stop: ['বন্ধ কৰক'], repeat: ['পুনৰাবৃত্তি'],
    'volume up': ['শব্দ বঢ়াওক'], 'volume down': ['শব্দ কমাওক'], 'play favorites': ['প্ৰিয়বোৰ বজাওক'], 'open music': ['সংগীত খোলক'],
    'go home': ['মুখ্য পৃষ্ঠা', 'হোম'], start: ['আৰম্ভ কৰক'], continue: ['আগবাঢ়ক'], restart: ['পুনৰ আৰম্ভ কৰক'], hint: ['ইংগিত'], easier: ['সহজ'], harder: ['কঠিন'],
  },
  bn: {
    play: ['চালাও', 'বাজাও'], pause: ['বিরতি'], next: ['পরবর্তী'], previous: ['আগের'], stop: ['থামান', 'বন্ধ করুন'], repeat: ['আবার বলুন', 'পুনরাবৃত্তি'],
    'volume up': ['শব্দ বাড়ান'], 'volume down': ['শব্দ কমান'], 'play favorites': ['পছন্দের চালান'], 'open music': ['গান খুলুন', 'সঙ্গীত খুলুন'],
    'go home': ['হোম', 'মূল পাতা'], start: ['শুরু করুন'], continue: ['চালিয়ে যান'], restart: ['আবার শুরু'], hint: ['ইঙ্গিত'], easier: ['সহজ'], harder: ['কঠিন'],
  },
  brx: {
    play: ['बायो', 'बजाय'], pause: ['देरि'], next: ['उनाव'], previous: ['सिगां'], stop: ['बन्द'], repeat: ['फिन'],
    'volume up': ['सारथि जाबाय'], 'volume down': ['सारथि खमाय'], 'play favorites': ['मोजांफोर बजाय'], 'open music': ['दोनथाय खोल'],
    'go home': ['नखर', 'होम'], start: ['जाबाय'], continue: ['सोलायनाय'], restart: ['फिन जाबाय'], hint: ['इंगित'], easier: ['गोरल'], harder: ['जोर'],
  },
  mni: {
    play: ['ꯆꯥꯎ', 'ꯁꯣꯜ'], pause: ['ꯂꯩꯊꯣꯛꯄ'], next: ['ꯑꯃꯨꯛ'], previous: ['ꯃꯃꯥꯜ'], stop: ['ꯂꯩꯊꯣꯛ'], repeat: ['ꯍꯟꯅ'],
    'volume up': ['ꯑꯣꯟꯗꯣꯛ ꯆꯥꯎ'], 'volume down': ['ꯑꯣꯟꯗꯣꯛ ꯇꯥꯡ'], 'play favorites': ['ꯄꯥꯝꯕ ꯆꯥꯎ'], 'open music': ['ꯁꯥꯡꯕ ꯊꯣꯛ'],
    'go home': ['ꯌꯨꯝ'], start: ['ꯍꯧꯖꯤꯛ'], continue: ['ꯃꯊꯪ'], restart: ['ꯑꯃꯨꯛ ꯍꯧꯖꯤꯛ'], hint: ['ꯄꯥꯡꯊꯣꯛ'], easier: ['ꯁꯥꯟꯇꯥ'], harder: ['ꯈꯔ'],
  },
  kha: {
    play: ['pyn'], pause: ['sangeh'], next: ['wan'], previous: ['shuwa'], stop: ['sangeh'], repeat: ['pyn biang'],
    'volume up': ['pyn heh ka sur'], 'volume down': ['pyn rit ka sur'], 'play favorites': ['pyn khih bynta ba nga ieit'], 'open music': ['plie ka jingrwai'],
    'go home': ['sha ïing', 'home'], start: ['sdang'], continue: ['bteng'], restart: ['sdang biang'], hint: ['jingmut'], easier: ['suk'], harder: ['eh'],
  },
  lus: {
    play: ['tih'], pause: ['tawp'], next: ['dah'], previous: ['hma'], stop: ['tawp'], repeat: ['sawi leh'],
    'volume up': ['aw chhuah tih sang'], 'volume down': ['aw chhuah tih hniam'], 'play favorites': ['ka duh te chu tih'], 'open music': ['hla hawn'],
    'go home': ['in lam', 'home'], start: ['tan'], continue: ['thawk zawm'], restart: ['tan leh'], hint: ['hriatthiamna'], easier: ['awlsam'], harder: ['harsa'],
  },
  ne: {
    play: ['बजाउनुहोस्', 'चलाउनुहोस्'], pause: ['रोक्नुहोस्'], next: ['अर्को'], previous: ['अघिल्लो'], stop: ['रोक्नुहोस्'], repeat: ['फेरि भन्नुहोस्', 'दोहोर्याउनुहोस्'],
    'volume up': ['आवाज बढाउनुहोस्'], 'volume down': ['आवाज घटाउनुहोस्'], 'play favorites': ['मनपर्ने बजाउनुहोस्'], 'open music': ['सङ्गीत खोल्नुहोस्'],
    'go home': ['गृहपृष्ठ', 'होम'], start: ['सुरु गर्नुहोस्'], continue: ['जारी राख्नुहोस्'], restart: ['फेरि सुरु गर्नुहोस्'], hint: ['संकेत'], easier: ['सजिलो'], harder: ['गाह्रो'],
  },
};

`;

const updated = text.slice(0, startIndex) + aliases + text.slice(endIndex);
await writeFile(file, updated, 'utf8');
console.log('Multilingual voice aliases patched for build.');
