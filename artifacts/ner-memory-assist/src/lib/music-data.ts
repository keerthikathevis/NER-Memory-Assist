export type MusicCategory = 'favorites' | 'calm' | 'memories' | 'regional' | 'instrumental' | 'nature';

export type MusicTrack = {
  id: string;
  title: string;
  category: Exclude<MusicCategory, 'favorites'>;
  description: string;
  duration: string;
  tone: number;
  demo: true;
};

export const demoMusicTracks: MusicTrack[] = [
  { id: 'bihu-morning', title: 'Bihu morning rhythm', category: 'regional', description: 'Team-created rhythmic demo inspired by a bright morning.', duration: '1:20', tone: 0 },
  { id: 'bamboo-dawn', title: 'Bamboo flute at dawn', category: 'instrumental', description: 'A soft generated flute-like tone sequence.', duration: '1:05', tone: 1 },
  { id: 'hills-rain', title: 'Monsoon on the hills', category: 'nature', description: 'A gentle rain-inspired soundscape demo.', duration: '1:30', tone: 2 },
  { id: 'quiet-lake', title: 'Quiet lake', category: 'calm', description: 'A slow, quiet listening moment.', duration: '1:15', tone: 3 },
  { id: 'family-window', title: 'By the family window', category: 'memories', description: 'A warm memory cue created for this prototype.', duration: '1:10', tone: 4 },
];