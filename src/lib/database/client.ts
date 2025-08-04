import { MongoClient } from 'mongodb';
import { env } from '@/src/lib/config/environment';

if (!env.MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

declare global {
  var mongoClient: MongoClient | undefined;
}

// In development, use a global variable to preserve the connection across hot-reloads
const client = global.mongoClient || new MongoClient(env.MONGODB_URI);

if (process.env.NODE_ENV === 'development') {
  global.mongoClient = client;
}

export default client;
