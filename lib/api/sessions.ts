import { db, Session, User, TutorProfile, RecurringPattern } from '../db/index';
import { addDays, addWeeks, addMonths, format, parseISO, isAfter, isBefore, isEqual, startOfDay, endOfDay } from 'date-fns';
import { zonedTimeToUtc, utcToZonedTime, formatInTimeZone } from 'date-fns-tz';

export interface SessionBookingRequest {
  tutorId: number;
  studentId: number;
  subject: string;
  title: string;
  description?: string;
  scheduledAt: Date;
  duration: number; // minutes
  price: number;
  currency: string;
  isRecurring?: boolean;
  recurringPattern?: RecurringPattern;
  timezone: string;
}

export interface SessionUpdateRequest {
  sessionId: number;
  scheduledAt?: Date;
  duration?: number;
  title?: string;
  description?: string;
  notes?: string;
  status?: Session['status'];
  timezone?: string;
}

export interface AvailabilitySlot {
  start: Date;
  end: Date;
  isAvailable: boolean;
  conflictReason?: string;
}

export interface SessionConflict {
  type: 'tutor_busy' | 'student_busy' | 'outside_availability' | 'past_time' | 'too_short_notice';
  message: string;
  conflictingSession?: Session;
  suggestedTimes?: Date[];
}

export interface SessionSearchFilters {
  tutorId?: number;
  studentId?: number;
  subject?: string;
  status?: Session['status'];
  dateFrom?: Date;
  dateTo?: Date;
  isRecurring?: boolean;
}

export interface SessionStats {
  totalSessions: number;
  completedSessions: number;
  cancelledSessions: number;
  upcomingSessions: number;
  totalHours: number;
  averageRating: number;
  totalEarnings?: number; // for tutors
  totalSpent?: number; // for students
}

class SessionAPI {
  private readonly MINIMUM_BOOKING_NOTICE = 2; // hours
  private readonly MAXIMUM_BOOKING_ADVANCE = 90; // days
  private readonly DEFAULT_SESSION_DURATION = 60; // minutes

  /**
   * Book a new session with conflict detection and validation
   */
  async bookSession(request: SessionBookingRequest): Promise<{ success: boolean; sessionId?: number; conflicts?: SessionConflict[]; error?: string }> {
    try {
      // Validate the booking request
      const validation = await this.validateBookingRequest(request);
      if (!validation.isValid) {
        return { success: false, conflicts: validation.conflicts, error: validation.error };
      }

      // Convert scheduled time to UTC for storage
      const scheduledAtUTC = zonedTimeToUtc(request.scheduledAt, request.timezone);

      // Create the main session
      const sessionData: Omit<Session, 'id'> = {
        tutorId: request.tutorId,
        studentId: request.studentId,
        subject: request.subject,
        title: request.title,
        description: request.description,
        scheduledAt: scheduledAtUTC,
        duration: request.duration,
        status: 'scheduled',
        price: request.price,
        currency: request.currency,
        isRecurring: request.isRecurring || false,
        recurringPattern: request.recurringPattern,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const sessionId = await db.sessions.add(sessionData);

      // If it's a recurring session, create the recurring instances
      if (request.isRecurring && request.recurringPattern) {
        await this.createRecurringSessions(sessionId, sessionData, request.recurringPattern, request.timezone);
      }

      // Create notifications for both tutor and student
      await this.createSessionNotifications(sessionId, request.tutorId, request.studentId, 'session_booked');

      return { success: true, sessionId };
    } catch (error) {
      console.error('Error booking session:', error);
      return { success: false, error: 'Failed to book session. Please try again.' };
    }
  }

  /**
   * Update an existing session
   */
  async updateSession(request: SessionUpdateRequest): Promise<{ success: boolean; error?: string; conflicts?: SessionConflict[] }> {
    try {
      const session = await db.sessions.get(request.sessionId);
      if (!session) {
        return { success: false, error: 'Session not found' };
      }

      // Check if session can be updated
      if (session.status === 'completed' || session.status === 'cancelled') {
        return { success: false, error: 'Cannot update completed or cancelled sessions' };
      }

      const updateData: Partial<Session> = {
        updatedAt: new Date()
      };

      // If rescheduling, validate the new time
      if (request.scheduledAt) {
        const timezone = request.timezone || 'UTC';
        const newScheduledAt = zonedTimeToUtc(request.scheduledAt, timezone);
        
        // Check for conflicts with the new time
        const conflicts = await this.checkSessionConflicts({
          tutorId: session.tutorId,
          studentId: session.studentId,
          scheduledAt: request.scheduledAt,
          duration: request.duration || session.duration,
          timezone,
          excludeSessionId: session.id
        });

        if (conflicts.length > 0) {
          return { success: false, conflicts };
        }

        updateData.scheduledAt = newScheduledAt;
      }

      // Update other fields
      if (request.duration !== undefined) updateData.duration = request.duration;
      if (request.title !== undefined) updateData.title = request.title;
      if (request.description !== undefined) updateData.description = request.description;
      if (request.notes !== undefined) updateData.notes = request.notes;
      if (request.status !== undefined) updateData.status = request.status;

      await db.sessions.update(request.sessionId, updateData);

      // Create notifications for session updates
      if (request.scheduledAt || request.status) {
        await this.createSessionNotifications(request.sessionId, session.tutorId, session.studentId, 'session_updated');
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating session:', error);
      return { success: false, error: 'Failed to update session. Please try again.' };
    }
  }

  /**
   * Cancel a session
   */
  async cancelSession(sessionId: number, cancelledBy: number, reason?: string): Promise<{ success: boolean; error?: string; refundAmount?: number }> {
    try {
      const session = await db.sessions.get(sessionId);
      if (!session) {
        return { success: false, error: 'Session not found' };
      }

      if (session.status === 'completed' || session.status === 'cancelled') {
        return { success: false, error: 'Session is already completed or cancelled' };
      }

      // Calculate refund amount based on cancellation policy
      const refundAmount = await this.calculateRefundAmount(session);

      // Update session status
      await db.sessions.update(sessionId, {
        status: 'cancelled',
        notes: reason ? `Cancelled: ${reason}` : 'Cancelled',
        updatedAt: new Date()
      });

      // If it's a recurring session, handle the series
      if (session.isRecurring && session.parentSessionId) {
        await this.handleRecurringCancellation(session);
      }

      // Process refund if applicable
      if (refundAmount > 0) {
        await this.processSessionRefund(session, refundAmount);
      }

      // Create notifications
      await this.createSessionNotifications(sessionId, session.tutorId, session.studentId, 'session_cancelled');

      return { success: true, refundAmount };
    } catch (error) {
      console.error('Error cancelling session:', error);
      return { success: false, error: 'Failed to cancel session. Please try again.' };
    }
  }

  /**
   * Get tutor availability for a specific date range
   */
  async getTutorAvailability(tutorId: number, startDate: Date, endDate: Date, timezone: string = 'UTC'): Promise<AvailabilitySlot[]> {
    try {
      const tutorProfile = await db.getTutorProfile(tutorId);
      if (!tutorProfile || !tutorProfile.isActive) {
        return [];
      }

      const availability: AvailabilitySlot[] = [];
      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        const dayOfWeek = currentDate.getDay();
        const dayAvailability = tutorProfile.availability.filter(slot => slot.dayOfWeek === dayOfWeek);

        for (const slot of dayAvailability) {
          // Convert tutor's availability to the requested timezone
          const slotStart = this.combineDateAndTime(currentDate, slot.startTime, slot.timezone);
          const slotEnd = this.combineDateAndTime(currentDate, slot.endTime, slot.timezone);

          // Convert to requested timezone
          const zonedStart = utcToZonedTime(slotStart, timezone);
          const zonedEnd = utcToZonedTime(slotEnd, timezone);

          // Check for existing sessions in this slot
          const conflicts = await this.getSessionsInTimeRange(tutorId, slotStart, slotEnd);
          
          if (conflicts.length === 0) {
            availability.push({
              start: zonedStart,
              end: zonedEnd,
              isAvailable: true
            });
          } else {
            // Split the slot around existing sessions
            const splitSlots = this.splitAvailabilityAroundConflicts(zonedStart, zonedEnd, conflicts, timezone);
            availability.push(...splitSlots);
          }
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      return availability.sort((a, b) => a.start.getTime() - b.start.getTime());
    } catch (error) {
      console.error('Error getting tutor availability:', error);
      return [];
    }
  }

  /**
   * Check for session conflicts
   */
  async checkSessionConflicts(params: {
    tutorId: number;
    studentId: number;
    scheduledAt: Date;
    duration: number;
    timezone: string;
    excludeSessionId?: number;
  }): Promise<SessionConflict[]> {
    const conflicts: SessionConflict[] = [];
    const { tutorId, studentId, scheduledAt, duration, timezone, excludeSessionId } = params;

    // Convert to UTC for database queries
    const scheduledAtUTC = zonedTimeToUtc(scheduledAt, timezone);
    const sessionEnd = new Date(scheduledAtUTC.getTime() + duration * 60000);

    // Check if the time is in the past
    if (scheduledAtUTC <= new Date()) {
      conflicts.push({
        type: 'past_time',
        message: 'Cannot schedule sessions in the past'
      });
    }

    // Check minimum booking notice
    const minBookingTime = new Date(Date.now() + this.MINIMUM_BOOKING_NOTICE * 60 * 60 * 1000);
    if (scheduledAtUTC < minBookingTime) {
      conflicts.push({
        type: 'too_short_notice',
        message: `Sessions must be booked at least ${this.MINIMUM_BOOKING_NOTICE} hours in advance`
      });
    }

    // Check tutor availability
    const tutorProfile = await db.getTutorProfile(tutorId);
    if (tutorProfile) {
      const isWithinAvailability = this.isTimeWithinAvailability(scheduledAt, duration, tutorProfile.availability, timezone);
      if (!isWithinAvailability) {
        conflicts.push({
          type: 'outside_availability',
          message: 'Selected time is outside tutor\'s available hours'
        });
      }
    }

    // Check for conflicting tutor sessions
    const tutorSessions = await this.getSessionsInTimeRange(tutorId, scheduledAtUTC, sessionEnd, 'tutor');
    const conflictingTutorSessions = tutorSessions.filter(session => 
      session.id !== excludeSessionId && 
      (session.status === 'scheduled' || session.status === 'ongoing')
    );

    if (conflictingTutorSessions.length > 0) {
      conflicts.push({
        type: 'tutor_busy',
        message: 'Tutor has another session at this time',
        conflictingSession: conflictingTutorSessions[0]
      });
    }

    // Check for conflicting student sessions
    const studentSessions = await this.getSessionsInTimeRange(studentId, scheduledAtUTC, sessionEnd, 'student');
    const conflictingStudentSessions = studentSessions.filter(session => 
      session.id !== excludeSessionId && 
      (session.status === 'scheduled' || session.status === 'ongoing')
    );

    if (conflictingStudentSessions.length > 0) {
      conflicts.push({
        type: 'student_busy',
        message: 'Student has another session at this time',
        conflictingSession: conflictingStudentSessions[0]
      });
    }

    return conflicts;
  }

  /**
   * Get sessions with filters
   */
  async getSessions(filters: SessionSearchFilters = {}): Promise<Session[]> {
    try {
      let query = db.sessions.toCollection();

      if (filters.tutorId) {
        query = query.filter(session => session.tutorId === filters.tutorId);
      }

      if (filters.studentId) {
        query = query.filter(session => session.studentId === filters.studentId);
      }

      if (filters.subject) {
        query = query.filter(session => session.subject === filters.subject);
      }

      if (filters.status) {
        query = query.filter(session => session.status === filters.status);
      }

      if (filters.dateFrom) {
        query = query.filter(session => session.scheduledAt >= filters.dateFrom!);
      }

      if (filters.dateTo) {
        query = query.filter(session => session.scheduledAt <= filters.dateTo!);
      }

      if (filters.isRecurring !== undefined) {
        query = query.filter(session => session.isRecurring === filters.isRecurring);
      }

      return await query.sortBy('scheduledAt');
    } catch (error) {
      console.error('Error getting sessions:', error);
      return [];
    }
  }

  /**
   * Get session statistics for a user
   */
  async getSessionStats(userId: number, role: 'tutor' | 'student'): Promise<SessionStats> {
    try {
      const field = role === 'tutor' ? 'tutorId' : 'studentId';
      const sessions = await db.sessions.where(field).equals(userId).toArray();

      const stats: SessionStats = {
        totalSessions: sessions.length,
        completedSessions: sessions.filter(s => s.status === 'completed').length,
        cancelledSessions: sessions.filter(s => s.status === 'cancelled').length,
        upcomingSessions: sessions.filter(s => s.status === 'scheduled' && s.scheduledAt > new Date()).length,
        totalHours: sessions.reduce((total, session) => total + session.duration, 0) / 60,
        averageRating: 0
      };

      // Calculate average rating from reviews
      if (role === 'tutor') {
        const reviews = await db.getReviewsByTutor(userId);
        if (reviews.length > 0) {
          stats.averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
        }

        // Calculate total earnings
        const completedSessions = sessions.filter(s => s.status === 'completed');
        stats.totalEarnings = completedSessions.reduce((total, session) => total + session.price, 0);
      } else {
        // For students, calculate total spent
        const completedSessions = sessions.filter(s => s.status === 'completed');
        stats.totalSpent = completedSessions.reduce((total, session) => total + session.price, 0);
      }

      return stats;
    } catch (error) {
      console.error('Error getting session stats:', error);
      return {
        totalSessions: 0,
        completedSessions: 0,
        cancelledSessions: 0,
        upcomingSessions: 0,
        totalHours: 0,
        averageRating: 0
      };
    }
  }

  /**
   * Get upcoming sessions for a user
   */
  async getUpcomingSessions(userId: number, role: 'tutor' | 'student', limit: number = 10): Promise<Session[]> {
    try {
      return await db.getUpcomingSessions(userId, role);
    } catch (error) {
      console.error('Error getting upcoming sessions:', error);
      return [];
    }
  }

  /**
   * Start a session (change status to ongoing)
   */
  async startSession(sessionId: number, startedBy: number): Promise<{ success: boolean; error?: string; meetingUrl?: string }> {
    try {
      const session = await db.sessions.get(sessionId);
      if (!session) {
        return { success: false, error: 'Session not found' };
      }

      if (session.status !== 'scheduled') {
        return { success: false, error: 'Session cannot be started' };
      }

      // Check if it's time to start (within 15 minutes of scheduled time)
      const now = new Date();
      const scheduledTime = new Date(session.scheduledAt);
      const timeDiff = Math.abs(now.getTime() - scheduledTime.getTime()) / (1000 * 60); // minutes

      if (timeDiff > 15) {
        return { success: false, error: 'Session can only be started within 15 minutes of scheduled time' };
      }

      // Generate meeting URL (in a real app, this would integrate with WebRTC service)
      const meetingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/classroom/${sessionId}`;

      await db.sessions.update(sessionId, {
        status: 'ongoing',
        meetingUrl,
        updatedAt: new Date()
      });

      // Create notifications
      await this.createSessionNotifications(sessionId, session.tutorId, session.studentId, 'session_started');

      return { success: true, meetingUrl };
    } catch (error) {
      console.error('Error starting session:', error);
      return { success: false, error: 'Failed to start session. Please try again.' };
    }
  }

  /**
   * End a session (change status to completed)
   */
  async endSession(sessionId: number, endedBy: number, notes?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const session = await db.sessions.get(sessionId);
      if (!session) {
        return { success: false, error: 'Session not found' };
      }

      if (session.status !== 'ongoing') {
        return { success: false, error: 'Session is not currently ongoing' };
      }

      await db.sessions.update(sessionId, {
        status: 'completed',
        notes: notes || session.notes,
        updatedAt: new Date()
      });

      // Create notifications
      await this.createSessionNotifications(sessionId, session.tutorId, session.studentId, 'session_completed');

      return { success: true };
    } catch (error) {
      console.error('Error ending session:', error);
      return { success: false, error: 'Failed to end session. Please try again.' };
    }
  }

  // Private helper methods

  private async validateBookingRequest(request: SessionBookingRequest): Promise<{ isValid: boolean; conflicts?: SessionConflict[]; error?: string }> {
    // Check if tutor exists and is active
    const tutorProfile = await db.getTutorProfile(request.tutorId);
    if (!tutorProfile || !tutorProfile.isActive) {
      return { isValid: false, error: 'Tutor not found or inactive' };
    }

    // Check if student exists
    const student = await db.users.get(request.studentId);
    if (!student || !student.isActive || student.role !== 'student') {
      return { isValid: false, error: 'Student not found or inactive' };
    }

    // Check for conflicts
    const conflicts = await this.checkSessionConflicts({
      tutorId: request.tutorId,
      studentId: request.studentId,
      scheduledAt: request.scheduledAt,
      duration: request.duration,
      timezone: request.timezone
    });

    if (conflicts.length > 0) {
      return { isValid: false, conflicts };
    }

    return { isValid: true };
  }

  private async createRecurringSessions(parentSessionId: number, sessionData: Omit<Session, 'id'>, pattern: RecurringPattern, timezone: string): Promise<void> {
    const sessions: Omit<Session, 'id'>[] = [];
    let currentDate = new Date(sessionData.scheduledAt);
    let occurrenceCount = 0;
    const maxOccurrences = pattern.maxOccurrences || 52; // Default to 1 year

    while (occurrenceCount < maxOccurrences) {
      // Calculate next occurrence
      switch (pattern.frequency) {
        case 'daily':
          currentDate = addDays(currentDate, pattern.interval);
          break;
        case 'weekly':
          currentDate = addWeeks(currentDate, pattern.interval);
          break;
        case 'monthly':
          currentDate = addMonths(currentDate, pattern.interval);
          break;
      }

      // Check if we've reached the end date
      if (pattern.endDate && currentDate > pattern.endDate) {
        break;
      }

      // For weekly patterns, check if the day matches
      if (pattern.frequency === 'weekly' && pattern.daysOfWeek) {
        const dayOfWeek = currentDate.getDay();
        if (!pattern.daysOfWeek.includes(dayOfWeek)) {
          continue;
        }
      }

      // Check for conflicts before creating
      const conflicts = await this.checkSessionConflicts({
        tutorId: sessionData.tutorId,
        studentId: sessionData.studentId,
        scheduledAt: utcToZonedTime(currentDate, timezone),
        duration: sessionData.duration,
        timezone
      });

      if (conflicts.length === 0) {
        sessions.push({
          ...sessionData,
          scheduledAt: currentDate,
          parentSessionId,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      occurrenceCount++;
    }

    if (sessions.length > 0) {
      await db.sessions.bulkAdd(sessions);
    }
  }

  private async getSessionsInTimeRange(userId: number, startTime: Date, endTime: Date, role: 'tutor' | 'student' = 'tutor'): Promise<Session[]> {
    const field = role === 'tutor' ? 'tutorId' : 'studentId';
    
    return await db.sessions
      .where(field)
      .equals(userId)
      .and(session => {
        const sessionStart = new Date(session.scheduledAt);
        const sessionEnd = new Date(sessionStart.getTime() + session.duration * 60000);
        
        // Check for overlap
        return (sessionStart < endTime && sessionEnd > startTime);
      })
      .toArray();
  }

  private combineDateAndTime(date: Date, time: string, timezone: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const combined = new Date(date);
    combined.setHours(hours, minutes, 0, 0);
    
    return zonedTimeToUtc(combined, timezone);
  }

  private isTimeWithinAvailability(scheduledAt: Date, duration: number, availability: any[], timezone: string): boolean {
    const dayOfWeek = scheduledAt.getDay();
    const timeString = format(scheduledAt, 'HH:mm');
    const endTime = format(new Date(scheduledAt.getTime() + duration * 60000), 'HH:mm');

    const dayAvailability = availability.filter(slot => slot.dayOfWeek === dayOfWeek);
    
    return dayAvailability.some(slot => {
      return timeString >= slot.startTime && endTime <= slot.endTime;
    });
  }

  private splitAvailabilityAroundConflicts(start: Date, end: Date, conflicts: Session[], timezone: string): AvailabilitySlot[] {
    const slots: AvailabilitySlot[] = [];
    let currentStart = start;

    // Sort conflicts by start time
    const sortedConflicts = conflicts.sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());

    for (const conflict of sortedConflicts) {
      const conflictStart = utcToZonedTime(conflict.scheduledAt, timezone);
      const conflictEnd = new Date(conflictStart.getTime() + conflict.duration * 60000);

      // Add available slot before conflict
      if (currentStart < conflictStart) {
        slots.push({
          start: currentStart,
          end: conflictStart,
          isAvailable: true
        });
      }

      // Add unavailable slot for conflict
      slots.push({
        start: conflictStart,
        end: conflictEnd,
        isAvailable: false,
        conflictReason: `Booked session: ${conflict.title}`
      });

      currentStart = conflictEnd;
    }

    // Add remaining available time
    if (currentStart < end) {
      slots.push({
        start: currentStart,
        end: end,
        isAvailable: true
      });
    }

    return slots;
  }

  private async calculateRefundAmount(session: Session): Promise<number> {
    const now = new Date();
    const sessionTime = new Date(session.scheduledAt);
    const hoursUntilSession = (sessionTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Refund policy: 100% if cancelled 24+ hours before, 50% if 2-24 hours, 0% if less than 2 hours
    if (hoursUntilSession >= 24) {
      return session.price;
    } else if (hoursUntilSession >= 2) {
      return session.price * 0.5;
    } else {
      return 0;
    }
  }

  private async processSessionRefund(session: Session, refundAmount: number): Promise<void> {
    // In a real app, this would integrate with payment processor
    // For now, we'll just add a transaction record
    const wallet = await db.getWalletByUser(session.studentId);
    if (wallet) {
      await db.transactions.add({
        walletId: wallet.id!,
        userId: session.studentId,
        type: 'refund',
        amount: refundAmount,
        currency: session.currency,
        description: `Refund for cancelled session: ${session.title}`,
        referenceId: session.id?.toString(),
        referenceType: 'session',
        balanceAfter: wallet.balance + refundAmount,
        createdAt: new Date()
      });

      await db.wallets.update(wallet.id!, {
        balance: wallet.balance + refundAmount,
        lastTransactionAt: new Date(),
        updatedAt: new Date()
      });
    }
  }

  private async handleRecurringCancellation(session: Session): Promise<void> {
    // For now, just cancel this instance. In a real app, you might want to ask
    // if they want to cancel the entire series or just this instance
    console.log(`Handling recurring session cancellation for session ${session.id}`);
  }

  private async createSessionNotifications(sessionId: number, tutorId: number, studentId: number, type: string): Promise<void> {
    const session = await db.sessions.get(sessionId);
    if (!session) return;

    const notifications = [
      {
        userId: tutorId,
        type: 'session_reminder' as const,
        title: `Session ${type.replace('_', ' ')}`,
        message: `Your session "${session.title}" has been ${type.replace('_', ' ')}`,
        data: { sessionId, type },
        isRead: false,
        createdAt: new Date()
      },
      {
        userId: studentId,
        type: 'session_reminder' as const,
        title: `Session ${type.replace('_', ' ')}`,
        message: `Your session "${session.title}" has been ${type.replace('_', ' ')}`,
        data: { sessionId, type },
        isRead: false,
        createdAt: new Date()
      }
    ];

    await db.notifications.bulkAdd(notifications);
  }
}

// Export singleton instance
export const sessionAPI = new SessionAPI();

// Export types
export type {
  SessionBookingRequest,
  SessionUpdateRequest,
  AvailabilitySlot,
  SessionConflict,
  SessionSearchFilters,
  SessionStats
};