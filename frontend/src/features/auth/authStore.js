/**
 * authStore.js — Zustand auth state
 *
 * Persists user to localStorage so the auth state survives page refresh.
 *
 * Shape: { user: User | null, isLoading: boolean }
 * Actions: setUser, clearUser, setLoading
 *
 * WHY Zustand (not Context): Auth state is read by many components but almost
 * never written. Zustand's subscription model only re-renders components that
 * read the changed slice — Context re-renders the entire subtree.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isLoading: true, // true on initial mount while we verify the token

      setUser: (user) => set({ user, isLoading: false }),
      clearUser: () => set({ user: null, isLoading: false }),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'talentforgeai-auth',       // localStorage key
      partialize: (state) => ({    // Only persist user, not isLoading
        user: state.user,
      }),
      onRehydrateStorage: () => (state) => {
        // After rehydration from localStorage, loading is complete
        state?.setLoading(false);
      },
    },
  ),
);
