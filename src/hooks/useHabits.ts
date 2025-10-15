"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Habit, HabitId, HabitState, Weekday, getWeekday, todayKey } from "@/types/habit";
import { addHabit, deleteHabit, loadState, saveState, toggleCheck, updateHabit } from "@/lib/storage";

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function useHabits() {
  const [state, setState] = useState<HabitState>({ habits: [], checksByDate: {} });
  const [dateKey, setDateKey] = useState<string>(todayKey());

  useEffect(() => {
    setState(loadState());
  }, []);

  const setDate = useCallback((d: Date) => setDateKey(d.toISOString().slice(0, 10)), []);

  const habitsForToday = useMemo(() => {
    const weekday = getWeekday(new Date(dateKey));
    return state.habits.filter((h) => h.schedule.length === 0 || h.schedule.includes(weekday));
  }, [state.habits, dateKey]);

  const checkedIds = state.checksByDate[dateKey] ?? [];

  const createHabit = useCallback(
    (attrs: { name: string; description?: string; schedule?: Weekday[] }) => {
      const newHabit: Habit = {
        id: generateId(),
        name: attrs.name,
        description: attrs.description,
        schedule: attrs.schedule ?? [],
        createdAt: new Date().toISOString(),
      };
      setState((s) => addHabit(s, newHabit));
    },
    []
  );

  const editHabit = useCallback((habit: Habit) => {
    setState((s) => updateHabit(s, habit));
  }, []);

  const removeHabit = useCallback((habitId: HabitId) => {
    setState((s) => deleteHabit(s, habitId));
  }, []);

  const toggleHabitCheck = useCallback((habitId: HabitId) => {
    setState((s) => toggleCheck(s, habitId, dateKey));
  }, [dateKey]);

  const resetAll = useCallback(() => {
    const empty: HabitState = { habits: [], checksByDate: {} };
    saveState(empty);
    setState(empty);
  }, []);

  return {
    state,
    dateKey,
    setDate,
    habitsForToday,
    checkedIds,
    createHabit,
    editHabit,
    removeHabit,
    toggleHabitCheck,
    resetAll,
  } as const;
}


