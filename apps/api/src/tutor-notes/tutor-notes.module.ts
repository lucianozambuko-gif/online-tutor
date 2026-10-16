import { Module } from '@nestjs/common';
import { TutorNotesController } from './tutor-notes.controller';
import { TutorNotesService } from './tutor-notes.service';
import { MessagesModule } from '../messages/messages.module';

@Module({
  imports: [MessagesModule],
  controllers: [TutorNotesController],
  providers: [TutorNotesService],
})
export class TutorNotesModule {}
