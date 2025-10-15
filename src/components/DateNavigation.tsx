'use client';

interface DateNavigationProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

export default function DateNavigation({ currentDate, onDateChange }: DateNavigationProps) {
  const goToPreviousDay = () => {
    const previousDay = new Date(currentDate);
    previousDay.setDate(previousDay.getDate() - 1);
    onDateChange(previousDay);
  };

  const goToNextDay = () => {
    const nextDay = new Date(currentDate);
    nextDay.setDate(nextDay.getDate() + 1);
    onDateChange(nextDay);
  };

  const goToToday = () => {
    onDateChange(new Date());
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isToday = () => {
    const today = new Date();
    return currentDate.toDateString() === today.toDateString();
  };

  return (
    <div className="bg-white px-4 py-3 border-b border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={goToPreviousDay}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Jour précédent"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <button
          onClick={goToToday}
          className={`px-3 py-1 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            isToday() 
              ? 'bg-blue-100 text-blue-700' 
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          Aujourd'hui
        </button>
        
        <button
          onClick={goToNextDay}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Jour suivant"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      
      <h2 className="text-lg font-semibold text-gray-900 text-center">
        {formatDate(currentDate)}
      </h2>
    </div>
  );
}
