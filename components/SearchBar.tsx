'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
  debounceMs?: number;
}

export default function SearchBar({ 
  onSearch, 
  placeholder = "Search for tutors or subjects...", 
  className = "",
  debounceMs = 300 
}: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Debounced search function
  const debouncedSearch = useCallback(
    (query: string) => {
      const timer = setTimeout(() => {
        onSearch(query);
      }, debounceMs);

      return () => clearTimeout(timer);
    },
    [onSearch, debounceMs]
  );

  // Effect to handle debounced search
  useEffect(() => {
    const cleanup = debouncedSearch(searchQuery);
    return cleanup;
  }, [searchQuery, debouncedSearch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleClear = () => {
    setSearchQuery('');
    onSearch('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <div className="relative">
        {/* Search Icon */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>

        {/* Search Input */}
        <input
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg 
                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                     placeholder-gray-500 text-gray-900 text-sm
                     transition-colors duration-200
                     hover:border-gray-400"
        />

        {/* Clear Button */}
        {searchQuery && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center
                       text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Hidden submit button for form submission */}
      <button type="submit" className="sr-only">
        Search
      </button>
    </form>
  );
}