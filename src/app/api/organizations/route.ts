import { getServerSession } from "next-auth/next";
import { authOptions } from "@/src/features/auth/lib/auth-config";
import { NextResponse } from "next/server";
import client from "@/src/lib/database/client";
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Connect to database and get all connected accounts
    await client.connect();
    const db = client.db('test');

    const accounts = await db.collection('accounts').find({
      userId: new ObjectId(session.user.id)
    }).toArray();

    const organizations = [];
    const errors = [];

    // Add personal organization (default workspace)
    organizations.push({
      id: 'personal',
      name: session.user.githubUsername || session.user.name || 'Personal',
      provider: 'github', // Default to github for personal
      avatar: session.user.image,
      isCurrent: true,
      type: 'personal'
    });

    // Fetch GitHub organizations if connected
    const githubAccount = accounts.find(acc => acc.provider === 'github');
    if (githubAccount?.access_token) {
      try {
        // Fetch user's GitHub organizations
        const orgsResponse = await fetch('https://api.github.com/user/orgs', {
          headers: {
            'Authorization': `Bearer ${githubAccount.access_token}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Platyfend-Dashboard'
          },
        });
        
        if (orgsResponse.ok) {
          const orgs = await orgsResponse.json();
          const githubOrgs = orgs.map((org: any) => ({
            id: `github-${org.id}`,
            name: org.login,
            provider: 'github',
            avatar: org.avatar_url,
            isCurrent: false,
            type: 'organization',
            description: org.description,
            publicRepos: org.public_repos
          }));
          
          organizations.push(...githubOrgs);
        } else {
          errors.push({
            provider: 'github',
            error: `HTTP ${orgsResponse.status}: ${orgsResponse.statusText}`
          });
        }
      } catch (error: any) {
        errors.push({
          provider: 'github',
          error: error.message
        });
      }
    }

    // Fetch GitLab groups if connected
    const gitlabAccount = accounts.find(acc => acc.provider === 'gitlab');
    if (gitlabAccount?.access_token) {
      try {
        // Fetch user's GitLab groups
        const groupsResponse = await fetch('https://gitlab.com/api/v4/groups?membership=true&per_page=50', {
          headers: {
            'Authorization': `Bearer ${gitlabAccount.access_token}`,
          },
        });
        
        if (groupsResponse.ok) {
          const groups = await groupsResponse.json();
          const gitlabOrgs = groups.map((group: any) => ({
            id: `gitlab-${group.id}`,
            name: group.name,
            provider: 'gitlab',
            avatar: group.avatar_url,
            isCurrent: false,
            type: 'organization',
            description: group.description,
            path: group.path
          }));
          
          organizations.push(...gitlabOrgs);
        } else {
          errors.push({
            provider: 'gitlab',
            error: `HTTP ${groupsResponse.status}: ${groupsResponse.statusText}`
          });
        }
      } catch (error: any) {
        errors.push({
          provider: 'gitlab',
          error: error.message
        });
      }
    }

    // Check what providers are missing
    const missingProviders = [];
    if (!gitlabAccount) missingProviders.push('gitlab');
    if (!githubAccount) missingProviders.push('github');

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
    return NextResponse.json({ 
      error: "Failed to fetch organizations",
      details: error.message 
    }, { status: 500 });
  }
}
