import { MongoClient, Db } from 'mongodb';
import { env } from '@/src/lib/config/environment';

if (!env.MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

declare global {
  var mongoClient: MongoClient | undefined;
  var mongoClientPromise: Promise<MongoClient> | undefined;
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global.mongoClient) {
    global.mongoClient = new MongoClient(env.MONGODB_URI);
  }
  client = global.mongoClient;

  if (!global.mongoClientPromise) {
    global.mongoClientPromise = client.connect();
  }
  clientPromise = global.mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(env.MONGODB_URI);
  clientPromise = client.connect();
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;

// Export the client for direct access when needed
export { client };

// Helper function to get connected database
export async function getDatabase(dbName: string = 'platyfend'): Promise<Db> {
  const connectedClient = await clientPromise;
  return connectedClient.db(dbName);
}
