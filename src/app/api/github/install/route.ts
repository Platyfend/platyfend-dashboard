import { NextRequest } from 'next/server'
import { authOptions } from '@/src/features/auth/lib/auth-config'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import client from '@/src/lib/database/client'

export async function GET(request: NextRequest) {
    try {
        // Get authenticated session
        const session = await getServerSession(authOptions)

        // Check if user is authenticated
        if (!session || !session.user?.id) {
            return NextResponse.json({ 
                error: 'Unauthorized',
                message: 'User must be logged in to install GitHub app'
            }, { status: 401 })
        }

        // Connect to MongoDB
        await client.connect()
        const db = client.db('platyfend')
        const workspacesCollection = db.collection('workspaces')

        // Find user's workspace
        let userWorkspace = await workspacesCollection.findOne({
            'members.userId': session.user.id,
            'members.role': { $in: ['owner', 'admin', 'member'] }
        })

        if (!userWorkspace) {
            return NextResponse.json({
                error: 'No workspace found',
                message: 'Please create a workspace first'
            }, { status: 404 })
        }

        // Generate GitHub App installation URL
        // Note: Replace 'platyfend' with your actual GitHub App name
        const githubAppName = 'platyfend' // This should come from environment variables
        const installationUrl = `https://github.com/apps/${githubAppName}/installations/new?state=${userWorkspace._id.toString()}`

        return NextResponse.json({
            installUrl: installationUrl,
            workspaceId: userWorkspace._id.toString(),
            workspaceName: userWorkspace.name
        })

    } catch (error) {
        console.error('Error generating GitHub installation URL:', error)
        return NextResponse.json({ 
            error: 'Internal server error',
            message: 'An unexpected error occurred while generating installation URL'
        }, { status: 500 })
    } finally {
        // Close the connection (optional in serverless environments)
        // await client.close()
    }
}
