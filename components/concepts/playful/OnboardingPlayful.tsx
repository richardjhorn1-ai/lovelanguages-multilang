import React, { useState } from 'react';

export default function OnboardingPlayful({ onComplete }: { onComplete: () => void }) {
    const [step, setStep] = useState(1);
    const [name, setName] = useState('');
    const [partnerInfo, setPartnerInfo] = useState('');

    const [shake, setShake] = useState(false);

    const totalSteps = 3;

    const handleNext = () => {
        if (step === 1 && !name) { triggerShake(); return; }
        if (step === 2 && !partnerInfo) { triggerShake(); return; }
        setStep(s => Math.min(s + 1, totalSteps));
    };

    const triggerShake = () => {
        setShake(true);
        setTimeout(() => setShake(false), 500);
    };

    return (
        <div className="min-h-screen bg-[#F7FFF7] text-[#292F36] flex flex-col items-center p-4 md:p-8" style={{ fontFamily: '"Outfit", sans-serif' }}>

            {/* Top Navbar */}
            <div className="w-full max-w-2xl flex items-center justify-between mb-8">
                <div className="w-12 h-12 bg-[#FF6B6B] border-4 border-[#292F36] rounded-full shadow-[4px_4px_0_#292F36] flex items-center justify-center text-white text-xl">
                    ❤️
                </div>
                <div className="flex-1 mx-4">
                    <div className="h-6 bg-gray-200 border-4 border-[#292F36] rounded-full overflow-hidden shadow-[inset_0_-4px_0_rgba(0,0,0,0.1)]">
                        <div
                            className="h-full bg-[#FFE66D] transition-all duration-300 border-r-4 border-[#292F36]"
                            style={{ width: `${(step / totalSteps) * 100}%` }}
                        >
                            <div className="w-full h-full bg-white/30 rounded-t-full"></div>
                        </div>
                    </div>
                </div>
                <div className="w-12 h-12 bg-white border-4 border-[#292F36] rounded-full shadow-[4px_4px_0_#292F36] flex items-center justify-center text-xl font-black">
                    {step}
                </div>
            </div>

            {/* Main Card */}
            <div className={`w-full max-w-xl bg-white border-4 border-[#292F36] rounded-3xl p-8 md:p-12 shadow-[12px_12px_0_#292F36] mt-8 ${shake ? 'animate-shake' : ''}`}>

                {step === 1 && (
                    <div className="text-center">
                        <div className="text-8xl mb-6">👋</div>
                        <h2 className="text-4xl md:text-5xl font-black uppercase mb-4" style={{ fontFamily: '"Quicksand", sans-serif' }}>What's your name?</h2>
                        <p className="text-xl font-bold text-gray-500 mb-8 border-b-4 border-dashed border-[#4ECDC4] inline-block pb-2">We need it for your profile!</p>

                        <input
                            type="text"
                            placeholder="ENTER NAME"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-[#E7F5FF] border-4 border-[#292F36] rounded-2xl py-6 px-6 font-black text-3xl uppercase text-center placeholder-gray-400 focus:outline-none focus:bg-[#FFF0F3] transition-colors shadow-[6px_6px_0_#292F36] mb-8"
                            autoFocus
                        />

                        <button
                            onClick={handleNext}
                            className="w-full bg-[#4ECDC4] border-4 border-[#292F36] text-[#292F36] font-black text-2xl py-5 rounded-2xl uppercase hover:-translate-y-2 hover:shadow-[6px_10px_0_#292F36] active:translate-y-0 active:shadow-[2px_2px_0_#292F36] transition-all shadow-[6px_6px_0_#292F36]"
                        >
                            Continue!
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div className="text-center">
                        <div className="text-8xl mb-6">💖</div>
                        <h2 className="text-4xl md:text-5xl font-black uppercase mb-4" style={{ fontFamily: '"Quicksand", sans-serif' }}>Who's your partner?</h2>
                        <p className="text-xl font-bold text-gray-500 mb-8 border-b-4 border-dashed border-[#FF6B6B] inline-block pb-2">So we can link your accounts.</p>

                        <input
                            type="text"
                            placeholder="THEIR NAME"
                            value={partnerInfo}
                            onChange={(e) => setPartnerInfo(e.target.value)}
                            className="w-full bg-[#FFF0F3] border-4 border-[#292F36] rounded-2xl py-6 px-6 font-black text-3xl uppercase text-center placeholder-gray-400 focus:outline-none focus:bg-[#FFE66D] transition-colors shadow-[6px_6px_0_#292F36] mb-8"
                            autoFocus
                        />

                        <div className="flex gap-4">
                            <button
                                onClick={() => setStep(1)}
                                className="w-20 bg-gray-200 border-4 border-[#292F36] text-[#292F36] font-black text-2xl py-5 rounded-2xl uppercase hover:-translate-y-2 hover:shadow-[6px_10px_0_#292F36] active:translate-y-0 active:shadow-[2px_2px_0_#292F36] transition-all shadow-[6px_6px_0_#292F36]"
                            >
                                ←
                            </button>
                            <button
                                onClick={handleNext}
                                className="flex-1 bg-[#FF6B6B] border-4 border-[#292F36] text-white font-black text-2xl py-5 rounded-2xl uppercase hover:-translate-y-2 hover:shadow-[6px_10px_0_#292F36] active:translate-y-0 active:shadow-[2px_2px_0_#292F36] transition-all shadow-[6px_6px_0_#292F36]"
                            >
                                Continue!
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="text-center">

                        <div className="flex justify-center -space-x-4 mb-8">
                            <div className="w-24 h-24 bg-[#FF6B6B] border-4 border-[#292F36] rounded-full flex items-center justify-center font-black text-3xl text-white shadow-[4px_4px_0_#292F36] z-10 -rotate-12">
                                {name.charAt(0) || '?'}
                            </div>
                            <div className="w-24 h-24 bg-[#4ECDC4] border-4 border-[#292F36] rounded-full flex items-center justify-center font-black text-3xl text-[#292F36] shadow-[4px_4px_0_#292F36] rotate-12">
                                {partnerInfo.charAt(0) || '?'}
                            </div>
                        </div>

                        <h2 className="text-4xl md:text-5xl font-black uppercase mb-4 text-[#FFE66D]" style={{ fontFamily: '"Quicksand", sans-serif', WebkitTextStroke: '2px #292F36' }}>
                            YOU'RE READY!
                        </h2>
                        <p className="text-xl font-bold text-gray-500 mb-8 border-b-4 border-dashed border-gray-300 inline-block pb-2">
                            Time to start learning together.
                        </p>

                        <button
                            onClick={onComplete}
                            className="w-full bg-[#FFE66D] border-4 border-[#292F36] text-[#292F36] font-black text-2xl py-6 rounded-2xl uppercase hover:-translate-y-2 hover:shadow-[6px_10px_0_#292F36] active:translate-y-0 active:shadow-[2px_2px_0_#292F36] transition-all shadow-[6px_6px_0_#292F36] animate-pulse"
                        >
                            START LEARNING! 🚀
                        </button>
                    </div>
                )}

            </div>

            <style>{`
        .animate-shake {
          animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
        @keyframes shake {
          10%, 90% { transform: translate3d(-2px, 0, 0); }
          20%, 80% { transform: translate3d(4px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-8px, 0, 0); }
          40%, 60% { transform: translate3d(8px, 0, 0); }
        }
      `}</style>
        </div>
    );
}
