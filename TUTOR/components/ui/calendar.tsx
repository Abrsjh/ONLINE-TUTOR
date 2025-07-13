'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Clock, Calendar as CalendarIcon, Grid, List } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TimeSlot {
  id: string;
  start: Date;
  end: Date;
  available: boolean;
  price?: number;
  tutorId?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'booked' | 'available' | 'blocked';
  tutorId?: string;
  studentId?: string;
}

export interface CalendarProps {
  value?: Date;
  onChange?: (date: Date) => void;
  onTimeSlotSelect?: (timeSlot: TimeSlot) => void;
  timeSlots?: TimeSlot[];
  events?: CalendarEvent[];
  timezone?: string;
  minDate?: Date;
  maxDate?: Date;
  view?: 'month' | 'week' | 'day';
  onViewChange?: (view: 'month' | 'week' | 'day') => void;
  showTimeSlots?: boolean;
  workingHours?: { start: number; end: number }; // 24-hour format
  className?: string;
  disabled?: boolean;
  highlightToday?: boolean;
  showWeekNumbers?: boolean;
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function Calendar({
  value,
  onChange,
  onTimeSlotSelect,
  timeSlots = [],
  events = [],
  timezone = Intl.DateTimeFormat().resolvedOptions().timeZone,
  minDate,
  maxDate,
  view = 'month',
  onViewChange,
  showTimeSlots = false,
  workingHours = { start: 9, end: 17 },
  className,
  disabled = false,
  highlightToday = true,
  showWeekNumbers = false,
}: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(value || new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(value || null);
  const [currentView, setCurrentView] = useState(view);

  // Convert dates to the specified timezone
  const toTimezone = (date: Date): Date => {
    return new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  };

  const fromTimezone = (date: Date): Date => {
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() + offset);
  };

  // Get the start of the month for calendar grid
  const getMonthStart = (date: Date): Date => {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const dayOfWeek = start.getDay();
    return new Date(start.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
  };

  // Get the end of the month for calendar grid
  const getMonthEnd = (date: Date): Date => {
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const dayOfWeek = end.getDay();
    const daysToAdd = 6 - dayOfWeek;
    return new Date(end.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
  };

  // Get week start (Sunday)
  const getWeekStart = (date: Date): Date => {
    const dayOfWeek = date.getDay();
    return new Date(date.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
  };

  // Generate calendar days based on current view
  const calendarDays = useMemo(() => {
    const days: Date[] = [];
    let start: Date;
    let end: Date;

    switch (currentView) {
      case 'month':
        start = getMonthStart(currentDate);
        end = getMonthEnd(currentDate);
        break;
      case 'week':
        start = getWeekStart(currentDate);
        end = new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
        break;
      case 'day':
        start = new Date(currentDate);
        end = new Date(currentDate);
        break;
      default:
        start = getMonthStart(currentDate);
        end = getMonthEnd(currentDate);
    }

    const current = new Date(start);
    while (current <= end) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  }, [currentDate, currentView]);

  // Generate time slots for a given day
  const generateTimeSlots = (date: Date): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const dayStart = new Date(date);
    dayStart.setHours(workingHours.start, 0, 0, 0);
    
    const dayEnd = new Date(date);
    dayEnd.setHours(workingHours.end, 0, 0, 0);

    const current = new Date(dayStart);
    while (current < dayEnd) {
      const slotEnd = new Date(current.getTime() + 60 * 60 * 1000); // 1-hour slots
      
      // Check if this slot exists in provided timeSlots
      const existingSlot = timeSlots.find(slot => 
        slot.start.getTime() === current.getTime()
      );

      slots.push(existingSlot || {
        id: `${current.getTime()}`,
        start: new Date(current),
        end: slotEnd,
        available: true,
      });

      current.setHours(current.getHours() + 1);
    }

    return slots;
  };

  // Check if a date is disabled
  const isDateDisabled = (date: Date): boolean => {
    if (disabled) return true;
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  // Check if a date has available slots
  const hasAvailableSlots = (date: Date): boolean => {
    return timeSlots.some(slot => 
      slot.start.toDateString() === date.toDateString() && slot.available
    );
  };

  // Check if a date has events
  const hasEvents = (date: Date): boolean => {
    return events.some(event => 
      event.start.toDateString() === date.toDateString()
    );
  };

  // Navigation handlers
  const navigatePrevious = () => {
    const newDate = new Date(currentDate);
    switch (currentView) {
      case 'month':
        newDate.setMonth(newDate.getMonth() - 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() - 7);
        break;
      case 'day':
        newDate.setDate(newDate.getDate() - 1);
        break;
    }
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    switch (currentView) {
      case 'month':
        newDate.setMonth(newDate.getMonth() + 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + 7);
        break;
      case 'day':
        newDate.setDate(newDate.getDate() + 1);
        break;
    }
    setCurrentDate(newDate);
  };

  const navigateToday = () => {
    setCurrentDate(new Date());
  };

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    if (isDateDisabled(date)) return;
    
    setSelectedDate(date);
    onChange?.(date);
  };

  // Handle view change
  const handleViewChange = (newView: 'month' | 'week' | 'day') => {
    setCurrentView(newView);
    onViewChange?.(newView);
  };

  // Format date for display
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { 
      timeZone: timezone,
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format time for display
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Get header title based on view
  const getHeaderTitle = (): string => {
    switch (currentView) {
      case 'month':
        return `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
      case 'week':
        const weekStart = getWeekStart(currentDate);
        const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
        return `${formatDate(weekStart)} - ${formatDate(weekEnd)}`;
      case 'day':
        return formatDate(currentDate);
      default:
        return '';
    }
  };

  useEffect(() => {
    if (value) {
      setCurrentDate(value);
      setSelectedDate(value);
    }
  }, [value]);

  return (
    <div className={cn('bg-white border border-gray-200 rounded-lg shadow-sm', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <button
            onClick={navigatePrevious}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            disabled={disabled}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <h2 className="text-lg font-semibold text-gray-900">
            {getHeaderTitle()}
          </h2>
          
          <button
            onClick={navigateNext}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            disabled={disabled}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={navigateToday}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            disabled={disabled}
          >
            Today
          </button>

          {/* View Toggle */}
          <div className="flex border border-gray-300 rounded-md overflow-hidden">
            {(['month', 'week', 'day'] as const).map((viewOption) => (
              <button
                key={viewOption}
                onClick={() => handleViewChange(viewOption)}
                className={cn(
                  'px-3 py-1 text-sm capitalize transition-colors',
                  currentView === viewOption
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                )}
                disabled={disabled}
              >
                {viewOption}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {currentView === 'month' && (
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {DAYS_OF_WEEK.map((day) => (
              <div
                key={day}
                className="p-2 text-center text-sm font-medium text-gray-500 border-b border-gray-200"
              >
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {calendarDays.map((date, index) => {
              const isCurrentMonth = date.getMonth() === currentDate.getMonth();
              const isToday = highlightToday && date.toDateString() === new Date().toDateString();
              const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
              const isDisabled = isDateDisabled(date);
              const hasSlots = hasAvailableSlots(date);
              const hasEventMarkers = hasEvents(date);

              return (
                <button
                  key={index}
                  onClick={() => handleDateSelect(date)}
                  disabled={isDisabled}
                  className={cn(
                    'relative p-2 text-sm border border-transparent rounded-md transition-all hover:border-gray-300',
                    isCurrentMonth ? 'text-gray-900' : 'text-gray-400',
                    isToday && 'bg-blue-50 border-blue-200',
                    isSelected && 'bg-blue-600 text-white',
                    isDisabled && 'opacity-50 cursor-not-allowed',
                    hasSlots && !isSelected && 'bg-green-50 border-green-200',
                    !isCurrentMonth && 'opacity-50'
                  )}
                >
                  <span className="block">{date.getDate()}</span>
                  
                  {/* Availability indicator */}
                  {hasSlots && !isSelected && (
                    <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-green-500 rounded-full" />
                  )}
                  
                  {/* Event indicator */}
                  {hasEventMarkers && !isSelected && (
                    <div className="absolute bottom-1 right-1 w-1 h-1 bg-blue-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {currentView === 'week' && (
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {calendarDays.map((date, index) => {
              const isToday = highlightToday && date.toDateString() === new Date().toDateString();
              const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();

              return (
                <div key={index} className="text-center">
                  <div className="text-sm font-medium text-gray-500 mb-2">
                    {DAYS_OF_WEEK[date.getDay()]}
                  </div>
                  <button
                    onClick={() => handleDateSelect(date)}
                    disabled={isDateDisabled(date)}
                    className={cn(
                      'w-8 h-8 text-sm rounded-full transition-colors',
                      isToday && 'bg-blue-50 border border-blue-200',
                      isSelected && 'bg-blue-600 text-white',
                      !isSelected && !isToday && 'hover:bg-gray-100'
                    )}
                  >
                    {date.getDate()}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {currentView === 'day' && (
          <div className="space-y-2">
            <div className="text-center text-lg font-medium text-gray-900 mb-4">
              {formatDate(currentDate)}
            </div>
            
            {showTimeSlots && (
              <div className="space-y-1">
                {generateTimeSlots(currentDate).map((slot) => (
                  <button
                    key={slot.id}
                    onClick={() => onTimeSlotSelect?.(slot)}
                    disabled={!slot.available || disabled}
                    className={cn(
                      'w-full p-3 text-left border rounded-md transition-colors',
                      slot.available
                        ? 'border-green-200 bg-green-50 hover:bg-green-100 text-green-900'
                        : 'border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4" />
                        <span className="font-medium">
                          {formatTime(slot.start)} - {formatTime(slot.end)}
                        </span>
                      </div>
                      {slot.price && (
                        <span className="text-sm font-medium">
                          ${slot.price}
                        </span>
                      )}
                    </div>
                    {!slot.available && (
                      <div className="text-xs text-gray-500 mt-1">
                        Not available
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Timezone indicator */}
      <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-500">
        Timezone: {timezone}
      </div>
    </div>
  );
}

export default Calendar;