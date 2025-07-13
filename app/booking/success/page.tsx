'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBookingStore } from '@/lib/store';
import { format } from 'date-fns';

export default function BookingSuccessPage() {
  const router = useRouter();
  const { selectedTutor, selectedDate, selectedTime, sessionDuration, clearBooking } = useBookingStore();
  const [confirmationNumber, setConfirmationNumber] = useState<string>('');

  // Generate confirmation number on mount
  useEffect(() => {
    const generateConfirmationNumber = () => {
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();
      return `TUT-${timestamp}-${random}`;
    };

    setConfirmationNumber(generateConfirmationNumber());
  }, []);

  // Redirect if no booking data
  useEffect(() => {
    if (!selectedTutor || !selectedDate || !selectedTime) {
      router.push('/tutors');
    }
  }, [selectedTutor, selectedDate, selectedTime, router]);

  // Don't render if no booking data
  if (!selectedTutor || !selectedDate || !selectedTime) {
    return null;
  }

  const totalCost = selectedTutor.hourlyRate * sessionDuration;
  const formattedDate = format(selectedDate, 'EEEE, MMMM d, yyyy');

  const handleBookAnother = () => {
    clearBooking();
    router.push('/tutors');
  };

  const handleReturnHome = () => {
    clearBooking();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Booking Confirmed!
          </h1>
          <p className="text-lg text-gray-600">
            Your tutoring session has been successfully booked.
          </p>
        </div>

        {/* Confirmation Details Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Booking Details
          </h2>

          <div className="space-y-4">
            {/* Confirmation Number */}
            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <span className="text-sm font-medium text-gray-500">
                Confirmation Number
              </span>
              <span className="text-sm font-mono font-semibold text-gray-900">
                {confirmationNumber}
              </span>
            </div>

            {/* Tutor */}
            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <span className="text-sm font-medium text-gray-500">
                Tutor
              </span>
              <span className="text-sm font-semibold text-gray-900">
                {selectedTutor.name}
              </span>
            </div>

            {/* Date */}
            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <span className="text-sm font-medium text-gray-500">
                Date
              </span>
              <span className="text-sm font-semibold text-gray-900">
                {formattedDate}
              </span>
            </div>

            {/* Time */}
            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <span className="text-sm font-medium text-gray-500">
                Time
              </span>
              <span className="text-sm font-semibold text-gray-900">
                {selectedTime}
              </span>
            </div>

            {/* Duration */}
            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <span className="text-sm font-medium text-gray-500">
                Duration
              </span>
              <span className="text-sm font-semibold text-gray-900">
                {sessionDuration} {sessionDuration === 1 ? 'hour' : 'hours'}
              </span>
            </div>

            {/* Subjects */}
            <div className="flex justify-between items-start py-3 border-b border-gray-200">
              <span className="text-sm font-medium text-gray-500">
                Subjects
              </span>
              <div className="text-right">
                {selectedTutor.subjects.map((subject, index) => (
                  <span
                    key={subject}
                    className="inline-block text-sm font-semibold text-gray-900"
                  >
                    {subject}
                    {index < selectedTutor.subjects.length - 1 && ', '}
                  </span>
                ))}
              </div>
            </div>

            {/* Total Cost */}
            <div className="flex justify-between items-center py-3">
              <span className="text-lg font-semibold text-gray-900">
                Total Cost
              </span>
              <span className="text-lg font-bold text-blue-600">
                ${totalCost}
              </span>
            </div>
          </div>
        </div>

        {/* Important Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">
            Important Information
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• You will receive a confirmation email shortly</li>
            <li>• Your tutor will contact you 24 hours before the session</li>
            <li>• Please be ready 5 minutes before your scheduled time</li>
            <li>• Cancellations must be made at least 24 hours in advance</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleBookAnother}
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200"
          >
            Book Another Session
          </button>
          <button
            onClick={handleReturnHome}
            className="flex-1 bg-gray-200 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors duration-200"
          >
            Return to Homepage
          </button>
        </div>

        {/* Contact Support */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-600">
            Need help? Contact our support team at{' '}
            <a
              href="mailto:support@tutormarketplace.com"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              support@tutormarketplace.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}