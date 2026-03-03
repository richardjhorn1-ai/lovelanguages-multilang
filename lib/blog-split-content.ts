/**
 * Split HTML content at approximately 70% through
 * Only splits BEFORE a heading (natural section break) - never mid-section
 */
export function splitContentAtMidpoint(html: string): { firstHalf: string; secondHalf: string } {
  if (!html || html.length < 1000) {
    // Too short to split
    return { firstHalf: html, secondHalf: '' };
  }

  // Find all section breaks: positions right BEFORE a h2 heading (major sections only)
  // This ensures we split between major sections, not mid-section
  const headingPattern = /<h2[^>]*>/gi;
  const matches: { index: number; length: number }[] = [];

  let match;
  while ((match = headingPattern.exec(html)) !== null) {
    // Store the position BEFORE the heading starts
    matches.push({
      index: match.index,
      length: match[0].length
    });
  }

  if (matches.length < 2) {
    // Not enough structure to split
    return { firstHalf: html, secondHalf: '' };
  }

  // Find the split point closest to 45% through the content
  const targetPosition = html.length * 0.45;
  let bestSplit = matches[0];
  let bestDistance = Math.abs(matches[0].index - targetPosition);

  for (const m of matches) {
    const distance = Math.abs(m.index - targetPosition);
    // Prefer splits that are 30-60% through
    const position = m.index / html.length;
    if (position >= 0.30 && position <= 0.60 && distance < bestDistance) {
      bestDistance = distance;
      bestSplit = m;
    }
  }

  // Only split if we found a good point between 30-60%
  const splitPosition = bestSplit.index / html.length;
  if (splitPosition < 0.30 || splitPosition > 0.60) {
    return { firstHalf: html, secondHalf: '' };
  }

  return {
    firstHalf: html.slice(0, bestSplit.index),
    secondHalf: html.slice(bestSplit.index)
  };
}
