'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Star, Clock, DollarSign, User } from 'lucide-react';
import { Tutor } from '@/lib/data';

interface TutorCardProps {
  tutor: Tutor;
}

const TutorCard: React.FC<TutorCardProps> = ({ tutor }) => {
  const router = useRouter();

  const handleCardClick = () => {
    router.push(`/tutors/${tutor.id}`);
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-yellow-500',
      'bg-red-500',
      'bg-teal-500',
      'bg-orange-500',
      'bg-cyan-500'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg hover:border-blue-300 transition-all duration-200 cursor-pointer group">
      <div onClick={handleCardClick} className="space-y-4">
        {/* Avatar */}
        <div className="flex items-center justify-between">
          <div className={`w-12 h-12 rounded-full ${getAvatarColor(tutor.name)} flex items-center justify-center text-white font-semibold text-lg`}>
            {getInitials(tutor.name)}
          </div>
          <Dialog.Root>
            <Dialog.Trigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm font-medium"
              >
                Quick View
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
              <Dialog.Content className="fixed left-1/2 top-1/2 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl z-50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title className="text-xl font-bold text-gray-900">
                    {tutor.name}
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <button className="text-gray-400 hover:text-gray-600 transition-colors">
                      <X size={20} />
                    </button>
                  </Dialog.Close>
                </div>
                
                <div className="space-y-4">
                  {/* Avatar in modal */}
                  <div className="flex items-center space-x-3">
                    <div className={`w-16 h-16 rounded-full ${getAvatarColor(tutor.name)} flex items-center justify-center text-white font-semibold text-xl`}>
                      {getInitials(tutor.name)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{tutor.name}</h3>
                      <div className="flex items-center space-x-1 text-yellow-500">
                        <Star size={16} fill="currentColor" />
                        <span className="text-gray-700 text-sm">
                          {tutor.rating} ({tutor.totalReviews} reviews)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Subjects */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Subjects</h4>
                    <div className="flex flex-wrap gap-2">
                      {tutor.subjects.map((subject, index) => (
                        <span
                          key={index}
                          className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm"
                        >
                          {subject}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Rate */}
                  <div className="flex items-center space-x-2">
                    <DollarSign size={16} className="text-green-600" />
                    <span className="font-semibold text-lg text-green-600">
                      ${tutor.hourlyRate}/hour
                    </span>
                  </div>

                  {/* About */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">About</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {tutor.about.length > 150 
                        ? `${tutor.about.substring(0, 150)}...` 
                        : tutor.about
                      }
                    </p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex space-x-3 pt-4">
                    <Dialog.Close asChild>
                      <button
                        onClick={() => router.push(`/tutors/${tutor.id}`)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium transition-colors"
                      >
                        View Profile
                      </button>
                    </Dialog.Close>
                    <Dialog.Close asChild>
                      <button className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 px-4 rounded-md font-medium transition-colors">
                        Close
                      </button>
                    </Dialog.Close>
                  </div>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>

        {/* Name */}
        <div>
          <h3 className="font-semibold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
            {tutor.name}
          </h3>
        </div>

        {/* Subjects */}
        <div className="flex flex-wrap gap-2">
          {tutor.subjects.slice(0, 3).map((subject, index) => (
            <span
              key={index}
              className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-sm"
            >
              {subject}
            </span>
          ))}
          {tutor.subjects.length > 3 && (
            <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded-md text-sm">
              +{tutor.subjects.length - 3} more
            </span>
          )}
        </div>

        {/* Rate and Rating */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <DollarSign size={16} className="text-green-600" />
            <span className="font-semibold text-green-600">
              ${tutor.hourlyRate}/hr
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <Star size={16} className="text-yellow-500" fill="currentColor" />
            <span className="font-medium text-gray-700">
              {tutor.rating}
            </span>
            <span className="text-gray-500 text-sm">
              ({tutor.totalReviews})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorCard;