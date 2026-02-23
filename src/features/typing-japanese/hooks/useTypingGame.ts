import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  Difficulty,
  GameState,
  GameStats,
  Mode,
  Problem,
  ProgrammingDifficulty,
  ProgrammingLanguage,
} from '../types';

const MAX_PROBLEMS = 50;
const DEFAULT_TIME_LIMIT = 60;

const problemModules = import.meta.glob('../problems/*.json', { eager: true }) as Record<
  string,
  { default: Problem[] }
>;

function shuffleProblems(items: Problem[]): Problem[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function getProblemFileName(mode: Mode, diff: Difficulty | ProgrammingDifficulty): string {
  if (mode === 'programming') return `programming-${diff}.json`;
  return `${diff}.json`;
}

function getProblems(mode: Mode, diff: Difficulty | ProgrammingDifficulty): Problem[] {
  const fileName = getProblemFileName(mode, diff);
  const module = problemModules[`../problems/${fileName}`];
  if (!module?.default) return [];
  return module.default;
}

function createInitialStats(): GameStats {
  return {
    correctChars: 0,
    wrongChars: 0,
    completedProblems: 0,
  };
}

function filterProgrammingProblemsByLanguage(
  items: Problem[],
  language: ProgrammingLanguage
): Problem[] {
  if (language === 'all') return items;
  return items.filter((problem) => problem.language === language || problem.language === 'common');
}

export function useTypingGame() {
  const [gameState, setGameState] = useState<GameState>('home');
  const [mode, setMode] = useState<Mode>('japanese');
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [programmingDifficulty, setProgrammingDifficulty] = useState<ProgrammingDifficulty>('beginner');
  const [programmingLanguage, setProgrammingLanguage] = useState<ProgrammingLanguage>('all');
  const [timeLimit, setTimeLimit] = useState(DEFAULT_TIME_LIMIT);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_TIME_LIMIT);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [stats, setStats] = useState<GameStats>(createInitialStats);

  const currentProblem = problems[currentIndex] ?? null;

  const accuracy = useMemo(() => {
    const total = stats.correctChars + stats.wrongChars;
    if (total === 0) return 0;
    return (stats.correctChars / total) * 100;
  }, [stats.correctChars, stats.wrongChars]);

  const finishGame = useCallback(() => {
    setGameState('result');
  }, []);

  useEffect(() => {
    if (gameState !== 'playing') return;
    if (timeLeft <= 0) {
      finishGame();
      return;
    }

    const timer = window.setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [finishGame, gameState, timeLeft]);

  const goToNextProblem = useCallback(() => {
    setUserInput('');
    setCurrentIndex((prev) => {
      const next = prev + 1;
      if (next >= problems.length) {
        setGameState('result');
        return prev;
      }
      return next;
    });
  }, [problems.length]);

  const handleKeyInput = useCallback(
    (key: string) => {
      if (gameState !== 'playing') return;
      if (!currentProblem) return;
      if (key.length !== 1) return;

      const newInput = `${userInput}${mode === 'programming' ? key : key.toLowerCase()}`;
      const validAnswers = currentProblem.answers.filter((answer) => answer.startsWith(newInput));

      if (validAnswers.length === 0) {
        setStats((prev) => ({
          ...prev,
          wrongChars: prev.wrongChars + 1,
        }));
        return;
      }

      setUserInput(newInput);

      if (validAnswers.some((answer) => answer === newInput)) {
        setStats((prev) => ({
          correctChars: prev.correctChars + newInput.length,
          wrongChars: prev.wrongChars,
          completedProblems: prev.completedProblems + 1,
        }));
        goToNextProblem();
      }
    },
    [currentProblem, gameState, goToNextProblem, mode, userInput]
  );

  const startGame = useCallback(() => {
    const selectedDifficulty = mode === 'programming' ? programmingDifficulty : difficulty;
    const loadedProblems = getProblems(mode, selectedDifficulty);
    const filteredProblems =
      mode === 'programming'
        ? filterProgrammingProblemsByLanguage(loadedProblems, programmingLanguage)
        : loadedProblems;
    const selectedProblems = shuffleProblems(filteredProblems).slice(0, MAX_PROBLEMS);
    if (selectedProblems.length === 0) {
      setProblems([]);
      setCurrentIndex(0);
      setUserInput('');
      setStats(createInitialStats());
      setTimeLeft(timeLimit);
      setGameState('result');
      return;
    }

    setProblems(selectedProblems);
    setCurrentIndex(0);
    setUserInput('');
    setStats(createInitialStats());
    setTimeLeft(timeLimit);
    setGameState('playing');
  }, [difficulty, mode, programmingDifficulty, programmingLanguage, timeLimit]);

  const handleSetMode = useCallback((newMode: Mode) => {
    setMode(newMode);
    if (newMode === 'programming') {
      setProgrammingDifficulty('beginner');
      setProgrammingLanguage('all');
      return;
    }
    setDifficulty('normal');
  }, []);

  const backToHome = useCallback(() => {
    setGameState('home');
    setProblems([]);
    setCurrentIndex(0);
    setUserInput('');
    setTimeLeft(timeLimit);
    setStats(createInitialStats());
  }, [timeLimit]);

  return {
    gameState,
    mode,
    handleSetMode,
    difficulty,
    setDifficulty,
    programmingDifficulty,
    setProgrammingDifficulty,
    programmingLanguage,
    setProgrammingLanguage,
    timeLimit,
    setTimeLimit,
    timeLeft,
    currentProblem,
    userInput,
    stats,
    accuracy,
    startGame,
    handleKeyInput,
    backToHome,
  };
}
