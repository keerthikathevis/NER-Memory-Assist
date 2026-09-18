export type MusicCategory = 'favorites' | 'calm' | 'memories' | 'regional' | 'instrumental' | 'nature';

export type MusicTrack = {
  id: string;
  title: string;
  category: Exclude<MusicCategory, 'favorites'>;
  description: string;
  duration: string;
  tone: number;
  region?: string;
  demo: true;
};

export const demoMusicTracks: MusicTrack[] = [
  { id: 'bihu-morning', title: 'Bihu morning rhythm', category: 'regional', description: 'Team-created rhythmic demo inspired by a bright morning.', duration: '1:20', tone: 0, region: 'Assamese folk · Bihu', demo: true },
  { id: 'manipuri-dawn', title: 'Manipur dawn pattern', category: 'regional', description: 'A generated cultural rhythm placeholder.', duration: '1:15', tone: 1, region: 'Manipuri cultural music', demo: true },
  { id: 'khasi-hills', title: 'Khasi hills welcome', category: 'regional', description: 'A generated cultural melody placeholder.', duration: '1:10', tone: 2, region: 'Khasi cultural music', demo: true },
  { id: 'mizo-evening', title: 'Mizo evening air', category: 'regional', description: 'A generated cultural melody placeholder.', duration: '1:05', tone: 3, region: 'Mizo cultural music', demo: true },
  { id: 'bengal-river', title: 'Bengal river songscape', category: 'regional', description: 'A generated regional sound placeholder.', duration: '1:20', tone: 4, region: 'Bengali regional music', demo: true },
  { id: 'bamboo-dawn', title: 'Bamboo flute at dawn', category: 'instrumental', description: 'A soft generated flute-like tone sequence.', duration: '1:05', tone: 5, region: 'Traditional instruments', demo: true },
  { id: 'hills-rain', title: 'Monsoon on the hills', category: 'nature', description: 'A gentle rain-inspired soundscape demo.', duration: '1:30', tone: 6, region: 'Nature sounds', demo: true },
  { id: 'quiet-lake', title: 'Quiet lake', category: 'calm', description: 'A gentle, low-complexity relaxation soundscape for comfortable listening. It is not a medical treatment or certified calming therapy.', duration: '1:15', tone: 7, region: 'Relaxation soundscape', demo: true },
  { id: 'soft-rain', title: 'Soft rain for quiet time', category: 'calm', description: 'A gentle rain-inspired relaxation soundscape for comfortable listening. It is not a medical treatment or certified calming therapy.', duration: '1:30', tone: 9, region: 'Relaxation soundscape', demo: true },
  { id: 'evening-breeze', title: 'Evening breeze', category: 'calm', description: 'A slow, simple soundscape intended for quiet listening and emotional engagement. It is not a medical treatment or certified calming therapy.', duration: '1:20', tone: 10, region: 'Relaxation soundscape', demo: true },
  { id: 'gentle-flute', title: 'Gentle flute moment', category: 'calm', description: 'A soft generated instrumental-style sequence for comfortable listening. It is not a medical treatment or certified calming therapy.', duration: '1:10', tone: 11, region: 'Relaxation soundscape', demo: true },
  { id: 'family-window', title: 'By the family window', category: 'memories', description: 'A warm memory cue created for this prototype.', duration: '1:10', tone: 8, demo: true },
];