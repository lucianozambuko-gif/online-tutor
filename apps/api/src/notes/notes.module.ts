import { Module } from '@nestjs/common';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { MessagesModule } from '../messages/messages.module';

@Module({
  imports: [SubscriptionsModule, MessagesModule],
  controllers: [NotesController],
  providers: [NotesService],
  exports: [NotesService],
})
export class NotesModule {}
