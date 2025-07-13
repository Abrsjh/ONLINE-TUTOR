'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useBookingStore, useBookingTotal, useIsBookingComplete } from '@/lib/store';
import Calendar from '@/components/Calendar';
import TimeSlotPicker from '@/components/TimeSlotPicker';
import { UserIcon, ClockIcon, CalendarIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

const BookingPage = () => {
  const router = useRouter();
  const {
    selectedTutor,
    selectedDate,
    selectedTime,
    sessionDuration,
    setSessionDuration,
    clearBooking
  } = useBookingStore();
  
  const totalCost = useBookingTotal();
  const isBookingComplete = useIsBookingComplete();
  
  const [isLoading, setIsLoading] = useState(false);
  const [studentInfo, setStudentInfo] = useState({
    name: '',
    email: '',
    phone: '',
    notes: ''
  });

  // Redirect if no tutor is selected
  useEffect(() => {
    if (!selectedTutor) {
      toast.error('Please select a tutor first');
      router.push('/tutors');
    }
  }, [selectedTutor, router]);

  // Don't render if no tutor is selected
  if (!selectedTutor) {
    return null;
  }

  const handleStudentInfoChange = (field: string, value: string) => {
    setStudentInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateBooking = (): boolean => {
    if (!selectedDate) {
      toast.error('Please select a date');
      return false;
    }
    
    if (!selectedTime) {
      toast.error('Please select a time slot');
      return false;
    }
    
    if (!studentInfo.name.trim()) {
      toast.error('Please enter your name');
      return false;
    }
    
    if (!studentInfo.email.trim()) {
      toast.error('Please enter your email');
      return false;
    }
    
    if (!studentInfo.phone.trim()) {
      toast.error('Please enter your phone number');
      return false;
    }

    return true;
  };

  const handleConfirmBooking = async () => {
    if (!validateBooking()) return;

    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Booking confirmed successfully!');
      router.push('/booking/success');
    } catch (error) {
      toast.error('Failed to confirm booking. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const sessionDurationOptions = [
    { value: 1, label: '1 hour', description: 'Perfect for quick help or review' },
    { value: 1.5, label: '1.5 hours', description: 'Good for focused learning sessions' },
    { value: 2, label: '2 hours', description: 'Ideal for comprehensive tutoring' },
    { value: 3, label: '3 hours', description: 'Extended learning session' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Book a Session</h1>
          <p className="text-gray-600">Complete your booking with {selectedTutor.name}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Booking Form */}
          <div className="lg:col-span-2 space-y-8">
            {/* Tutor Summary */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Selected Tutor</h2>
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                  <UserIcon className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">{selectedTutor.name}</h3>
                  <p className="text-gray-600 mb-2">{selectedTutor.subjects.join(', ')}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center">
                      <CurrencyDollarIcon className="w-4 h-4 mr-1" />
                      ${selectedTutor.hourlyRate}/hour
                    </span>
                    <span>⭐ {selectedTutor.rating} ({selectedTutor.totalReviews} reviews)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Date Selection */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <CalendarIcon className="w-5 h-5 mr-2" />
                Select Date
              </h2>
              <Calendar 
                tutor={selectedTutor} 
                mode="interactive"
                className="border-0 p-0"
              />
            </div>

            {/* Time Selection */}
            {selectedDate && (
              <div className="bg-white rounded-lg border border-gray-200">
                <TimeSlotPicker className="border-0" />
              </div>
            )}

            {/* Session Duration */}
            {selectedTime && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <ClockIcon className="w-5 h-5 mr-2" />
                  Session Duration
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {sessionDurationOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSessionDuration(option.value)}
                      className={`p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                        sessionDuration === option.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-gray-900">{option.label}</div>
                      <div className="text-sm text-gray-500 mt-1">{option.description}</div>
                      <div className="text-sm font-medium text-blue-600 mt-2">
                        ${(selectedTutor.hourlyRate * option.value).toFixed(0)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Student Information */}
            {isBookingComplete && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={studentInfo.name}
                      onChange={(e) => handleStudentInfoChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={studentInfo.email}
                      onChange={(e) => handleStudentInfoChange('email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your email"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      value={studentInfo.phone}
                      onChange={(e) => handleStudentInfoChange('phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your phone number"
                    />
                  </div>
                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                      Additional Notes
                    </label>
                    <textarea
                      id="notes"
                      value={studentInfo.notes}
                      onChange={(e) => handleStudentInfoChange('notes', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="Any specific topics or questions you'd like to focus on?"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Booking Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Booking Summary</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <span className="text-gray-600">Tutor:</span>
                  <span className="font-medium text-gray-900 text-right">{selectedTutor.name}</span>
                </div>
                
                {selectedDate && (
                  <div className="flex justify-between items-start">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium text-gray-900 text-right">
                      {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                    </span>
                  </div>
                )}
                
                {selectedTime && (
                  <div className="flex justify-between items-start">
                    <span className="text-gray-600">Time:</span>
                    <span className="font-medium text-gray-900">{selectedTime}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-start">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium text-gray-900">
                    {sessionDuration} {sessionDuration === 1 ? 'hour' : 'hours'}
                  </span>
                </div>
                
                <div className="flex justify-between items-start">
                  <span className="text-gray-600">Hourly Rate:</span>
                  <span className="font-medium text-gray-900">${selectedTutor.hourlyRate}</span>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Total:</span>
                    <span className="text-2xl font-bold text-blue-600">${totalCost.toFixed(0)}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 space-y-3">
                {isBookingComplete && studentInfo.name && studentInfo.email && studentInfo.phone ? (
                  <button
                    onClick={handleConfirmBooking}
                    disabled={isLoading}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Confirming...
                      </div>
                    ) : (
                      'Confirm Booking'
                    )}
                  </button>
                ) : (
                  <div className="w-full bg-gray-100 text-gray-500 py-3 px-4 rounded-lg font-medium text-center">
                    Complete all steps to confirm
                  </div>
                )}
                
                <button
                  onClick={() => router.push('/tutors')}
                  className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200"
                >
                  Choose Different Tutor
                </button>
                
                <button
                  onClick={() => {
                    clearBooking();
                    router.push('/');
                  }}
                  className="w-full text-gray-500 py-2 px-4 rounded-lg font-medium hover:text-gray-700 transition-colors duration-200"
                >
                  Cancel Booking
                </button>
              </div>

              {/* Progress Indicator */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-600 mb-2">Booking Progress</div>
                <div className="space-y-2">
                  <div className={`flex items-center text-sm ${selectedDate ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`w-4 h-4 rounded-full mr-2 ${selectedDate ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    Date Selected
                  </div>
                  <div className={`flex items-center text-sm ${selectedTime ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`w-4 h-4 rounded-full mr-2 ${selectedTime ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    Time Selected
                  </div>
                  <div className={`flex items-center text-sm ${studentInfo.name && studentInfo.email && studentInfo.phone ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`w-4 h-4 rounded-full mr-2 ${studentInfo.name && studentInfo.email && studentInfo.phone ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    Information Complete
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;