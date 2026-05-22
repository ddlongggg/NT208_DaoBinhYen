export const AUDIO_BASE_URL = '/Lighthouse/RadioSound';

export type GenreId = 'piano' | 'jazz' | 'lofi' | 'brainwaves' | 'secrets';

export interface GenreDef {
  id: GenreId;
  name: string;
  description: string;
  colorTheme: string; // The color to tint the room with
}

export const GENRES: GenreDef[] = [
  {
    id: 'piano',
    name: 'Piano Classical',
    description: 'Giai điệu nhẹ nhàng giúp tăng cường tập trung và thả lỏng tâm trí.',
    colorTheme: '#2563eb' // Blue-ish
  },
  {
    id: 'jazz',
    name: 'Cozy Jazz',
    description: 'Nhịp điệu êm ái, mang lại cảm giác ấm cúng như trong quán cafe.',
    colorTheme: '#d97706' // Amber-ish
  },
  {
    id: 'lofi',
    name: 'Lo-Fi Chill',
    description: 'Những beat lofi chậm rãi giúp duy trì sự tập trung dài hạn.',
    colorTheme: '#4f46e5' // Indigo
  },
  {
    id: 'brainwaves',
    name: 'Sóng Não (Brainwaves)',
    description: 'Tần số chuyên sâu giúp não bộ đi vào trạng thái tĩnh tâm hoặc tập trung cao độ.',
    colorTheme: '#059669' // Emerald
  },
  {
    id: 'secrets',
    name: 'Secrets',
    description: 'Những bản nhạc ẩn giấu mang lại niềm vui bất ngờ. Chỉ để giải trí, không khuyên dùng cho việc học tập sâu.',
    colorTheme: '#e11d48' // Rose
  }
];

export interface TrackDef {
  id: string;
  title: string;
  url: string;
  genre: GenreId;
}

export const TRACKS: TrackDef[] = [
  // PIANO
  { id: 'piano_1', title: 'Classical Piano 01', url: 'piano_classical01.mp3', genre: 'piano' },
  { id: 'piano_2', title: 'Classical Piano 02', url: 'piano_classical02.mp3', genre: 'piano' },
  { id: 'piano_3', title: 'Classical Piano 03', url: 'piano_classical03.mp3', genre: 'piano' },
  { id: 'piano_4', title: 'Classical Piano 04', url: 'piano_classical04.mp3', genre: 'piano' },
  { id: 'piano_5', title: 'Classical Piano 05', url: 'piano_classical05.mp3', genre: 'piano' },
  { id: 'piano_6', title: 'Classical Piano 06', url: 'piano_classical06.mp3', genre: 'piano' },
  // JAZZ
  { id: 'jazz_1', title: 'Jazz Song 01', url: 'jazzsong01.mp3', genre: 'jazz' },
  { id: 'jazz_2', title: 'Jazz Song 02', url: 'jazzsong02.mp3', genre: 'jazz' },
  { id: 'jazz_3', title: 'Jazz Song 03', url: 'jazzsong03.mp3', genre: 'jazz' },
  { id: 'jazz_4', title: 'Jazz Song 04', url: 'jazzsong04.mp3', genre: 'jazz' },
  { id: 'jazz_5', title: 'Jazz Song 05', url: 'jazzsong05.mp3', genre: 'jazz' },
  // LOFI
  { id: 'lofi_1', title: 'Lofi Song 01', url: 'lofisong_01.mp3', genre: 'lofi' },
  { id: 'lofi_2', title: 'Lofi Song 02', url: 'lofisong_02.mp3', genre: 'lofi' },
  { id: 'lofi_3', title: 'Lofi Song 03', url: 'lofisong_03.mp3', genre: 'lofi' },
  { id: 'lofi_4', title: 'Lofi Song 04', url: 'lofisong_04.mp3', genre: 'lofi' },
  { id: 'lofi_5', title: 'Lofi Song 05', url: 'lofisong_05.mp3', genre: 'lofi' },
  { id: 'lofi_6', title: 'Lofi Song 06', url: 'lofisong_06.mp3', genre: 'lofi' },
  // BRAINWAVES
  { id: 'brain_1', title: 'Alpha Waves 8Hz', url: 'AlphaWaves8hz.mp3', genre: 'brainwaves' },
  { id: 'brain_2', title: 'Beta Waves 16Hz', url: 'BetWaves16hz.mp3', genre: 'brainwaves' },
  { id: 'brain_3', title: 'Theta Waves 4-7Hz', url: 'ThetaWaves4-7hz.mp3', genre: 'brainwaves' },
  // SECRETS
  { id: 'sec_1', title: 'Secret Track 01', url: 'secrets01.mp3', genre: 'secrets' },
  { id: 'sec_2', title: 'Secret Track 02', url: 'secrets02.mp3', genre: 'secrets' },
  { id: 'sec_3', title: 'Secret Track 03', url: 'secrets03.mp3', genre: 'secrets' },
  { id: 'sec_4', title: 'Secret Track 04', url: 'secrets04.mp3', genre: 'secrets' },
  { id: 'sec_5', title: 'Secret Track 05', url: 'secrets05.mp3', genre: 'secrets' },
];

export interface AmbientDef {
  id: string;
  name: string;
  icon: string;
  url: string;
}

export const AMBIENT_TRACKS: AmbientDef[] = [
  { id: 'rain', name: 'Tiếng mưa', icon: '🌧️', url: 'Rain.mp3' },
  { id: 'cafe', name: 'Quán Cafe', icon: '☕', url: 'Cafe_Ambience.mp3' },
  { id: 'fireplace', name: 'Lửa trại', icon: '🔥', url: 'ambient_fireplace_crackling.mp3' },
  { id: 'ocean', name: 'Sóng biển', icon: '🌊', url: 'ambient_ocean_waves.mp3' },
  { id: 'stream', name: 'Suối chảy', icon: '💧', url: 'ambient_water_stream..mp3' },
  { id: 'wind', name: 'Tiếng gió', icon: '🍃', url: 'wind.mp3' },
  { id: 'birds', name: 'Chim hót', icon: '🐦', url: 'bird.mp3' },
  { id: 'thunderstorm', name: 'Mưa & Sấm', icon: '⛈️', url: 'rain_and_thunder.mp3' },
  { id: 'whales', name: 'Cá voi', icon: '🐋', url: 'whalesound.mp3' },
];
