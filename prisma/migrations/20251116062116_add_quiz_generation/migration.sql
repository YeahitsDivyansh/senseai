-- CreateEnum
CREATE TYPE "QuizStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "QuizGeneration" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "QuizStatus" NOT NULL DEFAULT 'PENDING',
    "questions" JSONB,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "QuizGeneration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QuizGeneration_userId_status_idx" ON "QuizGeneration"("userId", "status");

-- CreateIndex
CREATE INDEX "QuizGeneration_status_idx" ON "QuizGeneration"("status");

-- AddForeignKey
ALTER TABLE "QuizGeneration" ADD CONSTRAINT "QuizGeneration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
