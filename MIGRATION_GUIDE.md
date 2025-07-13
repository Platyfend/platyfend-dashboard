# Migration Guide: Project Structure Optimization

This guide explains the new project structure and how to migrate existing code.

## New Project Structure

```
src/
├── features/                 # Feature-based organization
│   ├── auth/                # Authentication feature
│   │   ├── components/      # Auth-specific components
│   │   ├── lib/            # Auth business logic
│   │   └── hooks/          # Auth-specific hooks
│   ├── dashboard/          # Dashboard feature
│   ├── vcs/               # Version control system feature
│   └── ...                # Other features
├── shared/                 # Shared components and utilities
│   ├── ui/                # UI components (shadcn/ui)
│   ├── components/        # Shared business components
│   └── hooks/             # Shared hooks
├── lib/                   # Core utilities and configurations
│   ├── utils/             # Utility functions
│   ├── database/          # Database configuration
│   ├── config/            # App configuration
│   ├── performance/       # Performance optimizations
│   └── fonts/             # Font configurations
├── types/                 # TypeScript type definitions
└── constants/             # Application constants
```

## Migration Steps

### 1. Update Import Paths

**Old:**
```typescript
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { authOptions } from "@/lib/auth"
```

**New:**
```typescript
import { Button } from "@/src/shared/ui/button"
import { cn } from "@/src/lib/utils"
import { authOptions } from "@/src/features/auth/lib/auth-config"
```

### 2. Component Organization

**Before:**
```
components/
├── ui/
├── dashboard/
├── auth-provider.tsx
└── providers.tsx
```

**After:**
```
src/
├── features/
│   ├── auth/components/auth-provider.tsx
│   └── dashboard/components/
├── shared/
│   ├── ui/
│   └── components/providers.tsx
```

### 3. Update File References

1. **Auth Components:**
   - `components/auth-provider.tsx` → `src/features/auth/components/auth-provider.tsx`
   - `lib/auth.ts` → `src/features/auth/lib/auth-config.ts`
   - `lib/auth/session.ts` → `src/features/auth/lib/session.ts`

2. **Dashboard Components:**
   - `components/dashboard/header.tsx` → `src/features/dashboard/components/dashboard-header.tsx`
   - `components/dashboard/sidebar.tsx` → `src/features/dashboard/components/dashboard-sidebar.tsx`

3. **Utilities:**
   - `lib/utils.ts` → `src/lib/utils/index.ts`
   - `lib/prisma.ts` → `src/lib/database/prisma.ts`

### 4. Performance Optimizations

#### Bundle Analysis
```bash
# Analyze bundle size
npm run build:analyze
```

#### Dynamic Imports
```typescript
// Old
import { HeavyComponent } from './heavy-component'

// New
import { DynamicChart } from '@/src/shared/components/dynamic-imports'
```

#### Optimized Links
```typescript
// Old
import Link from 'next/link'

// New
import { OptimizedLink } from '@/src/shared/components/optimized-link'
```

#### Image Optimization
```typescript
// Old
import Image from 'next/image'

// New
import { OptimizedImage } from '@/src/shared/ui/optimized-image'
```

### 5. Font Optimization

**Before:**
```typescript
import { Inter } from 'next/font/google'
const inter = Inter({ subsets: ['latin'] })
```

**After:**
```typescript
import { inter, fontVariables } from '@/src/lib/fonts'
// Use fontVariables in html className
```

### 6. Environment Configuration

**Before:**
```typescript
const dbUrl = process.env.DATABASE_URL
```

**After:**
```typescript
import { env } from '@/src/lib/config/environment'
const dbUrl = env.DATABASE_URL // Validated at startup
```

## New Features

### 1. Performance Monitoring
Automatically tracks Core Web Vitals and performance metrics in development.

### 2. Smart Prefetching
```typescript
import { OptimizedLink } from '@/src/shared/components/optimized-link'

// Prefetches on hover
<OptimizedLink href="/dashboard" prefetch="hover">
  Dashboard
</OptimizedLink>
```

### 3. Dynamic Imports
```typescript
import { DynamicChart } from '@/src/shared/components/dynamic-imports'

// Loads only when needed
<DynamicChart data={chartData} />
```

### 4. Type Safety
All environment variables are now validated with Zod schemas.

### 5. Bundle Analysis
Run `npm run build:analyze` to see bundle composition.

## Breaking Changes

1. **Import paths changed** - Update all imports to use new paths
2. **Component locations changed** - Update component imports
3. **Environment validation** - Invalid env vars will cause startup failure
4. **Font loading** - Fonts are now optimized and preloaded

## Benefits

1. **Better Organization:** Feature-based structure makes code easier to find and maintain
2. **Performance:** Optimized loading, prefetching, and code splitting
3. **Type Safety:** Environment variables are validated at startup
4. **Developer Experience:** Better tooling and monitoring
5. **Production Ready:** Optimized for production deployment

## Next Steps

1. Update all import statements
2. Move components to new locations
3. Test the application thoroughly
4. Run bundle analysis to identify optimization opportunities
5. Monitor performance metrics in development

## Troubleshooting

### Import Errors
If you see import errors, check:
1. The file exists in the new location
2. The import path is correct
3. TypeScript paths are configured in tsconfig.json

### Performance Issues
Use the built-in performance monitoring to identify bottlenecks:
1. Check browser console for performance logs
2. Run bundle analysis
3. Monitor Core Web Vitals

### Build Errors
Common issues:
1. Missing environment variables (check .env.example)
2. TypeScript errors (run `npm run type-check`)
3. ESLint errors (run `npm run lint:fix`)
