import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import { SessionProvider } from "@/src/components/providers/session-provider";
import { WorkspaceProvider } from "@/src/contexts/workspace-context";
import { GoogleAnalytics } from "@next/third-parties/google";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Platyfend - AI-Powered Code Review Platform",
  description: "Intelligent code review and analysis platform powered by AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const floatingChatbotUrl = process.env.NEXT_PUBLIC_FLOATING_CHATBOT_URL;
  const chatbotID = floatingChatbotUrl ? floatingChatbotUrl.split("/")[4] : null;

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider>
          <WorkspaceProvider>{children}</WorkspaceProvider>
        </SessionProvider>

        <Script id="clarity-script" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "s2ioes1uu7");
          `}
        </Script>

        {floatingChatbotUrl && (
                  <Script id="floating-chatbot-widget" strategy="afterInteractive">
                    {`
                 (function(){
          if(!window.agerra || window.agerra("getState") !== "initialized") {
            window.agerra = (...arguments) => {
              if(!window.agerra.q) {
                window.agerra.q = [];
              }
              window.agerra.q.push(arguments);
            };
        
            window.agerra = new Proxy(window.agerra, {
              get(target, prop) {
                if(prop === "q") {
                  return target.q;
                }
                return (...args) => target(prop, ...args);
              }
            });
          }
        
          const onLoad = function() {
            const script = document.createElement("script");
            script.src = "/embed_script.min.js";
            script.id = "${chatbotID}";
            script.domain = "localhost";
            document.body.appendChild(script);
          };
        
          if(document.readyState === "complete") {
            onLoad();
          } else {
            window.addEventListener("load", onLoad);
          }
        })();
        
        // Initialize chatbot
        agerra("init", {
          chatbotId: "${chatbotID}",
          primaryColor: "#669c35",
          foregroundColor: "#FFFFFF",
          displayName: "Platyfend"
        });
                  `}
                  </Script>
        )}
      </body>
      <GoogleAnalytics gaId="G-BSQPYPE5S1" /> 
    </html>
  );
}
