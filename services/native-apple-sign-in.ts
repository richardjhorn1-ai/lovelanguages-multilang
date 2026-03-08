import { registerPlugin } from '@capacitor/core';

export interface SignInWithAppleOptions {
  clientId: string;
  redirectURI: string;
  scopes?: string;
  state?: string;
  nonce?: string;
}

export interface SignInWithAppleResponse {
  response: {
    user: string | null;
    email: string | null;
    givenName: string | null;
    familyName: string | null;
    identityToken: string;
    authorizationCode: string;
  };
}

export interface SignInWithApplePlugin {
  authorize(options?: SignInWithAppleOptions): Promise<SignInWithAppleResponse>;
}

export const SignInWithApple = registerPlugin<SignInWithApplePlugin>('SignInWithApple');
