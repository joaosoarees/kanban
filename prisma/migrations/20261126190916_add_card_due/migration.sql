-- AlterTable
ALTER TABLE "cards" ADD COLUMN     "completedAt" TIMESTAMPTZ(3),
ADD COLUMN     "dueOn" DATE;
