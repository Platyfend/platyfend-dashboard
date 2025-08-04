import { z } from 'zod'

// Environment validation schema
const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Database
  MONGODB_URI: z.string().url(),
  
  // NextAuth
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(1),
  
  // GitHub OAuth
  GITHUB_CLIENT_ID: z.string().min(1),
  GITHUB_CLIENT_SECRET: z.string().min(1),

  // GitHub App
  GITHUB_APP_ID: z.string().min(1),
  GITHUB_PRIVATE_KEY: z.string().min(1).transform((key) => {
    // Handle both raw private key and base64 encoded private key
    if (key.includes('-----BEGIN')) {
      return key;
    }
    try {
      return Buffer.from(key, 'base64').toString('utf8');
    } catch {
      throw new Error('Invalid GitHub App private key format');
    }
  }),
  GITHUB_APP_NAME: z.string().min(1).default('platyfend'),
  GITHUB_WEBHOOK_SECRET: z.string().min(1),

  // GitLab OAuth (optional for development)
  GITLAB_CLIENT_ID: z.string().optional().default('placeholder'),
  GITLAB_CLIENT_SECRET: z.string().optional().default('placeholder'),

  GITLAB_APP_NAME: z.string().optional().default('platyfend'),
  

  
  // Sentry
  SENTRY_DSN: z.string().optional(),
  
  // Analytics
  ANALYZE: z.string().optional(),
  
  // Public environment variables (client-side)
  NEXT_PUBLIC_FLOATING_CHATBOT_URL: z.string().optional(),
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
    throw new Error('Environment validation failed')
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
  bundleAnalysis: env.ANALYZE === 'true',
} as const

// Database configuration
export const database = {
  mongoUri: env.MONGODB_URI,
  // Add connection pooling for production
  connectionLimit: isProduction ? 10 : 5,
} as const
