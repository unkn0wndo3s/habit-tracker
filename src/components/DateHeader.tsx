"use client";

export interface DateHeaderProps {
  dateKey: string; // YYYY-MM-DD
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

function formatReadable(dateKey: string): string {
  const d = new Date(dateKey);
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long" });
}

export function DateHeader({ dateKey, onPrev, onNext, onToday }: DateHeaderProps) {
  return (
    <div className="date-header">
      <button onClick={onPrev} aria-label="Jour précédent">◀</button>
      <div className="date-title" role="heading" aria-level={1}>
        {formatReadable(dateKey)}
      </div>
      <button onClick={onNext} aria-label="Jour suivant">▶</button>
      <button className="today" onClick={onToday}>Aujourd'hui</button>
    </div>
  );
}

export default DateHeader;


