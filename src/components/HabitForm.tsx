"use client";

import { useState } from "react";
import { Weekday } from "@/types/habit";

export interface HabitFormProps {
  onSubmit: (data: { name: string; description?: string; schedule: Weekday[] }) => void;
  onCancel?: () => void;
  initial?: { name: string; description?: string; schedule: Weekday[] };
}

const weekdayLabels = ["D", "L", "M", "M", "J", "V", "S"];

export function HabitForm({ onSubmit, onCancel, initial }: HabitFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [schedule, setSchedule] = useState<Weekday[]>(initial?.schedule ?? []);

  const toggleWeekday = (w: Weekday) => {
    setSchedule((prev) => (prev.includes(w) ? prev.filter((d) => d !== w) : [...prev, w]));
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ name, description: description || undefined, schedule });
      }}
      className="habit-form"
    >
      <div className="field">
        <label htmlFor="name">Nom</label>
        <input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Méditer"
          required
        />
      </div>

      <div className="field">
        <label htmlFor="desc">Description</label>
        <input
          id="desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optionnel"
        />
      </div>

      <div className="field">
        <label>Jours</label>
        <div className="weekday-grid">
          {weekdayLabels.map((label, idx) => {
            const w = idx as Weekday;
            const active = schedule.includes(w);
            return (
              <button
                type="button"
                key={w}
                onClick={() => toggleWeekday(w)}
                className="weekday"
                aria-pressed={active}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="form-actions">
        <button type="submit">Enregistrer</button>
        {onCancel ? (
          <button type="button" onClick={onCancel}>
            Annuler
          </button>
        ) : null}
      </div>
    </form>
  );
}

export default HabitForm;


