"use client";

import { Habit } from "@/types/habit";

export interface HabitListProps {
  habits: Habit[];
  checkedIds: string[];
  onToggle: (habitId: string) => void;
  onEdit: (habit: Habit) => void;
  onDelete: (habitId: string) => void;
}

export function HabitList({ habits, checkedIds, onToggle, onEdit, onDelete }: HabitListProps) {
  if (habits.length === 0) {
    return <div className="empty">Aucune habitude — ajoutez-en une.</div>;
  }

  return (
    <ul className="habit-list">
      {habits.map((h) => {
        const isChecked = checkedIds.includes(h.id);
        return (
          <li key={h.id} className="habit-item">
            <button
              className="check"
              aria-pressed={isChecked}
              onClick={() => onToggle(h.id)}
              aria-label={isChecked ? "Marqué" : "Non marqué"}
            />
            <div className="habit-meta">
              <div className="habit-name">{h.name}</div>
              {h.description ? <div className="habit-desc">{h.description}</div> : null}
            </div>
            <div className="habit-actions">
              <button onClick={() => onEdit(h)}>Modifier</button>
              <button onClick={() => onDelete(h.id)}>Supprimer</button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default HabitList;


