import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';

// Post review comments to GitHub
async function postReviewToGitHub(
  installationId: string,
  repoFullName: string,
  prNumber: number,
  reviewContent: string
) {
  const [owner, repo] = repoFullName.split('/');
  
  const octokit = new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: process.env.GITHUB_APP_ID!,
      privateKey: process.env.GITHUB_PRIVATE_KEY!,
      installationId
    }
  });
  
  // Post review as a PR comment
  await octokit.issues.createComment({
    owner,
    repo,
    issue_number: prNumber,
    body: reviewContent
  });
}

export async function POST(request: NextRequest) {
  try {
    const { installationId, repoFullName, prNumber, reviewContent, status } = await request.json();
    
    // Validate request
    if (!installationId || !repoFullName || !prNumber || !reviewContent) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Find repository and PR
    const repository = await prisma.repository.findFirst({
      where: {
        vcsInstallation: {
          installationId: installationId,
          provider: {
            type: "github"
          }
        },
        fullName: repoFullName,
      }
    });
    
    if (!repository) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 });
    }
    
    const pullRequest = await prisma.pullRequest.findUnique({
      where: {
        repositoryId_number: {
          repositoryId: repository.id,
          number: prNumber
        }
      }
    });
    
    if (!pullRequest) {
      return NextResponse.json({ error: 'Pull request not found' }, { status: 404 });
    }
    
    // Store review in database
    const review = await prisma.review.create({
      data: {
        pullRequestId: pullRequest.id,
        status: status || 'completed'
      }
    });
    
    // Post review to GitHub
    await postReviewToGitHub(installationId, repoFullName, prNumber, reviewContent);
    
    return NextResponse.json({ success: true, reviewId: review.id });
  } catch (error) {
    console.error('Review callback error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}