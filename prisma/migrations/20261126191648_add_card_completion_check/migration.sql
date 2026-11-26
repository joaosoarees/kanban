ALTER TABLE "cards" DROP CONSTRAINT IF EXISTS "cards_completed_at_check";
ALTER TABLE "cards" ADD CONSTRAINT "cards_completed_at_check" CHECK ("completedAt" >= "createdAt");
