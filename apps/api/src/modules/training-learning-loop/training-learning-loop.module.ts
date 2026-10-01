import { Module } from "@nestjs/common";
import { TrainingLearningLoopController } from "./training-learning-loop.controller";
import { TrainingLearningLoopService } from "./training-learning-loop.service";

@Module({
  controllers: [TrainingLearningLoopController],
  providers: [TrainingLearningLoopService],
})
export class TrainingLearningLoopModule {}
