export type CulturalCategory = 'landmark' | 'animal' | 'object' | 'food' | 'clothing' | 'festival' | 'nature';

export type CulturalItem = {
  id: string;
  titleKey: string;
  category: CulturalCategory;
  color: 'saffron' | 'teal' | 'leaf' | 'rose' | 'sky';
  symbol: string;
  detail: string;
};

export const culturalItems: CulturalItem[] = [
  { id: 'kamakhya', titleKey: 'Kamakhya Temple', category: 'landmark', color: 'rose', symbol: 'K', detail: 'A hilltop temple in Guwahati, Assam.' },
  { id: 'tawang', titleKey: 'Tawang Monastery', category: 'landmark', color: 'saffron', symbol: 'T', detail: 'A monastery among the high mountains of Arunachal Pradesh.' },
  { id: 'loktak', titleKey: 'Loktak Lake', category: 'nature', color: 'sky', symbol: 'L', detail: 'A lake known for its floating phumdis in Manipur.' },
  { id: 'kaziranga', titleKey: 'Kaziranga', category: 'animal', color: 'leaf', symbol: 'R', detail: 'Home to the greater one-horned rhinoceros.' },
  { id: 'mawlynnong', titleKey: 'Mawlynnong', category: 'nature', color: 'teal', symbol: 'M', detail: 'A green village in Meghalaya.' },
  { id: 'hornbill', titleKey: 'Hornbill', category: 'animal', color: 'rose', symbol: 'H', detail: 'A bright bird found across the hills of the region.' },
  { id: 'bamboo', titleKey: 'Bamboo basket', category: 'object', color: 'saffron', symbol: 'B', detail: 'A handwoven everyday object made with bamboo.' },
  { id: 'pitha', titleKey: 'Pitha', category: 'food', color: 'sky', symbol: 'P', detail: 'A traditional rice treat enjoyed in Assam and beyond.' },
  { id: 'shawl', titleKey: 'Woven shawl', category: 'clothing', color: 'teal', symbol: 'S', detail: 'A warm woven textile with regional patterns.' },
  { id: 'bihu', titleKey: 'Bihu festival', category: 'festival', color: 'leaf', symbol: 'F', detail: 'A joyful seasonal festival with dance and music.' },
];

export const culturalTitle = (item: CulturalItem) => item.titleKey;

export const demoMemoryProfiles = [
  { id: 'maya', name: 'Maya Das', relationship: 'Daughter', voiceNote: 'Maya likes singing by the window.', description: 'A familiar smile and a warm voice.', photoDataUrl: '' },
  { id: 'raju', name: 'Raju Das', relationship: 'Grandson', voiceNote: 'Ask Raju about his school garden.', description: 'Raju loves plants and small adventures.', photoDataUrl: '' },
  { id: 'pema', name: 'Pema Rai', relationship: 'Neighbour', voiceNote: 'Pema visits on Sunday afternoons.', description: 'A friendly face from nearby.', photoDataUrl: '' },
];
