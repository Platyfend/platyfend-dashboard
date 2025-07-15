import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/database/prisma';
import { createHmac, timingSafeEqual } from 'crypto';

// Verify GitHub webhook signature
function verifySignature(payload: string, signature: string): boolean {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  console.log('Loaded secret:', !!secret); // Debug: Check if secret is loaded
  if (!secret) return false;

  const hmac = createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  console.log('Calculated digest:', digest); // Debug: Log calculated digest
  console.log('Received signature:', signature); // Debug: Log received signature

  try {
    return timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  } catch (e) {
    console.error('Error during timingSafeEqual comparison:', e);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get('x-hub-signature-256') || '';

    // // Verify webhook signature
    // if (!verifySignature(payload, signature)) {
    //   console.warn('Invalid webhook signature');
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    // }

    const event = request.headers.get('x-github-event');
    const data = JSON.parse(payload);

    // Handle different GitHub events
    switch (event) {
      case 'pull_request':
        if (
          data.action === 'opened' ||
          data.action === 'synchronize' ||
          data.action === 'reopened'
        ) {
          const { installation, repository, pull_request } = data;

          // Store PR data in database
          const repo = await prisma.repository.findFirst({
            where: {
              vcsInstallation: {
                installationId: installation.id.toString(),
                provider: {
                  type: 'github',
                },
              },
              externalId: repository.id.toString(),
            },
          });

          if (!repo) {
            // Create repository record if it doesn't exist
            const app = await prisma.vCSInstallation.findFirst({
              where: {
                installationId: installation.id.toString(),
                provider: {
                  type: 'github',
                },
              },
              include: {
                provider: true,
              },
            });

            if (!app) {
              return NextResponse.json({ error: 'App installation not found' }, { status: 404 });
            }

            const newRepo = await prisma.repository.create({
              data: {
                vcsInstallationId: app.id,
                externalId: repository.id.toString(),
                name: repository.name,
                fullName: repository.full_name,
                private: repository.private,
                defaultBranch: repository.default_branch || 'main',
              },
            });

            // Create PR record
            await prisma.pullRequest.create({
              data: {
                repositoryId: newRepo.id,
                number: pull_request.number,
                title: pull_request.title,
                description: pull_request.body,
                status: pull_request.state,
                externalId: pull_request.id.toString(),
                sourceBranch: pull_request.head.ref,
                targetBranch: pull_request.base.ref,
                author: pull_request.user.login,
                authorId: pull_request.user.id.toString(),
                url: pull_request.html_url,
              },
            });
          } else {
            // Find or create PR record
            await prisma.pullRequest.upsert({
              where: {
                repositoryId_number: {
                  repositoryId: repo.id,
                  number: pull_request.number,
                },
              },
              update: {
                title: pull_request.title,
                description: pull_request.body,
                status: pull_request.state,
                externalId: pull_request.id.toString(),
                sourceBranch: pull_request.head.ref,
                targetBranch: pull_request.base.ref,
                author: pull_request.user.login,
                authorId: pull_request.user.id.toString(),
                url: pull_request.html_url,
                updatedAt: new Date(),
              },
              create: {
                repositoryId: repo.id,
                number: pull_request.number,
                title: pull_request.title,
                description: pull_request.body,
                status: pull_request.state,
                externalId: pull_request.id.toString(),
                sourceBranch: pull_request.head.ref,
                targetBranch: pull_request.base.ref,
                author: pull_request.user.login,
                authorId: pull_request.user.id.toString(),
                url: pull_request.html_url,
              },
            });
          }
        }
        break;

      case 'installation':
        // Handle installation events here if needed
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
