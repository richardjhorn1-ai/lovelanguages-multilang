/**
 * Apple Sign In utilities
 *
 * Generates a cryptographic nonce for Apple Sign In.
 * Apple requires the raw nonce to be sent to Supabase's signInWithIdToken(),
 * while the SHA-256 hashed nonce goes to Apple's authorize() call.
 */

/**
 * Generate a random nonce and its SHA-256 hash for Apple Sign In.
 * @returns rawNonce (for Supabase) and hashedNonce (for Apple)
 */
export async function generateNonce(): Promise<{ rawNonce: string; hashedNonce: string }> {
  // Generate 32 random bytes as hex string
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const rawNonce = Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');

  // SHA-256 hash it for Apple
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(rawNonce));
  const hashedNonce = Array.from(new Uint8Array(hashBuffer), (b) =>
    b.toString(16).padStart(2, '0')
  ).join('');

  return { rawNonce, hashedNonce };
}
