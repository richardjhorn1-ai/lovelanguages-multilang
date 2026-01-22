import { Composition } from 'remotion';
import { LoveLanguagesPromo } from './LoveLanguagesPromo';
import { TOTAL_DURATION, FPS } from './constants/timing';

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
    </>
  );
};
