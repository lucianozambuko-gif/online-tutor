import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { NotesModule } from '../notes/notes.module';
import { FlashcardsModule } from '../flashcards/flashcards.module';
import { QuizzesModule } from '../quizzes/quizzes.module';

@Module({
  imports: [NotesModule, FlashcardsModule, QuizzesModule],
  controllers: [DashboardController],
})
export class DashboardModule {}
