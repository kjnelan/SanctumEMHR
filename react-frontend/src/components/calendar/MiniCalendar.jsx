import React, { useState } from 'react';

function MiniCalendar({ currentDate, onDateClick }) {
  const [viewMonth, setViewMonth] = useState(new Date(currentDate));

  // Get days in month
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  // Get first day of month (0 = Sunday, 6 = Saturday)
  const getFirstDayOfMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  // Generate calendar grid
  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(viewMonth);
    const firstDay = getFirstDayOfMonth(viewMonth);
    const days = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const handlePrevMonth = () => {
    const newDate = new Date(viewMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    setViewMonth(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(viewMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    setViewMonth(newDate);
  };

  const handleDayClick = (day) => {
    if (!day) return;
    const clickedDate = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);
    onDateClick(clickedDate);
  };

  const isToday = (day) => {
    if (!day) return false;
    const today = new Date();
    return (
      day === today.getDate() &&
      viewMonth.getMonth() === today.getMonth() &&
      viewMonth.getFullYear() === today.getFullYear()
    );
  };

  const isSelectedWeek = (day) => {
    if (!day) return false;
    const dayDate = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);

    // Get the week start (Sunday) for both dates - US convention
    const getWeekStart = (date) => {
      const d = new Date(date);
      const dayOfWeek = d.getDay();
      const diff = d.getDate() - dayOfWeek;  // Sunday = 0, so this gets us to Sunday
      return new Date(d.setDate(diff));
    };

    const weekStart = getWeekStart(dayDate);
    const currentWeekStart = getWeekStart(currentDate);

    return weekStart.toDateString() === currentWeekStart.toDateString();
  };

  const days = generateCalendarDays();
  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="select-none">
      {/* Month/Year Header with Navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={handlePrevMonth}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          aria-label="Previous month"
        >
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <h3 className="font-semibold text-gray-900 text-sm">
          {viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h3>

        <button
          onClick={handleNextMonth}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          aria-label="Next month"
        >
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Week day headers */}
        {weekDays.map((day, index) => (
          <div key={index} className="text-center text-xs font-medium text-gray-500 py-1">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {days.map((day, index) => {
          const today = isToday(day);
          const selected = isSelectedWeek(day);

          return (
            <button
              key={index}
              onClick={() => handleDayClick(day)}
              disabled={!day}
              className={`
                aspect-square flex items-center justify-center text-sm rounded-lg
                transition-colors
                ${!day ? 'invisible' : ''}
                ${today ? 'bg-blue-600 text-white font-bold hover:bg-blue-700' : ''}
                ${!today && selected ? 'bg-blue-100 text-blue-900 font-semibold' : ''}
                ${!today && !selected ? 'hover:bg-gray-100 text-gray-700' : ''}
              `}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-600 space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-600 rounded"></div>
          <span>Today</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div>
          <span>Selected week</span>
        </div>
      </div>
    </div>
  );
}

export default MiniCalendar;
