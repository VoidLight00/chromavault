import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/layout/navigation";
import { ToastProvider } from "@/components/ui/toast";
import { InstallBanner } from "@/components/pwa/install-banner";
import { OfflineIndicator } from "@/components/pwa/offline-indicator";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ChromaVault - 완벽한 색상 팔레트 플랫폼",
  description: "크리에이티브를 위한 색상 조합 도구. 팔레트를 만들고, 저장하고, 공유하세요.",
  keywords: ["color palette", "design tool", "color scheme", "색상 팔레트", "디자인 도구"],
  authors: [{ name: "ChromaVault Team" }],
  manifest: "/manifest.json",
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
  openGraph: {
    title: "ChromaVault",
    description: "완벽한 색상 조합을 찾고, 저장하고, 공유하는 크리에이티브를 위한 컬러 팔레트 플랫폼",
    type: "website",
    images: ["/og-image.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ChromaVault",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#3B82F6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning className="dark" style={{ backgroundColor: '#0a0a0a' }}>
      <body 
        className={cn(
          inter.className,
          "min-h-screen font-sans antialiased dark"
        )}
        style={{ 
          backgroundColor: '#0a0a0a', 
          color: '#ffffff',
          minHeight: '100vh' 
        }}
      >
        <ToastProvider>
          <Navigation />
          <main className="pt-16 md:pt-16" style={{ backgroundColor: '#0a0a0a' }}>
            {children}
          </main>
          <InstallBanner />
          <OfflineIndicator />
        </ToastProvider>
      </body>
    </html>
  );
}
