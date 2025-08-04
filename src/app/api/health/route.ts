import { NextResponse } from "next/server";
import { checkDatabaseHealth } from "@/src/lib/database/init";

export async function GET() {
  try {
    const dbHealth = await checkDatabaseHealth();
    
    const health = {
      status: dbHealth.status === 'healthy' ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      database: dbHealth,
      environment: process.env.NODE_ENV,
    };

    const statusCode = dbHealth.status === 'healthy' ? 200 : 503;
    
    return NextResponse.json(health, { status: statusCode });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: {
          status: 'unhealthy',
          message: error instanceof Error ? error.message : 'Unknown error'
        },
        environment: process.env.NODE_ENV,
      },
      { status: 503 }
    );
  }
}
