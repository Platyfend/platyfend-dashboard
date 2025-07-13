import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/src/lib/auth"
import { prisma } from "@/src/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const workspaces = await prisma.workspace.findMany({
      where: {
        members: {
          some: {
            userId: session.user.id
          }
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            }
          }
        },
        installations: {
          include: {
            provider: true
          }
        }
      }
    })

    return NextResponse.json(workspaces)
  } catch (error) {
    console.error("Error fetching workspaces:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, description } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: "Workspace name is required" },
        { status: 400 }
      )
    }

    // Generate slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    const workspace = await prisma.workspace.create({
      data: {
        name,
        slug,
        description,
        members: {
          create: {
            userId: session.user.id,
            role: "owner"
          }
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(workspace, { status: 201 })
  } catch (error) {
    console.error("Error creating workspace:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
