import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { COLORS } from '../constants/colors';
import { FloatingHearts } from '../components/FloatingHearts';
import { Caption } from '../components/Caption';
import { AnimatedGradient } from '../components/AnimatedGradient';
import { CameraZoom, CameraKeyframe } from '../components/CameraZoom';
import { BeatPulse } from '../components/BeatPulse';
import { PhoneWithRole } from '../components/PhoneWithRole';
import { TapRipple } from '../components/TapRipple';
import { ChatScreen } from '../components/screens/ChatScreen';

// Camera path - no vertical panning (8.5s = 255 frames)
const CAMERA_PATH: CameraKeyframe[] = [
  { frame: 0, zoom: 1, focusX: 50, focusY: 50 },
  { frame: 255, zoom: 1, focusX: 50, focusY: 50 },
];

// Chat messages appearing progressively (10s = 300 frames)
const MESSAGES = [
  { type: 'user' as const, text: 'How do I say "I miss you" in Spanish?', delay: 40 },
  { type: 'ai' as const, text: 'Based on your vocabulary, you already know this one! 🎉', delay: 100 },
  { type: 'ai-highlight' as const, word: 'Te extraño', translation: 'I miss you', delay: 140 },
  { type: 'ai' as const, text: "You learned this as a gift from your partner last week. Want to practice using it in a sentence?", delay: 200 },
];

// Context badge items
const CONTEXT_ITEMS = [
  { icon: '📚', label: '42 words learned' },
  { icon: '💝', label: '12 gifted words' },
  { icon: '🎯', label: 'Conversational 2' },
];

// Scene phases
const TAP_CHAT_NAV = 20;
const USER_MESSAGE = 40;
const TYPING_START = 80;
const AI_HIGHLIGHT_REVEAL = 140;

export const Scene8AIChat: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bgPrimary,
        overflow: 'hidden',
      }}
    >
      <AnimatedGradient style="aurora" />

      <CameraZoom style="path" keyframes={CAMERA_PATH}>
        <AbsoluteFill
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            paddingTop: 340,
          }}
        >
          <FloatingHearts count={10} />

          {/* Caption */}
          <Caption
            text="AI That Knows Your Journey"
            subtext="The AI knows what you've learned together"
            startFrame={10}
            position="top"
            style="highlight"
          />

          {/* Phone with Chat */}
          <PhoneWithRole
            role="student"
            partnerName="Student"
            targetLanguage="Spanish"
            scale={2.25}
            startFrame={0}
            glowIntensity={0.5}
          >
            <div style={{ position: 'relative', height: '100%' }}>
              <ChatScreen
                messages={MESSAGES}
                contextBadges={CONTEXT_ITEMS}
                targetLanguage="Spanish"
                startFrame={0}
              />

              {/* Tap on Chat nav (assuming there's a chat button) */}
              <TapRipple x={50} y={95} startFrame={TAP_CHAT_NAV} color={COLORS.accentPink} />

              {/* Tap to send message */}
              <TapRipple x={85} y={92} startFrame={USER_MESSAGE - 5} color={COLORS.accentPink} />
            </div>
          </PhoneWithRole>
        </AbsoluteFill>
      </CameraZoom>

      {/* Beat pulse when AI reveals the word */}
      <BeatPulse startFrame={AI_HIGHLIGHT_REVEAL} color={COLORS.accentPink} intensity={0.5} />
    </AbsoluteFill>
  );
};
