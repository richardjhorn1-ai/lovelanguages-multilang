import { supabase } from './supabase';
import { generateNonce } from '../utils/apple-auth';
import { SignInWithApple, type SignInWithAppleResponse } from './native-apple-sign-in';

const APPLE_SIGN_IN_TIMEOUT_MS = 30000;

export class NativeAppleSignInTimeoutError extends Error {
  constructor() {
    super('Apple Sign In took too long to respond. Please try again.');
    this.name = 'NativeAppleSignInTimeoutError';
  }
}

function isSuccessfulAppleSignInResponse(
  response: SignInWithAppleResponse['response'] | undefined
): response is SignInWithAppleResponse['response'] {
  return Boolean(response?.identityToken && response?.authorizationCode);
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new NativeAppleSignInTimeoutError());
    }, timeoutMs);

    promise
      .then((value) => {
        window.clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        window.clearTimeout(timer);
        reject(error);
      });
  });
}

export function isNativeAppleSignInCancelled(error: any): boolean {
  const message = (error?.message || '').toLowerCase();
  return error?.code === '1001' || message.includes('cancelled') || message.includes('canceled');
}

export async function signInWithNativeApple() {
  const { rawNonce, hashedNonce } = await generateNonce();

  const result = await withTimeout(
    SignInWithApple.authorize({
      clientId: 'com.lovelanguages.app',
      redirectURI: '',
      scopes: 'email name',
      nonce: hashedNonce,
    }),
    APPLE_SIGN_IN_TIMEOUT_MS
  );

  if (!isSuccessfulAppleSignInResponse(result?.response)) {
    throw new Error('Apple Sign In did not return the required credentials.');
  }

  if (result.response.givenName || result.response.familyName) {
    const appleName = [result.response.givenName, result.response.familyName]
      .filter(Boolean)
      .join(' ');

    if (appleName) {
      localStorage.setItem('apple_display_name', appleName);
    }
  }

  const signInResult = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: result.response.identityToken,
    nonce: rawNonce,
  });

  if (signInResult.error) {
    throw signInResult.error;
  }

  return {
    response: result.response,
    session: signInResult.data.session,
  };
}
