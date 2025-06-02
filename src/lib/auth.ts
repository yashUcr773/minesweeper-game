import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User, AuthUser, LoginCredentials, SignupCredentials } from '../types/game';
import { findUserByEmail, createUser, updateUser } from './database-prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRY = '7d';

export interface AuthResponse {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Verify password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Generate JWT token
export function generateToken(user: User): string {
  return jwt.sign(
    { 
      userId: user.id, 
      email: user.email,
      username: user.username 
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
}

// Verify JWT token
export function verifyToken(token: string): { userId: string; email: string; username: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return {
      userId: decoded.userId,
      email: decoded.email,
      username: decoded.username
    };
  } catch {
    return null;
  }
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate password strength
export function isValidPassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 6) {
    return { valid: false, error: 'Password must be at least 6 characters long' };
  }
  
  if (password.length > 100) {
    return { valid: false, error: 'Password is too long' };
  }
  
  return { valid: true };
}

// Validate username
export function isValidUsername(username: string): { valid: boolean; error?: string } {
  if (username.length < 2) {
    return { valid: false, error: 'Username must be at least 2 characters long' };
  }
  
  if (username.length > 30) {
    return { valid: false, error: 'Username is too long (max 30 characters)' };
  }
  
  // Allow alphanumeric, underscore, and hyphen
  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!usernameRegex.test(username)) {
    return { valid: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' };
  }
  
  return { valid: true };
}

// Sign up new user
export async function signup(credentials: SignupCredentials): Promise<AuthResponse> {
  const { username, email, password } = credentials;
  
  // Validate input
  if (!isValidEmail(email)) {
    return { success: false, error: 'Invalid email format' };
  }
  
  const usernameValidation = isValidUsername(username);
  if (!usernameValidation.valid) {
    return { success: false, error: usernameValidation.error };
  }
  
  const passwordValidation = isValidPassword(password);
  if (!passwordValidation.valid) {
    return { success: false, error: passwordValidation.error };
  }
  
  // Check if user already exists
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    return { success: false, error: 'An account with this email already exists' };
  }
  
  try {
    // Hash password and create user
    const hashedPassword = await hashPassword(password);
    const user = await createUser({
      username,
      email,
      password: hashedPassword
    });
    
    // Generate token
    const token = generateToken(user);
    
    return {
      success: true,
      user: {
        ...user,
        token
      }
    };
  } catch (error) {
    console.error('Signup error:', error);
    return { success: false, error: 'Failed to create account' };
  }
}

// Login user
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const { email, password } = credentials;
  
  // Validate input
  if (!isValidEmail(email)) {
    return { success: false, error: 'Invalid email format' };
  }
  
  if (!password) {
    return { success: false, error: 'Password is required' };
  }
  
  try {
    // Find user
    const userWithPassword = await findUserByEmail(email);
    if (!userWithPassword) {
      return { success: false, error: 'Invalid email or password' };
    }
    
    // Verify password
    const isValidPassword = await verifyPassword(password, userWithPassword.password);
    if (!isValidPassword) {
      return { success: false, error: 'Invalid email or password' };
    }
    
    // Update last active
    const updatedUser = await updateUser(userWithPassword.id, { lastActive: new Date().toISOString() });
    if (!updatedUser) {
      return { success: false, error: 'Failed to update user' };
    }
    
    // Generate token
    const token = generateToken(updatedUser);
    
    return {
      success: true,
      user: {
        ...updatedUser,
        token
      }
    };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'Login failed' };
  }
}

// Get user from token
export function getUserFromToken(token: string): User | null {
  const decoded = verifyToken(token);
  if (!decoded) return null;
  
  // In a real app, you'd fetch the user from database to ensure it still exists
  // and get the latest data. For simplicity, we'll return the decoded data
  return {
    id: decoded.userId,
    email: decoded.email,
    username: decoded.username,
    createdAt: '',
    lastActive: ''
  };
}
