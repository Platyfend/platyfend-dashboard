import { MongoClient } from 'mongodb';

export interface GitHubAccountInfo {
  userId: string;
  provider: string;
  providerAccountId: string;
  githubOrgId?: string;
  githubUsername?: string;
  hasAccessToken: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Get GitHub account information for a user
 */
export async function getGitHubAccountInfo(
  client: MongoClient, 
  userId: string
): Promise<GitHubAccountInfo | null> {
  try {
    const db = client.db('test');
    const accountsCollection = db.collection('accounts');
    
    const account = await accountsCollection.findOne({
      userId: userId,
      provider: 'github'
    });
    
    if (!account) {
      return null;
    }
    
    return {
      userId: account.userId,
      provider: account.provider,
      providerAccountId: account.providerAccountId,
      githubOrgId: account.githubOrgId,
      githubUsername: account.githubUsername,
      hasAccessToken: !!account.access_token,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt
    };
  } catch (error) {
    console.error('Error fetching GitHub account info:', error);
    return null;
  }
}
