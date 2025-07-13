'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronDownIcon, ChevronUpIcon } from '@radix-ui/react-icons';
import { Loader2, SortAsc, SortDesc } from 'lucide-react';
import FilterSidebar from '@/components/FilterSidebar';
import TutorCard from '@/components/TutorCard';
import SearchBar from '@/components/SearchBar';
import { tutors } from '@/lib/data';
import { filterTutors, sortTutors, paginate, SortOption, FilterOptions } from '@/lib/utils';

const TUTORS_PER_PAGE = 12;

const sortOptions = [
  { field: 'name' as const, label: 'Name' },
  { field: 'hourlyRate' as const, label: 'Price' },
  { field: 'rating' as const, label: 'Rating' },
  { field: 'totalReviews' as const, label: 'Reviews' },
];

export default function TutorsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  
  // Initialize state from URL parameters
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') || '');
  const [currentPage, setCurrentPage] = useState(() => {
    const page = searchParams.get('page');
    return page ? parseInt(page) : 1;
  });
  
  const [sortOption, setSortOption] = useState<SortOption>(() => {
    const sortField = searchParams.get('sortBy') as SortOption['field'] || 'name';
    const sortDirection = searchParams.get('sortDir') as SortOption['direction'] || 'asc';
    return { field: sortField, direction: sortDirection };
  });

  const [filters, setFilters] = useState<FilterOptions>({});

  // Simulate loading on initial mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Update URL when state changes
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (searchQuery) {
      params.set('search', searchQuery);
    }
    
    if (currentPage > 1) {
      params.set('page', currentPage.toString());
    }
    
    if (sortOption.field !== 'name' || sortOption.direction !== 'asc') {
      params.set('sortBy', sortOption.field);
      params.set('sortDir', sortOption.direction);
    }

    // Filter params are handled by FilterSidebar component
    const existingFilterParams = ['subjects', 'minPrice', 'maxPrice', 'rating'];
    existingFilterParams.forEach(param => {
      const value = searchParams.get(param);
      if (value) {
        params.set(param, value);
      }
    });
    
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    router.replace(newUrl, { scroll: false });
  }, [searchQuery, currentPage, sortOption, router, searchParams]);

  // Process tutors with filters, search, and sorting
  const processedTutors = useMemo(() => {
    let result = tutors;
    
    // Apply filters
    const allFilters = {
      ...filters,
      searchQuery: searchQuery.trim() || undefined,
    };
    
    result = filterTutors(result, allFilters);
    
    // Apply sorting
    result = sortTutors(result, sortOption);
    
    return result;
  }, [filters, searchQuery, sortOption]);

  // Paginate results
  const paginatedResult = useMemo(() => {
    return paginate(processedTutors, currentPage, TUTORS_PER_PAGE);
  }, [processedTutors, currentPage]);

  // Reset page when filters change
  useEffect(() => {
    if (currentPage > 1 && paginatedResult.totalPages > 0 && currentPage > paginatedResult.totalPages) {
      setCurrentPage(1);
    }
  }, [paginatedResult.totalPages, currentPage]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleFiltersChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleSortChange = (field: SortOption['field']) => {
    setSortOption(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setFilters({});
    setSortOption({ field: 'name', direction: 'asc' });
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery || 
                          (filters.subjects && filters.subjects.length > 0) ||
                          filters.minPrice !== undefined ||
                          filters.maxPrice !== undefined ||
                          filters.minRating !== undefined;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading tutors...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Your Perfect Tutor</h1>
          <p className="text-gray-600">
            Browse through our qualified tutors and find the perfect match for your learning needs.
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <SearchBar
            onSearch={handleSearch}
            placeholder="Search for tutors or subjects..."
            className="max-w-2xl"
          />
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filter Sidebar */}
          <div className="lg:w-80 flex-shrink-0">
            <FilterSidebar
              onFiltersChange={handleFiltersChange}
              className="sticky top-4"
            />
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
              <div className="flex items-center space-x-4">
                <p className="text-gray-600">
                  {paginatedResult.totalItems === 0 ? (
                    'No tutors found'
                  ) : (
                    <>
                      Showing {((currentPage - 1) * TUTORS_PER_PAGE) + 1}-
                      {Math.min(currentPage * TUTORS_PER_PAGE, paginatedResult.totalItems)} of{' '}
                      {paginatedResult.totalItems} tutors
                    </>
                  )}
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    Clear all filters
                  </button>
                )}
              </div>

              {/* Sort Options */}
              {paginatedResult.totalItems > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Sort by:</span>
                  <div className="flex space-x-1">
                    {sortOptions.map((option) => (
                      <button
                        key={option.field}
                        onClick={() => handleSortChange(option.field)}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors flex items-center space-x-1 ${
                          sortOption.field === option.field
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span>{option.label}</span>
                        {sortOption.field === option.field && (
                          sortOption.direction === 'asc' ? (
                            <SortAsc className="w-3 h-3" />
                          ) : (
                            <SortDesc className="w-3 h-3" />
                          )
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Tutors Grid */}
            {paginatedResult.totalItems === 0 ? (
              <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                  <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-12 h-12 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No tutors found</h3>
                  <p className="text-gray-600 mb-4">
                    We couldn't find any tutors matching your criteria. Try adjusting your filters or search terms.
                  </p>
                  {hasActiveFilters && (
                    <button
                      onClick={clearAllFilters}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                    >
                      Clear all filters
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                  {paginatedResult.items.map((tutor) => (
                    <TutorCard key={tutor.id} tutor={tutor} />
                  ))}
                </div>

                {/* Pagination */}
                {paginatedResult.totalPages > 1 && (
                  <div className="flex items-center justify-center space-x-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={!paginatedResult.hasPreviousPage}
                      className="px-3 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>

                    <div className="flex space-x-1">
                      {Array.from({ length: paginatedResult.totalPages }, (_, i) => i + 1)
                        .filter(page => {
                          // Show first page, last page, current page, and pages around current page
                          return (
                            page === 1 ||
                            page === paginatedResult.totalPages ||
                            Math.abs(page - currentPage) <= 1
                          );
                        })
                        .map((page, index, array) => {
                          // Add ellipsis if there's a gap
                          const showEllipsis = index > 0 && page - array[index - 1] > 1;
                          
                          return (
                            <React.Fragment key={page}>
                              {showEllipsis && (
                                <span className="px-3 py-2 text-gray-500">...</span>
                              )}
                              <button
                                onClick={() => handlePageChange(page)}
                                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                  page === currentPage
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                {page}
                              </button>
                            </React.Fragment>
                          );
                        })}
                    </div>

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={!paginatedResult.hasNextPage}
                      className="px-3 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}