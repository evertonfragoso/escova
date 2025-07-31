import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  HOST: z.string().default('localhost'),
  PORT: z
    .string()
    .transform(Number)
    .refine(val => !isNaN(val), { message: 'PORT must be a number' })
    .default(3000),
  NODE_ENV: z.enum(['development', 'production']).default('development'),
});

const parsed = envSchema.parse(process.env);

const config = {
  host: parsed.HOST,
  port: parsed.PORT,
  nodeEnv: parsed.NODE_ENV,
};

export default config;
