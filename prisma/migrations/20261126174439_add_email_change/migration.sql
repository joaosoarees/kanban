-- AlterEnum
ALTER TYPE "EmailCodePurpose" ADD VALUE 'CHANGE_EMAIL';

-- AlterTable
ALTER TABLE "email_codes" ADD COLUMN     "newEmail" TEXT;

ALTER TABLE "email_codes" ADD CONSTRAINT "email_codes_new_email_check" CHECK (("purpose"::text = 'CHANGE_EMAIL') = ("newEmail" IS NOT NULL) AND "newEmail" = lower("newEmail"));
