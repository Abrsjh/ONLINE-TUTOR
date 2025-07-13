import { useCallback, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  useBookingStore, 
  useBookingStep, 
  useSelectedTutor, 
  useSelectedTimeSlot, 
  useBookingErrors, 
  useBookingConflicts, 
  useBookingLoading,
  type TimeSlot,
  type SelectedTutor,
  type BookingDetails,
  type PaymentInfo,
  type BookingConflict,
  type BookingSession
} from '../lib/state/booking';
import { 
  sessionAPI, 
  type SessionBookingRequest, 
  type AvailabilitySlot, 
  type SessionConflict 
} from '../lib/api/sessions';
import { useAuthStore } from '../lib/state/auth';
import { addDays, format, parseISO, isAfter, isBefore } from 'date-fns';
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';

export interface UseBookingOptions {
  autoLoadAvailability?: boolean;
  enableOptimisticUpdates?: boolean;
  conflictCheckDebounce?: number;
}

export interface BookingHookReturn {
  // Current state
  currentStep: string;
  selectedTutor: SelectedTutor | null;
  selectedTimeSlot: TimeSlot | null;
  bookingDetails: Partial<BookingDetails>;
  paymentInfo: Partial<PaymentInfo>;
  
  // Loading states
  isLoading: boolean;
  isSubmitting: boolean;
  isLoadingAvailability: boolean;
  isCheckingConflicts: boolean;
  
  // Error and conflict states
  errors: any[];
  conflicts: BookingConflict[];
  hasErrors: boolean;
  hasConflicts: boolean;
  
  // Available data
  availableTimeSlots: TimeSlot[];
  suggestedTimeSlots: TimeSlot[];
  
  // Actions
  selectTutor: (tutor: SelectedTutor) => void;
  selectTimeSlot: (slot: TimeSlot) => void;
  updateBookingDetails: (details: Partial<BookingDetails>) => void;
  updatePaymentInfo: (payment: Partial<PaymentInfo>) => void;
  
  // Navigation
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  goToStep: (step: string) => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  
  // Availability and conflicts
  loadAvailability: (tutorId: string, date?: string) => Promise<void>;
  checkConflicts: (slot: TimeSlot) => Promise<void>;
  refreshAvailability: () => void;
  
  // Booking operations
  submitBooking: () => Promise<string | null>;
  retryBooking: (bookingId: string) => Promise<void>;
  cancelBooking: (bookingId: string) => Promise<void>;
  
  // Utility functions
  calculateTotalPrice: () => number;
  getEstimatedDuration: () => number;
  formatTimeSlot: (slot: TimeSlot) => string;
  validateCurrentStep: () => boolean;
  
  // Reset functions
  resetBookingFlow: () => void;
  clearErrors: () => void;
  clearConflicts: () => void;
}

export function useBooking(options: UseBookingOptions = {}): BookingHookReturn {
  const {
    autoLoadAvailability = true,
    enableOptimisticUpdates = true,
    conflictCheckDebounce = 500
  } = options;

  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  
  // Store selectors
  const currentStep = useBookingStep();
  const selectedTutor = useSelectedTutor();
  const selectedTimeSlot = useSelectedTimeSlot();
  const errors = useBookingErrors();
  const conflicts = useBookingConflicts();
  const { isLoading, isSubmitting } = useBookingLoading();
  
  // Store actions
  const {
    setCurrentStep,
    selectTutor: storeSelectTutor,
    selectTimeSlot: storeSelectTimeSlot,
    updateBookingDetails: storeUpdateBookingDetails,
    updatePaymentInfo: storeUpdatePaymentInfo,
    bookingDetails,
    paymentInfo,
    availableTimeSlots,
    loadAvailableTimeSlots,
    checkTimeSlotConflicts,
    validateCurrentStep: storeValidateCurrentStep,
    goToNextStep: storeGoToNextStep,
    goToPreviousStep: storeGoToPreviousStep,
    submitBooking: storeSubmitBooking,
    resetBookingFlow: storeResetBookingFlow,
    clearErrors: storeClearErrors,
    clearConflicts: storeClearConflicts,
    addError,
    retryFailedBooking
  } = useBookingStore();

  // Availability query
  const {
    data: availabilityData,
    isLoading: isLoadingAvailability,
    refetch: refetchAvailability
  } = useQuery({
    queryKey: ['tutor-availability', selectedTutor?.id, selectedTutor?.timezone],
    queryFn: async () => {
      if (!selectedTutor) return [];
      
      const startDate = new Date();
      const endDate = addDays(startDate, 30); // Load 30 days of availability
      
      return await sessionAPI.getTutorAvailability(
        parseInt(selectedTutor.id),
        startDate,
        endDate,
        selectedTutor.timezone
      );
    },
    enabled: !!selectedTutor && autoLoadAvailability,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  // Conflict checking mutation
  const conflictCheckMutation = useMutation({
    mutationFn: async (slot: TimeSlot) => {
      if (!selectedTutor || !user) return [];
      
      return await sessionAPI.checkSessionConflicts({
        tutorId: parseInt(selectedTutor.id),
        studentId: user.id,
        scheduledAt: parseISO(`${slot.date}T${slot.startTime}`),
        duration: getEstimatedDuration(),
        timezone: slot.timezone
      });
    },
    onSuccess: (conflicts) => {
      // Convert SessionConflict[] to BookingConflict[]
      const bookingConflicts: BookingConflict[] = conflicts.map(conflict => ({
        type: conflict.type === 'tutor_busy' ? 'tutor_unavailable' : 
              conflict.type === 'student_busy' ? 'student_conflict' :
              conflict.type === 'past_time' ? 'time_past' : 'tutor_unavailable',
        message: conflict.message,
        suggestedSlots: conflict.suggestedTimes ? 
          conflict.suggestedTimes.map(time => convertToTimeSlot(time)) : undefined
      }));
      
      storeClearConflicts();
      bookingConflicts.forEach(conflict => {
        // Add conflicts to store (assuming there's a method for this)
        console.log('Conflict detected:', conflict);
      });
    },
    onError: (error) => {
      addError({
        step: 'time',
        message: 'Failed to check for conflicts. Please try again.',
        code: 'CONFLICT_CHECK_ERROR'
      });
    }
  });

  // Booking submission mutation
  const bookingMutation = useMutation({
    mutationFn: async (): Promise<string> => {
      if (!selectedTutor || !selectedTimeSlot || !user) {
        throw new Error('Missing required booking information');
      }

      const bookingRequest: SessionBookingRequest = {
        tutorId: parseInt(selectedTutor.id),
        studentId: user.id,
        subject: bookingDetails.subject || '',
        title: `${bookingDetails.subject} Session with ${selectedTutor.name}`,
        description: bookingDetails.notes,
        scheduledAt: parseISO(`${selectedTimeSlot.date}T${selectedTimeSlot.startTime}`),
        duration: bookingDetails.duration || 60,
        price: calculateTotalPrice(),
        currency: 'USD',
        isRecurring: bookingDetails.sessionType === 'recurring',
        recurringPattern: bookingDetails.recurringPattern ? {
          frequency: bookingDetails.recurringPattern.frequency === 'weekly' ? 'weekly' :
                   bookingDetails.recurringPattern.frequency === 'biweekly' ? 'weekly' : 'monthly',
          interval: bookingDetails.recurringPattern.frequency === 'biweekly' ? 2 : 1,
          endDate: bookingDetails.recurringPattern.endDate ? 
            parseISO(bookingDetails.recurringPattern.endDate) : undefined,
          maxOccurrences: bookingDetails.recurringPattern.occurrences
        } : undefined,
        timezone: selectedTimeSlot.timezone
      };

      const result = await sessionAPI.bookSession(bookingRequest);
      
      if (!result.success) {
        if (result.conflicts) {
          // Handle conflicts
          const bookingConflicts: BookingConflict[] = result.conflicts.map(conflict => ({
            type: conflict.type === 'tutor_busy' ? 'tutor_unavailable' : 
                  conflict.type === 'student_busy' ? 'student_conflict' :
                  conflict.type === 'past_time' ? 'time_past' : 'tutor_unavailable',
            message: conflict.message,
            suggestedSlots: conflict.suggestedTimes ? 
              conflict.suggestedTimes.map(time => convertToTimeSlot(time)) : undefined
          }));
          
          throw new Error(`Booking conflicts: ${bookingConflicts.map(c => c.message).join(', ')}`);
        }
        
        throw new Error(result.error || 'Booking failed');
      }

      return result.sessionId?.toString() || '';
    },
    onSuccess: (sessionId) => {
      toast.success('Session booked successfully!');
      setCurrentStep('confirmation');
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['tutor-availability'] });
      queryClient.invalidateQueries({ queryKey: ['user-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-sessions'] });
    },
    onError: (error) => {
      toast.error('Failed to book session. Please try again.');
      addError({
        step: 'payment',
        message: error.message || 'Booking failed. Please try again.',
        code: 'BOOKING_FAILED'
      });
    }
  });

  // Memoized computed values
  const hasErrors = useMemo(() => errors.length > 0, [errors]);
  const hasConflicts = useMemo(() => conflicts.length > 0, [conflicts]);
  const canGoNext = useMemo(() => storeValidateCurrentStep() && !hasConflicts, [storeValidateCurrentStep, hasConflicts]);
  const canGoPrevious = useMemo(() => {
    const stepOrder = ['tutor', 'time', 'details', 'payment', 'confirmation'];
    return stepOrder.indexOf(currentStep) > 0;
  }, [currentStep]);

  const suggestedTimeSlots = useMemo(() => {
    return conflicts
      .filter(conflict => conflict.suggestedSlots)
      .flatMap(conflict => conflict.suggestedSlots || []);
  }, [conflicts]);

  // Helper functions
  const convertToTimeSlot = useCallback((date: Date): TimeSlot => {
    return {
      id: `slot_${date.getTime()}`,
      date: format(date, 'yyyy-MM-dd'),
      startTime: format(date, 'HH:mm'),
      endTime: format(new Date(date.getTime() + 60 * 60 * 1000), 'HH:mm'), // 1 hour default
      timezone: selectedTutor?.timezone || 'UTC',
      isAvailable: true
    };
  }, [selectedTutor]);

  const calculateTotalPrice = useCallback((): number => {
    if (!selectedTutor || !bookingDetails.duration) return 0;
    
    const hourlyRate = selectedTutor.hourlyRate;
    const duration = bookingDetails.duration / 60; // Convert minutes to hours
    const basePrice = hourlyRate * duration;
    
    // Apply any discounts or fees
    let totalPrice = basePrice;
    
    // Recurring session discount
    if (bookingDetails.sessionType === 'recurring') {
      totalPrice *= 0.9; // 10% discount for recurring sessions
    }
    
    return Math.round(totalPrice * 100) / 100; // Round to 2 decimal places
  }, [selectedTutor, bookingDetails]);

  const getEstimatedDuration = useCallback((): number => {
    return bookingDetails.duration || 60; // Default to 60 minutes
  }, [bookingDetails.duration]);

  const formatTimeSlot = useCallback((slot: TimeSlot): string => {
    const date = parseISO(slot.date);
    const startTime = slot.startTime;
    const endTime = slot.endTime;
    
    return `${format(date, 'EEEE, MMMM d, yyyy')} at ${startTime} - ${endTime} (${slot.timezone})`;
  }, []);

  // Enhanced action handlers
  const selectTutor = useCallback((tutor: SelectedTutor) => {
    storeSelectTutor(tutor);
    storeClearErrors();
    storeClearConflicts();
    
    // Auto-load availability if enabled
    if (autoLoadAvailability) {
      refetchAvailability();
    }
  }, [storeSelectTutor, storeClearErrors, storeClearConflicts, autoLoadAvailability, refetchAvailability]);

  const selectTimeSlot = useCallback(async (slot: TimeSlot) => {
    storeSelectTimeSlot(slot);
    storeClearConflicts();
    
    // Auto-check conflicts
    if (selectedTutor && user) {
      await conflictCheckMutation.mutateAsync(slot);
    }
  }, [storeSelectTimeSlot, storeClearConflicts, selectedTutor, user, conflictCheckMutation]);

  const updateBookingDetails = useCallback((details: Partial<BookingDetails>) => {
    storeUpdateBookingDetails(details);
    
    // Recalculate price if duration changed
    if (details.duration && paymentInfo.totalAmount !== calculateTotalPrice()) {
      storeUpdatePaymentInfo({ totalAmount: calculateTotalPrice() });
    }
  }, [storeUpdateBookingDetails, paymentInfo.totalAmount, calculateTotalPrice, storeUpdatePaymentInfo]);

  const updatePaymentInfo = useCallback((payment: Partial<PaymentInfo>) => {
    storeUpdatePaymentInfo(payment);
  }, [storeUpdatePaymentInfo]);

  const loadAvailability = useCallback(async (tutorId: string, date?: string) => {
    await loadAvailableTimeSlots(tutorId, date);
  }, [loadAvailableTimeSlots]);

  const checkConflicts = useCallback(async (slot: TimeSlot) => {
    if (conflictCheckMutation.isPending) return;
    await conflictCheckMutation.mutateAsync(slot);
  }, [conflictCheckMutation]);

  const refreshAvailability = useCallback(() => {
    refetchAvailability();
  }, [refetchAvailability]);

  const goToStep = useCallback((step: string) => {
    setCurrentStep(step as any);
  }, [setCurrentStep]);

  const submitBooking = useCallback(async (): Promise<string | null> => {
    if (enableOptimisticUpdates) {
      return await storeSubmitBooking();
    } else {
      try {
        return await bookingMutation.mutateAsync();
      } catch (error) {
        return null;
      }
    }
  }, [enableOptimisticUpdates, storeSubmitBooking, bookingMutation]);

  const retryBooking = useCallback(async (bookingId: string) => {
    await retryFailedBooking(bookingId);
  }, [retryFailedBooking]);

  const cancelBooking = useCallback(async (bookingId: string) => {
    try {
      // In a real app, this would call the session API to cancel
      const sessionId = parseInt(bookingId);
      await sessionAPI.cancelSession(sessionId, user?.id || 0, 'Cancelled by user');
      
      toast.success('Booking cancelled successfully');
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['user-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['tutor-availability'] });
    } catch (error) {
      toast.error('Failed to cancel booking');
      throw error;
    }
  }, [user, queryClient]);

  const validateCurrentStep = useCallback((): boolean => {
    return storeValidateCurrentStep();
  }, [storeValidateCurrentStep]);

  const resetBookingFlow = useCallback(() => {
    storeResetBookingFlow();
    queryClient.removeQueries({ queryKey: ['tutor-availability'] });
  }, [storeResetBookingFlow, queryClient]);

  const clearErrors = useCallback(() => {
    storeClearErrors();
  }, [storeClearErrors]);

  const clearConflicts = useCallback(() => {
    storeClearConflicts();
  }, [storeClearConflicts]);

  // Auto-update total price when dependencies change
  useEffect(() => {
    if (selectedTutor && bookingDetails.duration) {
      const newTotal = calculateTotalPrice();
      if (paymentInfo.totalAmount !== newTotal) {
        storeUpdatePaymentInfo({ totalAmount: newTotal });
      }
    }
  }, [selectedTutor, bookingDetails.duration, calculateTotalPrice, paymentInfo.totalAmount, storeUpdatePaymentInfo]);

  // Convert availability data to time slots
  const convertedTimeSlots = useMemo(() => {
    if (!availabilityData) return [];
    
    return availabilityData
      .filter((slot: AvailabilitySlot) => slot.isAvailable)
      .map((slot: AvailabilitySlot): TimeSlot => ({
        id: `slot_${slot.start.getTime()}`,
        date: format(slot.start, 'yyyy-MM-dd'),
        startTime: format(slot.start, 'HH:mm'),
        endTime: format(slot.end, 'HH:mm'),
        timezone: selectedTutor?.timezone || 'UTC',
        isAvailable: true
      }));
  }, [availabilityData, selectedTutor]);

  return {
    // Current state
    currentStep,
    selectedTutor,
    selectedTimeSlot,
    bookingDetails,
    paymentInfo,
    
    // Loading states
    isLoading,
    isSubmitting: isSubmitting || bookingMutation.isPending,
    isLoadingAvailability,
    isCheckingConflicts: conflictCheckMutation.isPending,
    
    // Error and conflict states
    errors,
    conflicts,
    hasErrors,
    hasConflicts,
    
    // Available data
    availableTimeSlots: convertedTimeSlots,
    suggestedTimeSlots,
    
    // Actions
    selectTutor,
    selectTimeSlot,
    updateBookingDetails,
    updatePaymentInfo,
    
    // Navigation
    goToNextStep: storeGoToNextStep,
    goToPreviousStep: storeGoToPreviousStep,
    goToStep,
    canGoNext,
    canGoPrevious,
    
    // Availability and conflicts
    loadAvailability,
    checkConflicts,
    refreshAvailability,
    
    // Booking operations
    submitBooking,
    retryBooking,
    cancelBooking,
    
    // Utility functions
    calculateTotalPrice,
    getEstimatedDuration,
    formatTimeSlot,
    validateCurrentStep,
    
    // Reset functions
    resetBookingFlow,
    clearErrors,
    clearConflicts
  };
}

// Additional hooks for specific use cases
export function useBookingValidation() {
  const { validateCurrentStep, errors, hasErrors } = useBooking();
  
  return {
    validateCurrentStep,
    errors,
    hasErrors,
    getErrorsForStep: (step: string) => errors.filter(error => error.step === step),
    hasErrorsForStep: (step: string) => errors.some(error => error.step === step)
  };
}

export function useBookingPrice() {
  const { calculateTotalPrice, selectedTutor, bookingDetails } = useBooking();
  
  const breakdown = useMemo(() => {
    if (!selectedTutor || !bookingDetails.duration) {
      return { basePrice: 0, discount: 0, total: 0 };
    }
    
    const basePrice = (selectedTutor.hourlyRate * bookingDetails.duration) / 60;
    const discount = bookingDetails.sessionType === 'recurring' ? basePrice * 0.1 : 0;
    const total = basePrice - discount;
    
    return {
      basePrice: Math.round(basePrice * 100) / 100,
      discount: Math.round(discount * 100) / 100,
      total: Math.round(total * 100) / 100
    };
  }, [selectedTutor, bookingDetails]);
  
  return {
    calculateTotalPrice,
    breakdown,
    currency: 'USD'
  };
}

export function useBookingConflicts() {
  const { conflicts, hasConflicts, suggestedTimeSlots, checkConflicts, clearConflicts } = useBooking();
  
  return {
    conflicts,
    hasConflicts,
    suggestedTimeSlots,
    checkConflicts,
    clearConflicts,
    hasTimeConflicts: conflicts.some(c => c.type === 'tutor_unavailable' || c.type === 'student_conflict'),
    hasPastTimeConflicts: conflicts.some(c => c.type === 'time_past'),
    hasPaymentConflicts: conflicts.some(c => c.type === 'payment_failed')
  };
}