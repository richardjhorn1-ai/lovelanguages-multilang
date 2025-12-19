
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Profile, DictionaryEntry } from '../types';
import { ICONS } from '../constants';

interface FlashcardGameProps { profile: Profile; }

const FlashcardGame: React.FC<FlashcardGameProps> = ({ profile }) => {
  const [deck, setDeck] = useState<DictionaryEntry[]>([]);
  const [scores, setScores] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [profile]);

  const fetchData = async () => {
    setLoading(true);
    // Tutor sees partner's data; fall back to self if no partner (for testing).
    const targetUserId = (profile.role === 'tutor' && profile.linked_user_id) 
      ? profile.linked_user_id 
      : profile.id;

    const { data: dictData } = await supabase
      .from('dictionary')
      .select('*')
      .eq('user_id', targetUserId);
    
    if (dictData) setDeck(dictData.sort(() => Math.random() - 0.5));

    const { data: scoreData } = await supabase
      .from('scores')
      .select('*, dictionary:word_id(word, translation)')
      .eq('user_id', targetUserId);
    
    if (scoreData) setScores(scoreData);
    setLoading(false);
  };

  const handleResponse = async (isCorrect: boolean) => {
    const wordId = deck[currentIndex].id;
    if (isCorrect) setScore(s => s + 1);

    await supabase.from('scores').upsert({
      user_id: profile.id,
      word_id: wordId,
      success_count: isCorrect ? 1 : 0,
      fail_count: isCorrect ? 0 : 1,
      last_practiced: new Date().toISOString()
    }, { onConflict: 'user_id,word_id' });
    
    if (currentIndex < deck.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(c => c + 1), 300);
    } else {
      setFinished(true);
    }
  };

  if (loading) return <div className="h-full flex items-center justify-center font-bold text-rose-400 animate-pulse">Loading training module...</div>;

  if (profile.role === 'tutor') {
    return (
      <div className="h-full overflow-y-auto p-6 bg-[#fdfcfd]">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
            <h2 className="text-3xl font-bold font-header mb-2 text-gray-800">Learning Dashboard</h2>
            <p className="text-gray-500 font-medium">
              {profile.linked_user_id ? "Monitoring your partner's Polish mastery." : "Testing tutor view with your own collection."}
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-10">
              <div className="bg-rose-50 p-6 rounded-3xl border border-rose-100 text-center">
                <div className="text-3xl font-black text-rose-600 mb-1">{deck.length}</div>
                <div className="text-[10px] uppercase font-bold text-rose-400 tracking-widest">Total Vocabulary</div>
              </div>
              <div className="bg-teal-50 p-6 rounded-3xl border border-teal-100 text-center">
                <div className="text-3xl font-black text-teal-600 mb-1">
                  {scores.filter(s => s.success_count > s.fail_count).length}
                </div>
                <div className="text-[10px] uppercase font-bold text-teal-400 tracking-widest">Mastered</div>
              </div>
              <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 text-center">
                <div className="text-3xl font-black text-amber-600 mb-1">
                  {scores.filter(s => s.fail_count > 0).length}
                </div>
                <div className="text-[10px] uppercase font-bold text-amber-400 tracking-widest">Needs Review</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
            <h3 className="text-sm font-black uppercase text-gray-400 tracking-widest mb-6">Critical Weak Spots</h3>
            <div className="space-y-4">
              {scores.filter(s => s.fail_count > 0).length === 0 ? (
                <p className="text-gray-400 text-center py-10 italic font-medium">Acing everything! ✨</p>
              ) : (
                scores.filter(s => s.fail_count > 0).sort((a,b) => b.fail_count - a.fail_count).slice(0, 5).map(s => (
                  <div key={s.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div>
                      <p className="font-black text-gray-800">{s.dictionary.word}</p>
                      <p className="text-xs text-gray-400 italic font-medium">{s.dictionary.translation}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-red-500 font-black text-sm">{s.fail_count} Misses</div>
                      <div className="text-[9px] uppercase font-bold text-gray-300">Action required</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (deck.length === 0) return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
      <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-300 mb-6">
        <ICONS.Book className="w-10 h-10" />
      </div>
      <h2 className="text-2xl font-black text-gray-800 mb-4">No Words Yet</h2>
      <p className="text-gray-500 font-medium">You need to unlock words in the Chat before you can practice them here.</p>
    </div>
  );

  if (finished) return (
    <div className="h-full flex flex-col items-center justify-center p-8 bg-[#fdfcfd]">
      <div className="bg-white p-12 rounded-[3rem] shadow-2xl text-center max-w-sm w-full border border-rose-100">
        <h2 className="text-3xl font-black text-gray-800 mb-2">Great Job!</h2>
        <div className="text-6xl my-8">🏆</div>
        <p className="text-gray-500 font-medium mb-1">Session results:</p>
        <div className="text-5xl font-black text-rose-500 mb-8">{score} / {deck.length}</div>
        <button onClick={() => window.location.reload()} className="w-full bg-[#FF4761] text-white py-4 rounded-2xl font-bold shadow-lg shadow-rose-100 hover:bg-[#E63E56] active:scale-95 transition-all uppercase tracking-widest text-sm">Practice Again</button>
      </div>
    </div>
  );

  const current = deck[currentIndex];

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 bg-[#fcf9f9]">
      <div className="w-full max-w-md">
        <div className="flex justify-between items-center mb-10 px-4">
          <div className="h-1.5 flex-1 bg-gray-200 rounded-full overflow-hidden mr-4">
            <div className="h-full bg-rose-500 transition-all duration-500" style={{ width: `${((currentIndex + 1) / deck.length) * 100}%` }}></div>
          </div>
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{currentIndex + 1} / {deck.length}</span>
        </div>

        <div onClick={() => setIsFlipped(!isFlipped)} className={`relative w-full aspect-[4/5] cursor-pointer perspective-1000 group`}>
          <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
            {/* Front */}
            <div className="absolute inset-0 bg-white border border-rose-100 rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center shadow-lg backface-hidden">
              <span className="text-[10px] uppercase tracking-widest text-rose-300 font-black mb-8">POLISH WORD</span>
              <h3 className="text-4xl font-black text-gray-800">{current.word}</h3>
              <p className="mt-12 text-gray-400 text-[10px] uppercase font-black tracking-widest animate-pulse">Tap to reveal</p>
            </div>

            {/* Back */}
            <div className="absolute inset-0 bg-[#FF4761] text-white rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center shadow-lg backface-hidden rotate-y-180">
              <span className="text-[10px] uppercase tracking-widest text-white/50 font-black mb-8">TRANSLATION</span>
              <h3 className="text-4xl font-black">{current.translation}</h3>
              <div className="mt-12 grid grid-cols-2 gap-3 w-full">
                <button onClick={(e) => { e.stopPropagation(); handleResponse(false); }} className="bg-white/10 hover:bg-white/20 p-4 rounded-2xl flex items-center justify-center gap-2 border border-white/20 text-xs font-black uppercase tracking-widest transition-colors"><ICONS.X className="w-4 h-4" /> Hard</button>
                <button onClick={(e) => { e.stopPropagation(); handleResponse(true); }} className="bg-white text-rose-500 p-4 rounded-2xl flex items-center justify-center gap-2 font-black uppercase tracking-widest text-xs shadow-lg transition-all active:scale-95"><ICONS.Check className="w-4 h-4" /> Got it!</button>
              </div>
            </div>
          </div>
        </div>

        <style>{`.perspective-1000 { perspective: 1000px; } .transform-style-3d { transform-style: preserve-3d; } .backface-hidden { backface-visibility: hidden; } .rotate-y-180 { transform: rotateY(180deg); }`}</style>
      </div>
    </div>
  );
};

export default FlashcardGame;
