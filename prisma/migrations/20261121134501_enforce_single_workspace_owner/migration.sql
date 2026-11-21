CREATE UNIQUE INDEX "memberships_single_owner_key" ON "memberships"("workspaceId") WHERE "role" = 'OWNER';
