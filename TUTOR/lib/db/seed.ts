import { faker } from '@faker-js/faker';
import { db, User, TutorProfile, StudentProfile, Session, Assignment, Quiz, Payment, Wallet, Transaction, Review, Notification, ChatRoom, Message, StudyMaterial, StudentProgress, QuizQuestion, AvailabilitySlot, SkillProgress, LearningGoal } from './index';

// Seed configuration
const SEED_CONFIG = {
  users: {
    admins: 2,
    tutors: 50,
    students: 200
  },
  sessions: {
    perTutor: 15,
    completionRate: 0.7
  },
  assignments: {
    perSession: 0.6
  },
  quizzes: {
    perTutor: 3
  },
  reviews: {
    rate: 0.8
  },
  messages: {
    perChatRoom: 25
  },
  studyMaterials: {
    perTutor: 8
  }
};

// Subject categories and specific subjects
const SUBJECTS = {
  mathematics: ['Algebra', 'Geometry', 'Calculus', 'Statistics', 'Trigonometry', 'Linear Algebra'],
  science: ['Physics', 'Chemistry', 'Biology', 'Earth Science', 'Environmental Science'],
  languages: ['English', 'Spanish', 'French', 'German', 'Mandarin', 'Japanese'],
  programming: ['JavaScript', 'Python', 'Java', 'C++', 'React', 'Node.js'],
  business: ['Economics', 'Accounting', 'Marketing', 'Finance', 'Management'],
  arts: ['Music Theory', 'Art History', 'Drawing', 'Photography', 'Creative Writing'],
  social: ['History', 'Psychology', 'Sociology', 'Political Science', 'Philosophy']
};

const ALL_SUBJECTS = Object.values(SUBJECTS).flat();

// Helper functions
const getRandomSubjects = (count: number = 3): string[] => {
  return faker.helpers.arrayElements(ALL_SUBJECTS, count);
};

const getRandomAvailability = (): AvailabilitySlot[] => {
  const slots: AvailabilitySlot[] = [];
  const daysToWork = faker.number.int({ min: 3, max: 6 });
  const workDays = faker.helpers.arrayElements([0, 1, 2, 3, 4, 5, 6], daysToWork);
  
  workDays.forEach(day => {
    const startHour = faker.number.int({ min: 8, max: 14 });
    const endHour = faker.number.int({ min: startHour + 2, max: 20 });
    
    slots.push({
      dayOfWeek: day,
      startTime: `${startHour.toString().padStart(2, '0')}:00`,
      endTime: `${endHour.toString().padStart(2, '0')}:00`,
      timezone: faker.helpers.arrayElement(['UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Asia/Tokyo'])
    });
  });
  
  return slots;
};

const getRandomSkillProgress = (subjects: string[]): SkillProgress[] => {
  return subjects.map(subject => ({
    skill: subject,
    level: faker.number.int({ min: 1, max: 10 }),
    progress: faker.number.int({ min: 0, max: 100 }),
    lastPracticed: faker.date.recent({ days: 30 })
  }));
};

const getRandomLearningGoals = (): LearningGoal[] => {
  const goals = [
    'Master advanced calculus concepts',
    'Improve essay writing skills',
    'Learn programming fundamentals',
    'Understand scientific method',
    'Develop critical thinking',
    'Enhance communication skills'
  ];
  
  return faker.helpers.arrayElements(goals, faker.number.int({ min: 2, max: 4 })).map(goal => ({
    id: faker.string.uuid(),
    title: goal,
    description: faker.lorem.sentence(),
    targetDate: faker.date.future(),
    isCompleted: faker.datatype.boolean(0.3),
    completedAt: faker.datatype.boolean(0.3) ? faker.date.recent() : undefined,
    progress: faker.number.int({ min: 0, max: 100 })
  }));
};

const generateQuizQuestions = (subject: string, count: number = 10): QuizQuestion[] => {
  const questions: QuizQuestion[] = [];
  
  for (let i = 0; i < count; i++) {
    const type = faker.helpers.arrayElement(['multiple-choice', 'true-false', 'short-answer'] as const);
    
    let question: QuizQuestion = {
      id: faker.string.uuid(),
      type,
      question: `${subject} question ${i + 1}: ${faker.lorem.sentence()}?`,
      correctAnswer: '',
      points: faker.number.int({ min: 1, max: 5 }),
      explanation: faker.lorem.paragraph()
    };
    
    switch (type) {
      case 'multiple-choice':
        const options = Array.from({ length: 4 }, () => faker.lorem.words(3));
        const correctIndex = faker.number.int({ min: 0, max: 3 });
        question.options = options;
        question.correctAnswer = options[correctIndex];
        break;
      case 'true-false':
        question.options = ['True', 'False'];
        question.correctAnswer = faker.helpers.arrayElement(['True', 'False']);
        break;
      case 'short-answer':
        question.correctAnswer = faker.lorem.words(5);
        break;
    }
    
    questions.push(question);
  }
  
  return questions;
};

// Seed data generators
export class SeedDataGenerator {
  private users: User[] = [];
  private tutorProfiles: TutorProfile[] = [];
  private studentProfiles: StudentProfile[] = [];
  private sessions: Session[] = [];
  private assignments: Assignment[] = [];
  private quizzes: Quiz[] = [];
  private payments: Payment[] = [];
  private wallets: Wallet[] = [];
  private transactions: Transaction[] = [];
  private reviews: Review[] = [];
  private notifications: Notification[] = [];
  private chatRooms: ChatRoom[] = [];
  private messages: Message[] = [];
  private studyMaterials: StudyMaterial[] = [];
  private studentProgress: StudentProgress[] = [];

  async generateSeedData(): Promise<void> {
    console.log('🌱 Starting seed data generation...');
    
    // Clear existing data
    await db.clearAllData();
    
    // Generate data in order of dependencies
    await this.generateUsers();
    await this.generateTutorProfiles();
    await this.generateStudentProfiles();
    await this.generateWallets();
    await this.generateSessions();
    await this.generateAssignments();
    await this.generateQuizzes();
    await this.generatePayments();
    await this.generateReviews();
    await this.generateChatRooms();
    await this.generateMessages();
    await this.generateStudyMaterials();
    await this.generateStudentProgress();
    await this.generateNotifications();
    
    // Insert all data into database
    await this.insertSeedData();
    
    console.log('✅ Seed data generation completed!');
    this.logSeedStats();
  }

  private async generateUsers(): Promise<void> {
    console.log('👥 Generating users...');
    
    // Generate admin users
    for (let i = 0; i < SEED_CONFIG.users.admins; i++) {
      this.users.push({
        email: i === 0 ? 'admin@tutorplatform.com' : faker.internet.email(),
        password: 'hashedPassword123', // In real app, this would be properly hashed
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        role: 'admin',
        avatar: faker.image.avatar(),
        phone: faker.phone.number(),
        dateOfBirth: faker.date.birthdate({ min: 25, max: 60, mode: 'age' }),
        timezone: faker.helpers.arrayElement(['UTC', 'America/New_York', 'Europe/London']),
        language: 'en',
        isEmailVerified: true,
        isActive: true,
        lastLoginAt: faker.date.recent(),
        createdAt: faker.date.past({ years: 2 }),
        updatedAt: faker.date.recent()
      });
    }

    // Generate tutor users
    for (let i = 0; i < SEED_CONFIG.users.tutors; i++) {
      this.users.push({
        email: i === 0 ? 'tutor@tutorplatform.com' : faker.internet.email(),
        password: 'hashedPassword123',
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        role: 'tutor',
        avatar: faker.image.avatar(),
        phone: faker.phone.number(),
        dateOfBirth: faker.date.birthdate({ min: 22, max: 65, mode: 'age' }),
        timezone: faker.helpers.arrayElement(['UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Asia/Tokyo']),
        language: faker.helpers.arrayElement(['en', 'es', 'fr', 'de']),
        isEmailVerified: faker.datatype.boolean(0.95),
        isActive: faker.datatype.boolean(0.9),
        lastLoginAt: faker.date.recent({ days: 7 }),
        createdAt: faker.date.past({ years: 2 }),
        updatedAt: faker.date.recent()
      });
    }

    // Generate student users
    for (let i = 0; i < SEED_CONFIG.users.students; i++) {
      this.users.push({
        email: i === 0 ? 'student@tutorplatform.com' : faker.internet.email(),
        password: 'hashedPassword123',
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        role: 'student',
        avatar: faker.image.avatar(),
        phone: faker.phone.number(),
        dateOfBirth: faker.date.birthdate({ min: 13, max: 30, mode: 'age' }),
        timezone: faker.helpers.arrayElement(['UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London']),
        language: faker.helpers.arrayElement(['en', 'es', 'fr']),
        isEmailVerified: faker.datatype.boolean(0.85),
        isActive: faker.datatype.boolean(0.95),
        lastLoginAt: faker.date.recent({ days: 3 }),
        createdAt: faker.date.past({ years: 1 }),
        updatedAt: faker.date.recent()
      });
    }
  }

  private async generateTutorProfiles(): Promise<void> {
    console.log('👨‍🏫 Generating tutor profiles...');
    
    const tutorUsers = this.users.filter(user => user.role === 'tutor');
    
    tutorUsers.forEach((user, index) => {
      const subjects = getRandomSubjects(faker.number.int({ min: 1, max: 4 }));
      const experience = faker.number.int({ min: 1, max: 20 });
      const rating = faker.number.float({ min: 3.5, max: 5.0, fractionDigits: 1 });
      const totalReviews = faker.number.int({ min: 5, max: 200 });
      
      this.tutorProfiles.push({
        userId: index + SEED_CONFIG.users.admins + 1, // Adjust for admin users
        title: faker.helpers.arrayElement([
          'Certified Math Teacher',
          'PhD in Physics',
          'Professional Software Developer',
          'Language Learning Specialist',
          'Academic Writing Expert',
          'Science Tutor'
        ]),
        bio: faker.lorem.paragraphs(3),
        experience,
        education: faker.helpers.arrayElement([
          'Bachelor of Science in Mathematics',
          'Master of Arts in Education',
          'PhD in Computer Science',
          'Bachelor of Arts in English Literature',
          'Master of Science in Physics'
        ]),
        certifications: faker.helpers.arrayElements([
          'Teaching Certificate',
          'TESOL Certification',
          'Google Certified Educator',
          'Microsoft Certified Trainer',
          'AWS Certified Developer'
        ], faker.number.int({ min: 0, max: 3 })),
        subjects,
        hourlyRate: faker.number.int({ min: 25, max: 150 }),
        currency: 'USD',
        availability: getRandomAvailability(),
        languages: faker.helpers.arrayElements(['English', 'Spanish', 'French', 'German', 'Mandarin'], faker.number.int({ min: 1, max: 3 })),
        videoIntroUrl: faker.datatype.boolean(0.7) ? faker.internet.url() : undefined,
        rating,
        totalReviews,
        totalSessions: faker.number.int({ min: 10, max: 500 }),
        isVerified: faker.datatype.boolean(0.8),
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: faker.date.recent()
      });
    });
  }

  private async generateStudentProfiles(): Promise<void> {
    console.log('👨‍🎓 Generating student profiles...');
    
    const studentUsers = this.users.filter(user => user.role === 'student');
    
    studentUsers.forEach((user, index) => {
      const preferredSubjects = getRandomSubjects(faker.number.int({ min: 1, max: 3 }));
      
      this.studentProfiles.push({
        userId: index + SEED_CONFIG.users.admins + SEED_CONFIG.users.tutors + 1,
        grade: faker.helpers.arrayElement(['6th', '7th', '8th', '9th', '10th', '11th', '12th', 'College', 'Graduate']),
        school: faker.helpers.arrayElement([
          'Lincoln High School',
          'Washington Middle School',
          'Stanford University',
          'MIT',
          'Harvard University',
          'Local Community College'
        ]),
        learningGoals: faker.helpers.arrayElements([
          'Improve math grades',
          'Prepare for SAT',
          'Learn programming',
          'Master essay writing',
          'Understand science concepts'
        ], faker.number.int({ min: 1, max: 3 })),
        preferredSubjects,
        learningStyle: faker.helpers.arrayElement(['visual', 'auditory', 'kinesthetic', 'reading']),
        parentEmail: faker.datatype.boolean(0.6) ? faker.internet.email() : undefined,
        parentPhone: faker.datatype.boolean(0.6) ? faker.phone.number() : undefined,
        createdAt: user.createdAt,
        updatedAt: faker.date.recent()
      });
    });
  }

  private async generateWallets(): Promise<void> {
    console.log('💰 Generating wallets...');
    
    this.users.forEach((user, index) => {
      const balance = user.role === 'student' 
        ? faker.number.float({ min: 0, max: 500, fractionDigits: 2 })
        : faker.number.float({ min: 100, max: 5000, fractionDigits: 2 });
      
      this.wallets.push({
        userId: index + 1,
        balance,
        currency: 'USD',
        totalEarnings: user.role === 'tutor' ? faker.number.float({ min: 1000, max: 50000, fractionDigits: 2 }) : undefined,
        totalSpent: user.role === 'student' ? faker.number.float({ min: 100, max: 2000, fractionDigits: 2 }) : undefined,
        pendingAmount: faker.number.float({ min: 0, max: 200, fractionDigits: 2 }),
        lastTransactionAt: faker.date.recent({ days: 30 }),
        createdAt: user.createdAt,
        updatedAt: faker.date.recent()
      });
    });
  }

  private async generateSessions(): Promise<void> {
    console.log('📚 Generating sessions...');
    
    const tutorUsers = this.users.filter(user => user.role === 'tutor' && user.isActive);
    const studentUsers = this.users.filter(user => user.role === 'student' && user.isActive);
    
    tutorUsers.forEach((tutor, tutorIndex) => {
      const tutorProfile = this.tutorProfiles[tutorIndex];
      const sessionsCount = faker.number.int({ min: 5, max: SEED_CONFIG.sessions.perTutor });
      
      for (let i = 0; i < sessionsCount; i++) {
        const student = faker.helpers.arrayElement(studentUsers);
        const subject = faker.helpers.arrayElement(tutorProfile.subjects);
        const scheduledAt = faker.date.between({ 
          from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
          to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)    // 30 days from now
        });
        
        const isCompleted = scheduledAt < new Date() && faker.datatype.boolean(SEED_CONFIG.sessions.completionRate);
        const status = scheduledAt > new Date() 
          ? 'scheduled' 
          : isCompleted 
            ? 'completed' 
            : faker.helpers.arrayElement(['cancelled', 'no-show']);
        
        this.sessions.push({
          tutorId: tutorIndex + SEED_CONFIG.users.admins + 1,
          studentId: this.users.findIndex(u => u.email === student.email) + 1,
          subject,
          title: `${subject} Tutoring Session`,
          description: faker.lorem.sentence(),
          scheduledAt,
          duration: faker.helpers.arrayElement([30, 45, 60, 90]),
          status,
          meetingUrl: status !== 'cancelled' ? `https://meet.tutorplatform.com/${faker.string.uuid()}` : undefined,
          recordingUrl: status === 'completed' && faker.datatype.boolean(0.6) ? faker.internet.url() : undefined,
          notes: status === 'completed' ? faker.lorem.paragraph() : undefined,
          rating: status === 'completed' && faker.datatype.boolean(0.8) ? faker.number.int({ min: 3, max: 5 }) : undefined,
          review: status === 'completed' && faker.datatype.boolean(0.6) ? faker.lorem.paragraph() : undefined,
          price: tutorProfile.hourlyRate,
          currency: 'USD',
          isRecurring: faker.datatype.boolean(0.3),
          recurringPattern: faker.datatype.boolean(0.3) ? {
            frequency: faker.helpers.arrayElement(['weekly', 'monthly']),
            interval: 1,
            daysOfWeek: [scheduledAt.getDay()],
            endDate: faker.date.future()
          } : undefined,
          createdAt: faker.date.past({ years: 1 }),
          updatedAt: faker.date.recent()
        });
      }
    });
  }

  private async generateAssignments(): Promise<void> {
    console.log('📝 Generating assignments...');
    
    const completedSessions = this.sessions.filter(session => session.status === 'completed');
    
    completedSessions.forEach(session => {
      if (faker.datatype.boolean(SEED_CONFIG.assignments.perSession)) {
        const dueDate = faker.date.future({ days: 14 });
        const isOverdue = dueDate < new Date();
        const isSubmitted = faker.datatype.boolean(0.7);
        
        let status: Assignment['status'] = 'assigned';
        if (isOverdue && !isSubmitted) {
          status = 'overdue';
        } else if (isSubmitted) {
          status = faker.datatype.boolean(0.8) ? 'graded' : 'submitted';
        }
        
        this.assignments.push({
          tutorId: session.tutorId,
          studentId: session.studentId,
          sessionId: this.sessions.findIndex(s => s === session) + 1,
          title: `${session.subject} Assignment`,
          description: faker.lorem.paragraph(),
          instructions: faker.lorem.paragraphs(2),
          dueDate,
          maxPoints: faker.number.int({ min: 50, max: 100 }),
          status,
          submissionUrl: isSubmitted ? faker.internet.url() : undefined,
          submittedAt: isSubmitted ? faker.date.recent({ days: 7 }) : undefined,
          grade: status === 'graded' ? faker.number.int({ min: 60, max: 100 }) : undefined,
          feedback: status === 'graded' ? faker.lorem.paragraph() : undefined,
          gradedAt: status === 'graded' ? faker.date.recent({ days: 3 }) : undefined,
          createdAt: session.scheduledAt,
          updatedAt: faker.date.recent()
        });
      }
    });
  }

  private async generateQuizzes(): Promise<void> {
    console.log('🧠 Generating quizzes...');
    
    const tutorUsers = this.users.filter(user => user.role === 'tutor');
    
    tutorUsers.forEach((tutor, tutorIndex) => {
      const tutorProfile = this.tutorProfiles[tutorIndex];
      
      for (let i = 0; i < SEED_CONFIG.quizzes.perTutor; i++) {
        const subject = faker.helpers.arrayElement(tutorProfile.subjects);
        const questions = generateQuizQuestions(subject);
        
        this.quizzes.push({
          tutorId: tutorIndex + SEED_CONFIG.users.admins + 1,
          title: `${subject} Quiz ${i + 1}`,
          description: faker.lorem.paragraph(),
          subject,
          timeLimit: faker.helpers.arrayElement([15, 30, 45, 60]),
          maxAttempts: faker.number.int({ min: 1, max: 3 }),
          passingScore: faker.number.int({ min: 60, max: 80 }),
          isActive: faker.datatype.boolean(0.8),
          questions,
          createdAt: faker.date.past({ years: 1 }),
          updatedAt: faker.date.recent()
        });
      }
    });
  }

  private async generatePayments(): Promise<void> {
    console.log('💳 Generating payments...');
    
    this.sessions.forEach((session, sessionIndex) => {
      if (session.status === 'completed' || session.status === 'scheduled') {
        this.payments.push({
          userId: session.studentId,
          sessionId: sessionIndex + 1,
          type: 'session',
          amount: session.price,
          currency: 'USD',
          status: session.status === 'completed' ? 'completed' : 'pending',
          paymentMethod: faker.helpers.arrayElement(['card', 'paypal', 'wallet']),
          stripePaymentIntentId: faker.string.alphanumeric(27),
          description: `Payment for ${session.subject} session`,
          metadata: {
            sessionId: sessionIndex + 1,
            tutorId: session.tutorId
          },
          processedAt: session.status === 'completed' ? session.scheduledAt : undefined,
          createdAt: faker.date.past({ days: 30 }),
          updatedAt: faker.date.recent()
        });

        // Generate corresponding transaction
        const wallet = this.wallets.find(w => w.userId === session.studentId);
        if (wallet) {
          this.transactions.push({
            walletId: this.wallets.findIndex(w => w === wallet) + 1,
            userId: session.studentId,
            type: 'debit',
            amount: session.price,
            currency: 'USD',
            description: `Payment for ${session.subject} session`,
            referenceId: (this.payments.length).toString(),
            referenceType: 'payment',
            balanceAfter: wallet.balance - session.price,
            createdAt: faker.date.past({ days: 30 })
          });
        }
      }
    });
  }

  private async generateReviews(): Promise<void> {
    console.log('⭐ Generating reviews...');
    
    const completedSessions = this.sessions.filter(session => session.status === 'completed');
    
    completedSessions.forEach((session, sessionIndex) => {
      if (faker.datatype.boolean(SEED_CONFIG.reviews.rate)) {
        const rating = faker.number.int({ min: 3, max: 5 });
        const hasResponse = faker.datatype.boolean(0.6);
        
        this.reviews.push({
          tutorId: session.tutorId,
          studentId: session.studentId,
          sessionId: sessionIndex + 1,
          rating,
          comment: faker.lorem.paragraph(),
          isPublic: faker.datatype.boolean(0.9),
          tutorResponse: hasResponse ? faker.lorem.paragraph() : undefined,
          respondedAt: hasResponse ? faker.date.recent({ days: 7 }) : undefined,
          createdAt: faker.date.recent({ days: 30 }),
          updatedAt: faker.date.recent()
        });
      }
    });
  }

  private async generateChatRooms(): Promise<void> {
    console.log('💬 Generating chat rooms...');
    
    // Create unique tutor-student pairs from sessions
    const pairs = new Set<string>();
    this.sessions.forEach(session => {
      pairs.add(`${session.tutorId}-${session.studentId}`);
    });
    
    Array.from(pairs).forEach(pair => {
      const [tutorId, studentId] = pair.split('-').map(Number);
      
      this.chatRooms.push({
        tutorId,
        studentId,
        sessionId: faker.datatype.boolean(0.7) ? faker.number.int({ min: 1, max: this.sessions.length }) : undefined,
        lastMessageAt: faker.date.recent({ days: 7 }),
        isActive: faker.datatype.boolean(0.9),
        createdAt: faker.date.past({ days: 60 })
      });
    });
  }

  private async generateMessages(): Promise<void> {
    console.log('📨 Generating messages...');
    
    this.chatRooms.forEach((chatRoom, chatRoomIndex) => {
      const messageCount = faker.number.int({ min: 5, max: SEED_CONFIG.messages.perChatRoom });
      
      for (let i = 0; i < messageCount; i++) {
        const isFromTutor = faker.datatype.boolean(0.5);
        const senderId = isFromTutor ? chatRoom.tutorId : chatRoom.studentId;
        const messageType = faker.helpers.weightedArrayElement([
          { weight: 0.8, value: 'text' },
          { weight: 0.1, value: 'file' },
          { weight: 0.05, value: 'image' },
          { weight: 0.05, value: 'system' }
        ]);
        
        this.messages.push({
          chatRoomId: chatRoomIndex + 1,
          senderId,
          content: messageType === 'system' 
            ? faker.helpers.arrayElement(['Session started', 'File shared', 'Assignment submitted'])
            : faker.lorem.sentence(),
          type: messageType,
          fileUrl: messageType !== 'text' && messageType !== 'system' ? faker.internet.url() : undefined,
          fileName: messageType === 'file' ? faker.system.fileName() : undefined,
          fileSize: messageType === 'file' ? faker.number.int({ min: 1024, max: 5242880 }) : undefined,
          isRead: faker.datatype.boolean(0.7),
          readAt: faker.datatype.boolean(0.7) ? faker.date.recent({ days: 3 }) : undefined,
          createdAt: faker.date.recent({ days: 30 })
        });
      }
    });
  }

  private async generateStudyMaterials(): Promise<void> {
    console.log('📖 Generating study materials...');
    
    const tutorUsers = this.users.filter(user => user.role === 'tutor');
    
    tutorUsers.forEach((tutor, tutorIndex) => {
      const tutorProfile = this.tutorProfiles[tutorIndex];
      const materialCount = faker.number.int({ min: 3, max: SEED_CONFIG.studyMaterials.perTutor });
      
      for (let i = 0; i < materialCount; i++) {
        const subject = faker.helpers.arrayElement(tutorProfile.subjects);
        const type = faker.helpers.arrayElement(['pdf', 'video', 'audio', 'link', 'text']);
        
        this.studyMaterials.push({
          tutorId: tutorIndex + SEED_CONFIG.users.admins + 1,
          title: `${subject} Study Guide ${i + 1}`,
          description: faker.lorem.paragraph(),
          subject,
          type,
          url: faker.internet.url(),
          size: type !== 'link' ? faker.number.int({ min: 1024, max: 52428800 }) : undefined,
          duration: type === 'video' || type === 'audio' ? faker.number.int({ min: 300, max: 3600 }) : undefined,
          isPublic: faker.datatype.boolean(0.7),
          downloadCount: faker.number.int({ min: 0, max: 500 }),
          tags: faker.helpers.arrayElements(['beginner', 'intermediate', 'advanced', 'practice', 'theory', 'examples'], faker.number.int({ min: 1, max: 3 })),
          createdAt: faker.date.past({ years: 1 }),
          updatedAt: faker.date.recent()
        });
      }
    });
  }

  private async generateStudentProgress(): Promise<void> {
    console.log('📊 Generating student progress...');
    
    // Create progress records for student-tutor pairs that have had sessions
    const progressPairs = new Set<string>();
    this.sessions.forEach(session => {
      if (session.status === 'completed') {
        progressPairs.add(`${session.studentId}-${session.tutorId}-${session.subject}`);
      }
    });
    
    Array.from(progressPairs).forEach(pair => {
      const [studentId, tutorId, subject] = pair.split('-');
      const studentSessions = this.sessions.filter(s => 
        s.studentId === Number(studentId) && 
        s.tutorId === Number(tutorId) && 
        s.subject === subject &&
        s.status === 'completed'
      );
      
      const studentAssignments = this.assignments.filter(a => 
        a.studentId === Number(studentId) && 
        a.tutorId === Number(tutorId) &&
        a.status === 'graded'
      );
      
      const averageGrade = studentAssignments.length > 0
        ? studentAssignments.reduce((sum, a) => sum + (a.grade || 0), 0) / studentAssignments.length
        : 0;
      
      this.studentProgress.push({
        studentId: Number(studentId),
        tutorId: Number(tutorId),
        subject,
        totalSessions: studentSessions.length,
        completedAssignments: studentAssignments.length,
        averageGrade,
        skillsProgress: getRandomSkillProgress([subject]),
        goals: getRandomLearningGoals(),
        lastUpdated: faker.date.recent({ days: 7 })
      });
    });
  }

  private async generateNotifications(): Promise<void> {
    console.log('🔔 Generating notifications...');
    
    this.users.forEach((user, userIndex) => {
      const notificationCount = faker.number.int({ min: 5, max: 20 });
      
      for (let i = 0; i < notificationCount; i++) {
        const type = faker.helpers.arrayElement([
          'session_reminder',
          'payment_success',
          'assignment_due',
          'new_message',
          'system'
        ]);
        
        let title = '';
        let message = '';
        
        switch (type) {
          case 'session_reminder':
            title = 'Upcoming Session';
            message = 'You have a session starting in 30 minutes';
            break;
          case 'payment_success':
            title = 'Payment Successful';
            message = 'Your payment has been processed successfully';
            break;
          case 'assignment_due':
            title = 'Assignment Due Soon';
            message = 'Your assignment is due tomorrow';
            break;
          case 'new_message':
            title = 'New Message';
            message = 'You have received a new message';
            break;
          case 'system':
            title = 'System Update';
            message = 'Platform maintenance scheduled for tonight';
            break;
        }
        
        this.notifications.push({
          userId: userIndex + 1,
          type,
          title,
          message,
          data: {
            sessionId: type === 'session_reminder' ? faker.number.int({ min: 1, max: this.sessions.length }) : undefined,
            paymentId: type === 'payment_success' ? faker.number.int({ min: 1, max: this.payments.length }) : undefined
          },
          isRead: faker.datatype.boolean(0.6),
          readAt: faker.datatype.boolean(0.6) ? faker.date.recent({ days: 7 }) : undefined,
          createdAt: faker.date.recent({ days: 30 })
        });
      }
    });
  }

  private async insertSeedData(): Promise<void> {
    console.log('💾 Inserting seed data into database...');
    
    try {
      await db.transaction('rw', db.tables, async () => {
        // Insert in dependency order
        await db.users.bulkAdd(this.users);
        await db.tutorProfiles.bulkAdd(this.tutorProfiles);
        await db.studentProfiles.bulkAdd(this.studentProfiles);
        await db.wallets.bulkAdd(this.wallets);
        await db.sessions.bulkAdd(this.sessions);
        await db.assignments.bulkAdd(this.assignments);
        await db.quizzes.bulkAdd(this.quizzes);
        await db.payments.bulkAdd(this.payments);
        await db.transactions.bulkAdd(this.transactions);
        await db.reviews.bulkAdd(this.reviews);
        await db.chatRooms.bulkAdd(this.chatRooms);
        await db.messages.bulkAdd(this.messages);
        await db.studyMaterials.bulkAdd(this.studyMaterials);
        await db.studentProgress.bulkAdd(this.studentProgress);
        await db.notifications.bulkAdd(this.notifications);
      });
    } catch (error) {
      console.error('❌ Error inserting seed data:', error);
      throw error;
    }
  }

  private logSeedStats(): void {
    console.log('\n📈 Seed Data Statistics:');
    console.log(`👥 Users: ${this.users.length}`);
    console.log(`   - Admins: ${this.users.filter(u => u.role === 'admin').length}`);
    console.log(`   - Tutors: ${this.users.filter(u => u.role === 'tutor').length}`);
    console.log(`   - Students: ${this.users.filter(u => u.role === 'student').length}`);
    console.log(`👨‍🏫 Tutor Profiles: ${this.tutorProfiles.length}`);
    console.log(`👨‍🎓 Student Profiles: ${this.studentProfiles.length}`);
    console.log(`📚 Sessions: ${this.sessions.length}`);
    console.log(`   - Completed: ${this.sessions.filter(s => s.status === 'completed').length}`);
    console.log(`   - Scheduled: ${this.sessions.filter(s => s.status === 'scheduled').length}`);
    console.log(`📝 Assignments: ${this.assignments.length}`);
    console.log(`🧠 Quizzes: ${this.quizzes.length}`);
    console.log(`💳 Payments: ${this.payments.length}`);
    console.log(`💰 Wallets: ${this.wallets.length}`);
    console.log(`📊 Transactions: ${this.transactions.length}`);
    console.log(`⭐ Reviews: ${this.reviews.length}`);
    console.log(`💬 Chat Rooms: ${this.chatRooms.length}`);
    console.log(`📨 Messages: ${this.messages.length}`);
    console.log(`📖 Study Materials: ${this.studyMaterials.length}`);
    console.log(`📊 Student Progress Records: ${this.studentProgress.length}`);
    console.log(`🔔 Notifications: ${this.notifications.length}`);
  }
}

// Export functions for easy use
export const generateSeedData = async (): Promise<void> => {
  const generator = new SeedDataGenerator();
  await generator.generateSeedData();
};

export const clearDatabase = async (): Promise<void> => {
  await db.clearAllData();
  console.log('🗑️ Database cleared successfully');
};

// Export seed configuration for customization
export { SEED_CONFIG, SUBJECTS, ALL_SUBJECTS };

// Default export
export default SeedDataGenerator;