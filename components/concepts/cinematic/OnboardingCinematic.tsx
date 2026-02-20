import React, { useState } from 'react';

export default function OnboardingCinematic({ onComplete }: { onComplete: () => void }) {
    const [step, setStep] = useState(1);
    const [name, setName] = useState('');
    const [partnerInfo, setPartnerInfo] = useState('');

    const [isTransitioning, setIsTransitioning] = useState(false);

    const totalSteps = 3;

    const handleNext = () => {
        setIsTransitioning(true);
        setTimeout(() => {
            setStep(s => s + 1);
            setIsTransitioning(false);
        }, 400); // Wait for fade-out
    };

    const handlePrev = () => {
        setIsTransitioning(true);
        setTimeout(() => {
            setStep(s => s - 1);
            setIsTransitioning(false);
        }, 400);
    };

    return (
        <div className="min-h-screen bg-[#111316] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden" style={{ fontFamily: '"Outfit", sans-serif' }}>

            {/* Ambient Background Glows */}
            <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#FF6B6B]/20 blur-[150px] mix-blend-screen pointer-events-none"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#4ECDC4]/20 blur-[150px] mix-blend-screen pointer-events-none"></div>

            {/* Top Navigation / Progress */}
            <div className="absolute top-0 left-0 w-full p-8 flex justify-between items-center z-20">
                <div className="text-xl font-bold tracking-widest text-white/80" style={{ fontFamily: '"Quicksand", sans-serif' }}>L<span className="text-[#FF6B6B]">2</span></div>
                <div className="flex gap-2">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="relative h-1 w-12 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className={`absolute top-0 left-0 h-full bg-gradient-to-r from-[#FF6B6B] to-[#FFE66D] transition-all duration-1000 ease-out 
                                ${i < step ? 'w-full' : i === step ? 'w-full animate-pulse' : 'w-0'}`}
                            ></div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div className={`w-full max-w-2xl z-10 transition-all duration-400 ease-in-out ${isTransitioning ? 'opacity-0 scale-95 blur-sm' : 'opacity-100 scale-100 blur-0'}`}>

                {step === 1 && (
                    <div className="flex flex-col items-center text-center">
                        <div className="w-20 h-20 rounded-full bg-[#FF6B6B]/10 flex items-center justify-center mb-10 border border-[#FF6B6B]/30 shadow-[0_0_30px_rgba(255,107,107,0.2)]">
                            <div className="text-3xl">✦</div>
                        </div>
                        <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50" style={{ fontFamily: '"Quicksand", sans-serif' }}>
                            Identify yourself.
                        </h2>
                        <p className="text-gray-400 text-lg mb-16 max-w-md">
                            How should you be known in this shared universe?
                        </p>

                        <input
                            type="text"
                            placeholder="Enter your name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full max-w-md bg-transparent border-b-2 border-white/20 py-4 text-3xl font-light focus:outline-none focus:border-[#FF6B6B] transition-colors text-center placeholder-gray-600 mb-16"
                            autoFocus
                        />

                        <button
                            onClick={handleNext}
                            disabled={!name}
                            className={`px-12 py-4 rounded-full font-bold tracking-widest uppercase transition-all duration-300
                            ${name ? 'bg-white text-[#111316] hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.3)]' : 'bg-white/10 text-white/30 cursor-not-allowed'}`}
                        >
                            Continue
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div className="flex flex-col items-center text-center">
                        <div className="w-20 h-20 rounded-full bg-[#4ECDC4]/10 flex items-center justify-center mb-10 border border-[#4ECDC4]/30 shadow-[0_0_30px_rgba(78,205,196,0.2)]">
                            <div className="text-3xl">✧</div>
                        </div>
                        <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50" style={{ fontFamily: '"Quicksand", sans-serif' }}>
                            Your connection.
                        </h2>
                        <p className="text-gray-400 text-lg mb-16 max-w-md">
                            Who are you crossing the language barrier for?
                        </p>

                        <input
                            type="text"
                            placeholder="Their name"
                            value={partnerInfo}
                            onChange={(e) => setPartnerInfo(e.target.value)}
                            className="w-full max-w-md bg-transparent border-b-2 border-white/20 py-4 text-3xl font-light focus:outline-none focus:border-[#4ECDC4] transition-colors text-center placeholder-gray-600 mb-16"
                            autoFocus
                        />

                        <div className="flex gap-4">
                            <button
                                onClick={handlePrev}
                                className="px-8 py-4 rounded-full font-bold tracking-widest uppercase bg-white/5 text-gray-400 hover:bg-white/10 transition-all"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleNext}
                                disabled={!partnerInfo}
                                className={`px-12 py-4 rounded-full font-bold tracking-widest uppercase transition-all duration-300
                                ${partnerInfo ? 'bg-[#4ECDC4] text-[#111316] hover:scale-105 shadow-[0_0_20px_rgba(78,205,196,0.4)]' : 'bg-white/10 text-white/30 cursor-not-allowed'}`}
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="flex flex-col items-center text-center">

                        {/* Glowing Orb Sequence */}
                        <div className="relative w-40 h-40 mb-12 flex items-center justify-center">
                            <div className="absolute inset-0 bg-gradient-to-r from-[#FF6B6B] to-[#4ECDC4] rounded-full blur-[30px] opacity-60 animate-pulse"></div>
                            <div className="w-24 h-24 bg-black/50 backdrop-blur-md rounded-full border border-white/20 flex items-center justify-center z-10 shadow-inner">
                                <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B6B] to-[#FFE66D]" style={{ fontFamily: '"Quicksand", sans-serif' }}>
                                    {name.charAt(0)}&{partnerInfo.charAt(0)}
                                </span>
                            </div>

                            {/* Orbital animated ring */}
                            <div className="absolute w-40 h-40 rounded-full border border-white/10 border-t-[#4ECDC4]/80 animate-spin" style={{ animationDuration: '3s' }}></div>
                        </div>

                        <h2 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight" style={{ fontFamily: '"Quicksand", sans-serif' }}>
                            Connection Established.
                        </h2>
                        <p className="text-gray-400 text-lg mb-16 max-w-md">
                            Your personalized curriculum has been synced. Prepare to embark.
                        </p>

                        <button
                            onClick={onComplete}
                            className="group relative px-12 py-5 bg-white text-[#111316] rounded-full font-bold tracking-widest uppercase overflow-hidden hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                        >
                            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-[#FF6B6B] to-[#4ECDC4] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                            <span className="relative z-10 group-hover:text-white transition-colors">Enter Application</span>
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
}
