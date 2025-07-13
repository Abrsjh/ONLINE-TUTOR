'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  CreditCard,
  User,
  BookOpen,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar, TimeSlot } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

// Validation schemas for each step
const tutorSelectionSchema = z.object({
  tutorId: z.string().min(1, 'Please select a tutor'),
  subject: z.string().min(1, 'Please select a subject'),
});

const scheduleSchema = z.object({
  date: z.date({ required_error: 'Please select a date' }),
  timeSlot: z.object({
    id: z.string(),
    start: z.date(),
    end: z.date(),
    available: z.boolean(),
    price: z.number().optional(),
  }),
  timezone: z.string(),
  recurring: z.boolean().default(false),
  recurrencePattern: z.enum(['weekly', 'biweekly', 'monthly']).optional(),
  recurrenceEnd: z.date().optional(),
});

const sessionDetailsSchema = z.object({
  sessionType: z.enum(['individual', 'group']),
  duration: z.number().min(30).max(180),
  notes: z.string().max(500).optional(),
  materials: z.array(z.string()).optional(),
  learningObjectives: z.string().max(1000).optional(),
});

const paymentSchema = z.object({
  paymentMethod: z.enum(['card', 'wallet', 'paypal']),
  cardNumber: z.string().optional(),
  expiryDate: z.string().optional(),
  cvv: z.string().optional(),
  billingAddress: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    country: z.string(),
  }).optional(),
  savePaymentMethod: z.boolean().default(false),
});

const bookingSchema = tutorSelectionSchema
  .merge(scheduleSchema)
  .merge(sessionDetailsSchema)
  .merge(paymentSchema);

type BookingFormData = z.infer<typeof bookingSchema>;

export interface Tutor {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  subjects: string[];
  hourlyRate: number;
  availability: TimeSlot[];
  bio: string;
  experience: number;
}

export interface BookingWizardProps {
  tutors?: Tutor[];
  selectedTutorId?: string;
  onBookingComplete?: (booking: BookingFormData) => Promise<void>;
  onCancel?: () => void;
  className?: string;
  initialData?: Partial<BookingFormData>;
}

const STEPS = [
  { id: 'tutor', title: 'Select Tutor', icon: User },
  { id: 'schedule', title: 'Choose Schedule', icon: CalendarIcon },
  { id: 'details', title: 'Session Details', icon: BookOpen },
  { id: 'payment', title: 'Payment', icon: CreditCard },
  { id: 'confirmation', title: 'Confirmation', icon: CheckCircle },
] as const;

type StepId = typeof STEPS[number]['id'];

export function BookingWizard({
  tutors = [],
  selectedTutorId,
  onBookingComplete,
  onCancel,
  className,
  initialData,
}: BookingWizardProps) {
  const [currentStep, setCurrentStep] = useState<StepId>('tutor');
  const [completedSteps, setCompletedSteps] = useState<Set<StepId>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);

  const methods = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      tutorId: selectedTutorId || '',
      subject: '',
      sessionType: 'individual',
      duration: 60,
      recurring: false,
      paymentMethod: 'card',
      savePaymentMethod: false,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      ...initialData,
    },
    mode: 'onChange',
  });

  const { watch, setValue, trigger, getValues, formState: { errors } } = methods;
  const watchedValues = watch();

  // Load saved data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('booking-wizard-data');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        Object.keys(parsed).forEach((key) => {
          if (key === 'date' || key === 'recurrenceEnd') {
            setValue(key as any, new Date(parsed[key]));
          } else if (key === 'timeSlot' && parsed[key]) {
            setValue(key as any, {
              ...parsed[key],
              start: new Date(parsed[key].start),
              end: new Date(parsed[key].end),
            });
          } else {
            setValue(key as any, parsed[key]);
          }
        });
      } catch (error) {
        console.error('Failed to load saved booking data:', error);
      }
    }
  }, [setValue]);

  // Save data to localStorage whenever form data changes
  useEffect(() => {
    const dataToSave = { ...watchedValues };
    if (dataToSave.date) {
      dataToSave.date = dataToSave.date.toISOString();
    }
    if (dataToSave.recurrenceEnd) {
      dataToSave.recurrenceEnd = dataToSave.recurrenceEnd.toISOString();
    }
    if (dataToSave.timeSlot) {
      dataToSave.timeSlot = {
        ...dataToSave.timeSlot,
        start: dataToSave.timeSlot.start.toISOString(),
        end: dataToSave.timeSlot.end.toISOString(),
      };
    }
    localStorage.setItem('booking-wizard-data', JSON.stringify(dataToSave));
  }, [watchedValues]);

  // Update selected tutor when tutorId changes
  useEffect(() => {
    if (watchedValues.tutorId) {
      const tutor = tutors.find(t => t.id === watchedValues.tutorId);
      setSelectedTutor(tutor || null);
    }
  }, [watchedValues.tutorId, tutors]);

  const getCurrentStepIndex = () => STEPS.findIndex(step => step.id === currentStep);

  const validateCurrentStep = async (): Promise<boolean> => {
    let fieldsToValidate: (keyof BookingFormData)[] = [];

    switch (currentStep) {
      case 'tutor':
        fieldsToValidate = ['tutorId', 'subject'];
        break;
      case 'schedule':
        fieldsToValidate = ['date', 'timeSlot', 'timezone'];
        break;
      case 'details':
        fieldsToValidate = ['sessionType', 'duration'];
        break;
      case 'payment':
        fieldsToValidate = ['paymentMethod'];
        if (watchedValues.paymentMethod === 'card') {
          fieldsToValidate.push('cardNumber', 'expiryDate', 'cvv');
        }
        break;
    }

    const isValid = await trigger(fieldsToValidate);
    return isValid;
  };

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (!isValid) return;

    setCompletedSteps(prev => new Set([...prev, currentStep]));
    
    const currentIndex = getCurrentStepIndex();
    if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1].id);
    }
  };

  const handlePrevious = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1].id);
    }
  };

  const handleStepClick = (stepId: StepId) => {
    const stepIndex = STEPS.findIndex(step => step.id === stepId);
    const currentIndex = getCurrentStepIndex();
    
    // Allow going back to completed steps or the next immediate step
    if (stepIndex <= currentIndex || completedSteps.has(stepId)) {
      setCurrentStep(stepId);
    }
  };

  const handleSubmit = async () => {
    const isValid = await trigger();
    if (!isValid) return;

    setIsSubmitting(true);
    setBookingError(null);

    try {
      const formData = getValues();
      await onBookingComplete?.(formData);
      
      // Clear saved data on successful submission
      localStorage.removeItem('booking-wizard-data');
      
      setCurrentStep('confirmation');
      setCompletedSteps(new Set(STEPS.map(step => step.id)));
    } catch (error) {
      setBookingError(error instanceof Error ? error.message : 'Failed to complete booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateTotalPrice = (): number => {
    if (!selectedTutor || !watchedValues.timeSlot) return 0;
    
    const basePrice = selectedTutor.hourlyRate * (watchedValues.duration / 60);
    const sessionTypeMultiplier = watchedValues.sessionType === 'group' ? 0.8 : 1;
    
    return basePrice * sessionTypeMultiplier;
  };

  const renderProgressIndicator = () => (
    <div className="flex items-center justify-between mb-8">
      {STEPS.map((step, index) => {
        const isActive = step.id === currentStep;
        const isCompleted = completedSteps.has(step.id);
        const isClickable = index <= getCurrentStepIndex() || isCompleted;
        const Icon = step.icon;

        return (
          <React.Fragment key={step.id}>
            <button
              onClick={() => isClickable && handleStepClick(step.id)}
              disabled={!isClickable}
              className={cn(
                'flex flex-col items-center space-y-2 transition-all',
                isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
              )}
            >
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all',
                  isActive && 'border-blue-600 bg-blue-600 text-white',
                  isCompleted && !isActive && 'border-green-600 bg-green-600 text-white',
                  !isActive && !isCompleted && 'border-gray-300 bg-white text-gray-400'
                )}
              >
                {isCompleted && !isActive ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>
              <span
                className={cn(
                  'text-sm font-medium transition-colors',
                  isActive && 'text-blue-600',
                  isCompleted && !isActive && 'text-green-600',
                  !isActive && !isCompleted && 'text-gray-400'
                )}
              >
                {step.title}
              </span>
            </button>
            
            {index < STEPS.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-0.5 mx-4 transition-colors',
                  isCompleted ? 'bg-green-600' : 'bg-gray-300'
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );

  const renderTutorSelection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select a Tutor</h3>
        <div className="grid gap-4">
          {tutors.map((tutor) => (
            <button
              key={tutor.id}
              onClick={() => setValue('tutorId', tutor.id)}
              className={cn(
                'p-4 border rounded-lg text-left transition-all hover:border-blue-300',
                watchedValues.tutorId === tutor.id
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 bg-white'
              )}
            >
              <div className="flex items-center space-x-4">
                <img
                  src={tutor.avatar}
                  alt={tutor.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{tutor.name}</h4>
                  <p className="text-sm text-gray-600">{tutor.bio}</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className="text-sm text-yellow-600">
                      ★ {tutor.rating}
                    </span>
                    <span className="text-sm text-gray-600">
                      {tutor.experience} years exp.
                    </span>
                    <span className="text-sm font-medium text-green-600">
                      ${tutor.hourlyRate}/hour
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedTutor && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Subject
          </label>
          <select
            value={watchedValues.subject}
            onChange={(e) => setValue('subject', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Choose a subject</option>
            {selectedTutor.subjects.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
          {errors.subject && (
            <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>
          )}
        </div>
      )}
    </div>
  );

  const renderScheduleSelection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Schedule</h3>
        
        <Calendar
          value={watchedValues.date}
          onChange={(date) => setValue('date', date)}
          onTimeSlotSelect={(timeSlot) => setValue('timeSlot', timeSlot)}
          timeSlots={selectedTutor?.availability || []}
          view="month"
          showTimeSlots={!!watchedValues.date}
          timezone={watchedValues.timezone}
          minDate={new Date()}
          className="mb-6"
        />

        {watchedValues.timeSlot && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2 text-blue-800">
              <Clock className="w-4 h-4" />
              <span className="font-medium">
                Selected: {watchedValues.timeSlot.start.toLocaleString()} - {watchedValues.timeSlot.end.toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>

      <div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={watchedValues.recurring}
            onChange={(e) => setValue('recurring', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">
            Make this a recurring session
          </span>
        </label>

        {watchedValues.recurring && (
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Repeat every
              </label>
              <select
                value={watchedValues.recurrencePattern || 'weekly'}
                onChange={(e) => setValue('recurrencePattern', e.target.value as any)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="weekly">Week</option>
                <option value="biweekly">2 Weeks</option>
                <option value="monthly">Month</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End date
              </label>
              <input
                type="date"
                value={watchedValues.recurrenceEnd?.toISOString().split('T')[0] || ''}
                onChange={(e) => setValue('recurrenceEnd', new Date(e.target.value))}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderSessionDetails = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Details</h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Session Type
        </label>
        <div className="grid grid-cols-2 gap-4">
          {[
            { value: 'individual', label: 'Individual', description: 'One-on-one session' },
            { value: 'group', label: 'Group', description: 'Small group session (20% discount)' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setValue('sessionType', option.value as any)}
              className={cn(
                'p-4 border rounded-lg text-left transition-all',
                watchedValues.sessionType === option.value
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              )}
            >
              <div className="font-medium text-gray-900">{option.label}</div>
              <div className="text-sm text-gray-600">{option.description}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Duration (minutes)
        </label>
        <select
          value={watchedValues.duration}
          onChange={(e) => setValue('duration', parseInt(e.target.value))}
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value={30}>30 minutes</option>
          <option value={60}>1 hour</option>
          <option value={90}>1.5 hours</option>
          <option value={120}>2 hours</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Learning Objectives (Optional)
        </label>
        <textarea
          value={watchedValues.learningObjectives || ''}
          onChange={(e) => setValue('learningObjectives', e.target.value)}
          placeholder="What would you like to achieve in this session?"
          rows={3}
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Additional Notes (Optional)
        </label>
        <textarea
          value={watchedValues.notes || ''}
          onChange={(e) => setValue('notes', e.target.value)}
          placeholder="Any special requirements or notes for the tutor?"
          rows={3}
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>
  );

  const renderPayment = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h3>

      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Order Summary</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Session with {selectedTutor?.name}</span>
            <span>${selectedTutor?.hourlyRate}/hour</span>
          </div>
          <div className="flex justify-between">
            <span>Duration</span>
            <span>{watchedValues.duration} minutes</span>
          </div>
          {watchedValues.sessionType === 'group' && (
            <div className="flex justify-between text-green-600">
              <span>Group discount (20%)</span>
              <span>-${(calculateTotalPrice() * 0.2).toFixed(2)}</span>
            </div>
          )}
          <div className="border-t border-gray-300 pt-2 flex justify-between font-medium">
            <span>Total</span>
            <span>${calculateTotalPrice().toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Payment Method
        </label>
        <div className="space-y-3">
          {[
            { value: 'card', label: 'Credit/Debit Card', icon: CreditCard },
            { value: 'wallet', label: 'Wallet Balance', icon: User },
            { value: 'paypal', label: 'PayPal', icon: CreditCard },
          ].map((method) => {
            const Icon = method.icon;
            return (
              <button
                key={method.value}
                onClick={() => setValue('paymentMethod', method.value as any)}
                className={cn(
                  'w-full p-3 border rounded-lg flex items-center space-x-3 transition-all',
                  watchedValues.paymentMethod === method.value
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                )}
              >
                <Icon className="w-5 h-5 text-gray-600" />
                <span className="font-medium text-gray-900">{method.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {watchedValues.paymentMethod === 'card' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Card Number
            </label>
            <input
              type="text"
              value={watchedValues.cardNumber || ''}
              onChange={(e) => setValue('cardNumber', e.target.value)}
              placeholder="1234 5678 9012 3456"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expiry Date
              </label>
              <input
                type="text"
                value={watchedValues.expiryDate || ''}
                onChange={(e) => setValue('expiryDate', e.target.value)}
                placeholder="MM/YY"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CVV
              </label>
              <input
                type="text"
                value={watchedValues.cvv || ''}
                onChange={(e) => setValue('cvv', e.target.value)}
                placeholder="123"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={watchedValues.savePaymentMethod}
              onChange={(e) => setValue('savePaymentMethod', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              Save this payment method for future use
            </span>
          </label>
        </div>
      )}
    </div>
  );

  const renderConfirmation = () => (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle className="w-8 h-8 text-green-600" />
      </div>
      
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Booking Confirmed!
        </h3>
        <p className="text-gray-600">
          Your session has been successfully booked. You'll receive a confirmation email shortly.
        </p>
      </div>

      <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg text-left">
        <h4 className="font-medium text-gray-900 mb-4">Session Details</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Tutor:</span>
            <span className="font-medium">{selectedTutor?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Subject:</span>
            <span className="font-medium">{watchedValues.subject}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Date & Time:</span>
            <span className="font-medium">
              {watchedValues.timeSlot?.start.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Duration:</span>
            <span className="font-medium">{watchedValues.duration} minutes</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Total Paid:</span>
            <span className="font-medium">${calculateTotalPrice().toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="flex space-x-4 justify-center">
        <Button
          onClick={() => window.location.href = '/dashboard/sessions'}
          variant="outline"
        >
          View Sessions
        </Button>
        <Button
          onClick={() => window.location.href = '/dashboard'}
        >
          Go to Dashboard
        </Button>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'tutor':
        return renderTutorSelection();
      case 'schedule':
        return renderScheduleSelection();
      case 'details':
        return renderSessionDetails();
      case 'payment':
        return renderPayment();
      case 'confirmation':
        return renderConfirmation();
      default:
        return null;
    }
  };

  return (
    <FormProvider {...methods}>
      <div className={cn('max-w-4xl mx-auto p-6 bg-white', className)}>
        {renderProgressIndicator()}

        <div className="min-h-[500px]">
          {renderCurrentStep()}
        </div>

        {bookingError && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span className="text-red-700">{bookingError}</span>
          </div>
        )}

        {currentStep !== 'confirmation' && (
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            <div>
              {getCurrentStepIndex() > 0 && (
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={isSubmitting}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
              )}
            </div>

            <div className="flex space-x-4">
              <Button
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>

              {currentStep === 'payment' ? (
                <Button
                  onClick={handleSubmit}
                  loading={isSubmitting}
                  loadingText="Processing..."
                >
                  Complete Booking
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  disabled={isSubmitting}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </FormProvider>
  );
}

export default BookingWizard;