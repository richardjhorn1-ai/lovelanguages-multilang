
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { ICONS } from '../constants';
import { DEFAULT_THEME, applyTheme } from '../services/theme';
import { GameShowcase } from './hero/GameShowcase';

type HeroRole = 'student' | 'tutor';

// Fixed brand colors for landing page
const BRAND = {
  primary: '#FF4761',
  primaryHover: '#E63E56',
  light: '#FFF0F3',
  border: '#FECDD3',
  shadow: 'rgba(255, 71, 97, 0.25)',
  teal: '#14b8a6',
  tealHover: '#0d9488',
  tealLight: '#ccfbf1',
  tealShadow: 'rgba(20, 184, 166, 0.25)',
};

// CSS Keyframe animations (injected once)
const ANIMATION_STYLES = `
  @keyframes reveal-up {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes underline-draw {
    from { transform: scaleX(0); }
    to { transform: scaleX(1); }
  }

  @keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
  }

  .section-content > * {
    opacity: 0;
  }

  .section-content.visible > *:nth-child(1) {
    animation: reveal-up 0.6s ease-out forwards;
  }

  .section-content.visible > *:nth-child(2) {
    animation: reveal-up 0.6s ease-out 0.1s forwards;
  }

  .section-content.visible > *:nth-child(3) {
    animation: reveal-up 0.6s ease-out 0.2s forwards;
  }

  .section-content.visible > *:nth-child(4) {
    animation: reveal-up 0.6s ease-out 0.3s forwards;
  }

  .section-content.visible > *:nth-child(5) {
    animation: reveal-up 0.6s ease-out 0.4s forwards;
  }

  .typewriter-cursor {
    animation: blink 0.8s infinite;
    font-weight: 100;
  }
`;


// Highlight component for colored keywords - SUBTLE glow
const Highlight: React.FC<{
  children: React.ReactNode;
  isStudent: boolean;
  glow?: boolean;
  underline?: boolean;
}> = ({ children, isStudent, glow, underline }) => (
  <span
    className="transition-all duration-300 relative inline"
    style={{
      color: isStudent ? BRAND.primary : BRAND.teal,
      textShadow: glow
        ? `0 0 20px ${isStudent ? 'rgba(255, 71, 97, 0.25)' : 'rgba(20, 184, 166, 0.25)'}`
        : 'none',
      fontWeight: 'inherit',
    }}
  >
    {children}
    {underline && (
      <span
        className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full"
        style={{
          background: `linear-gradient(90deg, ${isStudent ? BRAND.primary : BRAND.teal}, ${isStudent ? '#FF6B81' : '#2dd4bf'})`,
          animation: 'underline-draw 0.8s ease-out 0.3s forwards',
          transformOrigin: 'left',
          transform: 'scaleX(0)',
        }}
      />
    )}
  </span>
);

// Helper to render text with multiple highlights
const renderWithHighlights = (
  text: string,
  highlights: string[],
  isStudent: boolean,
  underlinedPhrase?: string
): React.ReactNode => {
  if (!highlights.length && !underlinedPhrase) return text;

  // Build regex pattern for all highlights
  const allPatterns = [...highlights];
  if (underlinedPhrase && !highlights.includes(underlinedPhrase)) {
    allPatterns.push(underlinedPhrase);
  }

  // Sort by length (longest first) to avoid partial matches
  allPatterns.sort((a, b) => b.length - a.length);

  // Escape special regex characters
  const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`(${allPatterns.map(escapeRegex).join('|')})`, 'gi');

  const parts = text.split(pattern);

  return parts.map((part, i) => {
    const isHighlight = allPatterns.some(h => h.toLowerCase() === part.toLowerCase());
    const isUnderlined = underlinedPhrase && part.toLowerCase() === underlinedPhrase.toLowerCase();

    if (isHighlight) {
      return (
        <Highlight key={i} isStudent={isStudent} glow underline={isUnderlined}>
          {part}
        </Highlight>
      );
    }
    return part;
  });
};

// Interactive floating hearts with physics
interface Heart {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseSpeed: number; // Each heart has its own natural float speed
  wobbleOffset: number; // For organic horizontal drift
  size: number;
  opacity: number;
}

const InteractiveHearts: React.FC<{
  accentColor: string;
  activeSection: number;
  containerRef: React.RefObject<HTMLDivElement>;
}> = ({ accentColor, activeSection, containerRef }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heartsRef = useRef<Heart[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000, active: false });
  const clickImpulseRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const animationRef = useRef<number>();

  // Calculate heart count based on section (starts with 20, increases by 10 each section)
  const heartCount = 20 + activeSection * 10;

  // Initialize or update hearts when count changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const currentHearts = heartsRef.current;

    // Add new hearts if needed
    while (currentHearts.length < heartCount) {
      currentHearts.push({
        id: currentHearts.length,
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: 0,
        vy: 0,
        baseSpeed: 0.8 + Math.random() * 1.2, // Each heart floats at its own pace (0.8-2.0)
        wobbleOffset: Math.random() * Math.PI * 2, // Random starting phase for wobble
        size: 10 + Math.random() * 14,
        opacity: 0.15 + Math.random() * 0.25,
      });
    }
  }, [heartCount]);

  // Handle mouse/touch movement
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        active: true,
      };
    };

    const handleTouchMove = (e: TouchEvent) => {
      const rect = container.getBoundingClientRect();
      const touch = e.touches[0];
      mouseRef.current = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
        active: true,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    const handleClick = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      clickImpulseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        time: Date.now(),
      };
    };

    const handleTouchStart = (e: TouchEvent) => {
      const rect = container.getBoundingClientRect();
      const touch = e.touches[0];
      clickImpulseRef.current = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
        time: Date.now(),
      };
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('touchmove', handleTouchMove);
    container.addEventListener('mouseleave', handleMouseLeave);
    container.addEventListener('touchend', handleMouseLeave);
    container.addEventListener('click', handleClick);
    container.addEventListener('touchstart', handleTouchStart);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      container.removeEventListener('touchend', handleMouseLeave);
      container.removeEventListener('click', handleClick);
      container.removeEventListener('touchstart', handleTouchStart);
    };
  }, [containerRef]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize canvas to match container
    const resizeCanvas = () => {
      const container = containerRef.current;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let time = 0;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.016; // Approximate 60fps time step

      const hearts = heartsRef.current;
      const mouse = mouseRef.current;
      const clickImpulse = clickImpulseRef.current;

      // Apply click impulse to all hearts (pushes them away from click point)
      if (clickImpulse && Date.now() - clickImpulse.time < 100) {
        hearts.forEach((heart) => {
          const dx = heart.x - clickImpulse.x;
          const dy = heart.y - clickImpulse.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 300 && distance > 0) { // Impulse radius
            const force = 15 * (1 - distance / 300); // Strong push, fades with distance
            heart.vx += (dx / distance) * force;
            heart.vy += (dy / distance) * force;
          }
        });
        // Clear impulse after applying
        if (Date.now() - clickImpulse.time >= 50) {
          clickImpulseRef.current = null;
        }
      }

      hearts.forEach((heart) => {
        // Check if mouse is attracting this heart
        let isAttracted = false;

        if (mouse.active) {
          const dx = mouse.x - heart.x;
          const dy = mouse.y - heart.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 200) { // Attraction radius
            isAttracted = true;
            const force = 0.3 * (1 - distance / 200); // Stronger when closer
            heart.vx += (dx / distance) * force;
            heart.vy += (dy / distance) * force;
          }
        }

        if (isAttracted) {
          // When attracted, apply velocity with damping
          heart.vx *= 0.95;
          heart.vy *= 0.95;

          // Limit velocity when attracted
          const maxSpeed = 4;
          const speed = Math.sqrt(heart.vx * heart.vx + heart.vy * heart.vy);
          if (speed > maxSpeed) {
            heart.vx = (heart.vx / speed) * maxSpeed;
            heart.vy = (heart.vy / speed) * maxSpeed;
          }

          heart.x += heart.vx;
          heart.y += heart.vy;
        } else {
          // Natural balloon floating - gentle and organic
          // Horizontal wobble like a balloon drifting
          const wobble = Math.sin(time * 1.5 + heart.wobbleOffset) * 0.3;

          // Gradually return vx/vy to natural state
          heart.vx *= 0.92;
          heart.vy *= 0.92;

          // Apply natural upward float + wobble + any residual velocity
          heart.x += wobble + heart.vx;
          heart.y += -heart.baseSpeed + heart.vy;
        }

        // When heart exits top, respawn at bottom
        if (heart.y < -heart.size * 2) {
          heart.y = canvas.height + heart.size + Math.random() * 50;
          heart.x = Math.random() * canvas.width;
          heart.vx = 0;
          heart.vy = 0;
          heart.wobbleOffset = Math.random() * Math.PI * 2; // New wobble phase
        }

        // Keep hearts within horizontal bounds (gentle wrap)
        if (heart.x < -heart.size) {
          heart.x = canvas.width + heart.size;
        }
        if (heart.x > canvas.width + heart.size) {
          heart.x = -heart.size;
        }

        // Draw heart
        ctx.save();
        ctx.translate(heart.x, heart.y);
        ctx.globalAlpha = heart.opacity;
        ctx.fillStyle = accentColor;
        ctx.font = `${heart.size}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('♥', 0, 0);
        ctx.restore();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [accentColor, containerRef]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0"
      style={{ width: '100%', height: '100%' }}
    />
  );
};

// Section content - plain data, highlighting applied in component
interface SectionContent {
  headline: string;
  headlineHighlights: string[]; // Words to highlight in headline
  subhead?: string;
  copy: string;
  copyHighlights?: string[]; // Words to highlight in copy
  underlinedPhrase?: string; // Phrase to underline
}

// Section content for both arcs
const STUDENT_SECTIONS: SectionContent[] = [
  {
    headline: "Learn the words that matter—not the ones in textbooks.",
    headlineHighlights: ["words that matter"],
    subhead: "The ones they only use with people they love.",
    copy: "The songs they grew up with. The phrases their grandmother used. The way they say goodnight when it's just you two. This is the Polish that matters—and it's waiting for you.",
    copyHighlights: ["grandmother", "just you two", "waiting for you"],
    underlinedPhrase: "This is the Polish that matters",
  },
  {
    headline: "There's a conversation you're not part of. Yet.",
    headlineHighlights: ["Yet"],
    copy: "The laughter that doesn't translate. The phone calls you can't follow. The part of their life that's still just theirs. That 'yet' is what we're here for.",
    copyHighlights: ["their life", "we're here for"],
    underlinedPhrase: "That 'yet' is what we're here for",
  },
  {
    headline: "You're not learning Polish. You're learning them.",
    headlineHighlights: ["learning them"],
    copy: "Their words. Their world. Their way of saying 'I love you.' This isn't about passing a test—it's about passing the dinner table. Built for people who are learning for love.",
    copyHighlights: ["Their words", "Their world", "learning for love"],
    underlinedPhrase: "it's about passing the dinner table",
  },
  {
    headline: "Every word you learn is a little act of love.",
    headlineHighlights: ["love"],
    copy: "This isn't homework. It's not about grammar tests or streaks. Every word you learn is a step deeper into their world. A way of saying: I love you enough to meet you where you are.",
    copyHighlights: ["their world", "I love you"],
    underlinedPhrase: "I love you enough to meet you where you are",
  },
  {
    headline: "Imagine the look on their face.",
    headlineHighlights: ["their face"],
    copy: "The first time you get the joke without asking. The first 'kocham cię' that actually lands. The moment their mom realizes she can talk to you directly. These moments are coming. Every word brings them closer.",
    copyHighlights: ["kocham cię", "mom", "closer"],
  },
  {
    headline: "Learn together. Love together. Laugh together.",
    headlineHighlights: ["together", "Love", "Laugh"],
    copy: "They'll send you words that matter. Challenge you to little games. Celebrate when you nail it. This isn't you studying alone—it's the two of you, building something only you share.",
    copyHighlights: ["words that matter", "two of you"],
    underlinedPhrase: "building something only you share",
  },
];

const TUTOR_SECTIONS: SectionContent[] = [
  {
    headline: "They love you. Now help them love your language too.",
    headlineHighlights: ["love", "your language"],
    copy: "Your words. Your songs. Your grandmother's phrases that don't quite translate. There's so much of you wrapped up in Polish—and someone who loves you wants in.",
    copyHighlights: ["Your words", "Your songs", "grandmother's", "wants in"],
  },
  {
    headline: "Some things just don't translate. Yet.",
    headlineHighlights: ["translate", "Yet"],
    copy: "The joke that kills at family dinner but falls flat in English. The lullaby you grew up with. The way Polish says 'I love you' differently depending on who's saying it. You've tried to explain. Now let them actually learn.",
    copyHighlights: ["family dinner", "lullaby", "I love you"],
  },
  {
    headline: "Teaching them is how you bring them into your world.",
    headlineHighlights: ["your world"],
    copy: "Not lesson plans. Not grammar drills. Just sharing the words that matter to you—and watching them light up when they get it. Every word you teach is an invitation deeper into your life.",
    copyHighlights: ["light up", "invitation"],
    underlinedPhrase: "words that matter to you",
  },
  {
    headline: "Send a word. Start a game. Watch them grow.",
    headlineHighlights: ["game", "grow"],
    copy: "Challenge them to learn your mom's favorite phrase. Send them words for your next family dinner. Celebrate when they nail the pronunciation. This is couples time disguised as learning.",
    copyHighlights: ["mom's favorite phrase", "family dinner"],
    underlinedPhrase: "couples time disguised as learning",
  },
  {
    headline: "The first time they make your family laugh? That's the moment.",
    headlineHighlights: ["family laugh", "the moment"],
    copy: "When they finally get the joke. When your mom starts talking to them directly. When they surprise you with a phrase you never taught them. You gave them that. You opened the door.",
    copyHighlights: ["mom", "opened the door"],
  },
  {
    headline: "Teach together. Play together. Fall deeper in love.",
    headlineHighlights: ["together", "love"],
    copy: "Every word you share brings them closer to your world—and closer to you. This isn't about being their teacher. It's about being their guide into everything that makes you, you.",
    copyHighlights: ["closer to your world", "closer to you"],
    underlinedPhrase: "everything that makes you, you",
  },
];

// Context-aware login form content
const STUDENT_CONTEXTS = [
  { header: "Ready to meet them?", cta: "Start learning", subtext: "Free forever. 2 minutes to start." },
  { header: "We've got you", cta: "Start learning", subtext: "No more fake laughing." },
  { header: "Built for lovers", cta: "Try it free", subtext: "Not tourists. Family." },
  { header: "Make it count", cta: "Begin your journey", subtext: "Every word matters." },
  { header: "Make it happen", cta: "Start now", subtext: "That moment is coming." },
  { header: "Start together", cta: "Create your world", subtext: "They're waiting for you." },
];

const TUTOR_CONTEXTS = [
  { header: "Share your world", cta: "Start guiding", subtext: "Free forever. 2 minutes to start." },
  { header: "Let them in", cta: "Start guiding", subtext: "Some things translate better when learned." },
  { header: "Teach with love", cta: "Begin", subtext: "Not lessons. Love letters." },
  { header: "Make it fun", cta: "Start playing", subtext: "Games, challenges, surprises." },
  { header: "Open the door", cta: "Start now", subtext: "That moment is coming." },
  { header: "Grow together", cta: "Become their guide", subtext: "They're ready for you." },
];

// Section component
const Section: React.FC<{
  headline: string;
  headlineHighlights: string[];
  subhead?: string;
  copy: string;
  copyHighlights?: string[];
  underlinedPhrase?: string;
  index: number;
  isStudent: boolean;
  isVisible: boolean;
}> = ({ headline, headlineHighlights, subhead, copy, copyHighlights, underlinedPhrase, index, isStudent, isVisible }) => {
  const accentColor = isStudent ? BRAND.primary : BRAND.teal;

  return (
    <section
      data-section={index}
      className="min-h-screen snap-start flex flex-col justify-center px-8 md:px-16 lg:px-24 py-20 relative z-10"
    >
      <div className={`max-w-xl section-content ${isVisible ? 'visible' : ''}`}>
        {/* Show logo only on first section */}
        {index === 0 && (
          <div className="flex items-center gap-3 mb-10">
            <div
              className="p-2.5 rounded-xl shadow-lg"
              style={{ backgroundColor: accentColor, boxShadow: `0 10px 20px -5px ${isStudent ? BRAND.shadow : BRAND.tealShadow}` }}
            >
              <ICONS.Heart className="text-white fill-white w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black font-header tracking-tight" style={{ color: accentColor }}>
              Love Languages
            </h1>
          </div>
        )}

        <h2
          className="text-3xl md:text-4xl lg:text-5xl font-black leading-[1.1] mb-5 tracking-tight"
          style={{ color: '#1a1a2e' }}
        >
          {renderWithHighlights(headline, headlineHighlights, isStudent)}
        </h2>

        {subhead && (
          <p className="text-lg md:text-xl mb-6 font-semibold italic" style={{ color: accentColor }}>
            {subhead}
          </p>
        )}

        <p className="text-base md:text-lg leading-relaxed font-medium" style={{ color: '#4b5563' }}>
          {renderWithHighlights(copy, copyHighlights || [], isStudent, underlinedPhrase)}
        </p>

        {/* Visual accent bar */}
        <div
          className="mt-10 h-1.5 w-24 rounded-full"
          style={{ backgroundColor: accentColor, opacity: 0.3 }}
        />
      </div>
    </section>
  );
};

// Login form component
const LoginForm: React.FC<{
  context: { header: string; cta: string; subtext: string };
  isStudent: boolean;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  loading: boolean;
  isSignUp: boolean;
  setIsSignUp: (v: boolean) => void;
  message: string;
  onSubmit: (e: React.FormEvent) => void;
}> = ({ context, isStudent, email, setEmail, password, setPassword, loading, isSignUp, setIsSignUp, message, onSubmit }) => {
  const accentColor = isStudent ? BRAND.primary : BRAND.teal;
  const accentHover = isStudent ? BRAND.primaryHover : BRAND.tealHover;
  const accentShadow = isStudent ? BRAND.shadow : BRAND.tealShadow;
  const accentBorder = isStudent ? BRAND.border : BRAND.tealLight;

  return (
    <div className="w-full max-w-md relative z-10">
      <div className="text-center mb-12">
        <h3
          className="text-3xl md:text-4xl font-black mb-3 font-header transition-all duration-300"
          style={{ color: '#1a1a2e' }}
        >
          {context.header}
        </h3>
        <p className="font-semibold text-base transition-all duration-300" style={{ color: '#9ca3af' }}>
          {context.subtext}
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label className="block text-[11px] font-black uppercase tracking-[0.2em] mb-3 ml-1" style={{ color: '#9ca3af' }}>
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-6 py-5 rounded-2xl bg-[#1a1a2e] text-white border-2 border-transparent focus:outline-none transition-all placeholder:text-gray-500 font-bold text-base"
            onFocus={(e) => e.target.style.borderColor = accentColor}
            onBlur={(e) => e.target.style.borderColor = 'transparent'}
            placeholder="you@love.com"
          />
        </div>
        <div>
          <label className="block text-[11px] font-black uppercase tracking-[0.2em] mb-3 ml-1" style={{ color: '#9ca3af' }}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-6 py-5 rounded-2xl bg-[#1a1a2e] text-white border-2 border-transparent focus:outline-none transition-all placeholder:text-gray-500 font-bold text-base"
            onFocus={(e) => e.target.style.borderColor = accentColor}
            onBlur={(e) => e.target.style.borderColor = 'transparent'}
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full text-white font-black py-5 rounded-[2rem] shadow-2xl transition-all duration-300 active:scale-[0.98] disabled:opacity-50 text-base uppercase tracking-[0.15em] mt-4 hover:scale-[1.02]"
          style={{ backgroundColor: accentColor, boxShadow: `0 20px 40px -10px ${accentShadow}` }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = accentHover}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = accentColor}
        >
          {loading ? 'Entering...' : context.cta}
        </button>
      </form>

      {message && (
        <div className={`mt-6 p-5 rounded-2xl text-sm font-bold text-center ${message.includes('Check') || message.includes('check') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message}
        </div>
      )}

      <div className="mt-10 text-center">
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-sm font-black uppercase tracking-widest transition-all hover:opacity-70"
          style={{ color: accentColor }}
        >
          {isSignUp ? 'Already have an account? Sign in' : "New here? Create an account"}
        </button>
      </div>
    </div>
  );
};

// Main Hero component
const Hero: React.FC = () => {
  // Inject animation styles once
  useEffect(() => {
    const styleId = 'hero-animations';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = ANIMATION_STYLES;
      document.head.appendChild(style);
    }
    applyTheme(DEFAULT_THEME);
  }, []);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedRole, setSelectedRole] = useState<HeroRole>('student');
  const [activeSection, setActiveSection] = useState(0);
  const [visibleSections, setVisibleSections] = useState<Set<number>>(new Set([0]));
  const scrollRef = useRef<HTMLDivElement>(null);

  // Intersection Observer to track visible section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-section'));
            if (!isNaN(index)) {
              setActiveSection(index);
              // Track which sections have been seen (for animations)
              setVisibleSections(prev => new Set([...prev, index]));
            }
          }
        });
      },
      {
        threshold: 0.5,
        root: scrollRef.current
      }
    );

    // Observe all sections
    const sections = scrollRef.current?.querySelectorAll('[data-section]');
    sections?.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, [selectedRole]);

  // Reset visible sections when role changes
  useEffect(() => {
    setVisibleSections(new Set([0]));
  }, [selectedRole]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { error } = isSignUp
      ? await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { intended_role: selectedRole }
          }
        })
      : await supabase.auth.signInWithPassword({ email, password });

    if (error) setMessage(error.message);
    else if (isSignUp) setMessage('Check your email for confirmation!');

    setLoading(false);
  };

  const sections = selectedRole === 'student' ? STUDENT_SECTIONS : TUTOR_SECTIONS;
  const contexts = selectedRole === 'student' ? STUDENT_CONTEXTS : TUTOR_CONTEXTS;
  const currentContext = contexts[activeSection] || contexts[0];
  const isStudent = selectedRole === 'student';
  const accentColor = isStudent ? BRAND.primary : BRAND.teal;
  const accentShadow = isStudent ? BRAND.shadow : BRAND.tealShadow;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundColor: '#FFF0F3',
        color: '#1a1a2e',
        // Prevent inherited CSS variables from affecting this component
        isolation: 'isolate'
      }}
    >
      {/* Mobile: Login form first */}
      <div
        className="md:hidden flex flex-col items-center justify-center p-6 pt-8 rounded-b-[3rem] shadow-xl relative overflow-hidden"
        style={{ backgroundColor: '#ffffff', color: '#1a1a2e' }}
      >
        <ICONS.Heart className="absolute -bottom-16 -right-16 w-48 h-48 opacity-[0.03] pointer-events-none" style={{ color: '#1a1a2e' }} />

        {/* Mobile Toggle */}
        <div className="w-full mb-6 flex justify-center">
          <div className="flex gap-2">
            <button
              onClick={() => { setSelectedRole('student'); setActiveSection(0); }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold transition-all"
              style={isStudent
                ? { backgroundColor: BRAND.primary, boxShadow: `0 8px 12px -3px ${BRAND.shadow}`, color: '#ffffff' }
                : { backgroundColor: '#f3f4f6', color: '#4b5563' }
              }
            >
              <ICONS.Heart className="w-4 h-4" style={{ color: isStudent ? '#ffffff' : '#4b5563', fill: isStudent ? '#ffffff' : 'none' }} />
              <span>Learn</span>
            </button>
            <button
              onClick={() => { setSelectedRole('tutor'); setActiveSection(0); }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold transition-all"
              style={!isStudent
                ? { backgroundColor: BRAND.teal, boxShadow: `0 8px 12px -3px ${BRAND.tealShadow}`, color: '#ffffff' }
                : { backgroundColor: '#f3f4f6', color: '#4b5563' }
              }
            >
              <ICONS.Sparkles className="w-4 h-4" style={{ color: !isStudent ? '#ffffff' : '#4b5563' }} />
              <span>Teach</span>
            </button>
          </div>
        </div>

        <LoginForm
          context={currentContext}
          isStudent={isStudent}
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          loading={loading}
          isSignUp={isSignUp}
          setIsSignUp={setIsSignUp}
          message={message}
          onSubmit={handleAuth}
        />
      </div>

      {/* Mobile: Scrollable sections below */}
      <div className="md:hidden relative">
        {/* First 3 sections */}
        {sections.slice(0, 3).map((section, i) => (
          <Section
            key={`mobile-${selectedRole}-${i}`}
            {...section}
            index={i}
            isStudent={isStudent}
            isVisible={true}
          />
        ))}

        {/* Game Showcase - after section 3 */}
        <GameShowcase isStudent={isStudent} accentColor={accentColor} />

        {/* Remaining sections */}
        {sections.slice(3).map((section, i) => (
          <Section
            key={`mobile-${selectedRole}-${i + 3}`}
            {...section}
            index={i + 3}
            isStudent={isStudent}
            isVisible={true}
          />
        ))}
      </div>

      {/* Desktop: Split screen layout */}
      <div className="hidden md:flex flex-row flex-1">
        {/* Left: Scrollable sections with background effects */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto snap-y snap-mandatory h-screen relative"
          style={{ scrollBehavior: 'smooth' }}
        >
          {/* Sticky hearts container - stays visible while scrolling */}
          <div className="sticky top-0 h-screen w-full pointer-events-none" style={{ marginBottom: '-100vh' }}>
            {/* Interactive floating hearts */}
            <InteractiveHearts
              accentColor={accentColor}
              activeSection={activeSection}
              containerRef={scrollRef as React.RefObject<HTMLDivElement>}
            />
          </div>

          {/* First 3 sections */}
          {sections.slice(0, 3).map((section, i) => (
            <Section
              key={`desktop-${selectedRole}-${i}`}
              {...section}
              index={i}
              isStudent={isStudent}
              isVisible={visibleSections.has(i)}
            />
          ))}

          {/* Game Showcase - after section 3 */}
          <GameShowcase isStudent={isStudent} accentColor={accentColor} />

          {/* Remaining sections */}
          {sections.slice(3).map((section, i) => (
            <Section
              key={`desktop-${selectedRole}-${i + 3}`}
              {...section}
              index={i + 3}
              isStudent={isStudent}
              isVisible={visibleSections.has(i + 3)}
            />
          ))}
        </div>

        {/* Right: Sticky panel with toggle + login form */}
        <div
          className="flex-1 flex flex-col items-center justify-center p-8 rounded-l-[4rem] shadow-2xl relative overflow-hidden h-screen sticky top-0"
          style={{ backgroundColor: '#ffffff', color: '#1a1a2e' }}
        >
          <ICONS.Heart
            className="absolute -bottom-20 -right-20 w-80 h-80 opacity-[0.03] pointer-events-none transition-colors duration-500"
            style={{ color: accentColor }}
          />

          {/* Section indicator dots */}
          <div className="absolute left-8 top-1/2 -translate-y-1/2 flex flex-col gap-2">
            {sections.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  const section = scrollRef.current?.querySelector(`[data-section="${i}"]`);
                  section?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i === activeSection
                    ? 'scale-150'
                    : 'opacity-30 hover:opacity-60'
                }`}
                style={{ backgroundColor: accentColor }}
                aria-label={`Go to section ${i + 1}`}
              />
            ))}
          </div>

          {/* Toggle above login form */}
          <div className="flex gap-3 mb-8">
            <button
              onClick={() => { setSelectedRole('student'); setActiveSection(0); scrollRef.current?.scrollTo({ top: 0 }); }}
              className="flex items-center gap-3 px-5 py-3 rounded-2xl transition-all duration-300 border-2"
              style={isStudent
                ? { backgroundColor: BRAND.primary, boxShadow: `0 10px 25px -5px ${BRAND.shadow}`, color: '#ffffff', borderColor: 'transparent' }
                : { backgroundColor: '#f9fafb', color: '#6b7280', borderColor: '#e5e7eb' }
              }
            >
              <ICONS.Heart className="w-5 h-5" style={{ color: isStudent ? '#ffffff' : '#9ca3af', fill: isStudent ? '#ffffff' : 'none' }} />
              <span className="font-bold text-sm">Learn</span>
            </button>
            <button
              onClick={() => { setSelectedRole('tutor'); setActiveSection(0); scrollRef.current?.scrollTo({ top: 0 }); }}
              className="flex items-center gap-3 px-5 py-3 rounded-2xl transition-all duration-300 border-2"
              style={!isStudent
                ? { backgroundColor: BRAND.teal, boxShadow: `0 10px 25px -5px ${BRAND.tealShadow}`, color: '#ffffff', borderColor: 'transparent' }
                : { backgroundColor: '#f9fafb', color: '#6b7280', borderColor: '#e5e7eb' }
              }
            >
              <ICONS.Sparkles className="w-5 h-5" style={{ color: !isStudent ? '#ffffff' : '#9ca3af' }} />
              <span className="font-bold text-sm">Teach</span>
            </button>
          </div>

          <LoginForm
            context={currentContext}
            isStudent={isStudent}
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            loading={loading}
            isSignUp={isSignUp}
            setIsSignUp={setIsSignUp}
            message={message}
            onSubmit={handleAuth}
          />
        </div>
      </div>
    </div>
  );
};

export default Hero;
