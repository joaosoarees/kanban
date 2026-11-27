-- AlterTable
ALTER TABLE "users" ADD COLUMN     "failedPasswordAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "passwordLockedUntil" TIMESTAMPTZ(3);

ALTER TABLE "users" ADD CONSTRAINT "users_failed_password_attempts_check" CHECK ("failedPasswordAttempts" BETWEEN 0 AND 4);
