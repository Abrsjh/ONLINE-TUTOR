import { z } from 'zod';

// Common validation patterns
const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// Base schemas
export const emailSchema = z.string().email('Invalid email address');
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(passwordRegex, 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');

export const phoneSchema = z.string()
  .regex(phoneRegex, 'Invalid phone number format')
  .optional();

export const urlSchema = z.string().url('Invalid URL format').optional();

// User Authentication Schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  role: z.enum(['student', 'tutor'], {
    required_error: 'Please select a role',
  }),
  phone: phoneSchema,
  dateOfBirth: z.string().refine((date) => {
    const birthDate = new Date(date);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    return age >= 13;
  }, 'Must be at least 13 years old'),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),
  marketingConsent: z.boolean().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// User Profile Schemas
export const userProfileSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: emailSchema,
  phone: phoneSchema,
  dateOfBirth: z.string().optional(),
  bio: z.string().max(1000, 'Bio must be less than 1000 characters').optional(),
  profilePicture: z.string().url('Invalid profile picture URL').optional(),
  timezone: z.string().min(1, 'Timezone is required'),
  language: z.string().min(2, 'Language is required'),
  notifications: z.object({
    email: z.boolean(),
    push: z.boolean(),
    sms: z.boolean(),
    marketing: z.boolean(),
  }),
});

// Tutor Profile Schemas
export const tutorProfileSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100, 'Title must be less than 100 characters'),
  bio: z.string().min(50, 'Bio must be at least 50 characters').max(2000, 'Bio must be less than 2000 characters'),
  subjects: z.array(z.string()).min(1, 'At least one subject is required').max(10, 'Maximum 10 subjects allowed'),
  experience: z.number().min(0, 'Experience cannot be negative').max(50, 'Experience cannot exceed 50 years'),
  education: z.array(z.object({
    degree: z.string().min(2, 'Degree is required'),
    institution: z.string().min(2, 'Institution is required'),
    year: z.number().min(1950).max(new Date().getFullYear()),
    field: z.string().min(2, 'Field of study is required'),
  })).min(1, 'At least one education entry is required'),
  certifications: z.array(z.object({
    name: z.string().min(2, 'Certification name is required'),
    issuer: z.string().min(2, 'Issuer is required'),
    year: z.number().min(1950).max(new Date().getFullYear()),
    expiryYear: z.number().optional(),
  })).optional(),
  languages: z.array(z.object({
    language: z.string().min(2, 'Language is required'),
    proficiency: z.enum(['native', 'fluent', 'intermediate', 'beginner']),
  })).min(1, 'At least one language is required'),
  hourlyRate: z.number().min(5, 'Hourly rate must be at least $5').max(500, 'Hourly rate cannot exceed $500'),
  availability: z.object({
    monday: z.array(z.object({
      start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
      end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
    })),
    tuesday: z.array(z.object({
      start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
      end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
    })),
    wednesday: z.array(z.object({
      start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
      end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
    })),
    thursday: z.array(z.object({
      start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
      end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
    })),
    friday: z.array(z.object({
      start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
      end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
    })),
    saturday: z.array(z.object({
      start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
      end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
    })),
    sunday: z.array(z.object({
      start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
      end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
    })),
  }),
  videoIntroUrl: urlSchema,
  teachingStyle: z.string().max(500, 'Teaching style must be less than 500 characters').optional(),
  specializations: z.array(z.string()).max(5, 'Maximum 5 specializations allowed').optional(),
});

// Booking Schemas
export const bookingSchema = z.object({
  tutorId: z.string().min(1, 'Tutor ID is required'),
  subject: z.string().min(1, 'Subject is required'),
  sessionType: z.enum(['one-time', 'recurring'], {
    required_error: 'Session type is required',
  }),
  startTime: z.string().refine((date) => {
    const sessionDate = new Date(date);
    const now = new Date();
    return sessionDate > now;
  }, 'Session must be scheduled for a future time'),
  duration: z.number().min(30, 'Minimum session duration is 30 minutes').max(180, 'Maximum session duration is 180 minutes'),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
  recurringPattern: z.object({
    frequency: z.enum(['weekly', 'biweekly', 'monthly']),
    endDate: z.string(),
    daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
  }).optional(),
  timezone: z.string().min(1, 'Timezone is required'),
});

export const rescheduleBookingSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  newStartTime: z.string().refine((date) => {
    const sessionDate = new Date(date);
    const now = new Date();
    return sessionDate > now;
  }, 'New session time must be in the future'),
  reason: z.string().min(10, 'Please provide a reason for rescheduling').max(200, 'Reason must be less than 200 characters'),
});

export const cancelBookingSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  reason: z.string().min(10, 'Please provide a reason for cancellation').max(200, 'Reason must be less than 200 characters'),
  refundRequested: z.boolean().optional(),
});

// Payment Schemas
export const paymentMethodSchema = z.object({
  type: z.enum(['card', 'paypal', 'bank_transfer']),
  cardNumber: z.string().regex(/^\d{13,19}$/, 'Invalid card number').optional(),
  expiryMonth: z.number().min(1).max(12).optional(),
  expiryYear: z.number().min(new Date().getFullYear()).optional(),
  cvv: z.string().regex(/^\d{3,4}$/, 'Invalid CVV').optional(),
  cardholderName: z.string().min(2, 'Cardholder name is required').optional(),
  billingAddress: z.object({
    street: z.string().min(5, 'Street address is required'),
    city: z.string().min(2, 'City is required'),
    state: z.string().min(2, 'State is required'),
    zipCode: z.string().min(5, 'ZIP code is required'),
    country: z.string().min(2, 'Country is required'),
  }).optional(),
}).refine((data) => {
  if (data.type === 'card') {
    return data.cardNumber && data.expiryMonth && data.expiryYear && data.cvv && data.cardholderName;
  }
  return true;
}, {
  message: 'Card details are required for card payments',
});

export const walletTopUpSchema = z.object({
  amount: z.number().min(10, 'Minimum top-up amount is $10').max(1000, 'Maximum top-up amount is $1000'),
  paymentMethodId: z.string().min(1, 'Payment method is required'),
});

export const refundRequestSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  reason: z.string().min(20, 'Please provide a detailed reason for the refund request').max(500, 'Reason must be less than 500 characters'),
  amount: z.number().min(1, 'Refund amount must be greater than 0'),
});

// Assignment Schemas
export const assignmentSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100, 'Title must be less than 100 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters').max(2000, 'Description must be less than 2000 characters'),
  subject: z.string().min(1, 'Subject is required'),
  dueDate: z.string().refine((date) => {
    const dueDate = new Date(date);
    const now = new Date();
    return dueDate > now;
  }, 'Due date must be in the future'),
  maxPoints: z.number().min(1, 'Maximum points must be at least 1').max(1000, 'Maximum points cannot exceed 1000'),
  instructions: z.string().max(5000, 'Instructions must be less than 5000 characters').optional(),
  attachments: z.array(z.object({
    name: z.string().min(1, 'File name is required'),
    url: z.string().url('Invalid file URL'),
    size: z.number().min(1, 'File size must be greater than 0'),
    type: z.string().min(1, 'File type is required'),
  })).max(10, 'Maximum 10 attachments allowed').optional(),
  submissionType: z.enum(['file', 'text', 'both']),
  allowLateSubmission: z.boolean(),
  studentIds: z.array(z.string()).min(1, 'At least one student must be assigned'),
});

export const assignmentSubmissionSchema = z.object({
  assignmentId: z.string().min(1, 'Assignment ID is required'),
  submissionText: z.string().max(10000, 'Submission text must be less than 10000 characters').optional(),
  attachments: z.array(z.object({
    name: z.string().min(1, 'File name is required'),
    url: z.string().url('Invalid file URL'),
    size: z.number().min(1, 'File size must be greater than 0'),
    type: z.string().min(1, 'File type is required'),
  })).max(5, 'Maximum 5 attachments allowed').optional(),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
}).refine((data) => {
  return data.submissionText || (data.attachments && data.attachments.length > 0);
}, {
  message: 'Either submission text or attachments are required',
});

export const assignmentGradingSchema = z.object({
  submissionId: z.string().min(1, 'Submission ID is required'),
  points: z.number().min(0, 'Points cannot be negative'),
  feedback: z.string().max(2000, 'Feedback must be less than 2000 characters').optional(),
  rubricScores: z.array(z.object({
    criteriaId: z.string().min(1, 'Criteria ID is required'),
    score: z.number().min(0, 'Score cannot be negative'),
    comment: z.string().max(200, 'Comment must be less than 200 characters').optional(),
  })).optional(),
});

// Quiz Schemas
export const quizQuestionSchema = z.object({
  type: z.enum(['multiple_choice', 'true_false', 'short_answer', 'essay']),
  question: z.string().min(10, 'Question must be at least 10 characters').max(1000, 'Question must be less than 1000 characters'),
  options: z.array(z.string()).min(2, 'At least 2 options required for multiple choice').optional(),
  correctAnswer: z.string().min(1, 'Correct answer is required').optional(),
  points: z.number().min(1, 'Points must be at least 1').max(100, 'Points cannot exceed 100'),
  explanation: z.string().max(500, 'Explanation must be less than 500 characters').optional(),
});

export const quizSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100, 'Title must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  subject: z.string().min(1, 'Subject is required'),
  questions: z.array(quizQuestionSchema).min(1, 'At least one question is required').max(50, 'Maximum 50 questions allowed'),
  timeLimit: z.number().min(5, 'Minimum time limit is 5 minutes').max(300, 'Maximum time limit is 300 minutes').optional(),
  allowRetakes: z.boolean(),
  showCorrectAnswers: z.boolean(),
  randomizeQuestions: z.boolean(),
  passingScore: z.number().min(0).max(100).optional(),
  studentIds: z.array(z.string()).min(1, 'At least one student must be assigned'),
});

export const quizSubmissionSchema = z.object({
  quizId: z.string().min(1, 'Quiz ID is required'),
  answers: z.array(z.object({
    questionId: z.string().min(1, 'Question ID is required'),
    answer: z.string().min(1, 'Answer is required'),
  })).min(1, 'At least one answer is required'),
  timeSpent: z.number().min(1, 'Time spent must be greater than 0'),
});

// Search and Filter Schemas
export const tutorSearchSchema = z.object({
  query: z.string().optional(),
  subjects: z.array(z.string()).optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  availability: z.object({
    day: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']).optional(),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  }).optional(),
  minRating: z.number().min(0).max(5).optional(),
  languages: z.array(z.string()).optional(),
  experience: z.object({
    min: z.number().min(0).optional(),
    max: z.number().min(0).optional(),
  }).optional(),
  sortBy: z.enum(['rating', 'price_low', 'price_high', 'experience', 'newest']).optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(50).optional(),
});

// Review and Rating Schemas
export const reviewSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  tutorId: z.string().min(1, 'Tutor ID is required'),
  rating: z.number().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
  comment: z.string().min(10, 'Comment must be at least 10 characters').max(1000, 'Comment must be less than 1000 characters'),
  categories: z.object({
    communication: z.number().min(1).max(5),
    knowledge: z.number().min(1).max(5),
    punctuality: z.number().min(1).max(5),
    helpfulness: z.number().min(1).max(5),
  }),
  wouldRecommend: z.boolean(),
});

// Notification Schemas
export const notificationPreferencesSchema = z.object({
  email: z.object({
    bookingConfirmation: z.boolean(),
    sessionReminder: z.boolean(),
    assignmentDue: z.boolean(),
    paymentConfirmation: z.boolean(),
    marketing: z.boolean(),
  }),
  push: z.object({
    sessionReminder: z.boolean(),
    newMessage: z.boolean(),
    assignmentGraded: z.boolean(),
    bookingUpdate: z.boolean(),
  }),
  sms: z.object({
    sessionReminder: z.boolean(),
    emergencyOnly: z.boolean(),
  }),
});

// File Upload Schemas
export const fileUploadSchema = z.object({
  file: z.object({
    name: z.string().min(1, 'File name is required'),
    size: z.number().min(1, 'File size must be greater than 0').max(50 * 1024 * 1024, 'File size cannot exceed 50MB'),
    type: z.string().min(1, 'File type is required'),
  }),
  category: z.enum(['profile_picture', 'assignment', 'material', 'certificate', 'other']),
  description: z.string().max(200, 'Description must be less than 200 characters').optional(),
});

// Type exports for use in components
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type UserProfileData = z.infer<typeof userProfileSchema>;
export type TutorProfileData = z.infer<typeof tutorProfileSchema>;
export type BookingData = z.infer<typeof bookingSchema>;
export type PaymentMethodData = z.infer<typeof paymentMethodSchema>;
export type AssignmentData = z.infer<typeof assignmentSchema>;
export type AssignmentSubmissionData = z.infer<typeof assignmentSubmissionSchema>;
export type QuizData = z.infer<typeof quizSchema>;
export type QuizSubmissionData = z.infer<typeof quizSubmissionSchema>;
export type TutorSearchData = z.infer<typeof tutorSearchSchema>;
export type ReviewData = z.infer<typeof reviewSchema>;
export type NotificationPreferencesData = z.infer<typeof notificationPreferencesSchema>;
export type FileUploadData = z.infer<typeof fileUploadSchema>;