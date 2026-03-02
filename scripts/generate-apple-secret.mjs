/**
 * Generate Apple Client Secret JWT for Sign in with Apple token revocation.
 *
 * Usage:
 *   node scripts/generate-apple-secret.mjs \
 *     --team-id YOUR_TEAM_ID \
 *     --key-id YOUR_KEY_ID \
 *     --key-file /path/to/AuthKey_XXXXXX.p8
 *
 * The values for team-id and key-id can be found in:
 *   - Supabase Dashboard → Authentication → Providers → Apple
 *   - Or Apple Developer Portal → Certificates, Identifiers & Profiles → Keys
 *
 * The .p8 file is the private key you downloaded when creating the key.
 *
 * Output: A JWT valid for 6 months that you paste into Vercel as APPLE_CLIENT_SECRET.
 */
import { createPrivateKey, createSign } from 'crypto';
import { readFileSync } from 'fs';

// Parse args
const args = process.argv.slice(2);
function getArg(name) {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1 || idx + 1 >= args.length) {
    console.error(`Missing --${name}`);
    process.exit(1);
  }
  return args[idx + 1];
}

const teamId = getArg('team-id');
const keyId = getArg('key-id');
const keyFile = getArg('key-file');
const clientId = 'com.lovelanguages.app';

// Read the .p8 private key
const privateKeyPem = readFileSync(keyFile, 'utf8');

// Build JWT header + payload
const header = {
  alg: 'ES256',
  kid: keyId,
};

const now = Math.floor(Date.now() / 1000);
const payload = {
  iss: teamId,
  iat: now,
  exp: now + (86400 * 180), // 6 months
  aud: 'https://appleid.apple.com',
  sub: clientId,
};

// Base64url encode
function base64url(obj) {
  return Buffer.from(JSON.stringify(obj))
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

const headerEncoded = base64url(header);
const payloadEncoded = base64url(payload);
const signingInput = `${headerEncoded}.${payloadEncoded}`;

// Sign with ES256 (ECDSA P-256 + SHA-256)
const key = createPrivateKey(privateKeyPem);
const sign = createSign('SHA256');
sign.update(signingInput);
const signature = sign.sign({ key, dsaEncoding: 'ieee-p1363' });

const signatureEncoded = signature
  .toString('base64')
  .replace(/=/g, '')
  .replace(/\+/g, '-')
  .replace(/\//g, '_');

const jwt = `${signingInput}.${signatureEncoded}`;

console.log('\n=== Apple Client Secret (JWT) ===\n');
console.log(jwt);
console.log('\n=== Vercel Environment Variables ===\n');
console.log(`APPLE_CLIENT_ID = ${clientId}`);
console.log(`APPLE_CLIENT_SECRET = (the JWT above)`);
console.log(`\nThis JWT expires in 6 months (${new Date((now + 86400 * 180) * 1000).toISOString().split('T')[0]}).`);
console.log('Set a calendar reminder to regenerate it before then.\n');
