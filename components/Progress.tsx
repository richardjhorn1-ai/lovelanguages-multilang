import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { geminiService } from '../services/gemini';
import { Profile, DictionaryEntry, WordType } from '../types';
import { ICONS } from '../constants';

interface ProgressProps {
  profile: Profile;
}

const Progress: React.FC<ProgressProps> = ({ profile }) => {
  const [entries, setEntries] = useState<DictionaryEntry[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalWords: 0,
    nouns: 0,
    verbs: 0,
    adjectives: 0,
    phrases: 0,
    other: 0
  });

  useEffect(() => {
    fetchEntries();
  }, [profile]);

  const fetchEntries = async () => {
    const targetUserId = (profile.role === 'tutor' && profile.linked_user_id) ? profile.linked_user_id : profile.id;
    const { data } = await supabase
      .from('dictionary')
      .select('*')
      .eq('user_id', targetUserId);

    if (data) {
      setEntries(data);
      // Calculate stats
      const nouns = data.filter(e => e.word_type === 'noun').length;
      const verbs = data.filter(e => e.word_type === 'verb').length;
      const adjectives = data.filter(e => e.word_type === 'adjective').length;
      const phrases = data.filter(e => e.word_type === 'phrase').length;
      const other = data.length - nouns - verbs - adjectives - phrases;

      setStats({
        totalWords: data.length,
        nouns,
        verbs,
        adjectives,
        phrases,
        other
      });
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncMessage(null);

    try {
      // Fetch unharvested messages first (if column exists), otherwise all messages
      const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select('id, role, content, vocabulary_harvested_at')
        .order('created_at', { ascending: true });

      if (msgError) {
        console.error('Error fetching messages:', msgError);
        // Fallback: fetch without the new column
        const { data: fallbackMessages } = await supabase
          .from('messages')
          .select('id, role, content')
          .order('created_at', { ascending: false })
          .limit(100);

        if (!fallbackMessages || fallbackMessages.length === 0) {
          setSyncMessage('No messages to process');
          return;
        }

        // Process fallback
        await processMessages(fallbackMessages, false);
        return;
      }

      // Filter to unharvested messages
      const unharvested = messages?.filter(m => !m.vocabulary_harvested_at) || [];

      if (unharvested.length === 0) {
        setSyncMessage('All messages already synced!');
        return;
      }

      await processMessages(unharvested, true);

    } catch (e: any) {
      console.error('Sync failed:', e);
      setSyncMessage(`Sync error: ${e.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const processMessages = async (messages: any[], markAsHarvested: boolean) => {
    const knownWords = entries.map(e => e.word.toLowerCase());
    let totalNewWords = 0;

    // Process in batches of 50
    const batchSize = 50;
    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      const messageIds = batch.map(m => m.id);

      const harvested = await geminiService.analyzeHistory(
        batch.map(m => ({ role: m.role, content: m.content })),
        knownWords
      );

      if (harvested.length > 0) {
        const wordsToSave = harvested.map(w => ({
          user_id: profile.id,
          word: String(w.word).toLowerCase().trim(),
          translation: String(w.translation),
          word_type: w.type as WordType,
          importance: Number(w.importance) || 1,
          context: JSON.stringify({
            original: w.context,
            examples: w.examples || [],
            root: w.rootWord || w.word,
            proTip: w.proTip || '',
            conjugations: (w as any).conjugations || null,
            gender: (w as any).gender || null,
            plural: (w as any).plural || null,
            adjectiveForms: (w as any).adjectiveForms || null
          }),
          unlocked_at: new Date().toISOString()
        }));

        await supabase
          .from('dictionary')
          .upsert(wordsToSave, {
            onConflict: 'user_id,word',
            ignoreDuplicates: false
          });

        totalNewWords += harvested.length;
        harvested.forEach(w => knownWords.push(w.word.toLowerCase()));
      }

      // Mark messages as harvested
      if (markAsHarvested) {
        await supabase
          .from('messages')
          .update({ vocabulary_harvested_at: new Date().toISOString() })
          .in('id', messageIds);
      }
    }

    setSyncMessage(totalNewWords > 0
      ? `Synced ${totalNewWords} new word${totalNewWords > 1 ? 's' : ''}!`
      : 'No new words found'
    );
    await fetchEntries();
  };

  const xpProgress = (profile.xp || 0) % 100;
  const xpToNextLevel = 100 - xpProgress;

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-8 bg-[#fdfcfd]">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Level & XP Card */}
        <div className="bg-gradient-to-br from-[#FF4761] to-rose-600 p-8 rounded-[2.5rem] shadow-xl shadow-rose-200 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 opacity-10">
            <ICONS.Sparkles className="w-32 h-32" />
          </div>

          <div className="flex items-center justify-between mb-6 relative z-10">
            <div>
              <p className="text-rose-200 text-[10px] font-black uppercase tracking-widest mb-1">Current Level</p>
              <h2 className="text-5xl font-black">{profile.level || 1}</h2>
            </div>
            <div className="text-right">
              <p className="text-rose-200 text-[10px] font-black uppercase tracking-widest mb-1">Total XP</p>
              <p className="text-2xl font-black">{profile.xp || 0}</p>
            </div>
          </div>

          <div className="relative z-10">
            <div className="flex justify-between text-[10px] font-bold text-rose-200 mb-2">
              <span>Progress to Level {(profile.level || 1) + 1}</span>
              <span>{xpProgress}/100 XP</span>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-1000 shadow-lg"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
            <p className="text-[10px] text-rose-200 mt-2 text-center">{xpToNextLevel} XP to next level</p>
          </div>
        </div>

        {/* Words Stats Card */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[11px] font-black flex items-center gap-2 text-gray-400 uppercase tracking-[0.2em]">
              <ICONS.Book className="text-rose-400 w-4 h-4" />
              Words Learned
            </h3>
            <span className="text-3xl font-black text-[#FF4761]">{stats.totalWords}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Nouns', count: stats.nouns, color: 'bg-blue-50 text-blue-500 border-blue-100' },
              { label: 'Verbs', count: stats.verbs, color: 'bg-green-50 text-green-500 border-green-100' },
              { label: 'Adjectives', count: stats.adjectives, color: 'bg-purple-50 text-purple-500 border-purple-100' },
              { label: 'Phrases', count: stats.phrases, color: 'bg-amber-50 text-amber-500 border-amber-100' }
            ].map(stat => (
              <div key={stat.label} className={`${stat.color} p-4 rounded-2xl border text-center`}>
                <p className="text-2xl font-black">{stat.count}</p>
                <p className="text-[9px] font-bold uppercase tracking-wider opacity-70">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Sync Card */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <h3 className="text-[11px] font-black mb-4 flex items-center gap-2 text-gray-400 uppercase tracking-[0.2em]">
            <ICONS.RefreshCw className="text-rose-400 w-4 h-4" />
            Vocabulary Sync
          </h3>

          <p className="text-sm text-gray-500 mb-6">
            Scan all your conversations for any missed vocabulary. Real-time extraction captures most words automatically, but this ensures nothing is lost.
          </p>

          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="w-full bg-[#FF4761] hover:bg-rose-600 text-white py-4 rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg shadow-rose-100 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
          >
            <ICONS.Sparkles className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync All Words'}
          </button>

          {syncMessage && (
            <p className={`mt-4 text-center text-sm font-bold ${syncMessage.includes('error') ? 'text-red-500' : 'text-green-500'}`}>
              {syncMessage}
            </p>
          )}
        </div>

        {/* Coming Soon: Achievements */}
        <div className="bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100 opacity-60">
          <h3 className="text-[11px] font-black mb-4 flex items-center gap-2 text-gray-400 uppercase tracking-[0.2em]">
            <ICONS.Star className="text-gray-300 w-4 h-4" />
            Achievements
          </h3>
          <p className="text-sm text-gray-400 text-center py-4">Coming soon...</p>
        </div>

      </div>
    </div>
  );
};

export default Progress;
