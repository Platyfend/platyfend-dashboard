import { Toaster } from "@/src/components/ui/toaster";
import { Toaster as Sonner } from "@/src/components/ui/sonner";
import { TooltipProvider } from "@/src/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { Providers } from "@/src/components/providers";
import { AuthProvider } from "@/src/features/auth/components/auth-provider";
import { inter, fontVariables } from "@/src/lib/fonts";
import StyledComponentsRegistry from '@/src/lib/registry';
import './globals.css';

export const metadata = {
  title: 'Platyfend - AI-Powered Code Review Platform',
  description: 'Intelligent code review and analysis platform powered by AI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={inter.className}>
        <StyledComponentsRegistry>
          <ThemeProvider
            attribute="class"
            disableTransitionOnChange
          >
            <AuthProvider>
              <Providers>
                  <TooltipProvider>
                    <Toaster />
                    <Sonner />
                    {children}
                  </TooltipProvider>
              </Providers>
            </AuthProvider>
          </ThemeProvider>
        </StyledComponentsRegistry>
      </body>
    </html>
  )
}