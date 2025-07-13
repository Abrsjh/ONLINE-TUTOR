'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Calendar, 
  Clock, 
  CreditCard, 
  User, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft, 
  ArrowRight,
  Repeat,
  DollarSign,
  Globe,
  Info,
  Loader2,
  X,
  Plus,
  Minus
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import Calendar from '@/components/ui/calendar';
import { useBookingStore, type SelectedTutor, type TimeSlot, type BookingDetails, type PaymentInfo } from '@/lib/state/booking';
import { bookingSchema } from '@/lib/validations';
import { cn, dateUtils, currencyUtils, timezoneUtils } from '@/lib/utils';

// Booking form schema
const bookingFormSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  sessionType: z.enum(['one-time', 'recurring']),
  duration: z.number().min(30, 'Minimum duration is 30 minutes').max(180, 'Maximum duration is 180 minutes'),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
  recurringPattern: z.object({
    frequency: z.enum(['weekly', 'biweekly', 'monthly']),
    endDate: z.string().optional(),
    occurrences: z.number().min(1).max(52).optional(),
  }).optional(),
  paymentMethod: z.enum(['credit', 'card', 'paypal']),
  useCredits: z.boolean().optional(),
});

type BookingFormData = z.infer<typeof bookingFormSchema>;

// Mock data for subjects
const SUBJECTS = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'History',
  'Geography', 'Computer Science', 'Economics', 'Psychology', 'Art', 'Music'
];

// Mock payment methods
const PAYMENT_METHODS = [
  { id: 'credit', name: 'Wallet Credits', icon: DollarSign, description: 'Use your wallet balance' },
  { id: 'card', name: 'Credit/Debit Card', icon: CreditCard, description: 'Pay with card' },
  { id: 'paypal', name: 'PayPal', icon: Globe, description: 'Pay with PayPal' },
];

// Step indicator component
const StepIndicator = ({ currentStep, steps }: { currentStep: number; steps: string[] }) => (
  <div className="flex items-center justify-center mb-8">
    {steps.map((step, index) => (
      <React.Fragment key={step}>
        <div className="flex items-center">
          <div
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
              index < currentStep
                ? 'bg-green-500 text-white'
                : index === currentStep
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-500'
            )}
          >
            {index < currentStep ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              index + 1
            )}
          </div>
          <span
            className={cn(
              'ml-2 text-sm font-medium',
              index <= currentStep ? 'text-gray-900' : 'text-gray-500'
            )}
          >
            {step}
          </span>
        </div>
        {index < steps.length - 1 && (
          <div
            className={cn(
              'w-12 h-0.5 mx-4 transition-colors',
              index < currentStep ? 'bg-green-500' : 'bg-gray-200'
            )}
          />
        )}
      </React.Fragment>
    ))}
  </div>
);

// Tutor confirmation step
const TutorConfirmationStep = ({ tutor, onNext }: { tutor: SelectedTutor; onNext: () => void }) => (
  <div className="max-w-2xl mx-auto">
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-xl font-semibold mb-4">Confirm Your Tutor</h2>
      
      <div className="flex items-start space-x-4">
        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
          {tutor.avatar ? (
            <img src={tutor.avatar} alt={tutor.name} className="w-16 h-16 rounded-full object-cover" />
          ) : (
            <User className="w-8 h-8 text-gray-400" />
          )}
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-medium text-gray-900">{tutor.name}</h3>
          <div className="flex items-center mt-1">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'w-4 h-4 rounded-full',
                    i < Math.floor(tutor.rating) ? 'bg-yellow-400' : 'bg-gray-200'
                  )}
                />
              ))}
              <span className="ml-2 text-sm text-gray-600">{tutor.rating}/5</span>
            </div>
          </div>
          
          <div className="mt-2">
            <p className="text-sm text-gray-600">Subjects:</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {tutor.subjects.map((subject) => (
                <span
                  key={subject}
                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                >
                  {subject}
                </span>
              ))}
            </div>
          </div>
          
          <div className="mt-3 flex items-center justify-between">
            <span className="text-lg font-semibold text-green-600">
              {currencyUtils.formatCurrency(tutor.hourlyRate)}/hour
            </span>
            <span className="text-sm text-gray-500">
              Timezone: {tutor.timezone}
            </span>
          </div>
        </div>
      </div>
      
      <div className="mt-6 flex justify-end">
        <Button onClick={onNext} className="px-8">
          Continue with this tutor
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  </div>
);

// Time slot selection step
const TimeSlotSelectionStep = ({ 
  tutor, 
  selectedSlot, 
  onSlotSelect, 
  onNext, 
  onBack 
}: {
  tutor: SelectedTutor;
  selectedSlot: TimeSlot | null;
  onSlotSelect: (slot: TimeSlot) => void;
  onNext: () => void;
  onBack: () => void;
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [conflicts, setConflicts] = useState<string[]>([]);

  // Mock function to load available slots
  const loadTimeSlots = async (date: Date) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate mock time slots
      const slots: TimeSlot[] = [];
      const startHour = 9;
      const endHour = 17;
      
      for (let hour = startHour; hour < endHour; hour++) {
        const startTime = new Date(date);
        startTime.setHours(hour, 0, 0, 0);
        
        const endTime = new Date(startTime);
        endTime.setHours(hour + 1, 0, 0, 0);
        
        slots.push({
          id: `${date.toISOString().split('T')[0]}-${hour}`,
          date: date.toISOString().split('T')[0],
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          timezone: tutor.timezone,
          isAvailable: Math.random() > 0.3, // 70% availability
        });
      }
      
      setAvailableSlots(slots);
    } catch (error) {
      console.error('Error loading time slots:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimeSlots(selectedDate);
  }, [selectedDate]);

  const checkConflicts = async (slot: TimeSlot) => {
    // Mock conflict detection
    const hasConflict = Math.random() > 0.9; // 10% chance of conflict
    if (hasConflict) {
      setConflicts(['This time slot conflicts with another booking']);
    } else {
      setConflicts([]);
    }
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    onSlotSelect(slot);
    checkConflicts(slot);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">Select Date</h2>
          <Calendar
            value={selectedDate}
            onChange={setSelectedDate}
            minDate={new Date()}
            maxDate={dateUtils.addDays(new Date(), 90)}
            timezone={tutor.timezone}
            highlightToday
            className="w-full"
          />
        </div>

        {/* Time Slots */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">
            Available Times - {dateUtils.formatDate(selectedDate)}
          </h2>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="ml-2">Loading available times...</span>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {availableSlots.filter(slot => slot.isAvailable).map((slot) => (
                <button
                  key={slot.id}
                  onClick={() => handleSlotSelect(slot)}
                  className={cn(
                    'w-full p-3 text-left border rounded-lg transition-colors',
                    selectedSlot?.id === slot.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">
                        {dateUtils.formatTime(slot.startTime)} - {dateUtils.formatTime(slot.endTime)}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {timezoneUtils.formatInTimezone(slot.startTime, tutor.timezone, { timeZoneName: 'short' })}
                    </span>
                  </div>
                </button>
              ))}
              
              {availableSlots.filter(slot => slot.isAvailable).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No available time slots for this date
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Conflicts */}
      {conflicts.length > 0 && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800">Scheduling Conflict</h4>
              <ul className="mt-1 text-sm text-yellow-700">
                {conflicts.map((conflict, index) => (
                  <li key={index}>{conflict}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="mt-6 flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button 
          onClick={onNext} 
          disabled={!selectedSlot || conflicts.length > 0}
          className="px-8"
        >
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

// Session details step
const SessionDetailsStep = ({ 
  tutor,
  formData,
  onFormChange,
  onNext, 
  onBack 
}: {
  tutor: SelectedTutor;
  formData: Partial<BookingFormData>;
  onFormChange: (data: Partial<BookingFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}) => {
  const { control, handleSubmit, watch, formState: { errors } } = useForm<BookingFormData>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: formData,
  });

  const sessionType = watch('sessionType');
  const duration = watch('duration', 60);

  const onSubmit = (data: BookingFormData) => {
    onFormChange(data);
    onNext();
  };

  const calculateTotalSessions = () => {
    if (sessionType !== 'recurring' || !formData.recurringPattern) return 1;
    
    const { frequency, endDate, occurrences } = formData.recurringPattern;
    
    if (occurrences) return occurrences;
    
    if (endDate) {
      const start = new Date();
      const end = new Date(endDate);
      const weeks = Math.ceil((end.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));
      
      switch (frequency) {
        case 'weekly': return weeks;
        case 'biweekly': return Math.ceil(weeks / 2);
        case 'monthly': return Math.ceil(weeks / 4);
        default: return 1;
      }
    }
    
    return 1;
  };

  const totalCost = (tutor.hourlyRate * (duration / 60)) * calculateTotalSessions();

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-6">Session Details</h2>

          {/* Subject Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Subject *</label>
            <Controller
              name="subject"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a subject</option>
                  {SUBJECTS.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              )}
            />
            {errors.subject && (
              <p className="text-sm text-red-600">{errors.subject.message}</p>
            )}
          </div>

          {/* Session Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Session Type *</label>
            <Controller
              name="sessionType"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'one-time', label: 'One-time Session', icon: Clock },
                    { value: 'recurring', label: 'Recurring Sessions', icon: Repeat },
                  ].map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => field.onChange(value)}
                      className={cn(
                        'p-4 border rounded-lg text-left transition-colors',
                        field.value === value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <Icon className="w-5 h-5 mb-2 text-gray-600" />
                      <div className="font-medium">{label}</div>
                    </button>
                  ))}
                </div>
              )}
            />
            {errors.sessionType && (
              <p className="text-sm text-red-600">{errors.sessionType.message}</p>
            )}
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Duration (minutes) *</label>
            <Controller
              name="duration"
              control={control}
              render={({ field }) => (
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => field.onChange(Math.max(30, field.value - 15))}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <Input
                    type="number"
                    min={30}
                    max={180}
                    step={15}
                    {...field}
                    className="text-center"
                  />
                  <button
                    type="button"
                    onClick={() => field.onChange(Math.min(180, field.value + 15))}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              )}
            />
            {errors.duration && (
              <p className="text-sm text-red-600">{errors.duration.message}</p>
            )}
          </div>

          {/* Recurring Pattern */}
          {sessionType === 'recurring' && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900">Recurring Pattern</h3>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Frequency</label>
                <Controller
                  name="recurringPattern.frequency"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select frequency</option>
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Bi-weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">End Date</label>
                  <Controller
                    name="recurringPattern.endDate"
                    control={control}
                    render={({ field }) => (
                      <Input
                        type="date"
                        {...field}
                        min={dateUtils.formatDate(new Date(), { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-')}
                      />
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Or Number of Sessions</label>
                  <Controller
                    name="recurringPattern.occurrences"
                    control={control}
                    render={({ field }) => (
                      <Input
                        type="number"
                        min={1}
                        max={52}
                        placeholder="e.g., 10"
                        {...field}
                      />
                    )}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Additional Notes</label>
            <Controller
              name="notes"
              control={control}
              render={({ field }) => (
                <Textarea
                  {...field}
                  placeholder="Any specific topics or requirements for the session..."
                  rows={3}
                  maxLength={500}
                />
              )}
            />
            {errors.notes && (
              <p className="text-sm text-red-600">{errors.notes.message}</p>
            )}
          </div>

          {/* Cost Summary */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Cost Summary</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Rate per hour:</span>
                <span>{currencyUtils.formatCurrency(tutor.hourlyRate)}</span>
              </div>
              <div className="flex justify-between">
                <span>Session duration:</span>
                <span>{duration} minutes</span>
              </div>
              <div className="flex justify-between">
                <span>Cost per session:</span>
                <span>{currencyUtils.formatCurrency(tutor.hourlyRate * (duration / 60))}</span>
              </div>
              {sessionType === 'recurring' && (
                <>
                  <div className="flex justify-between">
                    <span>Number of sessions:</span>
                    <span>{calculateTotalSessions()}</span>
                  </div>
                  <div className="border-t border-blue-200 pt-1 mt-2">
                    <div className="flex justify-between font-medium">
                      <span>Total cost:</span>
                      <span>{currencyUtils.formatCurrency(totalCost)}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button type="submit" className="px-8">
            Continue
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </form>
    </div>
  );
};

// Payment method step
const PaymentMethodStep = ({ 
  totalAmount,
  formData,
  onFormChange,
  onNext, 
  onBack 
}: {
  totalAmount: number;
  formData: Partial<BookingFormData>;
  onFormChange: (data: Partial<BookingFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}) => {
  const [walletBalance] = useState(150.00); // Mock wallet balance
  const [selectedMethod, setSelectedMethod] = useState<string>(formData.paymentMethod || '');
  const [useCredits, setUseCredits] = useState(formData.useCredits || false);

  const creditAmount = useCredits ? Math.min(walletBalance, totalAmount) : 0;
  const remainingAmount = totalAmount - creditAmount;

  const handleNext = () => {
    onFormChange({
      ...formData,
      paymentMethod: selectedMethod as any,
      useCredits,
    });
    onNext();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-6">Payment Method</h2>

        {/* Cost Breakdown */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-3">Payment Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Total Amount:</span>
              <span className="font-medium">{currencyUtils.formatCurrency(totalAmount)}</span>
            </div>
            {useCredits && (
              <>
                <div className="flex justify-between text-green-600">
                  <span>Wallet Credits:</span>
                  <span>-{currencyUtils.formatCurrency(creditAmount)}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="flex justify-between font-medium">
                    <span>Amount to Pay:</span>
                    <span>{currencyUtils.formatCurrency(remainingAmount)}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Wallet Credits Option */}
        {walletBalance > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="use-credits"
                  checked={useCredits}
                  onChange={(e) => setUseCredits(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="use-credits" className="font-medium text-gray-900">
                  Use Wallet Credits
                </label>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Available Balance</div>
                <div className="font-medium text-green-600">
                  {currencyUtils.formatCurrency(walletBalance)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Methods */}
        {remainingAmount > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">Select Payment Method</h3>
            {PAYMENT_METHODS.map((method) => (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
                className={cn(
                  'w-full p-4 border rounded-lg text-left transition-colors',
                  selectedMethod === method.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <div className="flex items-center space-x-3">
                  <method.icon className="w-5 h-5 text-gray-600" />
                  <div>
                    <div className="font-medium">{method.name}</div>
                    <div className="text-sm text-gray-600">{method.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Security Notice */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Secure Payment</p>
              <p>Your payment information is encrypted and secure. You can cancel or reschedule your session up to 24 hours before the scheduled time.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-6 flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button 
          onClick={handleNext}
          disabled={remainingAmount > 0 && !selectedMethod}
          className="px-8"
        >
          Continue to Confirmation
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

// Booking confirmation step
const BookingConfirmationStep = ({ 
  tutor,
  timeSlot,
  formData,
  totalAmount,
  onConfirm,
  onBack,
  isSubmitting 
}: {
  tutor: SelectedTutor;
  timeSlot: TimeSlot;
  formData: BookingFormData;
  totalAmount: number;
  onConfirm: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}) => {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-6">Confirm Your Booking</h2>

        {/* Booking Summary */}
        <div className="space-y-6">
          {/* Tutor Info */}
          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
              {tutor.avatar ? (
                <img src={tutor.avatar} alt={tutor.name} className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <User className="w-6 h-6 text-gray-400" />
              )}
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{tutor.name}</h3>
              <p className="text-sm text-gray-600">Subject: {formData.subject}</p>
            </div>
          </div>

          {/* Session Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Date & Time</h4>
              <div className="text-sm text-gray-600">
                <p>{dateUtils.formatDate(timeSlot.startTime)}</p>
                <p>{dateUtils.formatTime(timeSlot.startTime)} - {dateUtils.formatTime(timeSlot.endTime)}</p>
                <p className="text-xs">({timeSlot.timezone})</p>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Session Type</h4>
              <div className="text-sm text-gray-600">
                <p className="capitalize">{formData.sessionType.replace('-', ' ')}</p>
                <p>{formData.duration} minutes</p>
              </div>
            </div>
          </div>

          {/* Recurring Pattern */}
          {formData.sessionType === 'recurring' && formData.recurringPattern && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Recurring Pattern</h4>
              <div className="text-sm text-gray-600">
                <p className="capitalize">{formData.recurringPattern.frequency}</p>
                {formData.recurringPattern.endDate && (
                  <p>Until: {dateUtils.formatDate(formData.recurringPattern.endDate)}</p>
                )}
                {formData.recurringPattern.occurrences && (
                  <p>Number of sessions: {formData.recurringPattern.occurrences}</p>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {formData.notes && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
              <p className="text-sm text-gray-600">{formData.notes}</p>
            </div>
          )}

          {/* Payment Summary */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Payment Summary</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Total Amount:</span>
                <span className="font-medium">{currencyUtils.formatCurrency(totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Method:</span>
                <span className="capitalize">{formData.paymentMethod}</span>
              </div>
              {formData.useCredits && (
                <div className="text-green-600">
                  <span>✓ Using wallet credits</span>
                </div>
              )}
            </div>
          </div>

          {/* Terms */}
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-medium text-yellow-800 mb-2">Cancellation Policy</h4>
            <p className="text-sm text-yellow-700">
              You can cancel or reschedule this session up to 24 hours before the scheduled time for a full refund. 
              Cancellations within 24 hours may be subject to a cancellation fee.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-6 flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={isSubmitting}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button 
          onClick={onConfirm}
          disabled={isSubmitting}
          loading={isSubmitting}
          loadingText="Confirming Booking..."
          className="px-8"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Confirming...
            </>
          ) : (
            <>
              Confirm Booking
              <CheckCircle className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

// Success step
const BookingSuccessStep = ({ bookingId }: { bookingId: string }) => {
  const router = useRouter();

  return (
    <div className="max-w-2xl mx-auto text-center">
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Booking Confirmed!</h2>
        <p className="text-gray-600 mb-6">
          Your session has been successfully booked. You'll receive a confirmation email shortly.
        </p>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-600">Booking ID</p>
          <p className="font-mono text-lg">{bookingId}</p>
        </div>

        <div className="space-y-3">
          <Button 
            onClick={() => router.push('/dashboard/sessions')}
            className="w-full"
          >
            View My Sessions
          </Button>
          <Button 
            variant="outline"
            onClick={() => router.push('/dashboard')}
            className="w-full"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

// Main booking page component
export default function BookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    currentStep,
    selectedTutor,
    selectedTimeSlot,
    bookingDetails,
    paymentInfo,
    isSubmitting,
    errors,
    conflicts,
    setCurrentStep,
    selectTutor,
    selectTimeSlot,
    updateBookingDetails,
    updatePaymentInfo,
    submitBooking,
    goToNextStep,
    goToPreviousStep,
    resetBookingFlow,
  } = useBookingStore();

  const [formData, setFormData] = useState<Partial<BookingFormData>>({});
  const [bookingId, setBookingId] = useState<string | null>(null);

  const steps = ['Tutor', 'Time', 'Details', 'Payment', 'Confirmation'];
  const currentStepIndex = steps.findIndex(step => step.toLowerCase() === currentStep);

  // Initialize tutor from URL params
  useEffect(() => {
    const tutorId = searchParams.get('tutorId');
    if (tutorId && !selectedTutor) {
      // Mock tutor data - in real app, fetch from API
      const mockTutor: SelectedTutor = {
        id: tutorId,
        name: 'Dr. Sarah Johnson',
        avatar: '',
        subjects: ['Mathematics', 'Physics'],
        hourlyRate: 45,
        rating: 4.8,
        timezone: 'America/New_York',
      };
      selectTutor(mockTutor);
    }
  }, [searchParams, selectedTutor, selectTutor]);

  // Calculate total amount
  const totalAmount = useMemo(() => {
    if (!selectedTutor || !formData.duration) return 0;
    
    const sessionCost = selectedTutor.hourlyRate * (formData.duration / 60);
    
    if (formData.sessionType === 'recurring' && formData.recurringPattern) {
      const { frequency, endDate, occurrences } = formData.recurringPattern;
      
      if (occurrences) return sessionCost * occurrences;
      
      if (endDate) {
        const start = new Date();
        const end = new Date(endDate);
        const weeks = Math.ceil((end.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));
        
        switch (frequency) {
          case 'weekly': return sessionCost * weeks;
          case 'biweekly': return sessionCost * Math.ceil(weeks / 2);
          case 'monthly': return sessionCost * Math.ceil(weeks / 4);
          default: return sessionCost;
        }
      }
    }
    
    return sessionCost;
  }, [selectedTutor, formData]);

  const handleFormChange = (data: Partial<BookingFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
    updateBookingDetails(data as any);
  };

  const handleConfirmBooking = async () => {
    const id = await submitBooking();
    if (id) {
      setBookingId(id);
    }
  };

  // Show success step if booking is confirmed
  if (bookingId) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <BookingSuccessStep bookingId={bookingId} />
        </div>
      </div>
    );
  }

  // Redirect if no tutor selected
  if (!selectedTutor) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-md mx-auto bg-white rounded-lg border border-gray-200 p-8">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Tutor Selected</h2>
            <p className="text-gray-600 mb-6">
              Please select a tutor first before booking a session.
            </p>
            <Button onClick={() => router.push('/dashboard/tutors')}>
              Browse Tutors
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Book a Session</h1>
            <Button
              variant="outline"
              onClick={() => {
                resetBookingFlow();
                router.push('/dashboard/tutors');
              }}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
          
          <StepIndicator currentStep={currentStepIndex} steps={steps} />
        </div>

        {/* Error Display */}
        {errors.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-800">Please fix the following errors:</h4>
                <ul className="mt-1 text-sm text-red-700">
                  {errors.map((error, index) => (
                    <li key={index}>{error.message}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Step Content */}
        {currentStep === 'tutor' && (
          <TutorConfirmationStep
            tutor={selectedTutor}
            onNext={goToNextStep}
          />
        )}

        {currentStep === 'time' && (
          <TimeSlotSelectionStep
            tutor={selectedTutor}
            selectedSlot={selectedTimeSlot}
            onSlotSelect={selectTimeSlot}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
          />
        )}

        {currentStep === 'details' && (
          <SessionDetailsStep
            tutor={selectedTutor}
            formData={formData}
            onFormChange={handleFormChange}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
          />
        )}

        {currentStep === 'payment' && (
          <PaymentMethodStep
            totalAmount={totalAmount}
            formData={formData}
            onFormChange={handleFormChange}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
          />
        )}

        {currentStep === 'confirmation' && selectedTimeSlot && (
          <BookingConfirmationStep
            tutor={selectedTutor}
            timeSlot={selectedTimeSlot}
            formData={formData as BookingFormData}
            totalAmount={totalAmount}
            onConfirm={handleConfirmBooking}
            onBack={goToPreviousStep}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </div>
  );
}