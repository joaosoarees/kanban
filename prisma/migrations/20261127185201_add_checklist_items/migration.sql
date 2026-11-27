-- CreateTable
CREATE TABLE "checklist_items" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "cardId" UUID NOT NULL,
    "text" TEXT NOT NULL,
    "position" TEXT COLLATE "C" NOT NULL,
    "completedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checklist_items_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "checklist_items_text_check" CHECK ("text" !~ '^[\u0001-\u0020\u007f-\u00a0\u00ad\u034f\u0600-\u0605\u061c\u06dd\u070f\u0890-\u0891\u08e2\u115f-\u1160\u1680\u17b4-\u17b5\u180b-\u180f\u2000-\u200f\u2028-\u202f\u205f-\u206f\u2800\u3000\u3164\ufe00-\ufe0f\ufeff\uffa0\ufff0-\ufffb\U000110bd\U000110cd\U00013430-\U0001343f\U0001bca0-\U0001bca3\U0001d159\U0001d173-\U0001d17a\U000e0000-\U000e0fff]*$' AND "text" !~ '^[ \t\n\v\f\r\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]|[ \t\n\v\f\r\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]$' AND "text" !~ '[\n\v\f\r\u0085\u2028\u2029]' AND char_length("text") <= 200),
    CONSTRAINT "checklist_items_completed_at_check" CHECK ("completedAt" >= "createdAt")
);

-- CreateIndex
CREATE UNIQUE INDEX "checklist_items_cardId_position_key" ON "checklist_items"("cardId", "position");

-- AddForeignKey
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
