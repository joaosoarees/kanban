-- CreateEnum
CREATE TYPE "LabelColor" AS ENUM ('GRAY', 'RED', 'ORANGE', 'YELLOW', 'GREEN', 'TEAL', 'BLUE', 'PURPLE');

-- AlterTable
ALTER TABLE "cards" ADD COLUMN     "assigneeId" UUID;

-- CreateTable
CREATE TABLE "labels" (
    "id" UUID NOT NULL,
    "boardId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "color" "LabelColor" NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "labels_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "labels_name_check" CHECK ("name" !~ '^[\u0001-\u0020\u007f-\u00a0\u00ad\u034f\u0600-\u0605\u061c\u06dd\u070f\u0890-\u0891\u08e2\u115f-\u1160\u1680\u17b4-\u17b5\u180b-\u180f\u2000-\u200f\u2028-\u202f\u205f-\u206f\u2800\u3000\u3164\ufe00-\ufe0f\ufeff\uffa0\ufff0-\ufffb\U000110bd\U000110cd\U00013430-\U0001343f\U0001bca0-\U0001bca3\U0001d159\U0001d173-\U0001d17a\U000e0000-\U000e0fff]*$' AND "name" !~ '^[ \t\n\v\f\r\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]|[ \t\n\v\f\r\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]$' AND "name" !~ '[\n\v\f\r\u0085\u2028\u2029]' AND char_length("name") <= 30)
);

-- CreateIndex
CREATE UNIQUE INDEX "labels_boardId_lower_name_key" ON "labels"("boardId", lower(normalize(regexp_replace("name", '[\u0001-\u001f\u007f-\u009f\u00ad\u034f\u0600-\u0605\u061c\u06dd\u070f\u0890-\u0891\u08e2\u115f-\u1160\u17b4-\u17b5\u180b-\u180f\u200b-\u200f\u2028-\u202e\u2060-\u206f\u2800\u3164\ufe00-\ufe0f\ufeff\uffa0\ufff0-\ufffb\U000110bd\U000110cd\U00013430-\U0001343f\U0001bca0-\U0001bca3\U0001d159\U0001d173-\U0001d17a\U000e0000-\U000e0fff]', '', 'g'), NFC)));

-- CreateTable
CREATE TABLE "card_labels" (
    "cardId" UUID NOT NULL,
    "labelId" UUID NOT NULL,

    CONSTRAINT "card_labels_pkey" PRIMARY KEY ("cardId","labelId")
);

-- CreateIndex
CREATE INDEX "card_labels_labelId_idx" ON "card_labels"("labelId");

-- CreateIndex
CREATE INDEX "cards_assigneeId_idx" ON "cards"("assigneeId");

-- AddForeignKey
ALTER TABLE "cards" ADD CONSTRAINT "cards_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "labels" ADD CONSTRAINT "labels_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "boards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_labels" ADD CONSTRAINT "card_labels_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_labels" ADD CONSTRAINT "card_labels_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "labels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
