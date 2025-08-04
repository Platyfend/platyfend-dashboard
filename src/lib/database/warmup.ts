import { initializeDatabase } from './init';

/**
 * Warm up database connections on application startup
 * This helps prevent cold start issues and connection timeouts
 */
export async function warmupDatabase() {
  try {
    console.log('🔥 Warming up database connections...');
    await initializeDatabase();
    console.log('✅ Database warmup completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Database warmup failed:', error);
    // Don't throw - let the app start even if warmup fails
    return false;
  }
}

// Auto-warmup in development
if (process.env.NODE_ENV === 'development') {
  // Delay warmup to avoid blocking app startup
  setTimeout(() => {
    warmupDatabase().catch(console.error);
  }, 1000);
}
