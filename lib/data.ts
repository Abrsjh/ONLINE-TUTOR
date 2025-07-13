export interface Tutor {
  id: string;
  name: string;
  subjects: string[];
  hourlyRate: number;
  rating: number;
  totalReviews: number;
  about: string;
  availability: {
    [key: string]: string[]; // day of week -> array of time slots
  };
}

export interface Stats {
  totalStudents: number;
  totalTutors: number;
  totalSessions: number;
}

export const subjects = [
  'Math',
  'Physics',
  'Chemistry',
  'Biology',
  'English',
  'History',
  'Geography',
  'Computer Science',
  'Economics',
  'Psychology',
  'Philosophy',
  'Art',
  'Music',
  'Spanish',
  'French',
  'German',
  'Statistics',
  'Calculus',
  'Algebra',
  'Literature'
];

export const tutors: Tutor[] = [
  {
    id: '1',
    name: 'Dr. Sarah Johnson',
    subjects: ['Math', 'Calculus', 'Statistics'],
    hourlyRate: 85,
    rating: 4.9,
    totalReviews: 127,
    about: 'PhD in Mathematics with 10+ years of teaching experience. Specializes in advanced calculus and statistical analysis. Passionate about making complex mathematical concepts accessible to all students.',
    availability: {
      monday: ['09:00', '10:00', '14:00', '15:00', '16:00'],
      tuesday: ['10:00', '11:00', '13:00', '14:00'],
      wednesday: ['09:00', '10:00', '15:00', '16:00', '17:00'],
      thursday: ['11:00', '13:00', '14:00', '15:00'],
      friday: ['09:00', '10:00', '11:00', '14:00'],
      saturday: ['10:00', '11:00', '13:00'],
      sunday: []
    }
  },
  {
    id: '2',
    name: 'Prof. Michael Chen',
    subjects: ['Physics', 'Chemistry', 'Math'],
    hourlyRate: 95,
    rating: 4.8,
    totalReviews: 89,
    about: 'Former university professor with expertise in quantum physics and organic chemistry. Published researcher with a talent for breaking down complex scientific principles into understandable concepts.',
    availability: {
      monday: ['13:00', '14:00', '15:00', '16:00'],
      tuesday: ['09:00', '10:00', '11:00', '15:00', '16:00'],
      wednesday: ['14:00', '15:00', '16:00', '17:00'],
      thursday: ['09:00', '10:00', '13:00', '14:00'],
      friday: ['11:00', '13:00', '14:00', '15:00'],
      saturday: ['09:00', '10:00', '11:00'],
      sunday: ['14:00', '15:00']
    }
  },
  {
    id: '3',
    name: 'Emma Rodriguez',
    subjects: ['English', 'Literature', 'History'],
    hourlyRate: 65,
    rating: 4.7,
    totalReviews: 156,
    about: 'Master\'s in English Literature with a passion for creative writing and historical analysis. Helps students develop critical thinking skills and improve their writing abilities.',
    availability: {
      monday: ['10:00', '11:00', '16:00', '17:00', '18:00'],
      tuesday: ['09:00', '14:00', '15:00', '16:00'],
      wednesday: ['10:00', '11:00', '12:00', '17:00'],
      thursday: ['14:00', '15:00', '16:00', '17:00'],
      friday: ['09:00', '10:00', '16:00', '17:00'],
      saturday: ['11:00', '12:00', '14:00', '15:00'],
      sunday: ['15:00', '16:00']
    }
  },
  {
    id: '4',
    name: 'David Kim',
    subjects: ['Computer Science', 'Math', 'Physics'],
    hourlyRate: 75,
    rating: 4.9,
    totalReviews: 203,
    about: 'Software engineer turned educator with expertise in algorithms, data structures, and programming languages. Specializes in making coding concepts accessible to beginners.',
    availability: {
      monday: ['18:00', '19:00', '20:00'],
      tuesday: ['17:00', '18:00', '19:00', '20:00'],
      wednesday: ['18:00', '19:00', '20:00'],
      thursday: ['17:00', '18:00', '19:00'],
      friday: ['18:00', '19:00', '20:00'],
      saturday: ['09:00', '10:00', '11:00', '14:00', '15:00'],
      sunday: ['10:00', '11:00', '14:00', '15:00', '16:00']
    }
  },
  {
    id: '5',
    name: 'Dr. Lisa Thompson',
    subjects: ['Biology', 'Chemistry', 'Psychology'],
    hourlyRate: 80,
    rating: 4.6,
    totalReviews: 94,
    about: 'PhD in Molecular Biology with research experience in neuroscience. Combines scientific rigor with engaging teaching methods to help students excel in life sciences.',
    availability: {
      monday: ['09:00', '10:00', '11:00', '15:00'],
      tuesday: ['10:00', '11:00', '14:00', '15:00', '16:00'],
      wednesday: ['09:00', '11:00', '14:00', '15:00'],
      thursday: ['10:00', '11:00', '15:00', '16:00'],
      friday: ['09:00', '10:00', '14:00', '15:00'],
      saturday: [],
      sunday: []
    }
  },
  {
    id: '6',
    name: 'Carlos Martinez',
    subjects: ['Spanish', 'French', 'History'],
    hourlyRate: 55,
    rating: 4.8,
    totalReviews: 178,
    about: 'Native Spanish speaker with fluency in French and extensive knowledge of European history. Creates immersive language learning experiences with cultural context.',
    availability: {
      monday: ['12:00', '13:00', '17:00', '18:00'],
      tuesday: ['11:00', '12:00', '13:00', '17:00'],
      wednesday: ['12:00', '13:00', '16:00', '17:00', '18:00'],
      thursday: ['11:00', '12:00', '17:00', '18:00'],
      friday: ['12:00', '13:00', '16:00', '17:00'],
      saturday: ['10:00', '11:00', '12:00', '16:00'],
      sunday: ['11:00', '12:00', '16:00', '17:00']
    }
  },
  {
    id: '7',
    name: 'Dr. Rachel Green',
    subjects: ['Economics', 'Statistics', 'Math'],
    hourlyRate: 90,
    rating: 4.7,
    totalReviews: 112,
    about: 'Economics professor with expertise in econometrics and financial modeling. Helps students understand complex economic theories and their real-world applications.',
    availability: {
      monday: ['14:00', '15:00', '16:00'],
      tuesday: ['13:00', '14:00', '15:00', '16:00'],
      wednesday: ['13:00', '14:00', '16:00', '17:00'],
      thursday: ['14:00', '15:00', '16:00', '17:00'],
      friday: ['13:00', '14:00', '15:00'],
      saturday: ['11:00', '13:00', '14:00'],
      sunday: []
    }
  },
  {
    id: '8',
    name: 'James Wilson',
    subjects: ['Philosophy', 'English', 'History'],
    hourlyRate: 70,
    rating: 4.5,
    totalReviews: 87,
    about: 'PhD in Philosophy with a focus on ethics and critical thinking. Encourages students to question assumptions and develop logical reasoning skills.',
    availability: {
      monday: ['11:00', '15:00', '16:00', '17:00'],
      tuesday: ['10:00', '11:00', '16:00', '17:00'],
      wednesday: ['11:00', '15:00', '16:00'],
      thursday: ['10:00', '11:00', '15:00', '16:00'],
      friday: ['11:00', '15:00', '16:00', '17:00'],
      saturday: ['14:00', '15:00', '16:00'],
      sunday: ['15:00', '16:00', '17:00']
    }
  },
  {
    id: '9',
    name: 'Dr. Amanda Foster',
    subjects: ['Art', 'History', 'Psychology'],
    hourlyRate: 60,
    rating: 4.9,
    totalReviews: 145,
    about: 'Art historian and practicing artist with expertise in Renaissance and modern art. Combines visual analysis with psychological insights to enhance learning.',
    availability: {
      monday: ['10:00', '11:00', '14:00', '15:00'],
      tuesday: ['09:00', '10:00', '14:00', '15:00', '16:00'],
      wednesday: ['10:00', '11:00', '14:00', '16:00'],
      thursday: ['09:00', '10:00', '15:00', '16:00'],
      friday: ['10:00', '11:00', '14:00', '15:00'],
      saturday: ['10:00', '11:00', '15:00', '16:00'],
      sunday: []
    }
  },
  {
    id: '10',
    name: 'Robert Taylor',
    subjects: ['Music', 'Math', 'Physics'],
    hourlyRate: 65,
    rating: 4.6,
    totalReviews: 76,
    about: 'Professional musician and music theory instructor with a background in acoustics and mathematical modeling. Bridges the gap between art and science.',
    availability: {
      monday: ['16:00', '17:00', '18:00', '19:00'],
      tuesday: ['15:00', '16:00', '17:00', '18:00'],
      wednesday: ['16:00', '17:00', '18:00', '19:00'],
      thursday: ['15:00', '16:00', '17:00', '18:00'],
      friday: ['16:00', '17:00', '18:00'],
      saturday: ['09:00', '10:00', '11:00', '16:00'],
      sunday: ['10:00', '11:00', '16:00', '17:00']
    }
  },
  {
    id: '11',
    name: 'Dr. Jennifer Lee',
    subjects: ['German', 'History', 'Philosophy'],
    hourlyRate: 75,
    rating: 4.8,
    totalReviews: 98,
    about: 'German literature scholar with extensive knowledge of European intellectual history. Provides comprehensive language instruction with cultural immersion.',
    availability: {
      monday: ['09:00', '10:00', '13:00', '14:00'],
      tuesday: ['09:00', '10:00', '11:00', '13:00'],
      wednesday: ['09:00', '13:00', '14:00', '15:00'],
      thursday: ['10:00', '11:00', '13:00', '14:00'],
      friday: ['09:00', '10:00', '13:00'],
      saturday: ['10:00', '11:00'],
      sunday: []
    }
  },
  {
    id: '12',
    name: 'Mark Anderson',
    subjects: ['Geography', 'History', 'Economics'],
    hourlyRate: 50,
    rating: 4.4,
    totalReviews: 134,
    about: 'Geography teacher with expertise in human geography and economic development. Uses real-world examples to make abstract concepts tangible.',
    availability: {
      monday: ['12:00', '13:00', '15:00', '16:00'],
      tuesday: ['11:00', '12:00', '15:00', '16:00', '17:00'],
      wednesday: ['12:00', '13:00', '15:00', '17:00'],
      thursday: ['11:00', '12:00', '15:00', '16:00'],
      friday: ['12:00', '13:00', '15:00', '16:00'],
      saturday: ['11:00', '12:00', '15:00'],
      sunday: ['14:00', '15:00', '16:00']
    }
  },
  {
    id: '13',
    name: 'Dr. Patricia Brown',
    subjects: ['Algebra', 'Calculus', 'Statistics'],
    hourlyRate: 85,
    rating: 4.9,
    totalReviews: 167,
    about: 'Mathematics educator with 15 years of experience helping students overcome math anxiety. Specializes in building strong foundational skills and confidence.',
    availability: {
      monday: ['08:00', '09:00', '14:00', '15:00'],
      tuesday: ['08:00', '09:00', '10:00', '14:00'],
      wednesday: ['08:00', '09:00', '15:00', '16:00'],
      thursday: ['08:00', '09:00', '14:00', '15:00'],
      friday: ['08:00', '09:00', '14:00'],
      saturday: ['09:00', '10:00', '11:00'],
      sunday: []
    }
  },
  {
    id: '14',
    name: 'Kevin O\'Connor',
    subjects: ['Computer Science', 'Math', 'Statistics'],
    hourlyRate: 70,
    rating: 4.7,
    totalReviews: 189,
    about: 'Data scientist and software developer with expertise in machine learning and statistical programming. Teaches practical coding skills for data analysis.',
    availability: {
      monday: ['17:00', '18:00', '19:00', '20:00'],
      tuesday: ['17:00', '18:00', '19:00'],
      wednesday: ['17:00', '18:00', '19:00', '20:00'],
      thursday: ['17:00', '18:00', '19:00'],
      friday: ['17:00', '18:00', '19:00', '20:00'],
      saturday: ['10:00', '11:00', '14:00', '15:00'],
      sunday: ['14:00', '15:00', '16:00']
    }
  },
  {
    id: '15',
    name: 'Dr. Maria Gonzalez',
    subjects: ['Spanish', 'Literature', 'History'],
    hourlyRate: 65,
    rating: 4.8,
    totalReviews: 142,
    about: 'Spanish literature professor with expertise in Latin American culture and history. Creates engaging lessons that combine language learning with cultural exploration.',
    availability: {
      monday: ['11:00', '12:00', '16:00', '17:00'],
      tuesday: ['10:00', '11:00', '12:00', '16:00'],
      wednesday: ['11:00', '12:00', '16:00', '17:00'],
      thursday: ['10:00', '11:00', '16:00', '17:00'],
      friday: ['11:00', '12:00', '16:00'],
      saturday: ['12:00', '13:00', '16:00', '17:00'],
      sunday: ['13:00', '16:00', '17:00']
    }
  },
  {
    id: '16',
    name: 'Thomas Wright',
    subjects: ['Physics', 'Math', 'Computer Science'],
    hourlyRate: 80,
    rating: 4.6,
    totalReviews: 103,
    about: 'Physics researcher with a passion for computational modeling. Helps students understand the mathematical foundations of physical phenomena.',
    availability: {
      monday: ['13:00', '14:00', '15:00'],
      tuesday: ['12:00', '13:00', '14:00', '15:00'],
      wednesday: ['13:00', '14:00', '15:00', '16:00'],
      thursday: ['12:00', '13:00', '14:00'],
      friday: ['13:00', '14:00', '15:00'],
      saturday: ['10:00', '11:00', '13:00'],
      sunday: []
    }
  },
  {
    id: '17',
    name: 'Dr. Susan Davis',
    subjects: ['Psychology', 'Biology', 'Statistics'],
    hourlyRate: 75,
    rating: 4.7,
    totalReviews: 118,
    about: 'Clinical psychologist with research background in cognitive neuroscience. Integrates psychological principles with biological understanding.',
    availability: {
      monday: ['10:00', '11:00', '15:00', '16:00'],
      tuesday: ['09:00', '10:00', '15:00', '16:00'],
      wednesday: ['10:00', '11:00', '15:00'],
      thursday: ['09:00', '10:00', '15:00', '16:00'],
      friday: ['10:00', '11:00', '15:00'],
      saturday: [],
      sunday: []
    }
  },
  {
    id: '18',
    name: 'Alex Murphy',
    subjects: ['English', 'Philosophy', 'Art'],
    hourlyRate: 55,
    rating: 4.5,
    totalReviews: 91,
    about: 'Creative writing instructor with a background in contemporary philosophy and visual arts. Encourages interdisciplinary thinking and creative expression.',
    availability: {
      monday: ['14:00', '15:00', '18:00', '19:00'],
      tuesday: ['13:00', '14:00', '18:00', '19:00'],
      wednesday: ['14:00', '15:00', '18:00'],
      thursday: ['13:00', '14:00', '18:00', '19:00'],
      friday: ['14:00', '15:00', '18:00'],
      saturday: ['11:00', '14:00', '15:00'],
      sunday: ['14:00', '15:00', '18:00']
    }
  },
  {
    id: '19',
    name: 'Dr. Helen Clark',
    subjects: ['Chemistry', 'Biology', 'Math'],
    hourlyRate: 85,
    rating: 4.8,
    totalReviews: 156,
    about: 'Biochemistry professor with expertise in organic chemistry and molecular biology. Makes complex chemical processes understandable through visual aids and analogies.',
    availability: {
      monday: ['09:00', '10:00', '14:00', '15:00'],
      tuesday: ['09:00', '10:00', '11:00', '14:00'],
      wednesday: ['09:00', '14:00', '15:00', '16:00'],
      thursday: ['10:00', '11:00', '14:00', '15:00'],
      friday: ['09:00', '10:00', '14:00'],
      saturday: ['10:00', '11:00'],
      sunday: []
    }
  },
  {
    id: '20',
    name: 'Daniel Rodriguez',
    subjects: ['Economics', 'Math', 'Statistics'],
    hourlyRate: 70,
    rating: 4.6,
    totalReviews: 124,
    about: 'Financial analyst turned educator with expertise in applied economics and quantitative methods. Focuses on practical applications of economic theory.',
    availability: {
      monday: ['16:00', '17:00', '18:00'],
      tuesday: ['15:00', '16:00', '17:00', '18:00'],
      wednesday: ['16:00', '17:00', '18:00'],
      thursday: ['15:00', '16:00', '17:00'],
      friday: ['16:00', '17:00', '18:00'],
      saturday: ['09:00', '10:00', '16:00', '17:00'],
      sunday: ['10:00', '16:00', '17:00']
    }
  },
  {
    id: '21',
    name: 'Dr. Nancy White',
    subjects: ['French', 'Literature', 'Art'],
    hourlyRate: 65,
    rating: 4.9,
    totalReviews: 108,
    about: 'French literature scholar with expertise in 19th-century art and culture. Provides immersive language instruction with rich cultural context.',
    availability: {
      monday: ['11:00', '12:00', '15:00', '16:00'],
      tuesday: ['10:00', '11:00', '15:00', '16:00'],
      wednesday: ['11:00', '12:00', '15:00'],
      thursday: ['10:00', '11:00', '15:00', '16:00'],
      friday: ['11:00', '12:00', '15:00'],
      saturday: ['11:00', '12:00', '15:00', '16:00'],
      sunday: ['15:00', '16:00']
    }
  },
  {
    id: '22',
    name: 'Christopher Lee',
    subjects: ['Geography', 'Economics', 'History'],
    hourlyRate: 45,
    rating: 4.4,
    totalReviews: 87,
    about: 'Geography and economics teacher with a focus on urban planning and development. Uses current events and case studies to illustrate concepts.',
    availability: {
      monday: ['13:00', '14:00', '17:00', '18:00'],
      tuesday: ['12:00', '13:00', '17:00', '18:00'],
      wednesday: ['13:00', '14:00', '17:00'],
      thursday: ['12:00', '13:00', '17:00', '18:00'],
      friday: ['13:00', '14:00', '17:00'],
      saturday: ['12:00', '13:00', '17:00'],
      sunday: ['13:00', '17:00', '18:00']
    }
  }
];

export const stats: Stats = {
  totalStudents: 2847,
  totalTutors: 156,
  totalSessions: 12394
};