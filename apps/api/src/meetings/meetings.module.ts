import { Module } from '@nestjs/common';
import { JaasService } from './jaas.service';
import { MeetingsController } from './meetings.controller';
import { JaasWebhookController } from './jaas-webhook.controller';

// PrismaModule is @Global, so it doesn't need importing here.
@Module({
  providers: [JaasService],
  controllers: [MeetingsController, JaasWebhookController],
  exports: [JaasService],
})
export class MeetingsModule {}
