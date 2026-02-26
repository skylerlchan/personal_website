import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
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
  keywords: [
    "Skyler Chan",
    "AI Engineer",
    "Machine Learning",
    "Large Language Models",
    "LLMs",
    "Robotics",
    "Computer Vision",
    "Climate Science",
    "Quantitative Finance",
    "WithAI Research",
    "Y Combinator",
    "Princeton",
    "Software Engineer",
    "Full Stack Developer",
    "Next.js",
    "React",
    "TypeScript",
    "Python",
    "Edge AI",
    "Autonomous Systems"
  ],
  authors: [{ name: SITE_CONFIG.name }],
  creator: SITE_CONFIG.name,
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
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_CONFIG.name} | ${SITE_CONFIG.title}`,
    description: SITE_CONFIG.description,
    images: ["/images/og-image.jpg"],
    creator: "@SkylerChan17",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${SITE_CONFIG.url}/#person`,
    "name": SITE_CONFIG.name,
    "url": SITE_CONFIG.url,
    "email": "skylerlchan@gmail.com",
    "jobTitle": "Founding Engineer",
    "description": "Founding engineer at WithAI Research building LLMs for AI-native hedge funds. Princeton researcher in climate science. Roboticist, AI/ML engineer, and quantitative finance practitioner.",
    "alumniOf": {
      "@type": "EducationalOrganization",
      "name": "Princeton University"
    },
    "worksFor": {
      "@type": "Organization",
      "name": "WithAI Research",
      "description": "YC W26 startup building LLMs for AI-native hedge funds"
    },
    "knowsAbout": [
      "Artificial Intelligence",
      "Machine Learning",
      "Large Language Models",
      "Computer Vision",
      "Robotics",
      "Climate Science",
      "Quantitative Finance",
      "Software Engineering"
    ],
    "sameAs": [
      "https://github.com/skylerlchan",
      "https://www.linkedin.com/in/skylerchan",
      "https://x.com/SkylerChan17",
      "https://www.instagram.com/_.skyler.chan._/"
    ]
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "name": `${SITE_CONFIG.name}'s Portfolio`,
    "url": SITE_CONFIG.url,
    "description": SITE_CONFIG.description,
    "mainEntity": {
      "@id": `${SITE_CONFIG.url}/#person`
    }
  };

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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(personSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteSchema),
          }}
        />
      </head>
      <body className="bg-background text-foreground font-sans antialiased cursor-custom">
        <ClientShell>{children}</ClientShell>
        <Analytics />
      </body>
    </html>
  );
}
