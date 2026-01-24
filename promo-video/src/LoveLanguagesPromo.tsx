import { AbsoluteFill } from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';

import { Scene1Hero } from './scenes/Scene1-Hero';
import { Scene2Languages } from './scenes/Scene2-Languages';
import { Scene3LoveGifts } from './scenes/Scene3-LoveGifts';
import { Scene4PartnerChallenge } from './scenes/Scene4-PartnerChallenge';
import { Scene5LoveLog } from './scenes/Scene5-LoveLog';
import { Scene6Games } from './scenes/Scene6-Games';
import { Scene7Progress } from './scenes/Scene7-Progress';
import { Scene8AIChat } from './scenes/Scene8-AIChat';
import { Scene6CTA } from './scenes/Scene6-CTA';
import { AudioMix } from './components/AudioMix';

import { SCENES, TRANSITION_FRAMES } from './constants/timing';
import { COLORS } from './constants/colors';

export const LoveLanguagesPromo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bgPrimary }}>
      {/* Audio: background music + voiceover + sound effects */}
      <AudioMix />

      <TransitionSeries>
        {/* Scene 1: Hero - "Learn Your Partner's Language... Together." (0-7s) */}
        <TransitionSeries.Sequence durationInFrames={SCENES.hero.duration}>
          <Scene1Hero />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
          presentation={slide({ direction: 'from-right' })}
        />

        {/* Scene 2: Languages - 18 flags + "306 Language Pairs" (7-15s) */}
        <TransitionSeries.Sequence durationInFrames={SCENES.languages.duration}>
          <Scene2Languages />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
          presentation={fade()}
        />

        {/* Scene 3: Love Gifts - Tutor sends word gift to partner (15-27s) */}
        <TransitionSeries.Sequence durationInFrames={SCENES.loveGifts.duration}>
          <Scene3LoveGifts />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
          presentation={slide({ direction: 'from-bottom' })}
        />

        {/* Scene 4: Partner Challenge - Tutor creates quiz, student solves (27-39s) */}
        <TransitionSeries.Sequence durationInFrames={SCENES.challenge.duration}>
          <Scene4PartnerChallenge />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
          presentation={fade()}
        />

        {/* Scene 5: Love Log - Vocabulary with gift badges (39-47s) */}
        <TransitionSeries.Sequence durationInFrames={SCENES.loveLog.duration}>
          <Scene5LoveLog />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
          presentation={slide({ direction: 'from-right' })}
        />

        {/* Scene 6: Games - Practice in multiple modes (47-61s) */}
        <TransitionSeries.Sequence durationInFrames={SCENES.games.duration}>
          <Scene6Games />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
          presentation={fade()}
        />

        {/* Scene 7: Progress - Watch your love grow (61-71s) */}
        <TransitionSeries.Sequence durationInFrames={SCENES.progress.duration}>
          <Scene7Progress />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
          presentation={slide({ direction: 'from-bottom' })}
        />

        {/* Scene 8: AI Chat - AI knows your relationship (71-81s) */}
        <TransitionSeries.Sequence durationInFrames={SCENES.aiChat.duration}>
          <Scene8AIChat />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
          presentation={fade()}
        />

        {/* Scene 9: CTA - "Language learning built for two" (81-88s) */}
        <TransitionSeries.Sequence durationInFrames={SCENES.cta.duration}>
          <Scene6CTA />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
