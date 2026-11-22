-- CreateTable
CREATE TABLE "cards" (
    "id" UUID NOT NULL,
    "columnId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "position" TEXT COLLATE "C" NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cards_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "cards_title_check" CHECK ("title" !~ '^[\u0001-\u0020\u007f-\u00a0\u00ad\u034f\u0600-\u0605\u061c\u06dd\u070f\u0890-\u0891\u08e2\u115f-\u1160\u1680\u17b4-\u17b5\u180b-\u180f\u2000-\u200f\u2028-\u202f\u205f-\u206f\u2800\u3000\u3164\ufe00-\ufe0f\ufeff\uffa0\ufff0-\ufffb\U000110bd\U000110cd\U00013430-\U0001343f\U0001bca0-\U0001bca3\U0001d159\U0001d173-\U0001d17a\U000e0000-\U000e0fff]*$' AND "title" !~ '^[ \t\n\v\f\r\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]|[ \t\n\v\f\r\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]$' AND "title" !~ '[\n\v\f\r\u0085\u2028\u2029]' AND char_length("title") <= 200),
    CONSTRAINT "cards_description_check" CHECK ("description" !~ '^[\u0001-\u0020\u007f-\u00a0\u00ad\u034f\u0600-\u0605\u061c\u06dd\u070f\u0890-\u0891\u08e2\u115f-\u1160\u1680\u17b4-\u17b5\u180b-\u180f\u2000-\u200f\u2028-\u202f\u205f-\u206f\u2800\u3000\u3164\ufe00-\ufe0f\ufeff\uffa0\ufff0-\ufffb\U000110bd\U000110cd\U00013430-\U0001343f\U0001bca0-\U0001bca3\U0001d159\U0001d173-\U0001d17a\U000e0000-\U000e0fff]*$' AND char_length("description") <= 5000)
);

-- CreateIndex
CREATE UNIQUE INDEX "cards_columnId_position_key" ON "cards"("columnId", "position");

-- AddForeignKey
ALTER TABLE "cards" ADD CONSTRAINT "cards_columnId_fkey" FOREIGN KEY ("columnId") REFERENCES "columns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
