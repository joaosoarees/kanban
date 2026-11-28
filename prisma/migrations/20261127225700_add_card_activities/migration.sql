-- CreateEnum
CREATE TYPE "CardActivityType" AS ENUM ('CARD_CREATED', 'CARD_MOVED', 'TITLE_CHANGED', 'DESCRIPTION_CHANGED', 'DUE_CHANGED', 'COMPLETION_CHANGED', 'ASSIGNEE_CHANGED', 'LABEL_ADDED', 'LABEL_REMOVED', 'CHECKLIST_ITEM_COMPLETION_CHANGED');

-- CreateTable
CREATE TABLE "card_activities" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "cardId" UUID NOT NULL,
    "actorId" UUID,
    "type" "CardActivityType" NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "card_activities_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "card_activities_data_check" CHECK (jsonb_typeof("data") = 'object')
);

-- CreateIndex
CREATE INDEX "card_activities_cardId_id_idx" ON "card_activities"("cardId", "id");

-- CreateIndex
CREATE INDEX "card_activities_actorId_idx" ON "card_activities"("actorId");

-- AddForeignKey
ALTER TABLE "card_activities" ADD CONSTRAINT "card_activities_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_activities" ADD CONSTRAINT "card_activities_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
