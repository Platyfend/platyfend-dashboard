import type { User, Account, Profile } from "next-auth";


/**
 * Saves GitHub OAuth information for workspace and repository integration
 * This function handles the OAuth data received during GitHub authentication
 */
export async function saveGitHubOAuthInfo(
  user: User,
  account: Account,
  profile?: Profile // Reserved for future use (GitHub profile data)
): Promise<void> {
  try {
    // Validate required OAuth data
    if (!account.access_token) {
      throw new Error("GitHub access token is required");
    }

    if (!user.email) {
      throw new Error("User email is required for GitHub integration");
    }

    // Log successful OAuth data capture (without sensitive tokens)
    console.log("GitHub OAuth info captured for user:", {
      userId: user.id,
      email: user.email,
      provider: account.provider,
      scope: account.scope,
      hasAccessToken: !!account.access_token
    });

    // TODO: Implement workspace creation and GitHub integration
    // This would typically involve:
    // 1. Creating a default workspace for the user
    // 2. Storing encrypted GitHub tokens for repository access
    // 3. Setting up webhook configurations
    // 4. Syncing user's GitHub organizations and repositories

  } catch (error) {
    console.error("Error in saveGitHubOAuthInfo:", error);
    throw error;
  }
}