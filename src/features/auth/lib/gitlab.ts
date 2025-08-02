import type { User, Account, Profile } from "next-auth";


export async function saveGitLabOAuthInfo(
  user: User,
  account: Account,
  profile?: Profile
): Promise<void> {
  try {
    // Validate required OAuth data
    if (!account.access_token) {
      throw new Error("GitLab access token is required");
    }
    if (!user.email) {
      throw new Error("User email is required for GitLab integration");
    }

    // Log successful OAuth data capture (without sensitive tokens)
    console.log("GitLab OAuth info captured for user:", {
      userId: user.id,
      email: user.email,
      provider: account.provider,
      scope: account.scope,
      hasAccessToken: !!account.access_token
    });

    // Skip webhook setup for localhost
    const baseUrl = process.env.NEXTAUTH_URL;
    if (baseUrl?.includes('localhost') || baseUrl?.includes('127.0.0.1')) {
      console.log("Skipping webhook setup in local development");
      return;
    }
  } catch (error) {
    console.error("Error in saveGitLabOAuthInfo:", error);
    throw error;
  }
}

async function setupGitLabWebhookByProjectName(accessToken: string, userId: string, projectName: string) {
  try {
    // Get user's GitLab projects
    const projects = await fetchUserGitLabProjects(accessToken);
    
    // Register webhooks for each project
    for (const project of projects) {
        if (!project.id || !project.name) {
          console.warn(`Skipping project without ID or name:`, project);
          continue;
        }

        if (project.name === projectName)
        {
            await registerWebhookForProject(accessToken, project.id, userId);
            break;
        }
    }
  } catch (error) {
    console.error("Error setting up GitLab webhooks:", error);
  }
}

async function fetchUserGitLabProjects(accessToken: string) {
  const response = await fetch('https://gitlab.com/api/v4/projects?membership=true', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch GitLab projects');
  } 

  return response.json();
}

async function registerWebhookForProject(accessToken: string, projectId: number, userId: string) {
  const webhookUrl = `${process.env.NEXTAUTH_URL}/api/webhooks/gitlab`;
  
  const webhookConfig = {
    url: webhookUrl,
    merge_requests_events: true,
    push_events: false, // Disable if you only want MR events
    issues_events: false,
    wiki_page_events: false,
    deployment_events: false,
    job_events: false,
    pipeline_events: false,
    release_events: false,
    token: process.env.GITLAB_WEBHOOK_SECRET,
  };
  
  const response = await fetch(`https://gitlab.com/api/v4/projects/${projectId}/hooks`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(webhookConfig),
  });
  
  if (!response.ok) {
    console.error(`Failed to register webhook for project ${projectId}:`, await response.text());
  } else {
    console.log(`Webhook registered for project ${projectId}`);
  }
}
