import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserProfile, EducationProfile } from '../types';
import { 
  getStoredUser, 
  saveStoredUser, 
  getStoredEducationProfile, 
  saveStoredEducationProfile,
  getRegisteredUsers,
  saveRegisteredUser,
  initializeStorage,
  defaultUserProfile,
  secondaryTestUser
} from '../lib/storage';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  user: UserProfile | null;
  educationProfile: EducationProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isFirstTimeUser: boolean;
  isSupabaseActive: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  register: (fullName: string, email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updated: Partial<UserProfile>) => void;
  updateEducationProfile: (updated: Partial<EducationProfile>) => void;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  switchDemoUser: (userType: 'limitha' | 'arjun') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [educationProfile, setEducationProfile] = useState<EducationProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const isSupabaseActive = isSupabaseConfigured();

  useEffect(() => {
    // Ensure demo seed is ready
    initializeStorage();

    const loadSession = async () => {
      setIsLoading(true);
      if (isSupabaseActive && supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            // Fetch profile from supabase or fallback to local
            const stored = getStoredUser();
            setUser({
              id: session.user.id,
              email: session.user.email || stored.email,
              fullName: session.user.user_metadata?.full_name || stored.fullName,
              avatarUrl: stored.avatarUrl && !stored.avatarUrl.includes('student_avatar') ? stored.avatarUrl : '/assets/robot_avatar.jpg',
              role: 'student',
              createdAt: session.user.created_at || stored.createdAt
            });
            setEducationProfile(getStoredEducationProfile());
            setIsLoading(false);
            return;
          }
        } catch (e) {
          console.warn('Supabase session fetch error:', e);
        }
      }

      // Load active session from storage
      const currentUser = getStoredUser();
      if (currentUser) {
        const currentEdu = getStoredEducationProfile(currentUser.id);
        setUser(currentUser);
        setEducationProfile(currentEdu);
      } else {
        setUser(null);
        setEducationProfile(null);
      }
      setIsLoading(false);
    };

    loadSession();
  }, [isSupabaseActive]);

  const login = async (email: string, password?: string) => {
    setIsLoading(true);
    if (isSupabaseActive && supabase && password) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setIsLoading(false);
          return { success: false, error: error.message };
        }
        if (data.user) {
          const u: UserProfile = {
            id: data.user.id,
            email: data.user.email || email,
            fullName: data.user.user_metadata?.full_name || 'Student',
            avatarUrl: '/assets/robot_avatar.jpg',
            role: 'student',
            createdAt: data.user.created_at
          };
          setUser(u);
          saveStoredUser(u);
          setIsLoading(false);
          return { success: true };
        }
      } catch (err: any) {
        setIsLoading(false);
        return { success: false, error: err.message || 'Login failed' };
      }
    }

    // Local multi-tenant authentication
    const users = getRegisteredUsers();
    const account = users.find(u => u.user.email.toLowerCase() === email.trim().toLowerCase());
    if (account) {
      if (password && account.password && password !== account.password) {
        setIsLoading(false);
        return { success: false, error: 'Incorrect password. Please verify your password.' };
      }
      setUser(account.user);
      saveStoredUser(account.user);
      const edu = getStoredEducationProfile(account.user.id);
      setEducationProfile(edu);
      setIsLoading(false);
      return { success: true };
    }

    setIsLoading(false);
    return { success: false, error: 'No account found with this email. Please click "Create student account" to register.' };
  };

  const register = async (fullName: string, email: string, password?: string) => {
    setIsLoading(true);
    if (isSupabaseActive && supabase && password) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName }
          }
        });
        if (error) {
          setIsLoading(false);
          return { success: false, error: error.message };
        }
        if (data.user) {
          const newUser: UserProfile = {
            id: data.user.id,
            email: data.user.email || email,
            fullName,
            avatarUrl: '/assets/robot_avatar.jpg',
            role: 'student',
            createdAt: new Date().toISOString()
          };
          setUser(newUser);
          saveStoredUser(newUser);

          // Mark new education profile as incomplete for first-time onboarding
          const newEdu: EducationProfile = {
            userId: newUser.id,
            board: 'CBSE',
            classLevel: '11',
            stream: 'Science',
            curriculumType: 'NCERT / National Curriculum Framework (NCF)',
            academicYear: '2026-27',
            preferredLanguage: 'English',
            subjects: ['Mathematics', 'Physics', 'Chemistry'],
            isProfileComplete: false,
            updatedAt: new Date().toISOString()
          };
          setEducationProfile(newEdu);
          saveStoredEducationProfile(newEdu);

          setIsLoading(false);
          return { success: true };
        }
      } catch (err: any) {
        setIsLoading(false);
        return { success: false, error: err.message || 'Registration failed' };
      }
    }

    // Local mode registration
    const existingAccounts = getRegisteredUsers();
    if (existingAccounts.some(a => a.user.email.toLowerCase() === email.trim().toLowerCase())) {
      setIsLoading(false);
      return { success: false, error: 'An account with this email already exists. Please sign in.' };
    }

    const newUser: UserProfile = {
      id: 'usr_' + Date.now(),
      email: email.trim(),
      fullName: fullName.trim(),
      avatarUrl: '/assets/robot_avatar.jpg',
      role: 'student',
      createdAt: new Date().toISOString()
    };
    saveRegisteredUser({ user: newUser, password });
    setUser(newUser);
    saveStoredUser(newUser);

    const newEdu: EducationProfile = {
      userId: newUser.id,
      board: 'CBSE',
      classLevel: '11',
      stream: 'Science',
      curriculumType: 'NCERT / National Curriculum Framework (NCF)',
      academicYear: '2026-27',
      preferredLanguage: 'English',
      subjects: ['Physics', 'Mathematics', 'Chemistry'],
      isProfileComplete: false,
      updatedAt: new Date().toISOString()
    };
    setEducationProfile(newEdu);
    saveStoredEducationProfile(newEdu);

    setIsLoading(false);
    return { success: true };
  };

  const logout = async () => {
    if (isSupabaseActive && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Supabase sign out error:', e);
      }
    }
    setUser(null);
    setEducationProfile(null);
    saveStoredUser(null);
  };

  const updateProfile = (updated: Partial<UserProfile>) => {
    if (!user) return;
    const merged = { ...user, ...updated };
    setUser(merged);
    saveStoredUser(merged);
  };

  const updateEducationProfile = (updated: Partial<EducationProfile>) => {
    if (!educationProfile) return;
    const merged = { ...educationProfile, ...updated, updatedAt: new Date().toISOString() };
    setEducationProfile(merged);
    saveStoredEducationProfile(merged);
  };

  const resetPassword = async (email: string) => {
    if (isSupabaseActive && supabase) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) return { success: false, error: error.message };
        return { success: true };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    }
    const users = getRegisteredUsers();
    const match = users.find(u => u.user.email.toLowerCase() === email.trim().toLowerCase());
    if (match) {
      return { success: true };
    }
    return { success: false, error: 'No student account registered with this email address.' };
  };

  const switchDemoUser = (userType: 'limitha' | 'arjun') => {
    if (userType === 'limitha') {
      setUser(defaultUserProfile);
      saveStoredUser(defaultUserProfile);
      const edu = getStoredEducationProfile('usr_limitha_default');
      setEducationProfile(edu);
      saveStoredEducationProfile(edu);
    } else {
      setUser(secondaryTestUser);
      saveStoredUser(secondaryTestUser);
      const edu = getStoredEducationProfile('usr_student_b');
      setEducationProfile(edu);
      saveStoredEducationProfile(edu);
    }
  };

  const isFirstTimeUser = Boolean(user && educationProfile && !educationProfile.isProfileComplete);

  return (
    <AuthContext.Provider
      value={{
        user,
        educationProfile,
        isAuthenticated: Boolean(user),
        isLoading,
        isFirstTimeUser,
        isSupabaseActive,
        login,
        register,
        logout,
        updateProfile,
        updateEducationProfile,
        resetPassword,
        switchDemoUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
