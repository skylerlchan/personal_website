import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import ClientShell from "@/components/layout/ClientShell";
import { SITE_CONFIG } from "@/lib/constants";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_CONFIG.url),
  title: `${SITE_CONFIG.name} | ${SITE_CONFIG.title}`,
  description: SITE_CONFIG.description,
  icons: {
    icon: { url: "/favicon.svg", type: "image/svg+xml" },
  },
  openGraph: {
    title: `${SITE_CONFIG.name} | ${SITE_CONFIG.title}`,
    description: SITE_CONFIG.description,
    url: SITE_CONFIG.url,
    siteName: SITE_CONFIG.name,
    images: [{ url: "/images/og-image.jpg", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_CONFIG.name} | ${SITE_CONFIG.title}`,
    description: SITE_CONFIG.description,
    images: ["/images/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('theme');var d=t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches);document.documentElement.classList.toggle('dark',d)})()`,
          }}
        />
      </head>
      <body className="bg-background text-foreground font-sans antialiased cursor-custom">
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  );
}
