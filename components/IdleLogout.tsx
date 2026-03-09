'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];

export function IdleLogout() {
  const { isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      router.push('/?reason=inactive');
    } catch {
      router.push('/?reason=inactive');
    }
  }, [logout, router]);

  const resetTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (!isAuthenticated) return;
    timeoutRef.current = setTimeout(handleLogout, IDLE_TIMEOUT_MS);
  }, [isAuthenticated, handleLogout]);

  useEffect(() => {
    if (!isAuthenticated) return;
    resetTimer();
    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });
    return () => {
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isAuthenticated, resetTimer]);

  return null;
}
