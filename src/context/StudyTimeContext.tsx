import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import type { StudySession } from '../types';
import { getStoredStudySessions, saveStudySession } from '../lib/storage';
import { useAuth } from './AuthContext';

interface StudyTimeContextType {
  isActive: boolean;
  isIdle: boolean;
  currentSessionSeconds: number;
  totalTrackedSeconds: number;
  recordLearningActivity: (activityName?: string) => void;
  pauseTracking: () => void;
  resumeTracking: () => void;
}

const StudyTimeContext = createContext<StudyTimeContextType | undefined>(undefined);

// Inactivity threshold: 60 seconds of no user interaction
const IDLE_TIMEOUT_MS = 60 * 1000;

export const StudyTimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isActive, setIsActive] = useState<boolean>(true);
  const [isIdle, setIsIdle] = useState<boolean>(false);
  const [currentSessionSeconds, setCurrentSessionSeconds] = useState<number>(0);
  const [totalTrackedSeconds, setTotalTrackedSeconds] = useState<number>(0);

  const sessionIdRef = useRef<string>('study-live-' + Date.now());
  const sessionStartRef = useRef<string>(new Date().toISOString());
  const lastActiveTimestampRef = useRef<number>(Date.now());
  const activeSecondsAccumulatorRef = useRef<number>(0);
  const idleTimerRef = useRef<any>(null);

  // Load existing recorded seconds from stored sessions
  useEffect(() => {
    const sessions = getStoredStudySessions();
    const sum = sessions.reduce((acc, s) => acc + (s.trackedSeconds || 0), 0);
    setTotalTrackedSeconds(sum);
  }, []);

  // Save progress periodically to storage
  const syncSessionToStorage = useCallback(() => {
    if (!user) return;
    const session: StudySession = {
      id: sessionIdRef.current,
      userId: user.id,
      startedAt: sessionStartRef.current,
      lastActiveAt: new Date().toISOString(),
      trackedSeconds: activeSecondsAccumulatorRef.current,
      sessionStatus: isIdle ? 'idle_paused' : 'active'
    };
    saveStudySession(session);
  }, [user, isIdle]);

  // Activity handler (triggered by user interaction)
  const handleUserActivity = useCallback(() => {
    lastActiveTimestampRef.current = Date.now();
    if (isIdle) {
      setIsIdle(false);
    }
    // Reset idle timer
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      setIsIdle(true);
      syncSessionToStorage();
    }, IDLE_TIMEOUT_MS);
  }, [isIdle, syncSessionToStorage]);

  // Record an explicit qualifying learning action (e.g. submitting a question, viewing solution, answering practice)
  const recordLearningActivity = useCallback((activityName?: string) => {
    handleUserActivity();
    console.debug(`[StudyTime] Qualifying learning action recorded: ${activityName || 'interaction'}`);
  }, [handleUserActivity]);

  const pauseTracking = () => setIsActive(false);
  const resumeTracking = () => {
    setIsActive(true);
    handleUserActivity();
  };

  // Window visibility and focus listeners (stops counting in background tabs)
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden) {
        setIsIdle(true);
        syncSessionToStorage();
      } else {
        handleUserActivity();
      }
    };

    const onBlur = () => {
      setIsIdle(true);
      syncSessionToStorage();
    };

    const onFocus = () => {
      handleUserActivity();
    };

    const events = ['mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    const throttledActivity = () => handleUserActivity();

    events.forEach(evt => window.addEventListener(evt, throttledActivity, { passive: true }));
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);

    // Initial idle timer setup
    idleTimerRef.current = setTimeout(() => {
      setIsIdle(true);
    }, IDLE_TIMEOUT_MS);

    return () => {
      events.forEach(evt => window.removeEventListener(evt, throttledActivity));
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [handleUserActivity, syncSessionToStorage]);

  // Heartbeat ticker: increments active time every second if active & not idle
  useEffect(() => {
    const timer = setInterval(() => {
      if (isActive && !isIdle && !document.hidden) {
        activeSecondsAccumulatorRef.current += 1;
        setCurrentSessionSeconds(activeSecondsAccumulatorRef.current);
        setTotalTrackedSeconds(prev => prev + 1);

        // Every 10 seconds, write snapshot to storage
        if (activeSecondsAccumulatorRef.current % 10 === 0) {
          syncSessionToStorage();
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, isIdle, syncSessionToStorage]);

  return (
    <StudyTimeContext.Provider
      value={{
        isActive,
        isIdle,
        currentSessionSeconds,
        totalTrackedSeconds,
        recordLearningActivity,
        pauseTracking,
        resumeTracking
      }}
    >
      {children}
    </StudyTimeContext.Provider>
  );
};

export const useStudyTime = () => {
  const context = useContext(StudyTimeContext);
  if (!context) {
    throw new Error('useStudyTime must be used within a StudyTimeProvider');
  }
  return context;
};
