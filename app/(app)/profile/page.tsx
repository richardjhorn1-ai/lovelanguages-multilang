'use client';

import ProfileView from '../../../components/ProfileView';
import { useProfile } from '../../../context/ProfileContext';

export default function ProfilePage() {
  const { profile, refreshProfile } = useProfile();
  return <ProfileView profile={profile} onRefresh={refreshProfile} />;
}
