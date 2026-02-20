import React, { useEffect } from 'react';

export type DesignConcept = 'original' | 'upgraded' | 'editorial' | 'cinematic' | 'playful';

interface Props {
  concept: DesignConcept;
  onSelect: (concept: DesignConcept) => void;
}

export const ConceptSwitcher: React.FC<Props> = ({ concept, onSelect }) => {
  useEffect(() => {
    localStorage.setItem('design_concept', concept);
  }, [concept]);

  return (
    <div className="fixed bottom-4 right-4 z-[9999] bg-white rounded-full shadow-2xl p-2 flex gap-2 border border-gray-200">
      <button
        onClick={() => onSelect('original')}
        className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${concept === 'original' ? 'bg-gray-800 text-white' : 'hover:bg-gray-100'}`}
      >
        Original
      </button>
      <button
        onClick={() => onSelect('upgraded')}
        className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${concept === 'upgraded' ? 'bg-[#FF6B6B] text-white shadow-md shadow-[#FF6B6B]/30' : 'hover:bg-[#FF6B6B]/10 text-gray-700'}`}
      >
        Upgraded ✨
      </button>
      <button
        onClick={() => onSelect('editorial')}
        className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${concept === 'editorial' ? 'bg-stone-800 text-stone-50' : 'hover:bg-stone-100'}`}
      >
        Editorial
      </button>
      <button
        onClick={() => onSelect('cinematic')}
        className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${concept === 'cinematic' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'hover:bg-indigo-50'}`}
      >
        Cinematic
      </button>
      <button
        onClick={() => onSelect('playful')}
        className={`px-4 py-2 rounded-full text-xs font-black transition-all ${concept === 'playful' ? 'bg-[#FF4761] text-white' : 'hover:bg-rose-50'}`}
      >
        Playful
      </button>
    </div>
  );
};
