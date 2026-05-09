// ============================================
// Muhit O'zgaruvchilari Konfiguratsiyasi
// ============================================
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000').transform(Number),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL majburiy!'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET kamida 32 belgi bo\'lishi kerak!'),
  JWT_EXPIRE: z.string().default('30d'),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform(Number),
  RATE_LIMIT_MAX: z.string().default('100').transform(Number),
  LOGIN_RATE_LIMIT_MAX: z.string().default('5').transform(Number),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Muhit o\'zgaruvchilari xatosi:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
