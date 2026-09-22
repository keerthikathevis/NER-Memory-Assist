export type CulturalCategory = 'landmark' | 'animal' | 'object' | 'food' | 'clothing' | 'festival' | 'nature';

export type CulturalItem = {
  id: string;
  titleKey: string;
  category: CulturalCategory;
  color: 'saffron' | 'teal' | 'leaf' | 'rose' | 'sky';
  symbol: string;
  detail: string;
  imageDataUrl: string;
  imageUrl?: string;
  imageCredit?: string;
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
  { id: 'kamakhya', titleKey: 'Kamakhya Temple', category: 'landmark', color: 'rose', symbol: 'K', detail: 'A hilltop temple in Guwahati, Assam.', imageDataUrl: svgDataUrl('Kamakhya Temple', 'K', '#f7c4bc', '#d88d7f'), imageUrl: '/api/cultural-image?id=kamakhya', imageCredit: 'Wikimedia Commons — Kamlesh011 — CC BY-SA.' },
  { id: 'umananda', titleKey: 'Umananda Temple', category: 'landmark', color: 'sky', symbol: 'U', detail: 'A Shiva temple on Peacock Island in the Brahmaputra, Assam.', imageDataUrl: svgDataUrl('Umananda Temple', 'U', '#c9e2f2', '#83b3d3'), imageUrl: '/api/cultural-image?id=umananda', imageCredit: 'Wikimedia Commons — license shown on source file page.' },
  { id: 'navagraha', titleKey: 'Navagraha Temple', category: 'landmark', color: 'saffron', symbol: 'N', detail: 'A historic temple on Chitrachal Hill in Guwahati, Assam.', imageDataUrl: svgDataUrl('Navagraha Temple', 'N', '#f5d79b', '#d9a85e'), imageUrl: '/api/cultural-image?id=navagraha', imageCredit: 'Wikimedia Commons — Saptarshi Chowdhury — CC BY-SA 3.0.' },
  { id: 'hayagriva', titleKey: 'Hayagriva Madhava Temple', category: 'landmark', color: 'teal', symbol: 'H', detail: 'A historic temple at Hajo, Assam.', imageDataUrl: svgDataUrl('Hayagriva Madhava Temple', 'H', '#bfe3dc', '#76b8ad'), imageUrl: '/api/cultural-image?id=hayagriva', imageCredit: 'Wikimedia Commons — Gaurav M Kumar — CC BY-SA 4.0.' },
  { id: 'nartiang', titleKey: 'Nartiang Durga Temple', category: 'landmark', color: 'rose', symbol: 'D', detail: 'A historic Durga temple in Nartiang, Meghalaya.', imageDataUrl: svgDataUrl('Nartiang Durga Temple', 'D', '#e8c5d5', '#c78aa7'), imageUrl: '/api/cultural-image?id=nartiang', imageCredit: 'Wikimedia Commons — Oliver walsher — CC BY-SA 4.0.' },
  { id: 'tripurasundari', titleKey: 'Tripura Sundari Temple', category: 'landmark', color: 'saffron', symbol: 'T', detail: 'A major pilgrimage temple at Udaipur, Tripura.', imageDataUrl: svgDataUrl('Tripura Sundari Temple', 'T', '#f3d39d', '#d49a45'), imageUrl: '/api/cultural-image?id=tripurasundari', imageCredit: 'Wikimedia Commons — GrowLer09 — CC BY 4.0.' },
  { id: 'tawang', titleKey: 'Tawang Monastery', category: 'landmark', color: 'saffron', symbol: 'M', detail: 'A major Buddhist monastery in Tawang, Arunachal Pradesh.', imageDataUrl: svgDataUrl('Tawang Monastery', 'M', '#efd69f', '#c79a48'), imageUrl: '/api/cultural-image?id=tawang', imageCredit: 'Wikimedia Commons — license shown on source file page.' },
  { id: 'madan', titleKey: 'Madan Kamdev Temple', category: 'landmark', color: 'teal', symbol: 'M', detail: 'A historic temple and archaeological site in Assam.', imageDataUrl: svgDataUrl('Madan Kamdev Temple', 'M', '#bfe1d9', '#70aea3'), imageUrl: '/api/cultural-image?id=madan', imageCredit: 'Wikimedia Commons — Arup Malakar — CC BY 2.0.' },
  { id: 'dirgheswari', titleKey: 'Dirgheswari Temple', category: 'landmark', color: 'rose', symbol: 'D', detail: 'A historic Shakti shrine in North Guwahati, Assam.', imageDataUrl: svgDataUrl('Dirgheswari Temple', 'D', '#e5c8d8', '#bd8ba4'), imageUrl: '/api/cultural-image?id=dirgheswari', imageCredit: 'Wikimedia Commons — Lachitbarphukan — CC BY-SA 3.0.' },
  { id: 'loktak', titleKey: 'Loktak Lake', category: 'nature', color: 'sky', symbol: 'L', detail: 'A lake known for its floating phumdis in Manipur.', imageDataUrl: svgDataUrl('Loktak Lake', 'L', '#c7e5f2', '#82b6d1'), imageUrl: '/api/cultural-image?id=loktak', imageCredit: 'Wikimedia Commons — license shown on source file page.' },
  { id: 'kaziranga', titleKey: 'Kaziranga Rhino', category: 'animal', color: 'leaf', symbol: 'R', detail: 'The greater one-horned rhinoceros of Kaziranga, Assam.', imageDataUrl: svgDataUrl('Kaziranga Rhino', 'R', '#cfe4c4', '#8fb47f'), imageUrl: '/api/cultural-image?id=kaziranga', imageCredit: 'Wikimedia Commons — ClekhaRoy — license shown on source file page.' },
  { id: 'mawlynnong', titleKey: 'Mawlynnong', category: 'nature', color: 'teal', symbol: 'M', detail: 'A green village in Meghalaya.', imageDataUrl: svgDataUrl('Mawlynnong', 'M', '#e8cad8', '#c68ca5'), imageUrl: '/api/cultural-image?id=mawlynnong', imageCredit: 'Wikimedia Commons — Explore heaven — CC BY 4.0.' },
  { id: 'hornbill', titleKey: 'Great Hornbill', category: 'animal', color: 'rose', symbol: 'H', detail: 'A distinctive hornbill found in northeastern forests and important in regional cultures.', imageDataUrl: svgDataUrl('Great Hornbill', 'H', '#cfe1c7', '#88ac78'), imageUrl: '/api/cultural-image?id=hornbill', imageCredit: 'Wikimedia Commons — license shown on source file page.' },
  { id: 'bamboo', titleKey: 'Bamboo basket', category: 'object', color: 'saffron', symbol: 'B', detail: 'A handwoven bamboo basket used in Assam.', imageDataUrl: svgDataUrl('Bamboo basket', 'B', '#f0d39c', '#c99b54'), imageUrl: '/api/cultural-image?id=bamboo', imageCredit: 'Wikimedia Commons — license shown on source file page.' },
  { id: 'pitha', titleKey: 'Pitha', category: 'food', color: 'sky', symbol: 'P', detail: 'A traditional Assamese rice-based food enjoyed especially around Bihu.', imageDataUrl: svgDataUrl('Pitha', 'P', '#c7e3ef', '#80b1cc'), imageUrl: '/api/cultural-image?id=pitha', imageCredit: 'Wikimedia Commons — Deepdlight — license shown on source file page.' },
  { id: 'bihu', titleKey: 'Bihu festival', category: 'festival', color: 'leaf', symbol: 'F', detail: 'A major Assamese seasonal festival with music and dance.', imageDataUrl: svgDataUrl('Bihu festival', 'F', '#cfe4c4', '#8db477'), imageUrl: '/api/cultural-image?id=bihu', imageCredit: 'Wikimedia Commons — Diganta Talukdar — CC BY-SA 4.0.' },
];

export const culturalTitle = (item: CulturalItem) => item.titleKey;

export const demoMemoryProfiles = [
  { id: 'maya', name: 'Maya Das', relationship: 'Daughter', voiceNote: 'Maya likes singing by the window.', description: 'A familiar smile and a warm voice.', photoDataUrl: portraitDataUrl('Maya Das', 'MD', '#f2d4c8', '#d79a85') },
  { id: 'raju', name: 'Raju Das', relationship: 'Grandson', voiceNote: 'Ask Raju about his school garden.', description: 'Raju loves plants and small adventures.', photoDataUrl: portraitDataUrl('Raju Das', 'RD', '#c8e0c8', '#82b184') },
  { id: 'pema', name: 'Pema Rai', relationship: 'Neighbour', voiceNote: 'Pema visits on Sunday afternoons.', description: 'A friendly face from nearby.', photoDataUrl: portraitDataUrl('Pema Rai', 'PR', '#c9dff0', '#82acd0') },
];
