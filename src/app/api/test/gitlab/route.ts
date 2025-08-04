import { getServerSession } from "next-auth/next";
import { authOptions } from "@/src/features/auth/lib/auth-config";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // For now, this is a placeholder to test the concept
    const accessToken = "e1453200106efacf49b660176471473a2a4b7f96244445346dda7f62d7e86ec4";
    
    // Test fetching GitLab user info
    const userResponse = await fetch('https://gitlab.com/api/v4/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    // Test fetching projects
    const projectsResponse = await fetch('https://gitlab.com/api/v4/projects?membership=true&per_page=5', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    const userData = await userResponse.json();
    const projectsData = await projectsResponse.json();
    
    return NextResponse.json({
      user: userData,
      projects: projectsData,
      message: "GitLab API access successful"
    });
    
  } catch (error) {
    console.error("GitLab test error:", error);
    return NextResponse.json({ error: "GitLab API test failed" }, { status: 500 });
  }
}