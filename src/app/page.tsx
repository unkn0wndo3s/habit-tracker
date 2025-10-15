"use client";

import { useMemo, useState } from "react";
import { Habit } from "@/types/habit";
import { useHabits } from "@/hooks/useHabits";
import HabitForm from "@/components/HabitForm";
import HabitList from "@/components/HabitList";
import DateHeader from "@/components/DateHeader";

export default function Home() {
  const {
    dateKey,
    setDate,
    habitsForToday,
    checkedIds,
    createHabit,
    editHabit,
    removeHabit,
    toggleHabitCheck,
  } = useHabits();

  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Habit | null>(null);

  const onPrev = () => {
    const d = new Date(dateKey);
    d.setDate(d.getDate() - 1);
    setDate(d);
  };
  const onNext = () => {
    const d = new Date(dateKey);
    d.setDate(d.getDate() + 1);
    setDate(d);
  };
  const onToday = () => setDate(new Date());

  const startEditing = (h: Habit) => {
    setEditTarget(h);
    setShowForm(true);
  };

  const onSubmit = (data: { name: string; description?: string; schedule: number[] }) => {
    if (editTarget) {
      editHabit({ ...editTarget, ...data });
      setEditTarget(null);
    } else {
      createHabit(data);
    }
    setShowForm(false);
  };

  return (
    <div className="app-shell">
      <div className="content">
        <DateHeader dateKey={dateKey} onPrev={onPrev} onNext={onNext} onToday={onToday} />

        {!showForm ? (
          <>
            <HabitList
              habits={habitsForToday}
              checkedIds={checkedIds}
              onToggle={toggleHabitCheck}
              onEdit={startEditing}
              onDelete={removeHabit}
            />
          </>
        ) : (
          <HabitForm
            initial={editTarget ? { name: editTarget.name, description: editTarget.description, schedule: editTarget.schedule } : undefined}
            onSubmit={onSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditTarget(null);
            }}
          />
        )}
      </div>

      <div className="bottom-bar">
        {!showForm && (
          <button style={{ width: "100%", height: 44 }} onClick={() => setShowForm(true)}>
            Ajouter une habitude
          </button>
        )}
      </div>
    </div>
  );
}
