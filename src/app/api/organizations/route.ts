import { getServerSession } from "next-auth/next";
import { authOptions } from "@/src/features/auth/lib/auth-config";
import { NextResponse } from "next/server";
import connectToDatabase from "@/src/lib/database/mongoose";
import { Organization } from "@/src/lib/database/models";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Connect to database with timeout and retry logic
    console.log('🔄 Connecting to database for organizations API...');
    let connection;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        connection = await connectToDatabase();
        console.log('✅ Database connection established, readyState:', connection.readyState);
        break;
      } catch (error) {
        retryCount++;
        console.warn(`⚠️ Database connection attempt ${retryCount} failed:`, error);
        if (retryCount >= maxRetries) {
          throw new Error(`Failed to connect to database after ${maxRetries} attempts`);
        }
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
      }
    }

    // Fetch user organizations from MongoDB with optimized query and timeout wrapper
    console.log('🔍 Fetching user organizations for user:', session.user.id);

    // Create a timeout promise to race against the query
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Query timeout after 25 seconds')), 25000);
    });

    const queryPromise = Organization.find({
      user_id: session.user.id
    })
    .select('org_id org_name provider avatar_url org_type description public_repos installation_status repos')
    .lean()
    .maxTimeMS(30000) // MongoDB timeout
    .hint({ user_id: 1, provider: 1 }) // Use the compound index
    .exec();

    const dbOrganizations = await Promise.race([queryPromise, timeoutPromise]) as any[];
    console.log('✅ Found', dbOrganizations.length, 'organizations in database');

    const organizations: any[] = [];
    const errors: Array<{ provider: string; error: string }> = [];

    // Convert database organizations to API format
    for (const org of dbOrganizations) {
      organizations.push({
        id: org.org_id, // Use the external org_id (GitHub user/org ID)
        name: org.org_name,
        provider: org.provider,
        avatar: org.avatar_url,
        isCurrent: true, // For now, mark all as current - can be refined later
        type: org.org_type,
        description: org.description,
        publicRepos: org.public_repos,
        installationStatus: org.installation_status,
        repoCount: org.repos?.length || 0
      });
    }

    // For now, we'll just return the organizations from the database
    // In the future, we could add logic to sync with external APIs if needed

    // Check what providers are missing (simplified for now)
    const missingProviders = [];
    const hasGitHub = dbOrganizations.some(org => org.provider === 'github');
    const hasGitLab = dbOrganizations.some(org => org.provider === 'gitlab');

    if (!hasGitHub) missingProviders.push('github');
    if (!hasGitLab) missingProviders.push('gitlab');

    return NextResponse.json({
      organizations,
      totalCount: organizations.length,
      missingProviders,
      errors: errors.length > 0 ? errors : undefined,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name
      }
    });

  } catch (error: any) {
    console.error("Organizations API error:", error);

    // Check if it's a timeout or connection error
    const isTimeoutError = error.message?.includes('timeout') ||
                          error.message?.includes('buffering') ||
                          error.name === 'MongooseError';

    // Provide specific error information for debugging
    const errorDetails = {
      message: error.message,
      name: error.name,
      code: error.code,
      isTimeout: isTimeoutError,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };

    // For timeout errors, return a more specific response
    if (isTimeoutError) {
      return NextResponse.json({
        error: "Database connection timeout",
        message: "The request took too long to process. Please try again.",
        organizations: [], // Return empty array as fallback
        totalCount: 0,
        missingProviders: ['github', 'gitlab'],
        details: errorDetails,
        timestamp: new Date().toISOString()
      }, { status: 503 }); // Service Unavailable
    }

    return NextResponse.json({
      error: "Failed to fetch organizations",
      details: errorDetails,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
