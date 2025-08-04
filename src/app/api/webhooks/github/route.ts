import { NextRequest, NextResponse } from 'next/server'
import { verifyGitHubWebhook } from '@/src/lib/github/app-auth'
import { Organization, InstallationStatus } from '@/src/lib/database/models'
import {
  handleInstallationWebhook,
  handleInstallationRepositoriesWebhook,
  handleRepositoryWebhook
} from '@/src/lib/services/webhook-sync'

export async function POST(request: NextRequest) {
    try {
        // Get webhook payload and signature
        const body = await request.text()
        const signature = request.headers.get('x-hub-signature-256') || ''
        const event = request.headers.get('x-github-event') || ''

        // Verify webhook signature
        if (!verifyGitHubWebhook(body, signature)) {
            console.error('Invalid webhook signature')
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
        }

        const payload = JSON.parse(body)
        console.log(`GitHub webhook received: ${event}`, {
            action: payload.action,
            installationId: payload.installation?.id,
            senderId: payload.sender?.id
        })

        // Handle different webhook events using sync services
        let syncResult;
        switch (event) {
            case 'installation':
                syncResult = await handleInstallationWebhook(payload)
                break
            case 'installation_repositories':
                syncResult = await handleInstallationRepositoriesWebhook(payload)
                break
            case 'repository':
                syncResult = await handleRepositoryWebhook(payload)
                break
            default:
                console.log(`Unhandled webhook event: ${event}`)
                syncResult = { success: true, action: `unhandled_${event}`, repositoriesAffected: 0, errors: [] }
        }

        // Log sync result
        if (syncResult && !syncResult.success) {
            console.error(`Webhook sync failed for ${event}:`, syncResult.errors)
        } else if (syncResult) {
            console.log(`Webhook sync completed for ${event}:`, {
                action: syncResult.action,
                repositoriesAffected: syncResult.repositoriesAffected,
                organizationId: syncResult.organizationId
            })
        }

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('GitHub webhook error:', error)
        return NextResponse.json({ 
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}






