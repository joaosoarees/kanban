import * as z from "zod";

export const assignableRoleSchema = z.enum(["ADMIN", "MEMBER"]);

export const inviteMemberSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("Digite um e-mail como nome@empresa.com.")),
  role: assignableRoleSchema,
});

export const inviteIdSchema = z.object({
  inviteId: z.uuid(),
});

export const inviteTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/u);

export const changeRoleSchema = z.object({
  userId: z.uuid(),
  role: assignableRoleSchema,
});

export const removeMemberSchema = z.object({
  userId: z.uuid(),
});
