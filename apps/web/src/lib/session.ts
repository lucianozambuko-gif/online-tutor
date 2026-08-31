import 'server-only';
import { jwtVerify } from 'jose';

export const AUTH_COOKIE_NAME = 'auth_token';

export type Role = 'STUDENT' | 'TUTOR' | 'ADMIN';

export interface SessionPayload {
  sub: string;
  email: string;
  role: Role;
}

const encodedSecret = new TextEncoder().encode(process.env.AUTH_JWT_SECRET);

// Optimistic check only: verifies the cookie's signature/expiry so proxy.ts can
// redirect fast. The API re-verifies on every request it actually serves data for.
export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, encodedSecret, { algorithms: ['HS256'] });
    if (typeof payload.sub !== 'string' || typeof payload.role !== 'string') {
      return null;
    }
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}
