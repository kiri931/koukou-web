import { useState, useEffect } from 'react';
import type { Task } from '../types';
import { DEFAULT_COLORS } from '../types';

const STORAGE_KEY = 'time-schedule-tasks';
const TOTAL_TIME_KEY = 'time-schedule-total';

function generateId(): string {
  return Math.random().toString(36).slice(2, 9);
}

export function useTaskManager() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [totalTime, setTotalTimeState] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(TOTAL_TIME_KEY);
      return stored ? Number(stored) : 60;
    } catch {
      return 60;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      // ignore
    }
  }, [tasks]);

  useEffect(() => {
    try {
      localStorage.setItem(TOTAL_TIME_KEY, String(totalTime));
    } catch {
      // ignore
    }
  }, [totalTime]);

  function addTask() {
    const colorIndex = tasks.length % DEFAULT_COLORS.length;
    const newTask: Task = {
      id: generateId(),
      name: `タスク ${tasks.length + 1}`,
      duration: 10,
      color: DEFAULT_COLORS[colorIndex],
    };
    setTasks((prev) => [...prev, newTask]);
  }

  function deleteTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  function updateTask(id: string, partial: Partial<Omit<Task, 'id'>>) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...partial } : t))
    );
  }

  function setTotalTime(n: number) {
    setTotalTimeState(Math.max(1, n));
  }

  return { tasks, totalTime, addTask, deleteTask, updateTask, setTotalTime };
}
