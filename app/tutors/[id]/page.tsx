'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { StarIcon, ClockIcon, AcademicCapIcon, CurrencyDollarIcon } from '@heroicons/react/24/solid';
import { EnvelopeIcon, PhoneIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Calendar from '../../../components/Calendar';
import { tutors } from '../../../lib/data';
import { useBookingStore } from '../../../lib/store';

interface TutorProfilePageProps {
  params: { id: string };
}

const TutorProfilePage: React.FC<TutorProfilePageProps> = ({ params }) => {
  const router = useRouter();
  const { setSelectedTutor } = useBookingStore();
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    message: ''
  });

  // Find tutor by ID
  const tutor = tutors.find(t => t.id === params.id);

  // Handle 404 state for invalid tutor IDs
  if (!tutor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl font-bold text-gray-300 mb-4">404</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Tutor Not Found</h1>
          <p className="text-gray-600 mb-6">
            The tutor you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => router.push('/tutors')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse All Tutors
          </button>
        </div>
      </div>
    );
  }

  const handleBookSession = () => {
    setSelectedTutor(tutor);
    router.push('/booking');
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      toast.error('Please fill in all fields');
      return;
    }

    // Simulate contact form submission
    toast.success(`Message sent to ${tutor.name}! They will get back to you soon.`);
    setContactForm({ name: '', email: '', message: '' });
  };

  const handleContactChange = (field: string, value: string) => {
    setContactForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            {/* Tutor Info */}
            <div className="flex-1">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                  {tutor.name.split(' ').map(n => n[0]).join('')}
                </div>
                
                {/* Basic Info */}
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{tutor.name}</h1>
                  
                  {/* Subjects */}
                  <div className="flex items-center gap-2 mb-3">
                    <AcademicCapIcon className="w-5 h-5 text-gray-500" />
                    <div className="flex flex-wrap gap-2">
                      {tutor.subjects.map((subject, index) => (
                        <span
                          key={index}
                          className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                        >
                          {subject}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Rating and Rate */}
                  <div className="flex items-center gap-6 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <StarIcon
                            key={i}
                            className={`w-5 h-5 ${
                              i < Math.floor(tutor.rating)
                                ? 'text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {tutor.rating} ({tutor.totalReviews} reviews)
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <CurrencyDollarIcon className="w-5 h-5 text-green-600" />
                      <span className="text-lg font-bold text-green-600">
                        ${tutor.hourlyRate}/hour
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Book Session Button */}
            <div className="lg:flex-shrink-0">
              <button
                onClick={handleBookSession}
                className="w-full lg:w-auto bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
              >
                Book Session
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About {tutor.name}</h2>
              <p className="text-gray-700 leading-relaxed">{tutor.about}</p>
            </div>

            {/* Availability Calendar */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Availability</h2>
              <Calendar tutor={tutor} mode="view" />
            </div>

            {/* Contact Form */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact {tutor.name}</h2>
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Your Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={contactForm.name}
                      onChange={(e) => handleContactChange('name', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your name"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Your Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={contactForm.email}
                      onChange={(e) => handleContactChange('email', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    rows={4}
                    value={contactForm.message}
                    onChange={(e) => handleContactChange('message', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Tell the tutor about your learning goals and any questions you have..."
                  />
                </div>
                <button
                  type="submit"
                  className="bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium"
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Hourly Rate</span>
                  <span className="font-semibold text-green-600">${tutor.hourlyRate}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Rating</span>
                  <div className="flex items-center gap-1">
                    <StarIcon className="w-4 h-4 text-yellow-400" />
                    <span className="font-semibold">{tutor.rating}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Reviews</span>
                  <span className="font-semibold">{tutor.totalReviews}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Subjects</span>
                  <span className="font-semibold">{tutor.subjects.length}</span>
                </div>
              </div>
            </div>

            {/* Subjects List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Subjects Taught</h3>
              <div className="space-y-2">
                {tutor.subjects.map((subject, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <AcademicCapIcon className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-gray-900">{subject}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Get in Touch</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-600">
                  <EnvelopeIcon className="w-5 h-5" />
                  <span className="text-sm">Send a message using the form</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <ClockIcon className="w-5 h-5" />
                  <span className="text-sm">Usually responds within 2 hours</span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={handleBookSession}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Book a Session Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorProfilePage;