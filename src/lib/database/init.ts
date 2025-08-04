import connectToDatabase from './mongoose';

/**
 * Initialize database connection and ensure models are loaded
 * This should be called early in the application lifecycle
 */
export async function initializeDatabase() {
  try {
    console.log('🔄 Initializing database connection...');
    
    // Connect to MongoDB via Mongoose
    await connectToDatabase();
    
    // Import models to ensure they are registered
    await import('./models');
    
    console.log('✅ Database initialized successfully');
    
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

/**
 * Health check for database connection
 */
export async function checkDatabaseHealth() {
  try {
    const connection = await connectToDatabase();
    
    if (connection.readyState === 1) {
      return { status: 'healthy', message: 'Database connection is active' };
    } else {
      return { status: 'unhealthy', message: 'Database connection is not ready' };
    }
  } catch (error) {
    return { 
      status: 'unhealthy', 
      message: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}
