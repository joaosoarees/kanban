-- CreateTable
CREATE TABLE "invites" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "invitedById" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "sentAt" TIMESTAMPTZ(3) NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invite_sends" (
    "id" UUID NOT NULL,
    "invitedById" UUID NOT NULL,
    "sentAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "invite_sends_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "invites_tokenHash_key" ON "invites"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "invites_workspaceId_email_key" ON "invites"("workspaceId", "email");

-- CreateIndex
CREATE INDEX "invite_sends_invitedById_sentAt_idx" ON "invite_sends"("invitedById", "sentAt");

-- AddForeignKey
ALTER TABLE "invites" ADD CONSTRAINT "invites_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invites" ADD CONSTRAINT "invites_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invite_sends" ADD CONSTRAINT "invite_sends_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "invites" ADD CONSTRAINT "invites_role_check" CHECK ("role" <> 'OWNER');
ALTER TABLE "invites" ADD CONSTRAINT "invites_email_lowercase_check" CHECK ("email" = lower("email"));
ALTER TABLE "invites" ADD CONSTRAINT "invites_expires_after_sent_check" CHECK ("expiresAt" > "sentAt");
ALTER TABLE "invites" ADD CONSTRAINT "invites_token_hash_check" CHECK ("tokenHash" ~ '^[0-9a-f]{64}$');
