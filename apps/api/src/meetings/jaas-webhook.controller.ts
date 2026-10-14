import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { JaasService } from './jaas.service';

interface JaasWebhookEvent {
  idempotencyKey?: string;
  eventType?: string;
  timestamp?: number;
  // "<appId>/<room>", e.g. "vpaas-magic-cookie-xxx/lumen-<bookingId>"
  fqn?: string;
  data?: { id?: string; moderator?: boolean | string };
}

const ROOM_PREFIX = 'lumen-';

/**
 * POST /webhooks/jaas — registered in the JaaS console (Webhooks) with
 * ROOM_CREATED, PARTICIPANT_JOINED, PARTICIPANT_LEFT and ROOM_DESTROYED.
 *
 * Not behind JwtAuthGuard: JaaS authenticates by sending the exact value set
 * in the console's "Authorization header" field, which must equal
 * JAAS_WEBHOOK_SECRET. JaaS retries, so writes are idempotent.
 */
@Controller('webhooks/jaas')
@SkipThrottle()
export class JaasWebhookController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jaas: JaasService,
  ) {}

  @Post()
  @HttpCode(200)
  async handle(
    @Headers('authorization') auth: string | undefined,
    @Body() evt: JaasWebhookEvent,
  ) {
    if (!this.jaas.verifyWebhook(auth)) {
      throw new UnauthorizedException('Bad JaaS webhook authorization');
    }

    const room =
      String(evt?.fqn ?? '')
        .split('/')
        .pop() ?? '';
    if (!room.startsWith(ROOM_PREFIX) || !evt.eventType) {
      return { ok: true, ignored: true };
    }
    const bookingId = room.slice(ROOM_PREFIX.length);
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: { id: true },
    });
    if (!booking) return { ok: true, ignored: true };

    const occurredAt = new Date(Number(evt.timestamp) || Date.now());
    const idempotencyKey =
      evt.idempotencyKey ??
      `${evt.eventType}:${bookingId}:${evt.data?.id ?? ''}:${occurredAt.getTime()}`;

    await this.prisma.meetingEvent.upsert({
      where: { idempotencyKey },
      update: {},
      create: {
        idempotencyKey,
        bookingId,
        type: evt.eventType,
        // context.user.id from the JWT we signed = the Lumen user id
        userId: evt.data?.id ? String(evt.data.id) : null,
        isModerator:
          evt.data?.moderator === true || evt.data?.moderator === 'true',
        occurredAt,
        payload: evt as unknown as Prisma.InputJsonValue,
      },
    });

    if (evt.eventType === 'ROOM_CREATED') {
      await this.prisma.booking.updateMany({
        where: { id: bookingId, meetingStartedAt: null },
        data: { meetingStartedAt: occurredAt },
      });
    } else if (evt.eventType === 'ROOM_DESTROYED') {
      await this.prisma.booking.update({
        where: { id: bookingId },
        data: { meetingEndedAt: occurredAt },
      });
    }

    return { ok: true };
  }
}
