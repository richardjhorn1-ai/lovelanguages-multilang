import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Profile, TutorChallenge, WordRequest } from '../types';
import { ICONS } from '../constants';
import PlayQuizChallenge from './PlayQuizChallenge';
import PlayQuickFireChallenge from './PlayQuickFireChallenge';
import WordGiftLearning from './WordGiftLearning';

interface PendingChallengesProps {
  profile: Profile;
  onRefresh?: () => void;
}

const PendingChallenges: React.FC<PendingChallengesProps> = ({ profile, onRefresh }) => {
  const [challenges, setChallenges] = useState<TutorChallenge[]>([]);
  const [wordRequests, setWordRequests] = useState<WordRequest[]>([]);
  const [partnerName, setPartnerName] = useState('Your Partner');
  const [loading, setLoading] = useState(true);

  // Active game states
  const [activeChallenge, setActiveChallenge] = useState<TutorChallenge | null>(null);
  const [activeWordRequest, setActiveWordRequest] = useState<WordRequest | null>(null);

  useEffect(() => {
    fetchPending();
  }, [profile]);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;

      // Get partner name
      if (profile.linked_user_id) {
        const { data: partner } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', profile.linked_user_id)
          .single();
        if (partner) setPartnerName(partner.full_name);
      }

      // Fetch pending challenges
      const challengeRes = await fetch('/api/get-challenges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'pending', role: 'student' })
      });
      const challengeData = await challengeRes.json();
      if (challengeData.challenges) setChallenges(challengeData.challenges);

      // Fetch pending word requests
      const requestRes = await fetch('/api/get-word-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'pending', role: 'student' })
      });
      const requestData = await requestRes.json();
      if (requestData.wordRequests) setWordRequests(requestData.wordRequests);

    } catch (error) {
      console.error('Error fetching pending items:', error);
    }
    setLoading(false);
  };

  const handleChallengeComplete = () => {
    setActiveChallenge(null);
    fetchPending();
    if (onRefresh) onRefresh();
  };

  const handleWordRequestComplete = () => {
    setActiveWordRequest(null);
    fetchPending();
    if (onRefresh) onRefresh();
  };

  if (loading) return null;

  const totalPending = challenges.length + wordRequests.length;
  if (totalPending === 0) return null;

  return (
    <>
      {/* Banner */}
      <div className="bg-gradient-to-r from-rose-500 to-amber-500 rounded-[2rem] p-6 text-white shadow-lg">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl animate-bounce">
            {wordRequests.length > 0 ? '🎁' : '🎮'}
          </div>
          <div>
            <h3 className="font-black text-lg">
              {partnerName} sent you {totalPending === 1 ? 'something' : `${totalPending} things`}!
            </h3>
            <p className="text-white/80 text-sm">
              {challenges.length > 0 && `${challenges.length} challenge${challenges.length > 1 ? 's' : ''}`}
              {challenges.length > 0 && wordRequests.length > 0 && ' & '}
              {wordRequests.length > 0 && `${wordRequests.length} word gift${wordRequests.length > 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        {/* Challenge Cards */}
        <div className="space-y-2">
          {challenges.map(challenge => (
            <button
              key={challenge.id}
              onClick={() => setActiveChallenge(challenge)}
              className="w-full flex items-center gap-3 p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-colors text-left"
            >
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                {challenge.challenge_type === 'quiz' ? '🎯' : '⚡'}
              </div>
              <div className="flex-1">
                <p className="font-bold">{challenge.title}</p>
                <p className="text-xs text-white/70">
                  {challenge.words_data?.length || 0} words • {challenge.challenge_type === 'quiz' ? 'Quiz' : 'Quick Fire'}
                </p>
              </div>
              <div className="flex items-center gap-1 text-sm font-bold">
                Play <ICONS.ChevronRight className="w-4 h-4" />
              </div>
            </button>
          ))}

          {wordRequests.map(request => (
            <button
              key={request.id}
              onClick={() => setActiveWordRequest(request)}
              className="w-full flex items-center gap-3 p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-colors text-left"
            >
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                🎁
              </div>
              <div className="flex-1">
                <p className="font-bold">Word Gift</p>
                <p className="text-xs text-white/70">
                  {request.selected_words?.length || 0} words • {request.xp_multiplier}x XP bonus
                </p>
              </div>
              <div className="flex items-center gap-1 text-sm font-bold">
                Learn <ICONS.ChevronRight className="w-4 h-4" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Active Challenge Modal */}
      {activeChallenge && activeChallenge.challenge_type === 'quiz' && (
        <PlayQuizChallenge
          challenge={activeChallenge}
          partnerName={partnerName}
          onClose={() => setActiveChallenge(null)}
          onComplete={handleChallengeComplete}
        />
      )}

      {activeChallenge && activeChallenge.challenge_type === 'quickfire' && (
        <PlayQuickFireChallenge
          challenge={activeChallenge}
          partnerName={partnerName}
          onClose={() => setActiveChallenge(null)}
          onComplete={handleChallengeComplete}
        />
      )}

      {/* Active Word Request Modal */}
      {activeWordRequest && (
        <WordGiftLearning
          wordRequest={activeWordRequest}
          partnerName={partnerName}
          onClose={() => setActiveWordRequest(null)}
          onComplete={handleWordRequestComplete}
        />
      )}
    </>
  );
};

export default PendingChallenges;
