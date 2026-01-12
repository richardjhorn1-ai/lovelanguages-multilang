import { useState, useCallback } from 'react';

/**
 * Honeypot anti-bot protection hook
 *
 * Adds an invisible form field that legitimate users never see or fill.
 * Bots automatically fill all form fields, triggering detection.
 *
 * Usage:
 * ```tsx
 * const { honeypotProps, honeypotStyles, isBot } = useHoneypot();
 *
 * // In your form:
 * <style>{honeypotStyles}</style>
 * <input {...honeypotProps} />
 *
 * // Before submitting:
 * if (isBot()) {
 *   // Fake success to not tip off the bot
 *   return;
 * }
 * ```
 */
export function useHoneypot() {
  const [honeypotValue, setHoneypotValue] = useState('');

  // Check if the honeypot was filled (indicates bot)
  const isBot = useCallback(() => {
    return honeypotValue.length > 0;
  }, [honeypotValue]);

  // Props to spread on the hidden input
  const honeypotProps = {
    type: 'text' as const,
    name: 'website', // Attractive name for bots
    value: honeypotValue,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setHoneypotValue(e.target.value),
    autoComplete: 'off',
    tabIndex: -1,
    'aria-hidden': true as const,
    className: 'hp-field',
  };

  // CSS to hide the honeypot (multiple techniques for robustness)
  const honeypotStyles = `
    .hp-field {
      opacity: 0;
      position: absolute;
      top: 0;
      left: 0;
      height: 0;
      width: 0;
      z-index: -1;
      pointer-events: none;
    }
  `;

  return {
    honeypotProps,
    honeypotStyles,
    isBot,
    honeypotValue,
  };
}

export default useHoneypot;
