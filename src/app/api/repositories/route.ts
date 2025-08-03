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

    const allRepositories = [];
    const connectedProviders = [];
    const errors = [];

    // Fetch from GitHub if connected
    const githubAccount = accounts.find(acc => acc.provider === 'github');
    if (githubAccount?.access_token) {
      try {
        const response = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
          headers: {
            'Authorization': `Bearer ${githubAccount.access_token}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Platyfend-Dashboard'
          },
        });
        
        if (response.ok) {
          const repos = await response.json();
          const githubRepos = repos.map((repo: any) => ({
            id: `github-${repo.id}`,
            externalId: repo.id.toString(),
            name: repo.name,
            fullName: repo.full_name,
            provider: 'github',
            isPrivate: repo.private,
            language: repo.language,
            stars: repo.stargazers_count || 0,
            forks: repo.forks_count || 0,
          }));
          
          allRepositories.push(...githubRepos);
          connectedProviders.push({
            provider: 'github',
            accountName: githubAccount.providerAccountId,
            repositoryCount: githubRepos.length
          });
        } else {
          errors.push({
            provider: 'github',
            error: `HTTP ${response.status}: ${response.statusText}`
          });
        }
      } catch (error: any) {
        errors.push({
          provider: 'github',
          error: error.message
        });
      }
    }

    // Fetch from GitLab if connected
    const gitlabAccount = accounts.find(acc => acc.provider === 'gitlab');
    if (gitlabAccount?.access_token) {
      try {
        const response = await fetch('https://gitlab.com/api/v4/projects?membership=true&per_page=100&order_by=last_activity_at', {
          headers: {
            'Authorization': `Bearer ${gitlabAccount.access_token}`,
          },
        });
            console.log("GitLab API response:", response.status, response.statusText);
        
        if (response.ok) {
          const projects = await response.json();
          const gitlabRepos = projects.map((project: any) => ({
            id: `gitlab-${project.id}`,
            externalId: project.id.toString(),
            name: project.name,
            fullName: project.path_with_namespace,
            provider: 'gitlab',
            isPrivate: project.visibility === 'private',
            language: project.default_branch || 'main',
            stars: project.star_count || 0,
            forks: project.forks_count || 0,
          }));
          
          allRepositories.push(...gitlabRepos);
          connectedProviders.push({
            provider: 'gitlab',
            accountName: gitlabAccount.providerAccountId,
            repositoryCount: gitlabRepos.length
          });
        } else {
          errors.push({
            provider: 'gitlab',
            error: `HTTP ${response.status}: ${response.statusText}`
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

    // Sort repositories by last activity
    allRepositories.sort((a, b) => 
      new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
    );

    return NextResponse.json({
      repositories: allRepositories,
      totalCount: allRepositories.length,
      connectedProviders,
      missingProviders,
      errors: errors.length > 0 ? errors : undefined,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name
      }
    });

  } catch (error: any) {
    console.error("Available repositories API error:", error);
    return NextResponse.json({ 
      error: "Failed to fetch available repositories",
      details: error.message 
    }, { status: 500 });
  }
}