import { z } from "zod";

const envSchema = z.object({
  CORE_URL: z.string().url(),
  CORE_API_KEY: z.string().optional().nullable().transform(v => v ?? ""),
  CORE_CDI_VERSION: z.string().optional(),
  ADMIN_USERNAME: z.string().min(1),
  ADMIN_PASSWORD: z.string().min(1),
  CORE_INSECURE_TLS: z
    .union([z.literal("true"), z.literal("false"), z.undefined()])
    .transform(v => v === "true"),
  BACKEND_API_URL: z.string().url().optional(),
  BACKEND_SIGNUP_PATH: z.string().optional().transform(v => v ?? "/auth/signup"),
  BACKEND_TENANT_HEADER: z.string().optional().transform(v => v ?? "x-supertokens-tenant-id"),
});

export function getEnv() {
  const parsed = envSchema.safeParse({
    CORE_URL: process.env.CORE_URL,
    CORE_API_KEY: process.env.CORE_API_KEY,
    CORE_CDI_VERSION: process.env.CORE_CDI_VERSION,
    ADMIN_USERNAME: process.env.ADMIN_USERNAME,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    CORE_INSECURE_TLS: process.env.CORE_INSECURE_TLS,
    BACKEND_API_URL: process.env.BACKEND_API_URL,
    BACKEND_SIGNUP_PATH: process.env.BACKEND_SIGNUP_PATH,
    BACKEND_TENANT_HEADER: process.env.BACKEND_TENANT_HEADER,
  });
  if (!parsed.success) {
    const issues = parsed.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid environment configuration: ${issues}`);
  }
  return parsed.data;
}
