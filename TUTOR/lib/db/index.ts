import Dexie, { Table } from 'dexie';

// User-related interfaces
export interface User {
  id?: number;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'tutor' | 'admin';
  avatar?: string;
  phone?: string;
  dateOfBirth?: Date;
  timezone: string;
  language: string;
  isEmailVerified: boolean;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TutorProfile {
  id?: number;
  userId: number;
  title: string;
  bio: string;
  experience: number; // years
  education: string;
  certifications: string[];
  subjects: string[];
  hourlyRate: number;
  currency: string;
  availability: AvailabilitySlot[];
  languages: string[];
  videoIntroUrl?: string;
  rating: number;
  totalReviews: number;
  totalSessions: number;
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AvailabilitySlot {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  timezone: string;
}

export interface StudentProfile {
  id?: number;
  userId: number;
  grade?: string;
  school?: string;
  learningGoals: string[];
  preferredSubjects: string[];
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  parentEmail?: string;
  parentPhone?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Session-related interfaces
export interface Session {
  id?: number;
  tutorId: number;
  studentId: number;
  subject: string;
  title: string;
  description?: string;
  scheduledAt: Date;
  duration: number; // minutes
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled' | 'no-show';
  meetingUrl?: string;
  recordingUrl?: string;
  notes?: string;
  rating?: number;
  review?: string;
  price: number;
  currency: string;
  isRecurring: boolean;
  recurringPattern?: RecurringPattern;
  parentSessionId?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecurringPattern {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number; // every N days/weeks/months
  daysOfWeek?: number[]; // for weekly patterns
  endDate?: Date;
  maxOccurrences?: number;
}

export interface SessionMaterial {
  id?: number;
  sessionId: number;
  name: string;
  type: 'document' | 'video' | 'audio' | 'image' | 'link';
  url: string;
  size?: number;
  uploadedBy: number;
  createdAt: Date;
}

// Assignment-related interfaces
export interface Assignment {
  id?: number;
  tutorId: number;
  studentId: number;
  sessionId?: number;
  title: string;
  description: string;
  instructions: string;
  dueDate: Date;
  maxPoints: number;
  status: 'assigned' | 'submitted' | 'graded' | 'overdue';
  submissionUrl?: string;
  submittedAt?: Date;
  grade?: number;
  feedback?: string;
  gradedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssignmentSubmission {
  id?: number;
  assignmentId: number;
  studentId: number;
  content: string;
  attachments: string[];
  submittedAt: Date;
  isLate: boolean;
}

// Quiz-related interfaces
export interface Quiz {
  id?: number;
  tutorId: number;
  title: string;
  description: string;
  subject: string;
  timeLimit?: number; // minutes
  maxAttempts: number;
  passingScore: number;
  isActive: boolean;
  questions: QuizQuestion[];
  createdAt: Date;
  updatedAt: Date;
}

export interface QuizQuestion {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer' | 'essay';
  question: string;
  options?: string[]; // for multiple choice
  correctAnswer: string | string[];
  points: number;
  explanation?: string;
}

export interface QuizAttempt {
  id?: number;
  quizId: number;
  studentId: number;
  answers: QuizAnswer[];
  score: number;
  maxScore: number;
  percentage: number;
  timeSpent: number; // minutes
  startedAt: Date;
  completedAt?: Date;
  isPassed: boolean;
}

export interface QuizAnswer {
  questionId: string;
  answer: string | string[];
  isCorrect: boolean;
  pointsEarned: number;
}

// Payment-related interfaces
export interface Payment {
  id?: number;
  userId: number;
  sessionId?: number;
  type: 'session' | 'package' | 'subscription' | 'refund';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: 'card' | 'paypal' | 'bank_transfer' | 'wallet';
  stripePaymentIntentId?: string;
  description: string;
  metadata?: Record<string, any>;
  processedAt?: Date;
  refundedAt?: Date;
  refundAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Wallet {
  id?: number;
  userId: number;
  balance: number;
  currency: string;
  totalEarnings?: number; // for tutors
  totalSpent?: number; // for students
  pendingAmount: number;
  lastTransactionAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id?: number;
  walletId: number;
  userId: number;
  type: 'credit' | 'debit' | 'refund' | 'withdrawal' | 'earning';
  amount: number;
  currency: string;
  description: string;
  referenceId?: string; // payment ID, session ID, etc.
  referenceType?: string;
  balanceAfter: number;
  createdAt: Date;
}

// Review and Rating interfaces
export interface Review {
  id?: number;
  tutorId: number;
  studentId: number;
  sessionId: number;
  rating: number; // 1-5
  comment: string;
  isPublic: boolean;
  tutorResponse?: string;
  respondedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Notification interfaces
export interface Notification {
  id?: number;
  userId: number;
  type: 'session_reminder' | 'payment_success' | 'assignment_due' | 'new_message' | 'system';
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
}

// Message and Chat interfaces
export interface ChatRoom {
  id?: number;
  tutorId: number;
  studentId: number;
  sessionId?: number;
  lastMessageAt?: Date;
  isActive: boolean;
  createdAt: Date;
}

export interface Message {
  id?: number;
  chatRoomId: number;
  senderId: number;
  content: string;
  type: 'text' | 'file' | 'image' | 'system';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
}

// Study Material interfaces
export interface StudyMaterial {
  id?: number;
  tutorId: number;
  title: string;
  description: string;
  subject: string;
  type: 'pdf' | 'video' | 'audio' | 'link' | 'text';
  url: string;
  size?: number;
  duration?: number; // for video/audio in seconds
  isPublic: boolean;
  downloadCount: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface StudentProgress {
  id?: number;
  studentId: number;
  tutorId: number;
  subject: string;
  totalSessions: number;
  completedAssignments: number;
  averageGrade: number;
  skillsProgress: SkillProgress[];
  goals: LearningGoal[];
  lastUpdated: Date;
}

export interface SkillProgress {
  skill: string;
  level: number; // 1-10
  progress: number; // 0-100%
  lastPracticed: Date;
}

export interface LearningGoal {
  id: string;
  title: string;
  description: string;
  targetDate: Date;
  isCompleted: boolean;
  completedAt?: Date;
  progress: number; // 0-100%
}

// Database class
export class TutorPlatformDB extends Dexie {
  // User tables
  users!: Table<User>;
  tutorProfiles!: Table<TutorProfile>;
  studentProfiles!: Table<StudentProfile>;

  // Session tables
  sessions!: Table<Session>;
  sessionMaterials!: Table<SessionMaterial>;

  // Assignment tables
  assignments!: Table<Assignment>;
  assignmentSubmissions!: Table<AssignmentSubmission>;

  // Quiz tables
  quizzes!: Table<Quiz>;
  quizAttempts!: Table<QuizAttempt>;

  // Payment tables
  payments!: Table<Payment>;
  wallets!: Table<Wallet>;
  transactions!: Table<Transaction>;

  // Review tables
  reviews!: Table<Review>;

  // Communication tables
  notifications!: Table<Notification>;
  chatRooms!: Table<ChatRoom>;
  messages!: Table<Message>;

  // Learning tables
  studyMaterials!: Table<StudyMaterial>;
  studentProgress!: Table<StudentProgress>;

  constructor() {
    super('TutorPlatformDB');

    // Version 1: Initial schema
    this.version(1).stores({
      users: '++id, email, role, isActive, createdAt',
      tutorProfiles: '++id, userId, subjects, hourlyRate, rating, isActive',
      studentProfiles: '++id, userId, preferredSubjects',
      sessions: '++id, tutorId, studentId, scheduledAt, status, subject',
      sessionMaterials: '++id, sessionId, uploadedBy, createdAt',
      assignments: '++id, tutorId, studentId, sessionId, dueDate, status',
      assignmentSubmissions: '++id, assignmentId, studentId, submittedAt',
      quizzes: '++id, tutorId, subject, isActive, createdAt',
      quizAttempts: '++id, quizId, studentId, score, completedAt',
      payments: '++id, userId, sessionId, type, status, createdAt',
      wallets: '++id, userId, currency',
      transactions: '++id, walletId, userId, type, createdAt',
      reviews: '++id, tutorId, studentId, sessionId, rating, createdAt',
      notifications: '++id, userId, type, isRead, createdAt',
      chatRooms: '++id, tutorId, studentId, sessionId, isActive',
      messages: '++id, chatRoomId, senderId, isRead, createdAt',
      studyMaterials: '++id, tutorId, subject, type, isPublic, createdAt',
      studentProgress: '++id, studentId, tutorId, subject, lastUpdated'
    });

    // Version 2: Add indexes for better query performance
    this.version(2).stores({
      users: '++id, email, role, isActive, createdAt, [role+isActive]',
      tutorProfiles: '++id, userId, subjects, hourlyRate, rating, isActive, [isActive+rating]',
      studentProfiles: '++id, userId, preferredSubjects',
      sessions: '++id, tutorId, studentId, scheduledAt, status, subject, [tutorId+status], [studentId+status], [scheduledAt+status]',
      sessionMaterials: '++id, sessionId, uploadedBy, createdAt',
      assignments: '++id, tutorId, studentId, sessionId, dueDate, status, [studentId+status], [tutorId+status]',
      assignmentSubmissions: '++id, assignmentId, studentId, submittedAt',
      quizzes: '++id, tutorId, subject, isActive, createdAt, [tutorId+isActive]',
      quizAttempts: '++id, quizId, studentId, score, completedAt, [studentId+quizId]',
      payments: '++id, userId, sessionId, type, status, createdAt, [userId+status], [type+status]',
      wallets: '++id, userId, currency',
      transactions: '++id, walletId, userId, type, createdAt, [userId+type]',
      reviews: '++id, tutorId, studentId, sessionId, rating, createdAt, [tutorId+rating]',
      notifications: '++id, userId, type, isRead, createdAt, [userId+isRead]',
      chatRooms: '++id, tutorId, studentId, sessionId, isActive, [tutorId+studentId]',
      messages: '++id, chatRoomId, senderId, isRead, createdAt, [chatRoomId+createdAt]',
      studyMaterials: '++id, tutorId, subject, type, isPublic, createdAt, [subject+isPublic]',
      studentProgress: '++id, studentId, tutorId, subject, lastUpdated, [studentId+tutorId]'
    });

    // Migration hooks
    this.version(2).upgrade(tx => {
      // Add any data migration logic here if needed
      console.log('Upgrading to version 2...');
    });
  }

  // Type-safe query methods

  // User methods
  async getUserByEmail(email: string): Promise<User | undefined> {
    return await this.users.where('email').equals(email).first();
  }

  async getUsersByRole(role: User['role']): Promise<User[]> {
    return await this.users.where('role').equals(role).toArray();
  }

  async getActiveUsers(): Promise<User[]> {
    return await this.users.where('isActive').equals(true).toArray();
  }

  // Tutor methods
  async getTutorProfile(userId: number): Promise<TutorProfile | undefined> {
    return await this.tutorProfiles.where('userId').equals(userId).first();
  }

  async getActiveTutors(): Promise<TutorProfile[]> {
    return await this.tutorProfiles.where('isActive').equals(true).toArray();
  }

  async getTutorsBySubject(subject: string): Promise<TutorProfile[]> {
    return await this.tutorProfiles
      .filter(tutor => tutor.subjects.includes(subject) && tutor.isActive)
      .toArray();
  }

  async getTutorsByRating(minRating: number): Promise<TutorProfile[]> {
    return await this.tutorProfiles
      .where('rating')
      .aboveOrEqual(minRating)
      .and(tutor => tutor.isActive)
      .toArray();
  }

  // Session methods
  async getSessionsByTutor(tutorId: number, status?: Session['status']): Promise<Session[]> {
    let query = this.sessions.where('tutorId').equals(tutorId);
    if (status) {
      query = query.and(session => session.status === status);
    }
    return await query.toArray();
  }

  async getSessionsByStudent(studentId: number, status?: Session['status']): Promise<Session[]> {
    let query = this.sessions.where('studentId').equals(studentId);
    if (status) {
      query = query.and(session => session.status === status);
    }
    return await query.toArray();
  }

  async getUpcomingSessions(userId: number, role: 'tutor' | 'student'): Promise<Session[]> {
    const now = new Date();
    const field = role === 'tutor' ? 'tutorId' : 'studentId';
    
    return await this.sessions
      .where(field)
      .equals(userId)
      .and(session => session.scheduledAt > now && session.status === 'scheduled')
      .sortBy('scheduledAt');
  }

  // Assignment methods
  async getAssignmentsByStudent(studentId: number, status?: Assignment['status']): Promise<Assignment[]> {
    let query = this.assignments.where('studentId').equals(studentId);
    if (status) {
      query = query.and(assignment => assignment.status === status);
    }
    return await query.toArray();
  }

  async getOverdueAssignments(studentId: number): Promise<Assignment[]> {
    const now = new Date();
    return await this.assignments
      .where('studentId')
      .equals(studentId)
      .and(assignment => assignment.dueDate < now && assignment.status !== 'submitted' && assignment.status !== 'graded')
      .toArray();
  }

  // Payment methods
  async getWalletByUser(userId: number): Promise<Wallet | undefined> {
    return await this.wallets.where('userId').equals(userId).first();
  }

  async getTransactionHistory(userId: number, limit?: number): Promise<Transaction[]> {
    let query = this.transactions.where('userId').equals(userId).reverse().sortBy('createdAt');
    if (limit) {
      return await query.then(transactions => transactions.slice(0, limit));
    }
    return await query;
  }

  async getPaymentsByUser(userId: number, status?: Payment['status']): Promise<Payment[]> {
    let query = this.payments.where('userId').equals(userId);
    if (status) {
      query = query.and(payment => payment.status === status);
    }
    return await query.toArray();
  }

  // Review methods
  async getReviewsByTutor(tutorId: number): Promise<Review[]> {
    return await this.reviews.where('tutorId').equals(tutorId).toArray();
  }

  async getTutorAverageRating(tutorId: number): Promise<number> {
    const reviews = await this.getReviewsByTutor(tutorId);
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return sum / reviews.length;
  }

  // Notification methods
  async getUnreadNotifications(userId: number): Promise<Notification[]> {
    return await this.notifications
      .where('userId')
      .equals(userId)
      .and(notification => !notification.isRead)
      .reverse()
      .sortBy('createdAt');
  }

  async markNotificationAsRead(notificationId: number): Promise<void> {
    await this.notifications.update(notificationId, {
      isRead: true,
      readAt: new Date()
    });
  }

  // Chat methods
  async getChatRoom(tutorId: number, studentId: number): Promise<ChatRoom | undefined> {
    return await this.chatRooms
      .where('tutorId')
      .equals(tutorId)
      .and(room => room.studentId === studentId)
      .first();
  }

  async getMessagesByRoom(chatRoomId: number, limit?: number): Promise<Message[]> {
    let query = this.messages.where('chatRoomId').equals(chatRoomId).reverse().sortBy('createdAt');
    if (limit) {
      return await query.then(messages => messages.slice(0, limit));
    }
    return await query;
  }

  // Study material methods
  async getPublicStudyMaterials(subject?: string): Promise<StudyMaterial[]> {
    let query = this.studyMaterials.where('isPublic').equals(true);
    if (subject) {
      query = query.and(material => material.subject === subject);
    }
    return await query.toArray();
  }

  async getStudyMaterialsByTutor(tutorId: number): Promise<StudyMaterial[]> {
    return await this.studyMaterials.where('tutorId').equals(tutorId).toArray();
  }

  // Progress tracking methods
  async getStudentProgress(studentId: number, tutorId?: number): Promise<StudentProgress[]> {
    let query = this.studentProgress.where('studentId').equals(studentId);
    if (tutorId) {
      query = query.and(progress => progress.tutorId === tutorId);
    }
    return await query.toArray();
  }

  // Utility methods
  async clearAllData(): Promise<void> {
    await this.transaction('rw', this.tables, async () => {
      await Promise.all(this.tables.map(table => table.clear()));
    });
  }

  async exportData(): Promise<any> {
    const data: any = {};
    for (const table of this.tables) {
      data[table.name] = await table.toArray();
    }
    return data;
  }

  async importData(data: any): Promise<void> {
    await this.transaction('rw', this.tables, async () => {
      for (const [tableName, tableData] of Object.entries(data)) {
        const table = (this as any)[tableName];
        if (table && Array.isArray(tableData)) {
          await table.bulkAdd(tableData);
        }
      }
    });
  }
}

// Create and export database instance
export const db = new TutorPlatformDB();

// Export types for use in other files
export type {
  User,
  TutorProfile,
  StudentProfile,
  Session,
  Assignment,
  Quiz,
  Payment,
  Wallet,
  Transaction,
  Review,
  Notification,
  ChatRoom,
  Message,
  StudyMaterial,
  StudentProgress
};