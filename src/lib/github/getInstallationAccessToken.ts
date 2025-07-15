// src/lib/github/getInstallationAccessToken.ts
import { createAppAuth } from "@octokit/auth-app"
import { Octokit } from "@octokit/rest"

const appId = process.env.GITHUB_APP_ID!
const privateKey = process.env.GITHUB_PRIVATE_KEY!.replace(/\\n/g, "\n")
const clientId = process.env.GITHUB_CLIENT_ID!
const clientSecret = process.env.GITHUB_CLIENT_SECRET!

export async function getInstallationOctokit(installationId: number) {
  const auth = createAppAuth({
    appId,
    privateKey,
    clientId,
    clientSecret,
  })

  const installationAuthentication = await auth({
    type: "installation",
    installationId,
  })

  const octokit = new Octokit({
    auth: installationAuthentication.token,
  })

  return octokit
}
