import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  Difficulty,
  GameState,
  GameStats,
  Mode,
  Problem,
  ProgrammingDifficulty,
  ProgrammingLanguage,
} from '../types';
import { expandAnswers } from '../romaji';

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
  const [deadline, setDeadline] = useState<number | null>(null);
  // 誤入力のたびに増やす。画面側はこの値の変化を見て一瞬だけ知らせる。
  const [errorSignal, setErrorSignal] = useState(0);

  // 時間切れの処理から最新の入力を読むためだけの参照。
  // これを effect の依存に入れると打鍵のたびにタイマーが張り直されてしまう。
  const userInputRef = useRef(userInput);
  userInputRef.current = userInput;

  const currentProblem = problems[currentIndex] ?? null;

  const accuracy = useMemo(() => {
    const total = stats.correctChars + stats.wrongChars;
    if (total === 0) return 0;
    return (stats.correctChars / total) * 100;
  }, [stats.correctChars, stats.wrongChars]);

  const elapsedSeconds = Math.max(0, timeLimit - timeLeft);

  // 1分あたりの打鍵数。制限時間を選ばせている以上、速さの指標が要る。
  const charsPerMinute = useMemo(() => {
    if (elapsedSeconds <= 0) return 0;
    return (stats.correctChars / elapsedSeconds) * 60;
  }, [elapsedSeconds, stats.correctChars]);

  // 締め切り時刻から残りを計算する。1秒ごとに setInterval を張り直す作りだと
  // タブが非アクティブなときにずれるため。
  useEffect(() => {
    if (gameState !== 'playing' || deadline === null) return;

    const tick = () => {
      const remain = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setTimeLeft(remain);
      if (remain > 0) return;
      // 打ちかけの文字も正解に数える。完答したときだけ加算する作りだと、
      // 時間切れの瞬間に打っていた文字がまるごと消えて正解率が実力より低く出る。
      setStats((prev) => ({
        ...prev,
        correctChars: prev.correctChars + userInputRef.current.length,
      }));
      setGameState('result');
    };

    tick();
    const timer = window.setInterval(tick, 200);
    return () => {
      window.clearInterval(timer);
    };
  }, [deadline, gameState]);

  const goToNextProblem = useCallback(() => {
    const next = currentIndex + 1;
    setUserInput('');
    if (next >= problems.length) {
      setGameState('result');
      return;
    }
    setCurrentIndex(next);
  }, [currentIndex, problems.length]);

  const handleKeyInput = useCallback(
    (key: string) => {
      if (gameState !== 'playing') return;
      if (!currentProblem) return;
      if (key.length !== 1) return;

      const char = mode === 'programming' ? key : key.toLowerCase();
      const newInput = `${userInput}${char}`;
      const validAnswers = currentProblem.answers.filter((answer) => answer.startsWith(newInput));

      if (validAnswers.length > 0) {
        setUserInput(newInput);

        // 完全一致していても、より長い候補が残っているうちは確定しない。
        // arigato / arigatou のように短い表記が長い表記の前方一致になっていると、
        // 即座に確定してしまい「arigatou」と正しく打った生徒の最後の u が
        // 次の問題への誤入力になっていた。
        const isExact = validAnswers.some((answer) => answer === newInput);
        const hasLonger = validAnswers.some((answer) => answer.length > newInput.length);
        if (isExact && !hasLonger) {
          setStats((prev) => ({
            correctChars: prev.correctChars + newInput.length,
            wrongChars: prev.wrongChars,
            completedProblems: prev.completedProblems + 1,
          }));
          goToNextProblem();
        }
        return;
      }

      // 候補が尽きた。ここまでの入力がすでに正解と完全一致しているなら、
      // 短い表記で打ち終えていた状態なので、確定して
      // 今回のキーは次の問題の1文字目として引き継ぐ(打ち直させない)。
      const wasComplete = userInput.length > 0 && currentProblem.answers.includes(userInput);
      if (!wasComplete) {
        setStats((prev) => ({
          ...prev,
          wrongChars: prev.wrongChars + 1,
        }));
        setErrorSignal((prev) => prev + 1);
        return;
      }

      const nextProblem = problems[currentIndex + 1];
      if (!nextProblem) {
        setStats((prev) => ({
          correctChars: prev.correctChars + userInput.length,
          wrongChars: prev.wrongChars,
          completedProblems: prev.completedProblems + 1,
        }));
        setUserInput('');
        setGameState('result');
        return;
      }

      // 引き継いだ1文字が次の問題の頭として成立しなければ捨てる。誤入力には数えない。
      // 生徒は正しい表記を打ち終えており、余りが出たのは複数表記を許している
      // こちらの都合なので、そのぶんを正解率に響かせない。
      // 答えは最短でも2文字なので、この1文字で次の問題が完了することはない。
      const carriedFits = nextProblem.answers.some((answer) => answer.startsWith(char));
      setStats((prev) => ({
        correctChars: prev.correctChars + userInput.length,
        wrongChars: prev.wrongChars,
        completedProblems: prev.completedProblems + 1,
      }));
      setCurrentIndex(currentIndex + 1);
      setUserInput(carriedFits ? char : '');
    },
    [currentIndex, currentProblem, gameState, goToNextProblem, mode, problems, userInput]
  );

  // 打ち間違えた文字は入力に反映されないので詰まりはしないが、
  // 「打ち直せない」のは通常のタイピング操作と違って戸惑うため Backspace を効かせる。
  const deleteLastChar = useCallback(() => {
    if (gameState !== 'playing') return;
    setUserInput((prev) => prev.slice(0, -1));
  }, [gameState]);

  // クリアできない問題や苦手な問題で時間切れまで拘束されないようにする。
  // 飛ばした問題は完了数にも文字数にも入れない。
  const skipProblem = useCallback(() => {
    if (gameState !== 'playing') return;
    goToNextProblem();
  }, [gameState, goToNextProblem]);

  const startGame = useCallback(() => {
    const selectedDifficulty = mode === 'programming' ? programmingDifficulty : difficulty;
    const loadedProblems = getProblems(mode, selectedDifficulty);
    const filteredProblems =
      mode === 'programming'
        ? filterProgrammingProblemsByLanguage(loadedProblems, programmingLanguage)
        : loadedProblems;
    // 日本語モードだけ、「ん」を n / nn どちらでも打てるように答えを広げる。
    // プログラミングモードのコードに同じ処理を掛けると print が prinnt になるので通さない。
    const selectedProblems = shuffleProblems(filteredProblems)
      .slice(0, MAX_PROBLEMS)
      .map((problem) =>
        mode === 'programming' ? problem : { ...problem, answers: expandAnswers(problem.answers) }
      );
    if (selectedProblems.length === 0) {
      setProblems([]);
      setCurrentIndex(0);
      setUserInput('');
      setStats(createInitialStats());
      setTimeLeft(timeLimit);
      setDeadline(null);
      setGameState('result');
      return;
    }

    setProblems(selectedProblems);
    setCurrentIndex(0);
    setUserInput('');
    setStats(createInitialStats());
    setErrorSignal(0);
    setTimeLeft(timeLimit);
    setDeadline(Date.now() + timeLimit * 1000);
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
    setDeadline(null);
    setStats(createInitialStats());
    setErrorSignal(0);
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
    elapsedSeconds,
    currentProblem,
    problemNumber: currentIndex + 1,
    problemCount: problems.length,
    userInput,
    stats,
    accuracy,
    charsPerMinute,
    errorSignal,
    startGame,
    handleKeyInput,
    deleteLastChar,
    skipProblem,
    backToHome,
  };
}
