import * as z from "zod";

export const assignableRoleSchema = z.enum(["ADMIN", "MEMBER"]);

export const addMemberSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("Digite um e-mail como nome@empresa.com.")),
  role: assignableRoleSchema,
});

export const changeRoleSchema = z.object({
  userId: z.uuid(),
  role: assignableRoleSchema,
});

export const removeMemberSchema = z.object({
  userId: z.uuid(),
});
