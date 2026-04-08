import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import LiveChatWidget from "@/components/LiveChatWidget";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Site configuration
const siteName = process.env.NEXT_PUBLIC_APP_NAME || process.env.SITE_NAME || "Oakwell Trust";
const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://oakweltrust.com";
const siteDescription = `${siteName} provides secure online banking services with competitive interest rates, easy fund transfers, and 24/7 account access. Open a savings or checking account today and experience modern banking designed for your financial success.`;

export const metadata: Metadata = {
  // Basic Meta Tags
  title: {
    default: `${siteName} - Secure Online Banking & Financial Services`,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  keywords: [
    "online banking",
    "secure banking",
    "savings account",
    "checking account",
    "money transfer",
    "international transfer",
    "wire transfer",
    "mobile banking",
    "digital banking",
    "financial services",
    "bank account",
    "interest rates",
    "FDIC insured",
    siteName,
  ],
  authors: [{ name: siteName }],
  creator: siteName,
  publisher: siteName,

  // Favicon & Icons
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { rel: "mask-icon", url: "/og-image.png", color: "#0369a1" },
    ],
  },
  manifest: "/site.webmanifest",

  // Open Graph (Facebook, LinkedIn, etc.)
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: siteName,
    title: `${siteName} - Secure Online Banking & Financial Services`,
    description: siteDescription,
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 800,
        height: 800,
        alt: `${siteName} Logo`,
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: `${siteName} - Secure Online Banking`,
    description: siteDescription,
    images: [`${siteUrl}/og-image.png`],
    creator: `@${siteName.replace(/\s+/g, '')}`,
  },

  // Robots & Indexing
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

  // Verification (add your verification codes)
  // verification: {
  //   google: "your-google-verification-code",
  //   yandex: "your-yandex-verification-code",
  // },

  // App Links
  alternates: {
    canonical: siteUrl,
  },

  // Additional Meta
  category: "finance",
  classification: "Banking & Financial Services",

  // App-specific
  applicationName: siteName,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: siteName,
  },
  formatDetection: {
    telephone: true,
    email: true,
    address: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0369a1" },
    { media: "(prefers-color-scheme: dark)", color: "#0c4a6e" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Structured Data for Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FinancialService",
              name: siteName,
              description: siteDescription,
              url: siteUrl,
              logo: `${siteUrl}/og-image.png`,
              image: `${siteUrl}/og-image.png`,
              priceRange: "$$",
              address: {
                "@type": "PostalAddress",
                addressCountry: "US",
              },
              sameAs: [],
              openingHoursSpecification: {
                "@type": "OpeningHoursSpecification",
                dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                opens: "00:00",
                closes: "23:59",
              },
              areaServed: {
                "@type": "Country",
                name: "Worldwide",
              },
              serviceType: [
                "Online Banking",
                "Savings Accounts",
                "Checking Accounts",
                "Wire Transfers",
                "International Transfers",
                "Mobile Banking",
              ],
            }),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>

        {/* JivoChat Live Chat Widget */}
        <LiveChatWidget />
      </body>
    </html>
  );
}
