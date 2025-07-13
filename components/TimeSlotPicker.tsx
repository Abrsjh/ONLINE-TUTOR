'use client';

import { useBookingStore } from '@/lib/store';
import { format, getDay } from 'date-fns';

interface TimeSlotPickerProps {
  className?: string;
}

const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({ className = '' }) => {
  const { selectedTutor, selectedDate, selectedTime, setSelectedTime } = useBookingStore();

  // Get day name from selected date
  const getDayName = (date: Date): string => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[getDay(date)];
  };

  // Get available time slots for the selected date
  const getAvailableTimeSlots = (): string[] => {
    if (!selectedTutor || !selectedDate) return [];
    
    const dayName = getDayName(selectedDate);
    return selectedTutor.availability[dayName] || [];
  };

  // Generate all possible time slots (9 AM to 9 PM)
  const getAllTimeSlots = (): string[] => {
    const slots = [];
    for (let hour = 9; hour <= 21; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    return slots;
  };

  const availableSlots = getAvailableTimeSlots();
  const allSlots = getAllTimeSlots();

  // Don't render if no tutor or date is selected
  if (!selectedTutor || !selectedDate) {
    return (
      <div className={`p-6 bg-gray-50 rounded-lg ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Time</h3>
        <p className="text-gray-500">Please select a tutor and date first.</p>
      </div>
    );
  }

  return (
    <div className={`p-6 bg-white border border-gray-200 rounded-lg ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Available Times for {format(selectedDate, 'EEEE, MMMM d, yyyy')}
      </h3>
      
      {availableSlots.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-2">No available time slots for this date.</p>
          <p className="text-sm text-gray-400">Please select a different date.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {allSlots.map((slot) => {
            const isAvailable = availableSlots.includes(slot);
            const isSelected = selectedTime === slot;
            
            return (
              <button
                key={slot}
                onClick={() => isAvailable ? setSelectedTime(slot) : null}
                disabled={!isAvailable}
                className={`
                  px-3 py-2 rounded-md text-sm font-medium transition-all duration-200
                  ${isAvailable
                    ? isSelected
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 hover:border-blue-300'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                  }
                  ${isAvailable && !isSelected ? 'hover:shadow-sm' : ''}
                `}
              >
                {slot}
              </button>
            );
          })}
        </div>
      )}
      
      {selectedTime && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-800">
            <span className="font-medium">Selected time:</span> {selectedTime}
          </p>
        </div>
      )}
      
      <div className="mt-4 text-xs text-gray-500">
        <p>• Available time slots are shown in blue</p>
        <p>• Unavailable times are grayed out</p>
        <p>• Click on an available time to select it</p>
      </div>
    </div>
  );
};

export default TimeSlotPicker;