import { getServerSession } from "next-auth/next";
import { authOptions } from "@/src/features/auth/lib/auth-config";
import { NextResponse } from "next/server";
import { getDatabase } from "@/src/lib/database/client";
import { database } from "@/src/lib/config/environment";
import { ObjectId } from "mongodb";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { orgId } = await params;

    // Get database connection
    const db = await getDatabase(database.databaseName);

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
        let apiUrl: string;
        let orgName: string | null = null;

        // Determine API URL based on orgId
        if (orgId === 'personal' || orgId === githubAccount.githubOrgId) {
          // Fetch user's personal repositories (handle both 'personal' and actual GitHub user ID)
          apiUrl = 'https://api.github.com/user/repos?per_page=100&sort=updated&affiliation=owner';
        } else if (orgId.startsWith('github-')) {
          // Extract GitHub org ID and fetch org repositories
          const githubOrgId = orgId.replace('github-', '');

          // First, get the org name from the org ID
          const orgResponse = await fetch(`https://api.github.com/organizations/${githubOrgId}`, {
            headers: {
              'Authorization': `Bearer ${githubAccount.access_token}`,
              'Accept': 'application/vnd.github.v3+json',
              'User-Agent': 'Platyfend-Dashboard'
            },
          });

          if (orgResponse.ok) {
            const org = await orgResponse.json();
            orgName = org.login;
            apiUrl = `https://api.github.com/orgs/${orgName}/repos?per_page=100&sort=updated`;
          } else {
            throw new Error(`Failed to fetch organization details: ${orgResponse.status}`);
          }
        } else {
          // Invalid orgId for GitHub
          return NextResponse.json({ error: "Invalid organization ID for GitHub" }, { status: 400 });
        }

        const response = await fetch(apiUrl, {
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
            accountName: orgName || githubAccount.providerAccountId,
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
        let apiUrl: string;
        let groupName: string | null = null;

        // Determine API URL based on orgId
        if (orgId === 'personal') {
          // Fetch user's personal projects
          apiUrl = 'https://gitlab.com/api/v4/projects?owned=true&per_page=100&order_by=last_activity_at';
        } else if (orgId.startsWith('gitlab-')) {
          // Extract GitLab group ID and fetch group projects
          const gitlabGroupId = orgId.replace('gitlab-', '');

          // First, get the group name from the group ID
          const groupResponse = await fetch(`https://gitlab.com/api/v4/groups/${gitlabGroupId}`, {
            headers: {
              'Authorization': `Bearer ${gitlabAccount.access_token}`,
            },
          });

          if (groupResponse.ok) {
            const group = await groupResponse.json();
            groupName = group.name;
            apiUrl = `https://gitlab.com/api/v4/groups/${gitlabGroupId}/projects?per_page=100&order_by=last_activity_at`;
          } else {
            throw new Error(`Failed to fetch group details: ${groupResponse.status}`);
          }
        } else {
          // Skip GitLab if orgId is not personal or gitlab-*
          return NextResponse.json({ error: "Invalid organization ID for GitLab" }, { status: 400 });
        }

        const response = await fetch(apiUrl, {
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
            accountName: groupName || gitlabAccount.providerAccountId,
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
        organizationId: orgId,
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