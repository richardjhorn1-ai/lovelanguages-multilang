'use client';

import { createContext, useContext } from 'react';
import { Profile } from '../types';

interface ProfileContextValue {
  profile: Profile;
  refreshProfile: () => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({
  children,
  profile,
  refreshProfile,
}: {
  children: React.ReactNode;
  profile: Profile;
  refreshProfile: () => void;
}) {
  return (
    <ProfileContext.Provider value={{ profile, refreshProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used inside ProfileProvider');
  return ctx;
}
