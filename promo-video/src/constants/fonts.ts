import { loadFont as loadQuicksand } from '@remotion/google-fonts/Quicksand';
import { loadFont as loadOutfit } from '@remotion/google-fonts/Outfit';

// Load Quicksand (headers) - rounded, friendly, distinctive
const quicksand = loadQuicksand('normal', {
  weights: ['400', '500', '600', '700'],
  subsets: ['latin'],
});

// Load Outfit (body) - clean, modern, slightly warm
const outfit = loadOutfit('normal', {
  weights: ['400', '500', '600', '700'],
  subsets: ['latin'],
});

export const FONTS = {
  header: quicksand.fontFamily,
  body: outfit.fontFamily,
};
