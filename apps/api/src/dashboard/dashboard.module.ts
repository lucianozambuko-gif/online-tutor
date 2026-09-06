import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { NotesModule } from '../notes/notes.module';
import { FlashcardsModule } from '../flashcards/flashcards.module';
import { QuizzesModule } from '../quizzes/quizzes.module';
import { TutorStudentsModule } from '../tutor-students/tutor-students.module';

@Module({
  imports: [NotesModule, FlashcardsModule, QuizzesModule, TutorStudentsModule],
  controllers: [DashboardController],
})
export class DashboardModule {}
