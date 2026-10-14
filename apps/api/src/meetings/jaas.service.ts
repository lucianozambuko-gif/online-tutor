import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';

export interface JaasUser {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  moderator: boolean;
}

/**
 * 8x8 Jitsi as a Service (JaaS) helper.
 *
 * Env vars (Render):
 *   JAAS_APP_ID          vpaas-magic-cookie-xxxxxxxx         (JaaS console -> API keys, top of page)
 *   JAAS_KEY_ID          vpaas-magic-cookie-xxxxxxxx/abc123  (the full "Key ID" of the API key you generated)
 *   JAAS_PRIVATE_KEY     -----BEGIN PRIVATE KEY-----\n...    (the .pk file downloaded when generating the key; \n escaped OK)
 *   JAAS_WEBHOOK_SECRET  same value as the endpoint's "Authorization header" in JaaS console -> Webhooks
 */
@Injectable()
export class JaasService {
  private readonly appId = process.env.JAAS_APP_ID ?? '';
  private readonly keyId = process.env.JAAS_KEY_ID ?? '';
  private readonly privateKey = (process.env.JAAS_PRIVATE_KEY ?? '').replace(
    /\\n/g,
    '\n',
  );

  get domain() {
    return '8x8.vc';
  }

  /** Room name is derived from the booking, so nothing new needs storing. */
  roomForBooking(bookingId: string) {
    return `lumen-${bookingId}`;
  }

  /** Full room name the iframe API expects: "<appId>/<room>" */
  fullRoomName(room: string) {
    return `${this.appId}/${room}`;
  }

  /** Signs a short-lived JWT scoped to ONE room. */
  signToken(room: string, user: JaasUser, ttlSeconds = 2 * 60 * 60) {
    if (!this.appId || !this.keyId || !this.privateKey) {
      throw new InternalServerErrorException(
        'JaaS is not configured on the server',
      );
    }
    const now = Math.floor(Date.now() / 1000);

    return jwt.sign(
      {
        aud: 'jitsi',
        iss: 'chat',
        sub: this.appId,
        room, // scoped to this room only (not "*")
        iat: now,
        nbf: now - 10,
        exp: now + ttlSeconds,
        context: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            moderator: user.moderator ? 'true' : 'false',
            'hidden-from-recorder': false,
          },
          features: {
            // Only the tutor gets recording / transcription; these need a paid JaaS plan anyway.
            recording: user.moderator ? 'true' : 'false',
            transcription: 'false',
            livestreaming: 'false',
            'outbound-call': 'false',
            'sip-outbound-call': 'false',
          },
        },
      },
      this.privateKey,
      {
        algorithm: 'RS256',
        header: { alg: 'RS256', kid: this.keyId, typ: 'JWT' },
      },
    );
  }

  /**
   * JaaS sends the exact value you typed into "Authorization header" on the
   * webhook endpoint as the HTTP Authorization header. JAAS_WEBHOOK_SECRET on
   * Render holds that same value; compare in constant time.
   */
  verifyWebhook(authHeader: string | undefined): boolean {
    const secret = process.env.JAAS_WEBHOOK_SECRET;
    if (!secret || !authHeader) return false;
    const a = crypto.createHash('sha256').update(authHeader.trim()).digest();
    const b = crypto.createHash('sha256').update(secret.trim()).digest();
    return crypto.timingSafeEqual(a, b);
  }
}
