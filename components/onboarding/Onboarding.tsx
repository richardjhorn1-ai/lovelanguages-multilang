import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import type { OnboardingData } from '../../types';

// Shared steps
import { NameStep } from './steps/shared/NameStep';
import { PartnerNameStep } from './steps/shared/PartnerNameStep';

// Student steps
import { VibeStep } from './steps/student/VibeStep';
import { PhotoStep } from './steps/student/PhotoStep';
import { WhyStep } from './steps/student/WhyStep';
import { TimeStep } from './steps/student/TimeStep';
import { WhenStep } from './steps/student/WhenStep';
import { FearStep } from './steps/student/FearStep';
import { PriorStep } from './steps/student/PriorStep';
import { LearnHelloStep } from './steps/student/LearnHelloStep';
import { LearnLoveStep } from './steps/student/LearnLoveStep';
import { TryItStep } from './steps/student/TryItStep';
import { CelebrationStep } from './steps/student/CelebrationStep';
import { GoalStep } from './steps/student/GoalStep';
import { StartStep } from './steps/student/StartStep';

// Tutor steps
import { RelationStep } from './steps/tutor/RelationStep';
import { PolishConnectionStep } from './steps/tutor/PolishConnectionStep';
import { OriginStep } from './steps/tutor/OriginStep';
import { DreamPhraseStep } from './steps/tutor/DreamPhraseStep';
import { TeachingStyleStep } from './steps/tutor/TeachingStyleStep';
import { TutorPreviewStep } from './steps/tutor/TutorPreviewStep';
import { TutorStartStep } from './steps/tutor/TutorStartStep';

interface OnboardingProps {
  role: 'student' | 'tutor';
  userId: string;
  onComplete: () => void;
}

const STUDENT_TOTAL_STEPS = 15;
const TUTOR_TOTAL_STEPS = 9;

const STORAGE_KEY = 'onboarding_progress';

export const Onboarding: React.FC<OnboardingProps> = ({
  role,
  userId,
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<Partial<OnboardingData>>({});
  const [saving, setSaving] = useState(false);

  const totalSteps = role === 'student' ? STUDENT_TOTAL_STEPS : TUTOR_TOTAL_STEPS;
  const accentColor = role === 'student' ? '#FF4761' : '#14B8A6';

  // Load saved progress from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.userId === userId && parsed.role === role) {
          setCurrentStep(parsed.step || 1);
          setData(parsed.data || {});
        }
      } catch {
        // Ignore parse errors
      }
    }
  }, [userId, role]);

  // Save progress to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      userId,
      role,
      step: currentStep,
      data
    }));
  }, [userId, role, currentStep, data]);

  const goNext = () => setCurrentStep(s => Math.min(s + 1, totalSteps));
  const goBack = () => setCurrentStep(s => Math.max(s - 1, 1));

  const updateData = (key: keyof OnboardingData, value: any) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      // For tutors, partner_name is their learner; for students, it's their partner
      const partnerNameValue = role === 'tutor' ? data.learnerName : data.partnerName;

      // Save to Supabase
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.userName || 'Friend',
          partner_name: partnerNameValue || null,
          onboarding_data: data,
          onboarding_completed_at: new Date().toISOString(),
          role: role
        })
        .eq('id', userId);

      if (error) throw error;

      // Award initial XP for completing onboarding (non-blocking, students only)
      if (role === 'student') {
        supabase.rpc('increment_xp', { user_id: userId, amount: 10 }).then(() => {
          // XP awarded successfully
        });
      }

      // Clear localStorage
      localStorage.removeItem(STORAGE_KEY);

      onComplete();
    } catch (err) {
      console.error('Error saving onboarding:', err);
      // Clear localStorage even on error
      localStorage.removeItem(STORAGE_KEY);
      // Still complete even if save fails - we can sync later
      onComplete();
    } finally {
      setSaving(false);
    }
  };

  // Student flow
  if (role === 'student') {
    switch (currentStep) {
      case 1:
        return (
          <NameStep
            currentStep={1}
            totalSteps={totalSteps}
            initialValue={data.userName}
            onNext={(name) => { updateData('userName', name); goNext(); }}
            accentColor={accentColor}
          />
        );
      case 2:
        return (
          <PartnerNameStep
            currentStep={2}
            totalSteps={totalSteps}
            userName={data.userName || 'Friend'}
            role="student"
            initialValue={data.partnerName}
            onNext={(name) => { updateData('partnerName', name); goNext(); }}
            onBack={goBack}
            accentColor={accentColor}
          />
        );
      case 3:
        return (
          <VibeStep
            currentStep={3}
            totalSteps={totalSteps}
            partnerName={data.partnerName || 'them'}
            initialValue={data.relationshipVibe}
            onNext={(vibe) => { updateData('relationshipVibe', vibe); goNext(); }}
            onBack={goBack}
            accentColor={accentColor}
          />
        );
      case 4:
        return (
          <PhotoStep
            currentStep={4}
            totalSteps={totalSteps}
            partnerName={data.partnerName || 'them'}
            onNext={(url) => { updateData('couplePhotoUrl', url); goNext(); }}
            onBack={goBack}
            accentColor={accentColor}
          />
        );
      case 5:
        return (
          <WhyStep
            currentStep={5}
            totalSteps={totalSteps}
            partnerName={data.partnerName || 'them'}
            initialValue={data.learningReason}
            onNext={(reason) => { updateData('learningReason', reason); goNext(); }}
            onBack={goBack}
            accentColor={accentColor}
          />
        );
      case 6:
        return (
          <TimeStep
            currentStep={6}
            totalSteps={totalSteps}
            initialValue={data.dailyTime}
            onNext={(time) => { updateData('dailyTime', time); goNext(); }}
            onBack={goBack}
            accentColor={accentColor}
          />
        );
      case 7:
        return (
          <WhenStep
            currentStep={7}
            totalSteps={totalSteps}
            initialValue={data.preferredTime}
            onNext={(when) => { updateData('preferredTime', when); goNext(); }}
            onBack={goBack}
            accentColor={accentColor}
          />
        );
      case 8:
        return (
          <FearStep
            currentStep={8}
            totalSteps={totalSteps}
            initialValue={data.biggestFear}
            onNext={(fear) => { updateData('biggestFear', fear); goNext(); }}
            onBack={goBack}
            accentColor={accentColor}
          />
        );
      case 9:
        return (
          <PriorStep
            currentStep={9}
            totalSteps={totalSteps}
            initialValue={data.priorExperience}
            onNext={(prior) => { updateData('priorExperience', prior); goNext(); }}
            onBack={goBack}
            accentColor={accentColor}
          />
        );
      case 10:
        return (
          <LearnHelloStep
            currentStep={10}
            totalSteps={totalSteps}
            partnerName={data.partnerName || 'them'}
            onNext={goNext}
            onBack={goBack}
            accentColor={accentColor}
          />
        );
      case 11:
        return (
          <LearnLoveStep
            currentStep={11}
            totalSteps={totalSteps}
            partnerName={data.partnerName || 'them'}
            onNext={goNext}
            onBack={goBack}
            accentColor={accentColor}
          />
        );
      case 12:
        return (
          <TryItStep
            currentStep={12}
            totalSteps={totalSteps}
            onNext={goNext}
            onBack={goBack}
            accentColor={accentColor}
          />
        );
      case 13:
        return (
          <CelebrationStep
            currentStep={13}
            totalSteps={totalSteps}
            partnerName={data.partnerName || 'them'}
            onNext={goNext}
            accentColor={accentColor}
          />
        );
      case 14:
        return (
          <GoalStep
            currentStep={14}
            totalSteps={totalSteps}
            partnerName={data.partnerName || 'them'}
            initialValue={data.firstGoal}
            onNext={(goal) => { updateData('firstGoal', goal); goNext(); }}
            onBack={goBack}
            accentColor={accentColor}
          />
        );
      case 15:
        return (
          <StartStep
            currentStep={15}
            totalSteps={totalSteps}
            userName={data.userName || 'Friend'}
            partnerName={data.partnerName || 'them'}
            onComplete={handleComplete}
            accentColor={accentColor}
          />
        );
      default:
        return null;
    }
  }

  // Tutor flow
  switch (currentStep) {
    case 1:
      return (
        <NameStep
          currentStep={1}
          totalSteps={totalSteps}
          initialValue={data.userName}
          onNext={(name) => { updateData('userName', name); goNext(); }}
          accentColor={accentColor}
        />
      );
    case 2:
      return (
        <PartnerNameStep
          currentStep={2}
          totalSteps={totalSteps}
          userName={data.userName || 'Friend'}
          role="tutor"
          initialValue={data.learnerName}
          onNext={(name) => { updateData('learnerName', name); goNext(); }}
          onBack={goBack}
          accentColor={accentColor}
        />
      );
    case 3:
      return (
        <RelationStep
          currentStep={3}
          totalSteps={totalSteps}
          learnerName={data.learnerName || 'them'}
          initialValue={data.relationshipType}
          onNext={(relation) => { updateData('relationshipType', relation); goNext(); }}
          onBack={goBack}
          accentColor={accentColor}
        />
      );
    case 4:
      return (
        <PolishConnectionStep
          currentStep={4}
          totalSteps={totalSteps}
          initialValue={data.polishConnection}
          onNext={(connection) => { updateData('polishConnection', connection); goNext(); }}
          onBack={goBack}
          accentColor={accentColor}
        />
      );
    case 5:
      return (
        <OriginStep
          currentStep={5}
          totalSteps={totalSteps}
          initialValue={data.polishOrigin}
          onNext={(origin) => { updateData('polishOrigin', origin); goNext(); }}
          onBack={goBack}
          accentColor={accentColor}
        />
      );
    case 6:
      return (
        <DreamPhraseStep
          currentStep={6}
          totalSteps={totalSteps}
          learnerName={data.learnerName || 'them'}
          initialValue={data.dreamPhrase}
          onNext={(phrase) => { updateData('dreamPhrase', phrase); goNext(); }}
          onBack={goBack}
          accentColor={accentColor}
        />
      );
    case 7:
      return (
        <TeachingStyleStep
          currentStep={7}
          totalSteps={totalSteps}
          initialValue={data.teachingStyle}
          onNext={(style) => { updateData('teachingStyle', style); goNext(); }}
          onBack={goBack}
          accentColor={accentColor}
        />
      );
    case 8:
      return (
        <TutorPreviewStep
          currentStep={8}
          totalSteps={totalSteps}
          learnerName={data.learnerName || 'them'}
          onNext={goNext}
          onBack={goBack}
          accentColor={accentColor}
        />
      );
    case 9:
      return (
        <TutorStartStep
          currentStep={9}
          totalSteps={totalSteps}
          userName={data.userName || 'Friend'}
          learnerName={data.learnerName || 'them'}
          onComplete={handleComplete}
          accentColor={accentColor}
        />
      );
    default:
      return null;
  }
};
