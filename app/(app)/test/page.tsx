'use client';

import LevelTest from '../../../components/LevelTest';
import { useProfile } from '../../../context/ProfileContext';

export default function TestPage() {
  const { profile } = useProfile();
  return <LevelTest profile={profile} />;
}
