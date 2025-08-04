import mongoose from 'mongoose';
import { env } from '@/src/lib/config/environment';

if (!env.MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

declare global {
  var mongoose: {
    conn: mongoose.Connection | null;
    promise: Promise<mongoose.Connection> | null;
  } | undefined;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectToDatabase(): Promise<mongoose.Connection> {
  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false, // Disable mongoose buffering
      maxPoolSize: 10,
      minPoolSize: 2, // Maintain minimum connections
      serverSelectionTimeoutMS: 30000, // Time to select a server
      socketTimeoutMS: 45000, // Socket timeout
      connectTimeoutMS: 30000, // Connection timeout
      family: 4, // Use IPv4, skip trying IPv6
      retryWrites: true,
      w: 'majority' as const,
      // Add additional connection options for better reliability
      maxIdleTimeMS: 30000, // Close connections after 30s of inactivity
      heartbeatFrequencyMS: 10000, // Check server every 10s
      // Additional timeout settings
      waitQueueTimeoutMS: 30000, // Time to wait for connection from pool
    };

    cached!.promise = mongoose.connect(env.MONGODB_URI, opts).then((mongoose) => {
      console.log('✅ Connected to MongoDB via Mongoose');

      // Set up connection event handlers
      mongoose.connection.on('error', (error) => {
        console.error('❌ MongoDB connection error:', error);
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️ MongoDB disconnected');
        cached!.conn = null;
        cached!.promise = null;
      });

      mongoose.connection.on('reconnected', () => {
        console.log('🔄 MongoDB reconnected');
      });

      return mongoose.connection;
    }).catch((error) => {
      console.error('❌ MongoDB connection error:', error);
      cached!.promise = null;
      throw error;
    });
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    throw e;
  }

  return cached!.conn;
}

export default connectToDatabase;
