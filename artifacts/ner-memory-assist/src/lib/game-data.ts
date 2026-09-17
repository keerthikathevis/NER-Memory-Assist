export type CulturalCategory = 'landmark' | 'animal' | 'object' | 'food' | 'clothing' | 'festival' | 'nature';

export type CulturalItem = {
  id: string;
  titleKey: string;
  category: CulturalCategory;
  color: 'saffron' | 'teal' | 'leaf' | 'rose' | 'sky';
  symbol: string;
  detail: string;
  imageDataUrl: string;
};

const svgDataUrl = (label: string, symbol: string, top: string, bottom: string) => {
  const safeLabel = label.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 420"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient></defs><rect width="600" height="420" rx="36" fill="url(#g)"/><circle cx="300" cy="175" r="92" fill="rgba(255,255,255,.72)"/><text x="300" y="215" text-anchor="middle" font-size="112" font-family="Arial,sans-serif" font-weight="700" fill="#17463d">${symbol}</text><rect x="70" y="310" width="460" height="62" rx="25" fill="rgba(255,255,255,.82)"/><text x="300" y="351" text-anchor="middle" font-size="28" font-family="Arial,sans-serif" font-weight="700" fill="#173b34">${safeLabel}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const portraitDataUrl = (name: string, initials: string, top: string, bottom: string) => {
  const safeName = name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 480"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient></defs><rect width="480" height="480" rx="48" fill="url(#g)"/><circle cx="240" cy="178" r="92" fill="#fff" fill-opacity=".78"/><text x="240" y="215" text-anchor="middle" font-size="94" font-family="Arial,sans-serif" font-weight="700" fill="#17463d">${initials}</text><rect x="58" y="332" width="364" height="74" rx="30" fill="#fff" fill-opacity=".85"/><text x="240" y="380" text-anchor="middle" font-size="30" font-family="Arial,sans-serif" font-weight="700" fill="#173b34">${safeName}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

export const culturalItems: CulturalItem[] = [
  { id: 'kamakhya', titleKey: 'Kamakhya Temple', category: 'landmark', color: 'rose', symbol: 'K', detail: 'A hilltop temple in Guwahati, Assam.', imageDataUrl: svgDataUrl('Kamakhya Temple', 'K', '#f7c4bc', '#d88d7f') },
  { id: 'tawang', titleKey: 'Tawang Monastery', category: 'landmark', color: 'saffron', symbol: 'T', detail: 'A monastery among the high mountains of Arunachal Pradesh.', imageDataUrl: svgDataUrl('Tawang Monastery', 'T', '#f7d6a1', '#d6a255') },
  { id: 'loktak', titleKey: 'Loktak Lake', category: 'nature', color: 'sky', symbol: 'L', detail: 'A lake known for its floating phumdis in Manipur.', imageDataUrl: svgDataUrl('Loktak Lake', 'L', '#b9def0', '#6eb0d2') },
  { id: 'kaziranga', titleKey: 'Kaziranga', category: 'animal', color: 'leaf', symbol: 'R', detail: 'Home to the greater one-horned rhinoceros.', imageDataUrl: svgDataUrl('Kaziranga', 'R', '#b8deb7', '#6eae72') },
  { id: 'mawlynnong', titleKey: 'Mawlynnong', category: 'nature', color: 'teal', symbol: 'M', detail: 'A green village in Meghalaya.', imageDataUrl: svgDataUrl('Mawlynnong', 'M', '#b8ded9', '#70afa7') },
  { id: 'hornbill', titleKey: 'Hornbill', category: 'animal', color: 'rose', symbol: 'H', detail: 'A bright bird found across the hills of the region.', imageDataUrl: svgDataUrl('Hornbill', 'H', '#f5c2c8', '#cf8491') },
  { id: 'bamboo', titleKey: 'Bamboo basket', category: 'object', color: 'saffron', symbol: 'B', detail: 'A handwoven everyday object made with bamboo.', imageDataUrl: svgDataUrl('Bamboo Basket', 'B', '#efd3a1', '#c99952') },
  { id: 'pitha', titleKey: 'Pitha', category: 'food', color: 'sky', symbol: 'P', detail: 'A traditional rice treat enjoyed in Assam and beyond.', imageDataUrl: svgDataUrl('Pitha', 'P', '#cae8f3', '#82bbd0') },
  { id: 'shawl', titleKey: 'Woven shawl', category: 'clothing', color: 'teal', symbol: 'S', detail: 'A warm woven textile with regional patterns.', imageDataUrl: svgDataUrl('Woven Shawl', 'S', '#bedfd8', '#78aaa0') },
  { id: 'bihu', titleKey: 'Bihu festival', category: 'festival', color: 'leaf', symbol: 'F', detail: 'A joyful seasonal festival with dance and music.', imageDataUrl: svgDataUrl('Bihu Festival', 'F', '#c5e0ae', '#86b05d') },
];

export const culturalTitle = (item: CulturalItem) => item.titleKey;

export const demoMemoryProfiles = [
  { id: 'maya', name: 'Maya Das', relationship: 'Daughter', voiceNote: 'Maya likes singing by the window.', description: 'A familiar smile and a warm voice.', photoDataUrl: portraitDataUrl('Maya Das', 'MD', '#f2d4c8', '#d79a85') },
  { id: 'raju', name: 'Raju Das', relationship: 'Grandson', voiceNote: 'Ask Raju about his school garden.', description: 'Raju loves plants and small adventures.', photoDataUrl: portraitDataUrl('Raju Das', 'RD', '#c8e0c8', '#82b184') },
  { id: 'pema', name: 'Pema Rai', relationship: 'Neighbour', voiceNote: 'Pema visits on Sunday afternoons.', description: 'A friendly face from nearby.', photoDataUrl: portraitDataUrl('Pema Rai', 'PR', '#c9dff0', '#82acd0') },
];
