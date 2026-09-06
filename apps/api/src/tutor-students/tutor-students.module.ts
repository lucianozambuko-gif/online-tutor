import { Module } from '@nestjs/common';
import { TutorStudentsController } from './tutor-students.controller';
import { TutorStudentsService } from './tutor-students.service';

@Module({
  controllers: [TutorStudentsController],
  providers: [TutorStudentsService],
  exports: [TutorStudentsService],
})
export class TutorStudentsModule {}
