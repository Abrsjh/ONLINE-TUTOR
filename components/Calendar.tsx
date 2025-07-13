'use client';

import React, { useState, useMemo } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  addDays, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  isToday,
  isBefore,
  startOfDay
} from 'date-fns';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Tutor } from '../lib/data';
import { useBookingStore } from '../lib/store';

interface CalendarProps {
  tutor?: Tutor;
  mode?: 'view' | 'interactive';
  onDateSelect?: (date: Date) => void;
  className?: string;
}

const Calendar: React.FC<CalendarProps> = ({ 
  tutor, 
  mode = 'interactive', 
  onDateSelect,
  className = '' 
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { selectedDate, setSelectedDate } = useBookingStore();

  // Get day of week in lowercase format for availability lookup
  const getDayKey = (date: Date): string => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
  };

  // Check if a date has available time slots
  const isDateAvailable = (date: Date): boolean => {
    if (!tutor) return false;
    
    const dayKey = getDayKey(date);
    const availableSlots = tutor.availability[dayKey] || [];
    return availableSlots.length > 0;
  };

  // Check if date is in the past
  const isPastDate = (date: Date): boolean => {
    return isBefore(date, startOfDay(new Date()));
  };

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days = [];
    let day = startDate;

    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }

    return days;
  }, [currentMonth]);

  const handleDateClick = (date: Date) => {
    if (mode === 'view') return;
    if (isPastDate(date)) return;
    if (!isDateAvailable(date)) return;

    setSelectedDate(date);
    onDateSelect?.(date);
  };

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const getDayClasses = (date: Date): string => {
    const baseClasses = 'w-10 h-10 flex items-center justify-center text-sm rounded-lg transition-colors duration-200';
    
    const isCurrentMonth = isSameMonth(date, currentMonth);
    const isSelected = selectedDate && isSameDay(date, selectedDate);
    const isAvailable = isDateAvailable(date);
    const isPast = isPastDate(date);
    const isTodayDate = isToday(date);

    let classes = baseClasses;

    if (!isCurrentMonth) {
      classes += ' text-gray-300';
    } else if (isPast) {
      classes += ' text-gray-400 cursor-not-allowed';
    } else if (isSelected && mode === 'interactive') {
      classes += ' bg-blue-600 text-white font-semibold';
    } else if (isTodayDate) {
      classes += ' bg-blue-100 text-blue-600 font-semibold';
    } else if (isAvailable && mode === 'interactive') {
      classes += ' text-gray-900 hover:bg-blue-50 cursor-pointer border border-blue-200';
    } else if (isAvailable && mode === 'view') {
      classes += ' text-gray-900 bg-green-50 border border-green-200';
    } else {
      classes += ' text-gray-400';
    }

    return classes;
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
        </button>
        
        <h2 className="text-lg font-semibold text-gray-900">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        
        <button
          onClick={nextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Next month"
        >
          <ChevronRightIcon className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Week Days Header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="w-10 h-8 flex items-center justify-center text-xs font-medium text-gray-500"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date, index) => (
          <button
            key={index}
            onClick={() => handleDateClick(date)}
            disabled={mode === 'view' || isPastDate(date) || !isDateAvailable(date)}
            className={getDayClasses(date)}
            title={
              isDateAvailable(date) 
                ? `Available on ${format(date, 'MMMM d, yyyy')}` 
                : `Not available on ${format(date, 'MMMM d, yyyy')}`
            }
          >
            {format(date, 'd')}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex flex-wrap gap-4 text-xs">
          {mode === 'interactive' && (
            <>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded border border-blue-200 bg-white"></div>
                <span className="text-gray-600">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-blue-600"></div>
                <span className="text-gray-600">Selected</span>
              </div>
            </>
          )}
          {mode === 'view' && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-50 border border-green-200"></div>
              <span className="text-gray-600">Available</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-100"></div>
            <span className="text-gray-600">Today</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-gray-100"></div>
            <span className="text-gray-600">Unavailable</span>
          </div>
        </div>
      </div>

      {/* Additional Info for Interactive Mode */}
      {mode === 'interactive' && tutor && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Select an available date to view time slots for <span className="font-medium">{tutor.name}</span>
          </p>
          {selectedDate && (
            <p className="text-sm text-blue-600 mt-1">
              Selected: {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </p>
          )}
        </div>
      )}

      {/* Additional Info for View Mode */}
      {mode === 'view' && tutor && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            <span className="font-medium">{tutor.name}</span>'s availability for the month
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Green dates indicate available time slots
          </p>
        </div>
      )}
    </div>
  );
};

export default Calendar;