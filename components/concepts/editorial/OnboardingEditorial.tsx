import React, { useState } from 'react';

export default function OnboardingEditorial({ onComplete }: { onComplete: () => void }) {
    const [step, setStep] = useState(1);
    const [name, setName] = useState('');
    const [partnerInfo, setPartnerInfo] = useState('');

    const totalSteps = 3;

    return (
        <div className="min-h-screen bg-[#F7FFF7] flex flex-col md:flex-row" style={{ fontFamily: '"Outfit", sans-serif', color: '#292F36' }}>

            {/* Left Side: Editorial Art */}
            <div className="md:w-1/2 p-12 flex flex-col justify-between border-r border-[#4ECDC4]/20 relative overflow-hidden bg-[#E7F5FF]/50">
                <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #4ECDC4 0, #4ECDC4 1px, transparent 0, transparent 50%)', backgroundSize: '20px 20px' }}></div>
                <div className="relative z-10 text-xs uppercase tracking-[0.2em] text-[#FF6B6B] font-bold">
                    Chapter {step} / {totalSteps}
                </div>

                <div className="relative z-10">
                    <h2 className="text-5xl md:text-7xl mb-6 font-bold text-[#292F36]" style={{ fontFamily: '"Quicksand", sans-serif' }}>
                        {step === 1 && "A new\nbeginning."}
                        {step === 2 && "The object\nof your\naffection."}
                        {step === 3 && "Ready to\nembark."}
                    </h2>
                    <div className="w-12 h-[2px] bg-[#FF6B6B] mb-6"></div>
                    <p className="text-gray-500 font-light max-w-sm">
                        {step === 1 && "Details matter. Let us know who is embarking on this journey."}
                        {step === 2 && "Language is a bridge. Tell us who you are building it for."}
                        {step === 3 && "Your personalized curriculum has been meticulously prepared."}
                    </p>
                </div>
            </div>

            {/* Right Side: Flow */}
            <div className="md:w-1/2 p-8 md:p-24 flex flex-col justify-center bg-white relative">
                <div className="max-w-md w-full mx-auto relative h-[400px]">

                    {step === 1 && (
                        <div className="absolute inset-0 animate-fade-in flex flex-col justify-center">
                            <label className="block text-xs uppercase tracking-[0.2em] text-gray-400 mb-8">01. Identification</label>
                            <h3 className="text-3xl mb-12 font-bold text-[#292F36]" style={{ fontFamily: '"Quicksand", sans-serif' }}>What should we call you?</h3>

                            <input
                                type="text"
                                placeholder="Your full name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                autoFocus
                                className="w-full bg-transparent border-b border-gray-200 py-4 text-2xl font-light focus:outline-none focus:border-[#FF6B6B] transition-colors placeholder-gray-300 mb-12"
                            />

                            <button
                                onClick={() => setStep(2)}
                                disabled={!name}
                                className="w-full bg-[#292F36] text-white py-5 uppercase tracking-[0.2em] text-xs hover:bg-black transition disabled:opacity-30 disabled:hover:bg-[#292F36]"
                            >
                                Proceed
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="absolute inset-0 animate-fade-in flex flex-col justify-center">
                            <label className="block text-xs uppercase tracking-[0.2em] text-gray-400 mb-8">02. Connection</label>
                            <h3 className="text-3xl mb-12 font-bold text-[#292F36]" style={{ fontFamily: '"Quicksand", sans-serif' }}>Who are you learning for?</h3>

                            <input
                                type="text"
                                placeholder="Their name"
                                value={partnerInfo}
                                onChange={(e) => setPartnerInfo(e.target.value)}
                                autoFocus
                                className="w-full bg-transparent border-b border-gray-200 py-4 text-2xl font-light focus:outline-none focus:border-[#4ECDC4] transition-colors placeholder-gray-300 mb-12"
                            />

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setStep(1)}
                                    className="w-1/3 bg-transparent border border-gray-300 text-gray-600 py-5 uppercase tracking-[0.2em] text-xs hover:bg-gray-50 transition"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={() => setStep(3)}
                                    disabled={!partnerInfo}
                                    className="w-2/3 bg-[#292F36] text-white py-5 uppercase tracking-[0.2em] text-xs hover:bg-black transition disabled:opacity-30 disabled:hover:bg-[#292F36]"
                                >
                                    Proceed
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="absolute inset-0 animate-fade-in flex flex-col justify-center text-center">
                            <div className="w-20 h-20 mx-auto rounded-full border border-[#4ECDC4]/30 flex items-center justify-center mb-8 bg-[#E7F5FF]">
                                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-2xl font-bold text-[#FF6B6B]" style={{ fontFamily: '"Quicksand", sans-serif' }}>
                                    {name.charAt(0)}{partnerInfo.charAt(0)}
                                </div>
                            </div>

                            <h3 className="text-3xl mb-4 font-bold text-[#292F36]" style={{ fontFamily: '"Quicksand", sans-serif' }}>The stage is set.</h3>
                            <p className="text-gray-500 font-light mb-12">
                                Your profile has been tailored. A world of words awaits <span className="text-[#FF6B6B] font-medium">{name}</span> and <span className="text-[#4ECDC4] font-medium">{partnerInfo}</span>.
                            </p>

                            <button
                                onClick={onComplete}
                                className="w-full bg-[#FF6B6B] text-white py-5 uppercase tracking-[0.2em] text-xs hover:bg-[#ff5252] transition"
                            >
                                Enter Love Languages
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
