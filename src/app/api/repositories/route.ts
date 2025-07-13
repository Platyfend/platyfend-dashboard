import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/database/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Find user's VCS installations
    const installations = await prisma.vCSInstallation.findMany({
      where: {
        userId: session.user.id
      },
      select: {
        id: true
      }
    });

    const installationIds = installations.map(inst => inst.id);

    // Get repositories with pagination and search
    const repositories = await prisma.repository.findMany({
      where: {
        vcsInstallationId: {
          in: installationIds
        },
        name: {
          contains: search,
          mode: 'insensitive'
        }
      },
      skip,
      take: limit,
      orderBy: {
        name: 'asc'
      }
    });

    // Get total count for pagination
    const totalCount = await prisma.repository.count({
      where: {
        vcsInstallationId: {
          in: installationIds
        },
        name: {
          contains: search,
          mode: 'insensitive'
        }
      }
    });

    return NextResponse.json({
      repositories,
      pagination: {
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
        page,
        limit
      }
    });
  } catch (error) {
    console.error("Error fetching repositories:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}