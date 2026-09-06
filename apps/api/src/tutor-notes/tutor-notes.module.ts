import { Module } from '@nestjs/common';
import { TutorNotesController } from './tutor-notes.controller';
import { TutorNotesService } from './tutor-notes.service';

@Module({
  controllers: [TutorNotesController],
  providers: [TutorNotesService],
})
export class TutorNotesModule {}
