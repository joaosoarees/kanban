import * as z from "zod";
import { userNameField } from "@/features/auth/lib/schemas";

export const renameSchema = z.object({ name: userNameField });
