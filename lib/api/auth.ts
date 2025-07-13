import { db, User, TutorProfile, StudentProfile } from '../db/index';
import bcrypt from 'bcryptjs';

// Types for authentication
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'tutor';
  phone?: string;
  dateOfBirth?: Date;
  timezone: string;
  language: string;
  // Tutor-specific fields
  title?: string;
  bio?: string;
  experience?: number;
  education?: string;
  subjects?: string[];
  hourlyRate?: number;
  // Student-specific fields
  grade?: string;
  school?: string;
  learningGoals?: string[];
  preferredSubjects?: string[];
  learningStyle?: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  parentEmail?: string;
  parentPhone?: string;
}

export interface AuthUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'tutor' | 'admin';
  avatar?: string;
  phone?: string;
  timezone: string;
  language: string;
  isEmailVerified: boolean;
  isActive: boolean;
  lastLoginAt?: Date;
  profile?: TutorProfile | StudentProfile;
}

export interface AuthToken {
  token: string;
  user: AuthUser;
  expiresAt: Date;
}

export interface AuthResponse {
  success: boolean;
  data?: AuthToken;
  error?: string;
}

export interface SessionValidationResult {
  isValid: boolean;
  user?: AuthUser;
  error?: string;
}

// Token management utilities
class TokenManager {
  private static readonly TOKEN_KEY = 'tutor_platform_token';
  private static readonly TOKEN_EXPIRY_HOURS = 24;

  static generateToken(user: AuthUser): string {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      iat: Date.now(),
      exp: Date.now() + (this.TOKEN_EXPIRY_HOURS * 60 * 60 * 1000)
    };

    // Simple JWT-like token (base64 encoded for demo purposes)
    // In production, use proper JWT library with signing
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payloadEncoded = btoa(JSON.stringify(payload));
    const signature = btoa(`signature_${user.id}_${payload.iat}`);
    
    return `${header}.${payloadEncoded}.${signature}`;
  }

  static decodeToken(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      const payload = JSON.parse(atob(parts[1]));
      return payload;
    } catch (error) {
      return null;
    }
  }

  static isTokenValid(token: string): boolean {
    const payload = this.decodeToken(token);
    if (!payload) return false;
    
    return Date.now() < payload.exp;
  }

  static saveToken(authToken: AuthToken): void {
    localStorage.setItem(this.TOKEN_KEY, JSON.stringify(authToken));
  }

  static getToken(): AuthToken | null {
    try {
      const stored = localStorage.getItem(this.TOKEN_KEY);
      if (!stored) return null;
      
      const authToken = JSON.parse(stored);
      
      // Check if token is expired
      if (new Date() > new Date(authToken.expiresAt)) {
        this.removeToken();
        return null;
      }
      
      return authToken;
    } catch (error) {
      this.removeToken();
      return null;
    }
  }

  static removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  static refreshToken(user: AuthUser): AuthToken {
    const token = this.generateToken(user);
    const expiresAt = new Date(Date.now() + (this.TOKEN_EXPIRY_HOURS * 60 * 60 * 1000));
    
    const authToken: AuthToken = {
      token,
      user,
      expiresAt
    };
    
    this.saveToken(authToken);
    return authToken;
  }
}

// Password utilities
class PasswordManager {
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  static validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Email validation utility
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Convert User to AuthUser
async function userToAuthUser(user: User): Promise<AuthUser> {
  const authUser: AuthUser = {
    id: user.id!,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    avatar: user.avatar,
    phone: user.phone,
    timezone: user.timezone,
    language: user.language,
    isEmailVerified: user.isEmailVerified,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt
  };

  // Load profile based on role
  if (user.role === 'tutor') {
    const tutorProfile = await db.getTutorProfile(user.id!);
    if (tutorProfile) {
      authUser.profile = tutorProfile;
    }
  } else if (user.role === 'student') {
    const studentProfile = await db.studentProfiles.where('userId').equals(user.id!).first();
    if (studentProfile) {
      authUser.profile = studentProfile;
    }
  }

  return authUser;
}

// Authentication API
export const authApi = {
  // Login user
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      // Validate input
      if (!credentials.email || !credentials.password) {
        return {
          success: false,
          error: 'Email and password are required'
        };
      }

      if (!isValidEmail(credentials.email)) {
        return {
          success: false,
          error: 'Invalid email format'
        };
      }

      // Find user by email
      const user = await db.getUserByEmail(credentials.email.toLowerCase());
      if (!user) {
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

      // Check if user is active
      if (!user.isActive) {
        return {
          success: false,
          error: 'Account is deactivated. Please contact support.'
        };
      }

      // Verify password
      const isPasswordValid = await PasswordManager.verifyPassword(credentials.password, user.password);
      if (!isPasswordValid) {
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

      // Update last login time
      await db.users.update(user.id!, {
        lastLoginAt: new Date(),
        updatedAt: new Date()
      });

      // Convert to AuthUser and generate token
      const authUser = await userToAuthUser({ ...user, lastLoginAt: new Date() });
      const token = TokenManager.generateToken(authUser);
      const expiresAt = new Date(Date.now() + (24 * 60 * 60 * 1000)); // 24 hours

      const authToken: AuthToken = {
        token,
        user: authUser,
        expiresAt
      };

      // Save token to localStorage
      TokenManager.saveToken(authToken);

      return {
        success: true,
        data: authToken
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'An error occurred during login. Please try again.'
      };
    }
  },

  // Register new user
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      // Validate required fields
      if (!data.email || !data.password || !data.firstName || !data.lastName || !data.role) {
        return {
          success: false,
          error: 'All required fields must be provided'
        };
      }

      if (!isValidEmail(data.email)) {
        return {
          success: false,
          error: 'Invalid email format'
        };
      }

      // Validate password strength
      const passwordValidation = PasswordManager.validatePasswordStrength(data.password);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          error: passwordValidation.errors.join('. ')
        };
      }

      // Check if user already exists
      const existingUser = await db.getUserByEmail(data.email.toLowerCase());
      if (existingUser) {
        return {
          success: false,
          error: 'An account with this email already exists'
        };
      }

      // Hash password
      const hashedPassword = await PasswordManager.hashPassword(data.password);

      // Create user
      const now = new Date();
      const newUser: User = {
        email: data.email.toLowerCase(),
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        phone: data.phone,
        dateOfBirth: data.dateOfBirth,
        timezone: data.timezone || 'UTC',
        language: data.language || 'en',
        isEmailVerified: false, // In real app, would send verification email
        isActive: true,
        createdAt: now,
        updatedAt: now
      };

      const userId = await db.users.add(newUser);

      // Create role-specific profile
      if (data.role === 'tutor') {
        const tutorProfile: TutorProfile = {
          userId: userId as number,
          title: data.title || '',
          bio: data.bio || '',
          experience: data.experience || 0,
          education: data.education || '',
          certifications: [],
          subjects: data.subjects || [],
          hourlyRate: data.hourlyRate || 0,
          currency: 'USD',
          availability: [],
          languages: [data.language || 'en'],
          rating: 0,
          totalReviews: 0,
          totalSessions: 0,
          isVerified: false,
          isActive: true,
          createdAt: now,
          updatedAt: now
        };

        await db.tutorProfiles.add(tutorProfile);
      } else if (data.role === 'student') {
        const studentProfile: StudentProfile = {
          userId: userId as number,
          grade: data.grade,
          school: data.school,
          learningGoals: data.learningGoals || [],
          preferredSubjects: data.preferredSubjects || [],
          learningStyle: data.learningStyle || 'visual',
          parentEmail: data.parentEmail,
          parentPhone: data.parentPhone,
          createdAt: now,
          updatedAt: now
        };

        await db.studentProfiles.add(studentProfile);
      }

      // Create wallet for the user
      await db.wallets.add({
        userId: userId as number,
        balance: 0,
        currency: 'USD',
        totalEarnings: data.role === 'tutor' ? 0 : undefined,
        totalSpent: data.role === 'student' ? 0 : undefined,
        pendingAmount: 0,
        createdAt: now,
        updatedAt: now
      });

      // Get the created user with profile
      const createdUser = await db.users.get(userId as number);
      if (!createdUser) {
        throw new Error('Failed to create user');
      }

      const authUser = await userToAuthUser(createdUser);
      const token = TokenManager.generateToken(authUser);
      const expiresAt = new Date(Date.now() + (24 * 60 * 60 * 1000));

      const authToken: AuthToken = {
        token,
        user: authUser,
        expiresAt
      };

      TokenManager.saveToken(authToken);

      return {
        success: true,
        data: authToken
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: 'An error occurred during registration. Please try again.'
      };
    }
  },

  // Logout user
  async logout(): Promise<{ success: boolean }> {
    try {
      TokenManager.removeToken();
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false };
    }
  },

  // Get current session
  getCurrentSession(): AuthToken | null {
    return TokenManager.getToken();
  },

  // Validate current session
  async validateSession(): Promise<SessionValidationResult> {
    try {
      const authToken = TokenManager.getToken();
      if (!authToken) {
        return {
          isValid: false,
          error: 'No active session'
        };
      }

      // Check token validity
      if (!TokenManager.isTokenValid(authToken.token)) {
        TokenManager.removeToken();
        return {
          isValid: false,
          error: 'Session expired'
        };
      }

      // Verify user still exists and is active
      const user = await db.users.get(authToken.user.id);
      if (!user || !user.isActive) {
        TokenManager.removeToken();
        return {
          isValid: false,
          error: 'User account not found or deactivated'
        };
      }

      // Refresh user data
      const refreshedUser = await userToAuthUser(user);
      
      // Update token with fresh user data
      const refreshedToken = TokenManager.refreshToken(refreshedUser);

      return {
        isValid: true,
        user: refreshedToken.user
      };
    } catch (error) {
      console.error('Session validation error:', error);
      TokenManager.removeToken();
      return {
        isValid: false,
        error: 'Session validation failed'
      };
    }
  },

  // Refresh token
  async refreshToken(): Promise<AuthResponse> {
    try {
      const validation = await this.validateSession();
      if (!validation.isValid || !validation.user) {
        return {
          success: false,
          error: validation.error || 'Invalid session'
        };
      }

      const newAuthToken = TokenManager.refreshToken(validation.user);
      
      return {
        success: true,
        data: newAuthToken
      };
    } catch (error) {
      console.error('Token refresh error:', error);
      return {
        success: false,
        error: 'Failed to refresh token'
      };
    }
  },

  // Change password
  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const authToken = TokenManager.getToken();
      if (!authToken) {
        return {
          success: false,
          error: 'Not authenticated'
        };
      }

      // Validate new password
      const passwordValidation = PasswordManager.validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          error: passwordValidation.errors.join('. ')
        };
      }

      // Get current user
      const user = await db.users.get(authToken.user.id);
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Verify current password
      const isCurrentPasswordValid = await PasswordManager.verifyPassword(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return {
          success: false,
          error: 'Current password is incorrect'
        };
      }

      // Hash new password
      const hashedNewPassword = await PasswordManager.hashPassword(newPassword);

      // Update password
      await db.users.update(user.id!, {
        password: hashedNewPassword,
        updatedAt: new Date()
      });

      return { success: true };
    } catch (error) {
      console.error('Change password error:', error);
      return {
        success: false,
        error: 'Failed to change password'
      };
    }
  },

  // Request password reset (mock implementation)
  async requestPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!isValidEmail(email)) {
        return {
          success: false,
          error: 'Invalid email format'
        };
      }

      const user = await db.getUserByEmail(email.toLowerCase());
      if (!user) {
        // Don't reveal if email exists for security
        return { success: true };
      }

      // In a real app, you would:
      // 1. Generate a secure reset token
      // 2. Store it with expiration time
      // 3. Send email with reset link
      
      console.log(`Password reset requested for ${email}`);
      
      return { success: true };
    } catch (error) {
      console.error('Password reset request error:', error);
      return {
        success: false,
        error: 'Failed to process password reset request'
      };
    }
  },

  // Reset password with token (mock implementation)
  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate new password
      const passwordValidation = PasswordManager.validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          error: passwordValidation.errors.join('. ')
        };
      }

      // In a real app, you would:
      // 1. Validate the reset token
      // 2. Check if it's not expired
      // 3. Find the associated user
      // 4. Update their password
      
      // Mock implementation - just validate token format
      if (!token || token.length < 10) {
        return {
          success: false,
          error: 'Invalid reset token'
        };
      }

      console.log('Password reset completed');
      
      return { success: true };
    } catch (error) {
      console.error('Password reset error:', error);
      return {
        success: false,
        error: 'Failed to reset password'
      };
    }
  },

  // Update user profile
  async updateProfile(updates: Partial<AuthUser>): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    try {
      const authToken = TokenManager.getToken();
      if (!authToken) {
        return {
          success: false,
          error: 'Not authenticated'
        };
      }

      // Validate email if being updated
      if (updates.email && !isValidEmail(updates.email)) {
        return {
          success: false,
          error: 'Invalid email format'
        };
      }

      // Check if email is already taken by another user
      if (updates.email && updates.email !== authToken.user.email) {
        const existingUser = await db.getUserByEmail(updates.email.toLowerCase());
        if (existingUser && existingUser.id !== authToken.user.id) {
          return {
            success: false,
            error: 'Email is already taken'
          };
        }
      }

      // Update user
      const userUpdates: Partial<User> = {
        email: updates.email?.toLowerCase(),
        firstName: updates.firstName,
        lastName: updates.lastName,
        phone: updates.phone,
        timezone: updates.timezone,
        language: updates.language,
        avatar: updates.avatar,
        updatedAt: new Date()
      };

      // Remove undefined values
      Object.keys(userUpdates).forEach(key => {
        if (userUpdates[key as keyof typeof userUpdates] === undefined) {
          delete userUpdates[key as keyof typeof userUpdates];
        }
      });

      await db.users.update(authToken.user.id, userUpdates);

      // Get updated user
      const updatedUser = await db.users.get(authToken.user.id);
      if (!updatedUser) {
        return {
          success: false,
          error: 'Failed to update user'
        };
      }

      const refreshedAuthUser = await userToAuthUser(updatedUser);
      
      // Update stored token
      const newAuthToken = TokenManager.refreshToken(refreshedAuthUser);

      return {
        success: true,
        user: newAuthToken.user
      };
    } catch (error) {
      console.error('Update profile error:', error);
      return {
        success: false,
        error: 'Failed to update profile'
      };
    }
  },

  // Check if user has permission
  hasPermission(requiredRole: 'student' | 'tutor' | 'admin', userRole?: string): boolean {
    if (!userRole) {
      const authToken = TokenManager.getToken();
      if (!authToken) return false;
      userRole = authToken.user.role;
    }

    const roleHierarchy = {
      student: 1,
      tutor: 2,
      admin: 3
    };

    return roleHierarchy[userRole as keyof typeof roleHierarchy] >= roleHierarchy[requiredRole];
  },

  // Get user by ID (for admin purposes)
  async getUserById(userId: number): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    try {
      const authToken = TokenManager.getToken();
      if (!authToken || !this.hasPermission('admin', authToken.user.role)) {
        return {
          success: false,
          error: 'Insufficient permissions'
        };
      }

      const user = await db.users.get(userId);
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      const authUser = await userToAuthUser(user);
      
      return {
        success: true,
        user: authUser
      };
    } catch (error) {
      console.error('Get user by ID error:', error);
      return {
        success: false,
        error: 'Failed to get user'
      };
    }
  }
};

// Export default
export default authApi;