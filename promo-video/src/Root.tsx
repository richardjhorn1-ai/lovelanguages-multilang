import { Composition } from 'remotion';
import { LoveLanguagesPromo } from './LoveLanguagesPromo';
import { LoveLanguagesPromoV2 } from './LoveLanguagesPromoV2';
import { TOTAL_DURATION, FPS } from './constants/timing';
import { V2_TOTAL_DURATION, FPS as V2_FPS } from './constants/timingV2';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="LoveLanguagesPromo"
        component={LoveLanguagesPromo}
        durationInFrames={TOTAL_DURATION}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="LoveLanguagesPromoV2"
        component={LoveLanguagesPromoV2}
        durationInFrames={V2_TOTAL_DURATION}
        fps={V2_FPS}
        width={1080}
        height={1920}
      />
    </>
  );
};
