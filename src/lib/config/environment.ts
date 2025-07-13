import { z } from 'zod'

// Environment validation schema
const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Database
  DATABASE_URL: z.string().url(),
  
  // NextAuth
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(1),
  
  // GitHub OAuth
  GITHUB_CLIENT_ID: z.string().min(1),
  GITHUB_CLIENT_SECRET: z.string().min(1),
  
  // GitHub App
  GITHUB_APP_ID: z.string().min(1),
  GITHUB_PRIVATE_KEY: z.string().min(1),
  GITHUB_WEBHOOK_SECRET: z.string().min(1),
  
  // RabbitMQ
  RABBITMQ_URL: z.string().url().default('amqp://localhost:5672'),
  
  // Python Backend
  PYTHON_BACKEND_URL: z.string().url().default('http://localhost:5000'),
  NEXTJS_CALLBACK_URL: z.string().url(),
  
  // Optional services
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  
  // AWS S3
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().default('us-east-1'),
  AWS_S3_BUCKET: z.string().optional(),
  
  // Sentry
  SENTRY_DSN: z.string().optional(),
  
  // Analytics
  ANALYZE: z.string().optional(),
})

// Validate environment variables
function validateEnv() {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    console.error('❌ Invalid environment variables:')
    if (error instanceof z.ZodError) {
      error.errors.forEach((err) => {
        console.error(`  ${err.path.join('.')}: ${err.message}`)
      })
    }
    process.exit(1)
  }
}

// Export validated environment variables
export const env = validateEnv()

// Helper functions
export const isDevelopment = env.NODE_ENV === 'development'
export const isProduction = env.NODE_ENV === 'production'
export const isTest = env.NODE_ENV === 'test'

// Feature flags based on environment
export const features = {
  analytics: isProduction && !!env.SENTRY_DSN,
  stripe: !!(env.STRIPE_SECRET_KEY && env.STRIPE_PUBLISHABLE_KEY),
  s3Upload: !!(env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY && env.AWS_S3_BUCKET),
  bundleAnalysis: env.ANALYZE === 'true',
} as const

// Database configuration
export const database = {
  url: env.DATABASE_URL,
  // Add connection pooling for production
  connectionLimit: isProduction ? 10 : 5,
} as const

// Cache configuration
export const cache = {
  redis: {
    enabled: isProduction,
    url: process.env.REDIS_URL,
  },
  memory: {
    enabled: !isProduction,
    maxSize: 100, // MB
  },
} as const

// Rate limiting configuration
export const rateLimiting = {
  enabled: isProduction,
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // per window
} as const

// CORS configuration
export const cors = {
  origin: isProduction 
    ? [env.NEXTAUTH_URL, env.PYTHON_BACKEND_URL]
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5000'],
  credentials: true,
} as const
