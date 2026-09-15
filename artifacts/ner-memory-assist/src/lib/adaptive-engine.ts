export type Difficulty = 'easy' | 'medium' | 'hard';

export type GameResult = {
  id: string;
  gameType: 'personalized-jigsaw' | 'family-match' | 'cultural-jigsaw' | 'cultural-match';
  accuracy: number;
  completionTime: number;
  attempts: number;
  hintsUsed: number;
  difficulty: Difficulty;
  score: number;
  createdAt: number;
};

export type Adaptation = {
  nextDifficulty: Difficulty;
  reason: 'increase' | 'reduce' | 'stay';
};

const order: Difficulty[] = ['easy', 'medium', 'hard'];

export function adaptDifficulty(result: GameResult, recent: GameResult[] = []): Adaptation {
  const recentForGame = recent
    .filter((item) => item.gameType === result.gameType)
    .slice(-3);
  const strong = result.accuracy >= 0.85 && result.hintsUsed <= 1 && result.attempts <= 10 && result.completionTime <= 180;
  const repeatedDifficulty =
    recentForGame.length >= 2 &&
    recentForGame.every((item) => item.accuracy < 0.6 || item.hintsUsed >= 3 || item.attempts > 15);

  if (strong && result.difficulty !== 'hard') {
    return { nextDifficulty: order[order.indexOf(result.difficulty) + 1], reason: 'increase' };
  }
  if (repeatedDifficulty && result.difficulty !== 'easy') {
    return { nextDifficulty: order[order.indexOf(result.difficulty) - 1], reason: 'reduce' };
  }
  return { nextDifficulty: result.difficulty, reason: 'stay' };
}

export function scoreGame(accuracy: number, difficulty: Difficulty, attempts: number, hintsUsed: number): number {
  const difficultyBonus = difficulty === 'hard' ? 30 : difficulty === 'medium' ? 15 : 0;
  return Math.max(0, Math.round(accuracy * 70 + difficultyBonus - Math.max(0, attempts - 4) * 2 - hintsUsed * 4));
}
