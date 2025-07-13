import Fuse from 'fuse.js';
import { db, TutorProfile, User, Review, Session } from '../db/index';

// Types for search and filtering
export interface TutorSearchFilters {
  subjects?: string[];
  minRating?: number;
  maxRating?: number;
  minHourlyRate?: number;
  maxHourlyRate?: number;
  languages?: string[];
  availability?: {
    dayOfWeek?: number;
    startTime?: string;
    endTime?: string;
    timezone?: string;
  };
  experience?: {
    min?: number;
    max?: number;
  };
  isVerified?: boolean;
  location?: string;
  searchQuery?: string;
}

export interface TutorSearchOptions {
  page?: number;
  limit?: number;
  sortBy?: 'rating' | 'hourlyRate' | 'experience' | 'totalSessions' | 'relevance';
  sortOrder?: 'asc' | 'desc';
  includeUnavailable?: boolean;
}

export interface TutorWithUser extends TutorProfile {
  user: User;
  averageRating: number;
  reviewCount: number;
  isAvailableNow: boolean;
  nextAvailableSlot?: Date;
}

export interface TutorSearchResult {
  tutors: TutorWithUser[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
  filters: TutorSearchFilters;
}

export interface AvailabilityCheckResult {
  isAvailable: boolean;
  conflictingSessions: Session[];
  suggestedTimes: Date[];
}

// Fuse.js configuration for fuzzy search
const fuseOptions: Fuse.IFuseOptions<TutorWithUser> = {
  keys: [
    { name: 'user.firstName', weight: 0.3 },
    { name: 'user.lastName', weight: 0.3 },
    { name: 'title', weight: 0.4 },
    { name: 'bio', weight: 0.2 },
    { name: 'subjects', weight: 0.5 },
    { name: 'education', weight: 0.3 },
    { name: 'certifications', weight: 0.2 },
    { name: 'languages', weight: 0.1 }
  ],
  threshold: 0.3,
  includeScore: true,
  includeMatches: true,
  minMatchCharLength: 2,
  shouldSort: true,
  findAllMatches: false,
  location: 0,
  distance: 100
};

class TutorAPI {
  private fuseInstance: Fuse<TutorWithUser> | null = null;
  private tutorsCache: TutorWithUser[] = [];
  private lastCacheUpdate: Date | null = null;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Search and filter tutors with advanced options
   */
  async searchTutors(
    filters: TutorSearchFilters = {},
    options: TutorSearchOptions = {}
  ): Promise<TutorSearchResult> {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'relevance',
        sortOrder = 'desc',
        includeUnavailable = false
      } = options;

      // Get all tutors with user data
      let tutors = await this.getAllTutorsWithUserData();

      // Apply filters
      tutors = await this.applyFilters(tutors, filters, includeUnavailable);

      // Apply search query if provided
      if (filters.searchQuery && filters.searchQuery.trim()) {
        tutors = await this.performFuzzySearch(tutors, filters.searchQuery);
      }

      // Sort results
      tutors = this.sortTutors(tutors, sortBy, sortOrder);

      // Calculate pagination
      const total = tutors.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedTutors = tutors.slice(startIndex, endIndex);

      return {
        tutors: paginatedTutors,
        total,
        page,
        totalPages,
        hasMore: page < totalPages,
        filters
      };
    } catch (error) {
      console.error('Error searching tutors:', error);
      throw new Error('Failed to search tutors');
    }
  }

  /**
   * Get tutor by ID with full profile data
   */
  async getTutorById(tutorId: number): Promise<TutorWithUser | null> {
    try {
      const tutorProfile = await db.tutorProfiles.get(tutorId);
      if (!tutorProfile) return null;

      const user = await db.users.get(tutorProfile.userId);
      if (!user) return null;

      const averageRating = await this.calculateAverageRating(tutorId);
      const reviewCount = await this.getReviewCount(tutorId);
      const isAvailableNow = await this.checkCurrentAvailability(tutorProfile);
      const nextAvailableSlot = await this.getNextAvailableSlot(tutorProfile);

      return {
        ...tutorProfile,
        user,
        averageRating,
        reviewCount,
        isAvailableNow,
        nextAvailableSlot
      };
    } catch (error) {
      console.error('Error getting tutor by ID:', error);
      throw new Error('Failed to get tutor profile');
    }
  }

  /**
   * Check tutor availability for specific date and time
   */
  async checkAvailability(
    tutorId: number,
    startTime: Date,
    duration: number = 60
  ): Promise<AvailabilityCheckResult> {
    try {
      const tutorProfile = await db.tutorProfiles.get(tutorId);
      if (!tutorProfile) {
        throw new Error('Tutor not found');
      }

      const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

      // Check if time slot is within tutor's availability
      const isWithinAvailability = this.isTimeWithinAvailability(
        startTime,
        endTime,
        tutorProfile.availability
      );

      if (!isWithinAvailability) {
        const suggestedTimes = await this.getSuggestedTimes(tutorProfile, startTime);
        return {
          isAvailable: false,
          conflictingSessions: [],
          suggestedTimes
        };
      }

      // Check for conflicting sessions
      const conflictingSessions = await db.sessions
        .where('tutorId')
        .equals(tutorId)
        .and(session => {
          const sessionStart = new Date(session.scheduledAt);
          const sessionEnd = new Date(sessionStart.getTime() + session.duration * 60 * 1000);
          
          return (
            session.status === 'scheduled' &&
            ((startTime >= sessionStart && startTime < sessionEnd) ||
             (endTime > sessionStart && endTime <= sessionEnd) ||
             (startTime <= sessionStart && endTime >= sessionEnd))
          );
        })
        .toArray();

      const isAvailable = conflictingSessions.length === 0;
      const suggestedTimes = isAvailable ? [] : await this.getSuggestedTimes(tutorProfile, startTime);

      return {
        isAvailable,
        conflictingSessions,
        suggestedTimes
      };
    } catch (error) {
      console.error('Error checking availability:', error);
      throw new Error('Failed to check availability');
    }
  }

  /**
   * Get tutor's upcoming availability slots
   */
  async getUpcomingAvailability(
    tutorId: number,
    days: number = 14
  ): Promise<Date[]> {
    try {
      const tutorProfile = await db.tutorProfiles.get(tutorId);
      if (!tutorProfile) {
        throw new Error('Tutor not found');
      }

      const availableSlots: Date[] = [];
      const now = new Date();
      const endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

      // Get all scheduled sessions for the tutor
      const scheduledSessions = await db.sessions
        .where('tutorId')
        .equals(tutorId)
        .and(session => 
          session.status === 'scheduled' &&
          new Date(session.scheduledAt) >= now &&
          new Date(session.scheduledAt) <= endDate
        )
        .toArray();

      // Generate available slots based on tutor's availability
      for (let date = new Date(now); date <= endDate; date.setDate(date.getDate() + 1)) {
        const dayOfWeek = date.getDay();
        const dayAvailability = tutorProfile.availability.filter(slot => slot.dayOfWeek === dayOfWeek);

        for (const slot of dayAvailability) {
          const slotStart = this.createDateTimeFromSlot(date, slot.startTime);
          const slotEnd = this.createDateTimeFromSlot(date, slot.endTime);

          // Generate hourly slots within the availability window
          for (let time = new Date(slotStart); time < slotEnd; time.setHours(time.getHours() + 1)) {
            if (time <= now) continue; // Skip past times

            // Check if this slot conflicts with any scheduled session
            const hasConflict = scheduledSessions.some(session => {
              const sessionStart = new Date(session.scheduledAt);
              const sessionEnd = new Date(sessionStart.getTime() + session.duration * 60 * 1000);
              return time >= sessionStart && time < sessionEnd;
            });

            if (!hasConflict) {
              availableSlots.push(new Date(time));
            }
          }
        }
      }

      return availableSlots.sort((a, b) => a.getTime() - b.getTime());
    } catch (error) {
      console.error('Error getting upcoming availability:', error);
      throw new Error('Failed to get upcoming availability');
    }
  }

  /**
   * Update tutor profile
   */
  async updateTutorProfile(
    tutorId: number,
    updates: Partial<TutorProfile>
  ): Promise<TutorProfile> {
    try {
      const existingProfile = await db.tutorProfiles.get(tutorId);
      if (!existingProfile) {
        throw new Error('Tutor profile not found');
      }

      const updatedProfile = {
        ...existingProfile,
        ...updates,
        updatedAt: new Date()
      };

      await db.tutorProfiles.update(tutorId, updatedProfile);
      
      // Clear cache to force refresh
      this.clearCache();

      return updatedProfile;
    } catch (error) {
      console.error('Error updating tutor profile:', error);
      throw new Error('Failed to update tutor profile');
    }
  }

  /**
   * Get popular subjects based on tutor count and session frequency
   */
  async getPopularSubjects(limit: number = 10): Promise<Array<{ subject: string; tutorCount: number; sessionCount: number }>> {
    try {
      const tutors = await db.tutorProfiles.where('isActive').equals(true).toArray();
      const sessions = await db.sessions.toArray();

      const subjectStats = new Map<string, { tutorCount: number; sessionCount: number }>();

      // Count tutors per subject
      tutors.forEach(tutor => {
        tutor.subjects.forEach(subject => {
          const stats = subjectStats.get(subject) || { tutorCount: 0, sessionCount: 0 };
          stats.tutorCount++;
          subjectStats.set(subject, stats);
        });
      });

      // Count sessions per subject
      sessions.forEach(session => {
        const stats = subjectStats.get(session.subject) || { tutorCount: 0, sessionCount: 0 };
        stats.sessionCount++;
        subjectStats.set(session.subject, stats);
      });

      // Convert to array and sort by combined score
      const popularSubjects = Array.from(subjectStats.entries())
        .map(([subject, stats]) => ({
          subject,
          tutorCount: stats.tutorCount,
          sessionCount: stats.sessionCount
        }))
        .sort((a, b) => {
          // Weight tutor count and session count
          const scoreA = a.tutorCount * 2 + a.sessionCount;
          const scoreB = b.tutorCount * 2 + b.sessionCount;
          return scoreB - scoreA;
        })
        .slice(0, limit);

      return popularSubjects;
    } catch (error) {
      console.error('Error getting popular subjects:', error);
      throw new Error('Failed to get popular subjects');
    }
  }

  /**
   * Get featured tutors based on rating and activity
   */
  async getFeaturedTutors(limit: number = 6): Promise<TutorWithUser[]> {
    try {
      const tutors = await this.getAllTutorsWithUserData();
      
      // Filter and sort featured tutors
      const featuredTutors = tutors
        .filter(tutor => 
          tutor.isActive && 
          tutor.isVerified && 
          tutor.averageRating >= 4.5 &&
          tutor.totalSessions >= 10
        )
        .sort((a, b) => {
          // Score based on rating, sessions, and reviews
          const scoreA = a.averageRating * 0.4 + (a.totalSessions / 100) * 0.3 + (a.reviewCount / 50) * 0.3;
          const scoreB = b.averageRating * 0.4 + (b.totalSessions / 100) * 0.3 + (b.reviewCount / 50) * 0.3;
          return scoreB - scoreA;
        })
        .slice(0, limit);

      return featuredTutors;
    } catch (error) {
      console.error('Error getting featured tutors:', error);
      throw new Error('Failed to get featured tutors');
    }
  }

  // Private helper methods

  private async getAllTutorsWithUserData(): Promise<TutorWithUser[]> {
    // Check cache first
    if (this.isCacheValid()) {
      return this.tutorsCache;
    }

    try {
      const tutorProfiles = await db.getActiveTutors();
      const tutorsWithUserData: TutorWithUser[] = [];

      for (const tutorProfile of tutorProfiles) {
        const user = await db.users.get(tutorProfile.userId);
        if (!user) continue;

        const averageRating = await this.calculateAverageRating(tutorProfile.id!);
        const reviewCount = await this.getReviewCount(tutorProfile.id!);
        const isAvailableNow = await this.checkCurrentAvailability(tutorProfile);
        const nextAvailableSlot = await this.getNextAvailableSlot(tutorProfile);

        tutorsWithUserData.push({
          ...tutorProfile,
          user,
          averageRating,
          reviewCount,
          isAvailableNow,
          nextAvailableSlot
        });
      }

      // Update cache
      this.tutorsCache = tutorsWithUserData;
      this.lastCacheUpdate = new Date();

      return tutorsWithUserData;
    } catch (error) {
      console.error('Error getting tutors with user data:', error);
      throw new Error('Failed to get tutors data');
    }
  }

  private async applyFilters(
    tutors: TutorWithUser[],
    filters: TutorSearchFilters,
    includeUnavailable: boolean
  ): Promise<TutorWithUser[]> {
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

      // Rating filter
      if (filters.minRating !== undefined && tutor.averageRating < filters.minRating) {
        return false;
      }
      if (filters.maxRating !== undefined && tutor.averageRating > filters.maxRating) {
        return false;
      }

      // Hourly rate filter
      if (filters.minHourlyRate !== undefined && tutor.hourlyRate < filters.minHourlyRate) {
        return false;
      }
      if (filters.maxHourlyRate !== undefined && tutor.hourlyRate > filters.maxHourlyRate) {
        return false;
      }

      // Language filter
      if (filters.languages && filters.languages.length > 0) {
        const hasMatchingLanguage = filters.languages.some(language =>
          tutor.languages.some(tutorLanguage =>
            tutorLanguage.toLowerCase().includes(language.toLowerCase())
          )
        );
        if (!hasMatchingLanguage) return false;
      }

      // Experience filter
      if (filters.experience) {
        if (filters.experience.min !== undefined && tutor.experience < filters.experience.min) {
          return false;
        }
        if (filters.experience.max !== undefined && tutor.experience > filters.experience.max) {
          return false;
        }
      }

      // Verified filter
      if (filters.isVerified !== undefined && tutor.isVerified !== filters.isVerified) {
        return false;
      }

      // Availability filter
      if (!includeUnavailable && !tutor.isAvailableNow) {
        return false;
      }

      // Availability time filter
      if (filters.availability) {
        const hasMatchingAvailability = tutor.availability.some(slot => {
          if (filters.availability!.dayOfWeek !== undefined && 
              slot.dayOfWeek !== filters.availability!.dayOfWeek) {
            return false;
          }
          if (filters.availability!.startTime && 
              slot.startTime < filters.availability!.startTime) {
            return false;
          }
          if (filters.availability!.endTime && 
              slot.endTime > filters.availability!.endTime) {
            return false;
          }
          return true;
        });
        if (!hasMatchingAvailability) return false;
      }

      return true;
    });
  }

  private async performFuzzySearch(
    tutors: TutorWithUser[],
    searchQuery: string
  ): Promise<TutorWithUser[]> {
    if (!this.fuseInstance || this.fuseInstance.getIndex().size !== tutors.length) {
      this.fuseInstance = new Fuse(tutors, fuseOptions);
    }

    const searchResults = this.fuseInstance.search(searchQuery);
    return searchResults.map(result => result.item);
  }

  private sortTutors(
    tutors: TutorWithUser[],
    sortBy: string,
    sortOrder: 'asc' | 'desc'
  ): TutorWithUser[] {
    return tutors.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'rating':
          comparison = a.averageRating - b.averageRating;
          break;
        case 'hourlyRate':
          comparison = a.hourlyRate - b.hourlyRate;
          break;
        case 'experience':
          comparison = a.experience - b.experience;
          break;
        case 'totalSessions':
          comparison = a.totalSessions - b.totalSessions;
          break;
        case 'relevance':
        default:
          // For relevance, prioritize verified tutors, then rating, then sessions
          const scoreA = (a.isVerified ? 1000 : 0) + a.averageRating * 100 + a.totalSessions;
          const scoreB = (b.isVerified ? 1000 : 0) + b.averageRating * 100 + b.totalSessions;
          comparison = scoreA - scoreB;
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }

  private async calculateAverageRating(tutorId: number): Promise<number> {
    try {
      const reviews = await db.getReviewsByTutor(tutorId);
      if (reviews.length === 0) return 0;
      
      const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
      return Math.round((sum / reviews.length) * 10) / 10; // Round to 1 decimal place
    } catch (error) {
      console.error('Error calculating average rating:', error);
      return 0;
    }
  }

  private async getReviewCount(tutorId: number): Promise<number> {
    try {
      const reviews = await db.getReviewsByTutor(tutorId);
      return reviews.length;
    } catch (error) {
      console.error('Error getting review count:', error);
      return 0;
    }
  }

  private async checkCurrentAvailability(tutorProfile: TutorProfile): Promise<boolean> {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // Check if current time is within any availability slot
    const isWithinAvailability = tutorProfile.availability.some(slot => {
      return slot.dayOfWeek === dayOfWeek &&
             slot.startTime <= currentTime &&
             slot.endTime > currentTime;
    });

    if (!isWithinAvailability) return false;

    // Check if tutor has any ongoing sessions
    const ongoingSessions = await db.sessions
      .where('tutorId')
      .equals(tutorProfile.id!)
      .and(session => {
        const sessionStart = new Date(session.scheduledAt);
        const sessionEnd = new Date(sessionStart.getTime() + session.duration * 60 * 1000);
        return session.status === 'ongoing' || 
               (session.status === 'scheduled' && now >= sessionStart && now < sessionEnd);
      })
      .count();

    return ongoingSessions === 0;
  }

  private async getNextAvailableSlot(tutorProfile: TutorProfile): Promise<Date | undefined> {
    const availableSlots = await this.getUpcomingAvailability(tutorProfile.id!, 7);
    return availableSlots.length > 0 ? availableSlots[0] : undefined;
  }

  private isTimeWithinAvailability(
    startTime: Date,
    endTime: Date,
    availability: TutorProfile['availability']
  ): boolean {
    const dayOfWeek = startTime.getDay();
    const startTimeStr = `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}`;
    const endTimeStr = `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`;

    return availability.some(slot => {
      return slot.dayOfWeek === dayOfWeek &&
             slot.startTime <= startTimeStr &&
             slot.endTime >= endTimeStr;
    });
  }

  private async getSuggestedTimes(
    tutorProfile: TutorProfile,
    requestedTime: Date,
    count: number = 5
  ): Promise<Date[]> {
    const availableSlots = await this.getUpcomingAvailability(tutorProfile.id!, 14);
    
    // Find slots closest to the requested time
    const requestedTimestamp = requestedTime.getTime();
    const sortedSlots = availableSlots
      .map(slot => ({
        slot,
        distance: Math.abs(slot.getTime() - requestedTimestamp)
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, count)
      .map(item => item.slot);

    return sortedSlots;
  }

  private createDateTimeFromSlot(date: Date, timeStr: string): Date {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const result = new Date(date);
    result.setHours(hours, minutes, 0, 0);
    return result;
  }

  private isCacheValid(): boolean {
    if (!this.lastCacheUpdate || this.tutorsCache.length === 0) {
      return false;
    }
    
    const now = new Date();
    const timeDiff = now.getTime() - this.lastCacheUpdate.getTime();
    return timeDiff < this.CACHE_DURATION;
  }

  private clearCache(): void {
    this.tutorsCache = [];
    this.lastCacheUpdate = null;
    this.fuseInstance = null;
  }
}

// Export singleton instance
export const tutorAPI = new TutorAPI();

// Export types
export type {
  TutorSearchFilters,
  TutorSearchOptions,
  TutorWithUser,
  TutorSearchResult,
  AvailabilityCheckResult
};