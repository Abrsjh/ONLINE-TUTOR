'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import * as Select from '@radix-ui/react-select';
import { ChevronDownIcon, CheckIcon, Cross2Icon } from '@radix-ui/react-icons';
import { subjects } from '@/lib/data';
import { getPriceRanges, getRatingOptions } from '@/lib/utils';

interface FilterSidebarProps {
  onFiltersChange: (filters: {
    subjects: string[];
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
  }) => void;
  className?: string;
}

export default function FilterSidebar({ onFiltersChange, className = '' }: FilterSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Initialize state from URL parameters
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(() => {
    const subjectsParam = searchParams.get('subjects');
    return subjectsParam ? subjectsParam.split(',') : [];
  });
  
  const [priceRange, setPriceRange] = useState<{ min?: number; max?: number }>(() => {
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    return {
      min: minPrice ? parseInt(minPrice) : undefined,
      max: maxPrice ? parseInt(maxPrice) : undefined,
    };
  });
  
  const [selectedRating, setSelectedRating] = useState<number>(() => {
    const rating = searchParams.get('rating');
    return rating ? parseFloat(rating) : 0;
  });

  const [isOpen, setIsOpen] = useState(false);

  const priceRanges = getPriceRanges();
  const ratingOptions = getRatingOptions();

  // Update URL parameters when filters change
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    
    // Update subjects
    if (selectedSubjects.length > 0) {
      params.set('subjects', selectedSubjects.join(','));
    } else {
      params.delete('subjects');
    }
    
    // Update price range
    if (priceRange.min !== undefined) {
      params.set('minPrice', priceRange.min.toString());
    } else {
      params.delete('minPrice');
    }
    
    if (priceRange.max !== undefined && priceRange.max !== Infinity) {
      params.set('maxPrice', priceRange.max.toString());
    } else {
      params.delete('maxPrice');
    }
    
    // Update rating
    if (selectedRating > 0) {
      params.set('rating', selectedRating.toString());
    } else {
      params.delete('rating');
    }
    
    // Update URL without causing a page reload
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    router.replace(newUrl, { scroll: false });
    
    // Notify parent component of filter changes
    onFiltersChange({
      subjects: selectedSubjects,
      minPrice: priceRange.min,
      maxPrice: priceRange.max,
      minRating: selectedRating,
    });
  }, [selectedSubjects, priceRange, selectedRating, router, searchParams, onFiltersChange]);

  const handleSubjectToggle = (subject: string) => {
    setSelectedSubjects(prev => 
      prev.includes(subject)
        ? prev.filter(s => s !== subject)
        : [...prev, subject]
    );
  };

  const handlePriceRangeChange = (value: string) => {
    const range = priceRanges.find(r => `${r.min}-${r.max}` === value);
    if (range) {
      setPriceRange({ min: range.min, max: range.max });
    }
  };

  const handleRatingChange = (value: string) => {
    setSelectedRating(parseFloat(value));
  };

  const clearAllFilters = () => {
    setSelectedSubjects([]);
    setPriceRange({});
    setSelectedRating(0);
  };

  const hasActiveFilters = selectedSubjects.length > 0 || 
                          priceRange.min !== undefined || 
                          priceRange.max !== undefined || 
                          selectedRating > 0;

  const getCurrentPriceRangeValue = () => {
    if (priceRange.min !== undefined && priceRange.max !== undefined) {
      return `${priceRange.min}-${priceRange.max}`;
    }
    return '';
  };

  const getCurrentPriceRangeLabel = () => {
    const range = priceRanges.find(r => r.min === priceRange.min && r.max === priceRange.max);
    return range?.label || 'Any price';
  };

  const getCurrentRatingLabel = () => {
    const rating = ratingOptions.find(r => r.value === selectedRating);
    return rating?.label || 'Any rating';
  };

  return (
    <>
      {/* Mobile Filter Toggle Button */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
        >
          <span className="font-medium text-gray-900">Filters</span>
          <div className="flex items-center space-x-2">
            {hasActiveFilters && (
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                {selectedSubjects.length + (priceRange.min !== undefined ? 1 : 0) + (selectedRating > 0 ? 1 : 0)}
              </span>
            )}
            <ChevronDownIcon 
              className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
            />
          </div>
        </button>
      </div>

      {/* Filter Sidebar */}
      <div className={`${className} ${isOpen ? 'block' : 'hidden'} lg:block bg-white border border-gray-200 rounded-lg p-6 shadow-sm`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Subjects Filter */}
        <div className="mb-8">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Subjects</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {subjects.map((subject) => (
              <label
                key={subject}
                className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded-md transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedSubjects.includes(subject)}
                  onChange={() => handleSubjectToggle(subject)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <span className="text-sm text-gray-700">{subject}</span>
              </label>
            ))}
          </div>
          {selectedSubjects.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedSubjects.map((subject) => (
                <span
                  key={subject}
                  className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full"
                >
                  {subject}
                  <button
                    onClick={() => handleSubjectToggle(subject)}
                    className="ml-1 hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                  >
                    <Cross2Icon className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Price Range Filter */}
        <div className="mb-8">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Price Range</h4>
          <Select.Root value={getCurrentPriceRangeValue()} onValueChange={handlePriceRangeChange}>
            <Select.Trigger className="w-full flex items-center justify-between px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
              <Select.Value>
                <span className="text-sm text-gray-700">{getCurrentPriceRangeLabel()}</span>
              </Select.Value>
              <Select.Icon>
                <ChevronDownIcon className="w-4 h-4 text-gray-400" />
              </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content className="bg-white border border-gray-200 rounded-md shadow-lg z-50 overflow-hidden">
                <Select.Viewport className="p-1">
                  <Select.Item
                    value=""
                    className="flex items-center px-3 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-100 rounded-sm outline-none data-[highlighted]:bg-gray-100"
                  >
                    <Select.ItemText>Any price</Select.ItemText>
                    <Select.ItemIndicator className="ml-auto">
                      <CheckIcon className="w-4 h-4 text-blue-600" />
                    </Select.ItemIndicator>
                  </Select.Item>
                  {priceRanges.map((range) => (
                    <Select.Item
                      key={`${range.min}-${range.max}`}
                      value={`${range.min}-${range.max}`}
                      className="flex items-center px-3 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-100 rounded-sm outline-none data-[highlighted]:bg-gray-100"
                    >
                      <Select.ItemText>{range.label}</Select.ItemText>
                      <Select.ItemIndicator className="ml-auto">
                        <CheckIcon className="w-4 h-4 text-blue-600" />
                      </Select.ItemIndicator>
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        </div>

        {/* Rating Filter */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Minimum Rating</h4>
          <Select.Root value={selectedRating.toString()} onValueChange={handleRatingChange}>
            <Select.Trigger className="w-full flex items-center justify-between px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
              <Select.Value>
                <span className="text-sm text-gray-700">{getCurrentRatingLabel()}</span>
              </Select.Value>
              <Select.Icon>
                <ChevronDownIcon className="w-4 h-4 text-gray-400" />
              </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content className="bg-white border border-gray-200 rounded-md shadow-lg z-50 overflow-hidden">
                <Select.Viewport className="p-1">
                  {ratingOptions.map((option) => (
                    <Select.Item
                      key={option.value}
                      value={option.value.toString()}
                      className="flex items-center px-3 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-100 rounded-sm outline-none data-[highlighted]:bg-gray-100"
                    >
                      <Select.ItemText>
                        <div className="flex items-center space-x-2">
                          <span>{option.label}</span>
                          {option.value > 0 && (
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <svg
                                  key={i}
                                  className={`w-3 h-3 ${
                                    i < Math.floor(option.value) ? 'text-yellow-400' : 'text-gray-300'
                                  }`}
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                          )}
                        </div>
                      </Select.ItemText>
                      <Select.ItemIndicator className="ml-auto">
                        <CheckIcon className="w-4 h-4 text-blue-600" />
                      </Select.ItemIndicator>
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">
                Active filters ({selectedSubjects.length + (priceRange.min !== undefined ? 1 : 0) + (selectedRating > 0 ? 1 : 0)})
              </span>
              <button
                onClick={clearAllFilters}
                className="text-xs text-red-600 hover:text-red-800 font-medium transition-colors"
              >
                Clear all
              </button>
            </div>
          </div>
        )}

        {/* Mobile Close Button */}
        <div className="lg:hidden mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={() => setIsOpen(false)}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}