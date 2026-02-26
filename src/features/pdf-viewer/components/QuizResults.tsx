import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import type { GradingResult, Quiz } from '../types';

interface QuizResultsProps {
  quiz: Quiz;
  results: GradingResult[];
  onReset: () => void;
}

export function QuizResults({ quiz, results, onReset }: QuizResultsProps) {
  const totalQuestions = quiz.questions.length;
  const correctCount = results.filter((result) => result.correct).length;
  const earnedPoints = results.reduce((sum, result) => sum + result.points, 0);
  const totalPoints = quiz.questions.reduce((sum, question) => sum + question.points, 0);

  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle className="text-base">採点結果</CardTitle>
        <CardDescription>
          正解数 {correctCount}/{totalQuestions} ・ 獲得点 {earnedPoints}/{totalPoints}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          {quiz.questions.map((question, index) => {
            const result = results.find((row) => row.questionId === question.id);
            if (!result) {
              return null;
            }

            return (
              <div key={question.id} className="rounded-md border p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">
                    {result.correct ? '✅' : '❌'} Q{index + 1}
                  </p>
                  <p className="text-muted-foreground">
                    {result.points}/{question.points} 点
                  </p>
                </div>
                <p className="mt-1 text-muted-foreground">あなたの解答: {result.studentAnswer || '(未回答)'}</p>
                {!result.correct && <p className="mt-1">正解: {result.correctAnswer}</p>}
              </div>
            );
          })}
        </div>
        <Button type="button" variant="outline" onClick={onReset}>
          もう一度やり直す
        </Button>
      </CardContent>
    </Card>
  );
}
