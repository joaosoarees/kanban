-- CreateEnum
CREATE TYPE "EmailCodePurpose" AS ENUM ('VERIFY_EMAIL', 'RESET_PASSWORD');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "codeWindowAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "codeWindowStartedAt" TIMESTAMPTZ(3),
ADD COLUMN     "emailVerifiedAt" TIMESTAMPTZ(3),
ADD COLUMN     "passwordChangedAt" TIMESTAMPTZ(3);

-- CreateTable
CREATE TABLE "email_codes" (
    "userId" UUID NOT NULL,
    "purpose" "EmailCodePurpose" NOT NULL,
    "codeHash" TEXT NOT NULL,
    "sentAt" TIMESTAMPTZ(3) NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "email_codes_pkey" PRIMARY KEY ("userId","purpose")
);

-- AddForeignKey
ALTER TABLE "email_codes" ADD CONSTRAINT "email_codes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "users" ADD CONSTRAINT "users_code_window_attempts_check" CHECK ("codeWindowAttempts" BETWEEN 0 AND 10);
ALTER TABLE "email_codes" ADD CONSTRAINT "email_codes_attempts_check" CHECK ("attempts" BETWEEN 0 AND 5);
ALTER TABLE "email_codes" ADD CONSTRAINT "email_codes_expires_after_sent_check" CHECK ("expiresAt" > "sentAt");
ALTER TABLE "email_codes" ADD CONSTRAINT "email_codes_code_hash_check" CHECK ("codeHash" ~ '^[0-9a-f]{64}$');
