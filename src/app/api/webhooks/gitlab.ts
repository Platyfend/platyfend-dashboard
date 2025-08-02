import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-gitlab-token');
    
    // Verify webhook signature
    if (!verifyGitLabWebhook(body, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(body);
    
    // Handle merge request events
    if (payload.object_kind === 'merge_request') {
      await handleMergeRequestEvent(payload);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('GitLab webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function verifyGitLabWebhook(payload: string, signature: string | null): boolean {
  if (!signature || !process.env.GITLAB_WEBHOOK_SECRET) {
    return false;
  }
  
  const expectedSignature = crypto
    .createHmac('sha256', process.env.GITLAB_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
    
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

async function handleMergeRequestEvent(payload: any) {
  const {
    object_attributes: mr,
    project,
    user
  } = payload;
  
  console.log(`Merge Request ${mr.action}:`, {
    id: mr.id,
    title: mr.title,
    state: mr.state,
    action: mr.action,
    project: project.name,
    author: user.name
  });
  
  // Implement business logic here
}