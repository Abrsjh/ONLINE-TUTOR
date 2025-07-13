import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// Types
export interface TimeSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  timezone: string;
  isAvailable: boolean;
}

export interface SelectedTutor {
  id: string;
  name: string;
  avatar?: string;
  subjects: string[];
  hourlyRate: number;
  rating: number;
  timezone: string;
}

export interface BookingDetails {
  subject: string;
  sessionType: 'one-time' | 'recurring';
  duration: number; // in minutes
  notes?: string;
  recurringPattern?: {
    frequency: 'weekly' | 'biweekly' | 'monthly';
    endDate?: string;
    occurrences?: number;
  };
}

export interface PaymentInfo {
  method: 'credit' | 'card' | 'paypal';
  cardId?: string;
  useCredits?: boolean;
  totalAmount: number;
  creditAmount?: number;
  cardAmount?: number;
}

export interface BookingSession {
  id: string;
  tutorId: string;
  studentId: string;
  timeSlot: TimeSlot;
  details: BookingDetails;
  payment: PaymentInfo;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface BookingConflict {
  type: 'tutor_unavailable' | 'student_conflict' | 'time_past' | 'payment_failed';
  message: string;
  suggestedSlots?: TimeSlot[];
}

export type BookingStep = 'tutor' | 'time' | 'details' | 'payment' | 'confirmation';

export interface BookingError {
  step: BookingStep;
  field?: string;
  message: string;
  code?: string;
}

interface BookingState {
  // Current booking flow state
  currentStep: BookingStep;
  selectedTutor: SelectedTutor | null;
  selectedTimeSlot: TimeSlot | null;
  bookingDetails: Partial<BookingDetails>;
  paymentInfo: Partial<PaymentInfo>;
  
  // Available options
  availableTimeSlots: TimeSlot[];
  conflictingSlots: string[];
  
  // UI state
  isLoading: boolean;
  isSubmitting: boolean;
  errors: BookingError[];
  conflicts: BookingConflict[];
  
  // Booking history and optimistic updates
  pendingBookings: BookingSession[];
  confirmedBookings: BookingSession[];
  failedBookings: string[]; // IDs of failed bookings for rollback
  
  // Actions
  setCurrentStep: (step: BookingStep) => void;
  selectTutor: (tutor: SelectedTutor) => void;
  selectTimeSlot: (slot: TimeSlot) => void;
  updateBookingDetails: (details: Partial<BookingDetails>) => void;
  updatePaymentInfo: (payment: Partial<PaymentInfo>) => void;
  
  // Time slot management
  loadAvailableTimeSlots: (tutorId: string, date?: string) => Promise<void>;
  checkTimeSlotConflicts: (slot: TimeSlot) => Promise<BookingConflict[]>;
  
  // Booking flow
  validateCurrentStep: () => boolean;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  submitBooking: () => Promise<string | null>; // Returns booking ID or null if failed
  
  // Optimistic updates and error handling
  addOptimisticBooking: (booking: BookingSession) => void;
  confirmBooking: (bookingId: string) => void;
  rollbackBooking: (bookingId: string) => void;
  retryFailedBooking: (bookingId: string) => Promise<void>;
  
  // Error management
  addError: (error: BookingError) => void;
  clearErrors: (step?: BookingStep) => void;
  clearConflicts: () => void;
  
  // Reset and cleanup
  resetBookingFlow: () => void;
  clearBookingData: () => void;
}

const initialState = {
  currentStep: 'tutor' as BookingStep,
  selectedTutor: null,
  selectedTimeSlot: null,
  bookingDetails: {},
  paymentInfo: {},
  availableTimeSlots: [],
  conflictingSlots: [],
  isLoading: false,
  isSubmitting: false,
  errors: [],
  conflicts: [],
  pendingBookings: [],
  confirmedBookings: [],
  failedBookings: [],
};

export const useBookingStore = create<BookingState>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initialState,

        // Step navigation
        setCurrentStep: (step: BookingStep) => {
          set((state) => {
            state.currentStep = step;
            // Clear step-specific errors when navigating
            state.errors = state.errors.filter(error => error.step !== step);
          });
        },

        // Selection actions
        selectTutor: (tutor: SelectedTutor) => {
          set((state) => {
            state.selectedTutor = tutor;
            state.selectedTimeSlot = null; // Reset time slot when tutor changes
            state.availableTimeSlots = [];
            state.conflicts = [];
            state.errors = state.errors.filter(error => error.step !== 'tutor');
          });
        },

        selectTimeSlot: (slot: TimeSlot) => {
          set((state) => {
            state.selectedTimeSlot = slot;
            state.conflicts = [];
            state.errors = state.errors.filter(error => error.step !== 'time');
          });
        },

        updateBookingDetails: (details: Partial<BookingDetails>) => {
          set((state) => {
            state.bookingDetails = { ...state.bookingDetails, ...details };
            state.errors = state.errors.filter(error => error.step !== 'details');
          });
        },

        updatePaymentInfo: (payment: Partial<PaymentInfo>) => {
          set((state) => {
            state.paymentInfo = { ...state.paymentInfo, ...payment };
            state.errors = state.errors.filter(error => error.step !== 'payment');
          });
        },

        // Time slot management
        loadAvailableTimeSlots: async (tutorId: string, date?: string) => {
          set((state) => {
            state.isLoading = true;
            state.errors = state.errors.filter(error => error.step !== 'time');
          });

          try {
            // Mock API call - replace with actual API
            const response = await fetch(`/api/tutors/${tutorId}/availability?date=${date || ''}`);
            const slots: TimeSlot[] = await response.json();

            set((state) => {
              state.availableTimeSlots = slots;
              state.isLoading = false;
            });
          } catch (error) {
            set((state) => {
              state.isLoading = false;
              state.errors.push({
                step: 'time',
                message: 'Failed to load available time slots',
                code: 'LOAD_SLOTS_ERROR'
              });
            });
          }
        },

        checkTimeSlotConflicts: async (slot: TimeSlot) => {
          const { selectedTutor } = get();
          if (!selectedTutor) return [];

          try {
            const response = await fetch('/api/booking/check-conflicts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                tutorId: selectedTutor.id,
                timeSlot: slot
              })
            });
            
            const conflicts: BookingConflict[] = await response.json();
            
            set((state) => {
              state.conflicts = conflicts;
            });
            
            return conflicts;
          } catch (error) {
            const conflict: BookingConflict = {
              type: 'tutor_unavailable',
              message: 'Unable to verify availability. Please try again.'
            };
            
            set((state) => {
              state.conflicts = [conflict];
            });
            
            return [conflict];
          }
        },

        // Validation
        validateCurrentStep: () => {
          const { currentStep, selectedTutor, selectedTimeSlot, bookingDetails, paymentInfo } = get();
          const errors: BookingError[] = [];

          switch (currentStep) {
            case 'tutor':
              if (!selectedTutor) {
                errors.push({
                  step: 'tutor',
                  message: 'Please select a tutor'
                });
              }
              break;

            case 'time':
              if (!selectedTimeSlot) {
                errors.push({
                  step: 'time',
                  message: 'Please select a time slot'
                });
              }
              break;

            case 'details':
              if (!bookingDetails.subject) {
                errors.push({
                  step: 'details',
                  field: 'subject',
                  message: 'Subject is required'
                });
              }
              if (!bookingDetails.sessionType) {
                errors.push({
                  step: 'details',
                  field: 'sessionType',
                  message: 'Session type is required'
                });
              }
              if (!bookingDetails.duration || bookingDetails.duration < 30) {
                errors.push({
                  step: 'details',
                  field: 'duration',
                  message: 'Session duration must be at least 30 minutes'
                });
              }
              break;

            case 'payment':
              if (!paymentInfo.method) {
                errors.push({
                  step: 'payment',
                  field: 'method',
                  message: 'Payment method is required'
                });
              }
              if (!paymentInfo.totalAmount || paymentInfo.totalAmount <= 0) {
                errors.push({
                  step: 'payment',
                  field: 'totalAmount',
                  message: 'Invalid payment amount'
                });
              }
              break;
          }

          if (errors.length > 0) {
            set((state) => {
              state.errors = [...state.errors.filter(e => e.step !== currentStep), ...errors];
            });
            return false;
          }

          return true;
        },

        // Step navigation
        goToNextStep: () => {
          const { validateCurrentStep, currentStep } = get();
          
          if (!validateCurrentStep()) return;

          const stepOrder: BookingStep[] = ['tutor', 'time', 'details', 'payment', 'confirmation'];
          const currentIndex = stepOrder.indexOf(currentStep);
          
          if (currentIndex < stepOrder.length - 1) {
            set((state) => {
              state.currentStep = stepOrder[currentIndex + 1];
            });
          }
        },

        goToPreviousStep: () => {
          const { currentStep } = get();
          const stepOrder: BookingStep[] = ['tutor', 'time', 'details', 'payment', 'confirmation'];
          const currentIndex = stepOrder.indexOf(currentStep);
          
          if (currentIndex > 0) {
            set((state) => {
              state.currentStep = stepOrder[currentIndex - 1];
            });
          }
        },

        // Booking submission
        submitBooking: async () => {
          const { 
            selectedTutor, 
            selectedTimeSlot, 
            bookingDetails, 
            paymentInfo,
            addOptimisticBooking,
            confirmBooking,
            rollbackBooking
          } = get();

          if (!selectedTutor || !selectedTimeSlot) {
            return null;
          }

          // Create optimistic booking
          const bookingId = `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const optimisticBooking: BookingSession = {
            id: bookingId,
            tutorId: selectedTutor.id,
            studentId: 'current_user', // Replace with actual user ID
            timeSlot: selectedTimeSlot,
            details: bookingDetails as BookingDetails,
            payment: paymentInfo as PaymentInfo,
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          set((state) => {
            state.isSubmitting = true;
            state.errors = [];
          });

          // Add optimistic booking
          addOptimisticBooking(optimisticBooking);

          try {
            // Submit to API
            const response = await fetch('/api/booking/create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(optimisticBooking)
            });

            if (!response.ok) {
              throw new Error('Booking failed');
            }

            const result = await response.json();
            
            // Confirm booking with server response
            confirmBooking(bookingId);
            
            set((state) => {
              state.isSubmitting = false;
              state.currentStep = 'confirmation';
            });

            return result.id || bookingId;
          } catch (error) {
            // Rollback optimistic booking
            rollbackBooking(bookingId);
            
            set((state) => {
              state.isSubmitting = false;
              state.errors.push({
                step: 'payment',
                message: 'Booking failed. Please try again.',
                code: 'BOOKING_FAILED'
              });
            });

            return null;
          }
        },

        // Optimistic updates
        addOptimisticBooking: (booking: BookingSession) => {
          set((state) => {
            state.pendingBookings.push(booking);
          });
        },

        confirmBooking: (bookingId: string) => {
          set((state) => {
            const bookingIndex = state.pendingBookings.findIndex(b => b.id === bookingId);
            if (bookingIndex !== -1) {
              const booking = state.pendingBookings[bookingIndex];
              booking.status = 'confirmed';
              state.confirmedBookings.push(booking);
              state.pendingBookings.splice(bookingIndex, 1);
            }
          });
        },

        rollbackBooking: (bookingId: string) => {
          set((state) => {
            state.pendingBookings = state.pendingBookings.filter(b => b.id !== bookingId);
            state.failedBookings.push(bookingId);
          });
        },

        retryFailedBooking: async (bookingId: string) => {
          // Implementation for retrying failed bookings
          const { submitBooking } = get();
          return submitBooking();
        },

        // Error management
        addError: (error: BookingError) => {
          set((state) => {
            state.errors.push(error);
          });
        },

        clearErrors: (step?: BookingStep) => {
          set((state) => {
            if (step) {
              state.errors = state.errors.filter(error => error.step !== step);
            } else {
              state.errors = [];
            }
          });
        },

        clearConflicts: () => {
          set((state) => {
            state.conflicts = [];
          });
        },

        // Reset functions
        resetBookingFlow: () => {
          set((state) => {
            Object.assign(state, {
              ...initialState,
              confirmedBookings: state.confirmedBookings, // Keep confirmed bookings
            });
          });
        },

        clearBookingData: () => {
          set((state) => {
            Object.assign(state, initialState);
          });
        },
      })),
      {
        name: 'booking-store',
        partialize: (state) => ({
          // Only persist essential data, not UI state
          confirmedBookings: state.confirmedBookings,
          selectedTutor: state.selectedTutor,
          selectedTimeSlot: state.selectedTimeSlot,
          bookingDetails: state.bookingDetails,
          currentStep: state.currentStep,
        }),
      }
    ),
    {
      name: 'booking-store',
    }
  )
);

// Selectors for optimized component subscriptions
export const useBookingStep = () => useBookingStore((state) => state.currentStep);
export const useSelectedTutor = () => useBookingStore((state) => state.selectedTutor);
export const useSelectedTimeSlot = () => useBookingStore((state) => state.selectedTimeSlot);
export const useBookingErrors = () => useBookingStore((state) => state.errors);
export const useBookingConflicts = () => useBookingStore((state) => state.conflicts);
export const useBookingLoading = () => useBookingStore((state) => ({
  isLoading: state.isLoading,
  isSubmitting: state.isSubmitting,
}));
export const usePendingBookings = () => useBookingStore((state) => state.pendingBookings);
export const useConfirmedBookings = () => useBookingStore((state) => state.confirmedBookings);