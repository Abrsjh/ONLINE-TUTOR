import { format, isToday, isTomorrow, isThisWeek, parseISO } from 'date-fns';
import { Tutor } from './data';

export interface FilterOptions {
  subjects?: string[];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  searchQuery?: string;
}

export interface SortOption {
  field: 'name' | 'hourlyRate' | 'rating' | 'totalReviews';
  direction: 'asc' | 'desc';
}

export interface PaginationResult<T> {
  items: T[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Filter tutors based on various criteria
export function filterTutors(tutors: Tutor[], filters: FilterOptions): Tutor[] {
  return tutors.filter(tutor => {
    // Subject filter
    if (filters.subjects && filters.subjects.length > 0) {
      const hasMatchingSubject = filters.subjects.some(subject =>
        tutor.subjects.some(tutorSubject =>
          tutorSubject.toLowerCase().includes(subject.toLowerCase())
        )
      );
      if (!hasMatchingSubject) return false;
    }

    // Price range filter
    if (filters.minPrice !== undefined && tutor.hourlyRate < filters.minPrice) {
      return false;
    }
    if (filters.maxPrice !== undefined && tutor.hourlyRate > filters.maxPrice) {
      return false;
    }

    // Rating filter
    if (filters.minRating !== undefined && tutor.rating < filters.minRating) {
      return false;
    }

    // Search query filter (name, subjects, about)
    if (filters.searchQuery && filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase().trim();
      const matchesName = tutor.name.toLowerCase().includes(query);
      const matchesSubjects = tutor.subjects.some(subject =>
        subject.toLowerCase().includes(query)
      );
      const matchesAbout = tutor.about.toLowerCase().includes(query);
      
      if (!matchesName && !matchesSubjects && !matchesAbout) {
        return false;
      }
    }

    return true;
  });
}

// Sort tutors by specified criteria
export function sortTutors(tutors: Tutor[], sortOption: SortOption): Tutor[] {
  return [...tutors].sort((a, b) => {
    let comparison = 0;

    switch (sortOption.field) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'hourlyRate':
        comparison = a.hourlyRate - b.hourlyRate;
        break;
      case 'rating':
        comparison = a.rating - b.rating;
        break;
      case 'totalReviews':
        comparison = a.totalReviews - b.totalReviews;
        break;
      default:
        return 0;
    }

    return sortOption.direction === 'desc' ? -comparison : comparison;
  });
}

// Paginate an array of items
export function paginate<T>(
  items: T[],
  page: number,
  itemsPerPage: number
): PaginationResult<T> {
  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const currentPage = Math.max(1, Math.min(page, totalPages));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = items.slice(startIndex, endIndex);

  return {
    items: paginatedItems,
    totalItems,
    totalPages,
    currentPage,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
  };
}

// Check if a tutor is available on a specific date and time
export function isTutorAvailable(
  tutor: Tutor,
  date: Date,
  timeSlot: string
): boolean {
  const dayOfWeek = format(date, 'EEEE').toLowerCase();
  const availableSlots = tutor.availability[dayOfWeek] || [];
  return availableSlots.includes(timeSlot);
}

// Get available time slots for a tutor on a specific date
export function getAvailableTimeSlots(tutor: Tutor, date: Date): string[] {
  const dayOfWeek = format(date, 'EEEE').toLowerCase();
  return tutor.availability[dayOfWeek] || [];
}

// Format date for display
export function formatDate(date: Date): string {
  if (isToday(date)) {
    return 'Today';
  }
  if (isTomorrow(date)) {
    return 'Tomorrow';
  }
  if (isThisWeek(date)) {
    return format(date, 'EEEE');
  }
  return format(date, 'MMM d, yyyy');
}

// Format time for display (12-hour format)
export function formatTime(timeString: string): string {
  const [hours, minutes] = timeString.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return format(date, 'h:mm a');
}

// Format date and time together
export function formatDateTime(date: Date, timeString: string): string {
  const formattedDate = formatDate(date);
  const formattedTime = formatTime(timeString);
  return `${formattedDate} at ${formattedTime}`;
}

// Calculate session cost
export function calculateSessionCost(
  hourlyRate: number,
  durationMinutes: number
): number {
  const hours = durationMinutes / 60;
  return Math.round(hourlyRate * hours * 100) / 100; // Round to 2 decimal places
}

// Format price for display
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

// Generate a random confirmation number
export function generateConfirmationNumber(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Get price range options for filtering
export function getPriceRanges(): Array<{ label: string; min: number; max: number }> {
  return [
    { label: 'Under $50', min: 0, max: 49 },
    { label: '$50 - $69', min: 50, max: 69 },
    { label: '$70 - $89', min: 70, max: 89 },
    { label: '$90+', min: 90, max: Infinity },
  ];
}

// Get rating options for filtering
export function getRatingOptions(): Array<{ label: string; value: number }> {
  return [
    { label: '4.5+ stars', value: 4.5 },
    { label: '4.0+ stars', value: 4.0 },
    { label: '3.5+ stars', value: 3.5 },
    { label: 'Any rating', value: 0 },
  ];
}

// Debounce function for search input
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Check if a date is in the future (for booking validation)
export function isFutureDate(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const compareDate = new Date(date);
  compareDate.setHours(0, 0, 0, 0);
  return compareDate >= today;
}

// Get next 30 days for calendar display
export function getNext30Days(): Date[] {
  const dates: Date[] = [];
  const today = new Date();
  
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date);
  }
  
  return dates;
}

// Check if tutor has any availability on a given date
export function hasTutorAvailability(tutor: Tutor, date: Date): boolean {
  const dayOfWeek = format(date, 'EEEE').toLowerCase();
  const availableSlots = tutor.availability[dayOfWeek] || [];
  return availableSlots.length > 0;
}

// Get unique subjects from all tutors
export function getUniqueSubjects(tutors: Tutor[]): string[] {
  const subjects = new Set<string>();
  tutors.forEach(tutor => {
    tutor.subjects.forEach(subject => subjects.add(subject));
  });
  return Array.from(subjects).sort();
}

// Search tutors with highlighted matches
export function searchTutorsWithHighlight(
  tutors: Tutor[],
  query: string
): Array<Tutor & { highlightedName?: string; highlightedSubjects?: string[] }> {
  if (!query.trim()) return tutors;

  const searchQuery = query.toLowerCase().trim();
  
  return tutors.map(tutor => {
    const highlightedTutor = { ...tutor };
    
    // Highlight name matches
    if (tutor.name.toLowerCase().includes(searchQuery)) {
      highlightedTutor.highlightedName = tutor.name.replace(
        new RegExp(`(${query})`, 'gi'),
        '<mark>$1</mark>'
      );
    }
    
    // Highlight subject matches
    highlightedTutor.highlightedSubjects = tutor.subjects.map(subject => {
      if (subject.toLowerCase().includes(searchQuery)) {
        return subject.replace(
          new RegExp(`(${query})`, 'gi'),
          '<mark>$1</mark>'
        );
      }
      return subject;
    });
    
    return highlightedTutor;
  });
}

// Validate booking data
export interface BookingValidation {
  isValid: boolean;
  errors: string[];
}

export function validateBooking(
  tutor: Tutor | null,
  date: Date | null,
  timeSlot: string | null,
  duration: number | null
): BookingValidation {
  const errors: string[] = [];

  if (!tutor) {
    errors.push('Please select a tutor');
  }

  if (!date) {
    errors.push('Please select a date');
  } else if (!isFutureDate(date)) {
    errors.push('Please select a future date');
  }

  if (!timeSlot) {
    errors.push('Please select a time slot');
  } else if (tutor && date && !isTutorAvailable(tutor, date, timeSlot)) {
    errors.push('Selected time slot is not available');
  }

  if (!duration || duration <= 0) {
    errors.push('Please select a valid session duration');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}