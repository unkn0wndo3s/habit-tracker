"use client";

import { Habit, HabitId, HabitState, todayKey } from "@/types/habit";

const STORAGE_KEY = "habit-tracker-state-v1";

const defaultState: HabitState = {
  habits: [],
  checksByDate: {},
};

export function loadState(): HabitState {
  if (typeof window === "undefined") return structuredClone(defaultState);
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return structuredClone(defaultState);
  try {
    const parsed = JSON.parse(raw) as HabitState;
    if (!parsed || !Array.isArray(parsed.habits) || typeof parsed.checksByDate !== "object") {
      return structuredClone(defaultState);
    }
    return parsed;
  } catch {
    return structuredClone(defaultState);
  }
}

export function saveState(state: HabitState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function addHabit(state: HabitState, habit: Habit): HabitState {
  const next: HabitState = { ...state, habits: [...state.habits, habit] };
  saveState(next);
  return next;
}

export function updateHabit(state: HabitState, habit: Habit): HabitState {
  const next: HabitState = {
    ...state,
    habits: state.habits.map((h) => (h.id === habit.id ? habit : h)),
  };
  saveState(next);
  return next;
}

export function deleteHabit(state: HabitState, habitId: HabitId): HabitState {
  const next: HabitState = {
    ...state,
    habits: state.habits.filter((h) => h.id !== habitId),
    checksByDate: Object.fromEntries(
      Object.entries(state.checksByDate).map(([date, ids]) => [
        date,
        ids.filter((id) => id !== habitId),
      ])
    ),
  };
  saveState(next);
  return next;
}

export function toggleCheck(
  state: HabitState,
  habitId: HabitId,
  dateKey: string = todayKey()
): HabitState {
  const ids = state.checksByDate[dateKey] ?? [];
  const exists = ids.includes(habitId);
  const nextIds = exists ? ids.filter((id) => id !== habitId) : [...ids, habitId];
  const next: HabitState = {
    ...state,
    checksByDate: { ...state.checksByDate, [dateKey]: nextIds },
  };
  saveState(next);
  return next;
}


