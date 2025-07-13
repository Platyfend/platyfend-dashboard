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
    
    // Get user's VCS installations
    const installations = await prisma.vCSInstallation.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        provider: true,
        repositories: {
          select: {
            id: true,
            name: true,
            fullName: true,
            private: true
          }
        }
      }
    });
    
    return NextResponse.json({
      userId: session.user.id,
      installations: installations.map(installation => ({
        id: installation.id,
        provider: installation.provider.name,
        accountLogin: installation.accountLogin,
        repositoryCount: installation.repositories.length,
        repositories: installation.repositories
      }))
    });
  } catch (error) {
    console.error("Error fetching VCS installations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
