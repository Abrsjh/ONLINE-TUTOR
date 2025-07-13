import { create } from 'zustand';

// TypeScript interfaces for type safety
export interface Tutor {
  id: string;
  name: string;
  subjects: string[];
  hourlyRate: number;
  rating: number;
  totalReviews: number;
  about: string;
  availability: {
    [key: string]: string[]; // day of week -> array of time slots
  };
}

export interface BookingState {
  selectedTutor: Tutor | null;
  selectedDate: Date | null;
  selectedTime: string | null;
  sessionDuration: number; // in hours
}

export interface BookingActions {
  setSelectedTutor: (tutor: Tutor | null) => void;
  setSelectedDate: (date: Date | null) => void;
  setSelectedTime: (time: string | null) => void;
  setSessionDuration: (duration: number) => void;
  setBooking: (booking: Partial<BookingState>) => void;
  clearBooking: () => void;
}

export type BookingStore = BookingState & BookingActions;

// Initial state
const initialState: BookingState = {
  selectedTutor: null,
  selectedDate: null,
  selectedTime: null,
  sessionDuration: 1, // default to 1 hour
};

// Create Zustand store
export const useBookingStore = create<BookingStore>((set, get) => ({
  // State
  ...initialState,

  // Actions
  setSelectedTutor: (tutor) => set({ selectedTutor: tutor }),
  
  setSelectedDate: (date) => set({ selectedDate: date }),
  
  setSelectedTime: (time) => set({ selectedTime: time }),
  
  setSessionDuration: (duration) => set({ sessionDuration: duration }),
  
  setBooking: (booking) => set((state) => ({ ...state, ...booking })),
  
  clearBooking: () => set(initialState),
}));

// Helper functions for computed values
export const useBookingTotal = () => {
  const { selectedTutor, sessionDuration } = useBookingStore();
  
  if (!selectedTutor) return 0;
  
  return selectedTutor.hourlyRate * sessionDuration;
};

export const useIsBookingComplete = () => {
  const { selectedTutor, selectedDate, selectedTime, sessionDuration } = useBookingStore();
  
  return !!(selectedTutor && selectedDate && selectedTime && sessionDuration > 0);
};

// Selector hooks for specific state pieces
export const useSelectedTutor = () => useBookingStore((state) => state.selectedTutor);
export const useSelectedDate = () => useBookingStore((state) => state.selectedDate);
export const useSelectedTime = () => useBookingStore((state) => state.selectedTime);
export const useSessionDuration = () => useBookingStore((state) => state.sessionDuration);