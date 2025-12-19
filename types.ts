
export enum View {
  LEARN = 'LEARN',
  PLAY = 'PLAY',
  TEST = 'TEST',
  PARENT = 'PARENT',
  HOME = 'HOME',
  REVIEW = 'REVIEW'
}

export interface Word {
  id: string;
  en: string;
  cn: string;
  category: string;
  imageUrl?: string;
  audioData?: string;
}

export interface ReviewEntry {
  wordId: string;
  lastReviewTime: number; // Timestamp
  stage: number; // 0 to 6 based on Ebbinghaus stages
}

export interface UserStats {
  stars: number;
  wordsMastered: number;
  studyMinutes: number;
  streak: number;
  lastActive: string;
  wordsLearnedToday: number;
  dailyGoal: number;
}

export interface AppState {
  view: View;
  stats: UserStats;
  currentCategory: string;
  wrongWords: string[];
  reviewData: Record<string, ReviewEntry>;
}

export interface WordPack {
  name: string;
  icon: string; // Fallback emoji
  character: string; // Disney character name
  characterPrompt: string; // Specific prompt to match the user's reference image style
  color: string;
  words: Word[];
}
