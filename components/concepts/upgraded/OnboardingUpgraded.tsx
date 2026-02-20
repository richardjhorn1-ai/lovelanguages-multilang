import React, { useState } from 'react';
import { ICONS } from '../../../constants';

export default function OnboardingUpgraded({ onComplete }: { onComplete: () => void }) {
    const [step, setStep] = useState(1);
    const [name, setName] = useState('');
    const [partnerInfo, setPartnerInfo] = useState('');

    const totalSteps = 3;
    const progressPercent = (step / totalSteps) * 100;

    return (
        <div className="min-h-screen bg-[#F7FFF7] flex flex-col items-center p-4 md:p-8" style={{ fontFamily: '"Outfit", sans-serif', color: '#292F36' }}>

            {/* Polished Header Navbar */}
            <div className="w-full max-w-2xl flex items-center justify-between mb-8 md:mb-12 pt-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF6B6B] to-[#FFE66D] shadow-sm flex items-center justify-center text-white text-xs">
                        <ICONS.Heart />
                    </div>
                    <span className="font-bold text-lg" style={{ fontFamily: '"Quicksand", sans-serif' }}>Love Languages</span>
                </div>

                {/* Modern Pill Progress */}
                <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-gray-100 shadow-sm">
                    <div className="flex gap-1.5">
                        {[1, 2, 3].map(i => (
                            <div
                                key={i}
                                className={`h-2 rounded-full transition-all duration-500 ${i === step ? 'w-6 bg-[#FF6B6B]' : i < step ? 'w-2 bg-[#FF6B6B]/40' : 'w-2 bg-gray-200'}`}
                            ></div>
                        ))}
                    </div>
                    <span className="text-xs font-bold text-gray-400">{step}/{totalSteps}</span>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="w-full max-w-xl mx-auto flex-1 flex flex-col justify-center pb-24 relative min-h-[400px]">

                {/* Step 1 */}
                {step === 1 && (
                    <div className="absolute inset-x-0 animate-fade-up">
                        <div className="w-16 h-16 mx-auto mb-8 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-center text-3xl">
                            👋
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4" style={{ fontFamily: '"Quicksand", sans-serif' }}>
                            What's your name?
                        </h2>
                        <p className="text-gray-500 text-center mb-10 max-w-sm mx-auto">
                            We'll use this to personalize your learning experience.
                        </p>

                        <input
                            type="text"
                            placeholder="E.g. Richard..."
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoFocus
                            className="w-full max-w-sm mx-auto block bg-white border border-gray-200 rounded-2xl py-5 px-6 font-medium text-xl shadow-sm focus:outline-none focus:border-[#4ECDC4] focus:ring-4 focus:ring-[#4ECDC4]/10 transition-all placeholder-gray-300"
                        />

                        <button
                            onClick={() => setStep(2)}
                            disabled={!name}
                            className="w-full max-w-sm mx-auto mt-10 block bg-[#292F36] disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-5 rounded-2xl transition-all shadow-[0_8px_20px_-6px_rgba(41,47,54,0.3)] hover:shadow-[0_12px_24px_-8px_rgba(41,47,54,0.4)] hover:-translate-y-0.5 disabled:hover:translate-y-0 disabled:shadow-none"
                        >
                            Continue
                        </button>
                    </div>
                )}

                {/* Step 2 */}
                {step === 2 && (
                    <div className="absolute inset-x-0 animate-fade-up">
                        <div className="w-16 h-16 mx-auto mb-8 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-center text-3xl">
                            💕
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4" style={{ fontFamily: '"Quicksand", sans-serif' }}>
                            Who is your partner?
                        </h2>
                        <p className="text-gray-500 text-center mb-10 max-w-sm mx-auto">
                            We'll set up a shared space for both of you.
                        </p>

                        <input
                            type="text"
                            placeholder="Their name..."
                            value={partnerInfo}
                            onChange={(e) => setPartnerInfo(e.target.value)}
                            autoFocus
                            className="w-full max-w-sm mx-auto block bg-white border border-gray-200 rounded-2xl py-5 px-6 font-medium text-xl shadow-sm focus:outline-none focus:border-[#FF6B6B] focus:ring-4 focus:ring-[#FF6B6B]/10 transition-all placeholder-gray-300"
                        />

                        <div className="flex gap-4 max-w-sm mx-auto mt-10">
                            <button
                                onClick={() => setStep(1)}
                                className="w-1/3 bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 font-bold py-5 rounded-2xl transition-all"
                            >
                                Back
                            </button>
                            <button
                                onClick={() => setStep(3)}
                                disabled={!partnerInfo}
                                className="w-2/3 bg-[#FF6B6B] disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-5 rounded-2xl transition-all shadow-[0_8px_20px_-6px_rgba(255,107,107,0.4)] hover:shadow-[0_12px_24px_-8px_rgba(255,107,107,0.5)] hover:-translate-y-0.5 disabled:hover:translate-y-0 disabled:shadow-none"
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3 */}
                {step === 3 && (
                    <div className="absolute inset-x-0 animate-fade-up text-center">

                        <div className="relative w-32 h-32 mx-auto mb-10">
                            <div className="absolute inset-0 bg-[#FFE66D] rounded-full blur-xl opacity-40 animate-pulse"></div>
                            <div className="w-20 h-20 rounded-2xl bg-white shadow-[0_10px_30px_-10px_rgba(0,0,0,0.1)] absolute left-0 top-6 flex items-center justify-center text-2xl font-bold border border-gray-50 rotate-[-10deg]">
                                {name.charAt(0) || '?'}
                            </div>
                            <div className="w-20 h-20 rounded-2xl bg-[#FF6B6B] shadow-[0_10px_30px_-10px_rgba(255,107,107,0.3)] absolute right-0 top-0 flex items-center justify-center text-white text-2xl font-bold rotate-[10deg] z-10">
                                {partnerInfo.charAt(0) || '?'}
                            </div>
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-white rounded-full p-2 shadow-lg z-20">
                                <div className="w-6 h-6 text-[#FF6B6B] animate-bounce"><ICONS.Heart /></div>
                            </div>
                        </div>

                        <h2 className="text-3xl md:text-5xl font-bold mb-6" style={{ fontFamily: '"Quicksand", sans-serif' }}>
                            You're all set!
                        </h2>
                        <p className="text-lg text-gray-600 mb-12 max-w-sm mx-auto">
                            Your shared language journey is ready. Let's start learning together!
                        </p>

                        <button
                            onClick={onComplete}
                            className="w-full max-w-sm mx-auto block bg-[#4ECDC4] text-white font-bold py-5 rounded-2xl text-lg transition-all shadow-[0_8px_20px_-6px_rgba(78,205,196,0.4)] hover:shadow-[0_12px_24px_-8px_rgba(78,205,196,0.5)] hover:-translate-y-0.5"
                        >
                            Start Learning ✨
                        </button>
                    </div>
                )}

            </div>

            <style>{`
        .animate-fade-up {
          animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
        </div>
    );
}
