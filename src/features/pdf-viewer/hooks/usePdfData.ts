import { useEffect, useMemo, useState } from 'react';
import type { AnswerData, PdfEntry, Question } from '../types';

const ANSWER_FILE_MAP: Record<string, string> = {
  'ipa-2025r07-ip': '/data/pdf-viewer/ipa_answers7.json',
  'fe-2023r05-a-short': '/data/pdf-viewer/it_answers5a.json',
  'fe-2023r05-b-short': '/data/pdf-viewer/it_answers5b.json',
};

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(path, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function usePdfData(pdfId: string | null) {
  const [pdfList, setPdfList] = useState<PdfEntry[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<AnswerData | null>(null);
  const [isListLoading, setIsListLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPdfList() {
      setIsListLoading(true);
      setError(null);
      try {
        const data = await fetchJson<PdfEntry[]>('/data/pdf-viewer/pdf_list.json');
        if (!cancelled) {
          setPdfList(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        if (!cancelled) {
          const message = e instanceof Error ? e.message : 'Failed to load PDF list';
          setError(message);
          setPdfList([]);
        }
      } finally {
        if (!cancelled) {
          setIsListLoading(false);
        }
      }
    }

    loadPdfList();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!pdfId) {
      setQuestions([]);
      setAnswers(null);
      return;
    }

    async function loadData() {
      setIsDataLoading(true);
      setError(null);

      try {
        let nextQuestions: Question[] = [];
        if (pdfId.startsWith('ipa-')) {
          const allIpaQuestions = await fetchJson<Question[]>('/data/pdf-viewer/ipa_questions.json');
          nextQuestions = (Array.isArray(allIpaQuestions) ? allIpaQuestions : []).filter(
            (question) => question.source.pdfId === pdfId
          );
        }

        const answerPath = ANSWER_FILE_MAP[pdfId];
        let nextAnswers: AnswerData | null = null;
        if (answerPath) {
          nextAnswers = await fetchJson<AnswerData>(answerPath);
        }

        if (!cancelled) {
          setQuestions(nextQuestions);
          setAnswers(nextAnswers);
        }
      } catch (e) {
        if (!cancelled) {
          const message = e instanceof Error ? e.message : 'Failed to load question/answer data';
          setError(message);
          setQuestions([]);
          setAnswers(null);
        }
      } finally {
        if (!cancelled) {
          setIsDataLoading(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [pdfId]);

  const currentPdf = useMemo(() => pdfList.find((pdf) => pdf.id === pdfId) ?? null, [pdfList, pdfId]);

  return {
    pdfList,
    currentPdf,
    questions,
    answers,
    isListLoading,
    isDataLoading,
    error,
  };
}
