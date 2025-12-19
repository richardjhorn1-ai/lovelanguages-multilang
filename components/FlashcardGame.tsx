
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Profile, DictionaryEntry } from '../types';
import { ICONS } from '../constants';

interface FlashcardGameProps {
  profile: Profile;
}

const FlashcardGame: React.FC<FlashcardGameProps> = ({ profile }) => {
  const [deck, setDeck] = useState<DictionaryEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeck();
  }, [profile]);

  const fetchDeck = async () => {
    const { data } = await supabase
      .from('dictionary')
      .select('*')
      .eq('user_id', profile.id)
      .limit(10);
    
    if (data && data.length > 0) {
      setDeck(data.sort(() => Math.random() - 0.5));
    }
    setLoading(false);
  };

  const handleResponse = (isCorrect: boolean) => {
    if (isCorrect) setScore(s => s + 1);
    
    if (currentIndex < deck.length - 1) {
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentIndex(c => c + 1);
      }, 300);
    } else {
      setFinished(true);
    }
  };

  if (loading) return <div className="p-20 text-center">Loading deck...</div>;

  if (deck.length === 0) return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
      <div className="w-24 h-24 bg-rose-100 rounded-full flex items-center justify-center text-rose-500 mb-6">
        <ICONS.Book className="w-12 h-12" />
      </div>
      <h2 className="text-2xl font-bold mb-4">No Words Yet</h2>
      <p className="text-gray-500 mb-8">You need to unlock words in the Chat before you can practice them here.</p>
    </div>
  );

  if (finished) return (
    <div className="h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-rose-50 to-white">
      <div className="bg-white p-12 rounded-[3rem] shadow-2xl text-center max-w-sm w-full border border-rose-100">
        <h2 className="text-4xl font-bold mb-2">Great Job!</h2>
        <div className="text-6xl my-8">🏆</div>
        <p className="text-gray-600 mb-2">You mastered</p>
        <div className="text-5xl font-bold text-rose-500 mb-8">{score} / {deck.length}</div>
        <button 
          onClick={() => window.location.reload()}
          className="w-full bg-rose-500 text-white py-4 rounded-2xl font-bold shadow-lg shadow-rose-200 hover:bg-rose-600 active:scale-95 transition-all"
        >
          Practice Again
        </button>
      </div>
    </div>
  );

  const current = deck[currentIndex];

  return (
    <div className="h-full flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex justify-between items-center mb-10 px-4">
          <div className="h-2 flex-1 bg-gray-100 rounded-full overflow-hidden mr-4">
            <div 
              className="h-full bg-rose-500 transition-all duration-500" 
              style={{ width: `${((currentIndex + 1) / deck.length) * 100}%` }}
            ></div>
          </div>
          <span className="text-sm font-bold text-gray-400">{currentIndex + 1} / {deck.length}</span>
        </div>

        <div 
          onClick={() => setIsFlipped(!isFlipped)}
          className={`relative w-full aspect-[4/5] cursor-pointer perspective-1000 group`}
        >
          <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
            {/* Front */}
            <div className="absolute inset-0 bg-white border-2 border-rose-100 rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center shadow-xl backface-hidden">
              <span className="text-[10px] uppercase tracking-widest text-rose-300 font-bold mb-8">POLISH WORD</span>
              <h3 className="text-4xl font-bold text-gray-800">{current.word}</h3>
              <p className="mt-12 text-gray-400 text-sm animate-pulse">Click to see translation</p>
            </div>

            {/* Back */}
            <div className="absolute inset-0 bg-rose-500 text-white rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center shadow-xl backface-hidden rotate-y-180">
              <span className="text-[10px] uppercase tracking-widest text-white/60 font-bold mb-8">TRANSLATION</span>
              <h3 className="text-4xl font-bold">{current.translation}</h3>
              <div className="mt-12 grid grid-cols-2 gap-4 w-full">
                <button 
                  onClick={(e) => { e.stopPropagation(); handleResponse(false); }}
                  className="bg-white/20 hover:bg-white/30 p-4 rounded-2xl flex items-center justify-center gap-2 border border-white/20"
                >
                  <ICONS.X className="w-5 h-5" /> Forgot
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleResponse(true); }}
                  className="bg-white text-rose-500 p-4 rounded-2xl flex items-center justify-center gap-2 font-bold shadow-lg"
                >
                  <ICONS.Check className="w-5 h-5" /> Got it!
                </button>
              </div>
            </div>
          </div>
        </div>

        <style>{`
          .perspective-1000 { perspective: 1000px; }
          .transform-style-3d { transform-style: preserve-3d; }
          .backface-hidden { backface-visibility: hidden; }
          .rotate-y-180 { transform: rotateY(180deg); }
        `}</style>
      </div>
    </div>
  );
};

export default FlashcardGame;
