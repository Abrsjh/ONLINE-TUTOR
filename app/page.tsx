'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import SearchBar from '@/components/SearchBar';
import TutorCard from '@/components/TutorCard';
import { tutors, subjects, stats } from '@/lib/data';
import { BookOpen, Users, Clock, Star, ArrowRight, GraduationCap } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  // Get featured tutors (first 6 with highest ratings)
  const featuredTutors = tutors
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 6);

  // Get popular subjects (first 8)
  const popularSubjects = subjects.slice(0, 8);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      router.push(`/tutors?search=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleSubjectClick = (subject: string) => {
    router.push(`/tutors?subject=${encodeURIComponent(subject)}`);
  };

  const handleViewAllTutors = () => {
    router.push('/tutors');
  };

  const handleGetStarted = () => {
    router.push('/tutors');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Find Your Perfect
              <span className="block text-yellow-300">Tutor Today</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto leading-relaxed">
              Connect with expert tutors across all subjects. Personalized learning that fits your schedule and goals.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-8">
              <SearchBar
                onSearch={handleSearch}
                placeholder="Search for tutors or subjects..."
                className="text-lg"
              />
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={handleGetStarted}
                className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-8 py-4 rounded-lg text-lg transition-colors duration-200 flex items-center space-x-2 shadow-lg"
              >
                <span>Get Started</span>
                <ArrowRight size={20} />
              </button>
              <button
                onClick={handleViewAllTutors}
                className="border-2 border-white hover:bg-white hover:text-blue-700 text-white font-semibold px-8 py-4 rounded-lg text-lg transition-colors duration-200"
              >
                Browse All Tutors
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="space-y-2">
              <div className="flex justify-center">
                <Users className="h-12 w-12 text-blue-600" />
              </div>
              <div className="text-3xl lg:text-4xl font-bold text-gray-900">
                {stats.totalStudents.toLocaleString()}+
              </div>
              <div className="text-gray-600 text-lg">Happy Students</div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-center">
                <GraduationCap className="h-12 w-12 text-green-600" />
              </div>
              <div className="text-3xl lg:text-4xl font-bold text-gray-900">
                {stats.totalTutors}+
              </div>
              <div className="text-gray-600 text-lg">Expert Tutors</div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-center">
                <Clock className="h-12 w-12 text-purple-600" />
              </div>
              <div className="text-3xl lg:text-4xl font-bold text-gray-900">
                {stats.totalSessions.toLocaleString()}+
              </div>
              <div className="text-gray-600 text-lg">Sessions Completed</div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Subjects Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Popular Subjects
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Explore our most sought-after subjects and find the perfect tutor for your learning needs.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {popularSubjects.map((subject, index) => (
              <button
                key={index}
                onClick={() => handleSubjectClick(subject)}
                className="bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg p-6 text-center transition-all duration-200 group shadow-sm hover:shadow-md"
              >
                <div className="flex justify-center mb-3">
                  <BookOpen className="h-8 w-8 text-blue-600 group-hover:text-blue-700" />
                </div>
                <div className="font-semibold text-gray-900 group-hover:text-blue-700">
                  {subject}
                </div>
              </button>
            ))}
          </div>

          <div className="text-center">
            <button
              onClick={handleViewAllTutors}
              className="text-blue-600 hover:text-blue-700 font-semibold text-lg flex items-center space-x-2 mx-auto transition-colors duration-200"
            >
              <span>View All Subjects</span>
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* Featured Tutors Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Featured Tutors
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Meet our top-rated tutors who are ready to help you achieve your academic goals.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {featuredTutors.map((tutor) => (
              <TutorCard key={tutor.id} tutor={tutor} />
            ))}
          </div>

          <div className="text-center">
            <button
              onClick={handleViewAllTutors}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-lg text-lg transition-colors duration-200 flex items-center space-x-2 mx-auto shadow-lg"
            >
              <span>View All Tutors</span>
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Getting started with your learning journey is simple and straightforward.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Find Your Tutor
              </h3>
              <p className="text-gray-600">
                Browse our extensive list of qualified tutors and find the perfect match for your subject and learning style.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Book a Session
              </h3>
              <p className="text-gray-600">
                Choose a convenient time slot that works for both you and your tutor. Flexible scheduling to fit your needs.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Start Learning
              </h3>
              <p className="text-gray-600">
                Begin your personalized learning journey with expert guidance and achieve your academic goals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Ready to Start Your Learning Journey?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Join thousands of students who have already improved their grades with our expert tutors.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleGetStarted}
              className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-8 py-4 rounded-lg text-lg transition-colors duration-200 flex items-center justify-center space-x-2 shadow-lg"
            >
              <Star size={20} />
              <span>Find Your Tutor Now</span>
            </button>
            <button
              onClick={handleViewAllTutors}
              className="border-2 border-white hover:bg-white hover:text-blue-700 text-white font-semibold px-8 py-4 rounded-lg text-lg transition-colors duration-200"
            >
              Browse All Tutors
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}