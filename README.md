# Platyfend - AI-Powered Code Review Platform

A modern Next.js application for intelligent code review and analysis powered by AI.

## Overview

Platyfend is a comprehensive code review platform that leverages AI to provide intelligent insights and analysis for your codebase. It supports multiple authentication methods and can be deployed as a cloud SaaS solution or self-hosted within your organization's infrastructure.

## Key Features

- 🧠 **AI-Powered Analysis**: Intelligent code review with contextual suggestions
- 🔐 **Flexible Authentication**: Support for GitHub, GitLab, Azure DevOps, and Bitbucket
- 🏢 **Workspaces**: Multi-tenant workspace management for teams and organizations
- 🎨 **Modern UI**: Built with shadcn/ui components and Tailwind CSS
- 🗄️ **Robust Database**: PostgreSQL with Prisma ORM for type-safe queries
- 🔒 **Enterprise Security**: Role-based access control and data encryption
- 📱 **Responsive Design**: Optimized for desktop, tablet, and mobile devices

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **State Management**: TanStack Query (React Query)
- **Deployment**: Vercel-ready

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- GitHub OAuth App (for authentication)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/platyfend.git
cd platyfend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```
Edit `.env` with your actual values (see Environment Variables section below).

4. Set up the database:
```bash
npx prisma migrate dev
npx prisma generate
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3001](http://localhost:3001) in your browser.

## Environment Variables

Key variables that need to be configured in your `.env` file:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Random secret for NextAuth.js |
| `NEXTAUTH_URL` | Base URL of your application |
| `GITHUB_CLIENT_ID` | GitHub OAuth App client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App client secret |

For a complete list of environment variables, see `.env.example`.

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository in Vercel
3. Configure environment variables
4. Deploy

### Docker

```bash
# Build the Docker image
docker build -t platyfend .

# Run the container
docker run -p 3001:3001 --env-file .env platyfend
```

## Development

### Project Structure

```
├── app/                 # Next.js App Router pages and layouts
├── components/          # React components
│   ├── ui/              # UI components from shadcn/ui
│   └── ...              # Feature-specific components
├── lib/                 # Utilities and configurations
├── prisma/              # Database schema and migrations
├── public/              # Static assets
└── hooks/               # Custom React hooks
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run prisma:studio` | Open Prisma Studio to manage database |
| `npm run seed` | Seed the database with initial data |

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue in the GitHub repository or contact the maintainers.
