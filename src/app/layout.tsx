import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Ember & Oak | Wood-fired Flavors, Crafted with Passion",
    template: "%s | Ember & Oak",
  },
  description:
    "Experience wood-fired flavors and modern American cuisine at Ember & Oak in Austin, TX. Order online for pickup or delivery.",
  keywords: [
    "restaurant",
    "wood-fired",
    "Austin",
    "pizza",
    "burgers",
    "online ordering",
    "Ember Oak",
  ],
  authors: [{ name: "Ember & Oak" }],
  creator: "Ember & Oak",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: "Ember & Oak",
    title: "Ember & Oak | Wood-fired Flavors",
    description: "Modern American cuisine, wood-fired with passion.",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ember & Oak",
    description: "Modern American cuisine, wood-fired with passion.",
    images: ["/og-image.jpg"],
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fff7ed" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0a09" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable} font-sans`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster
            position="top-center"
            gutter={8}
            toastOptions={{
              duration: 4000,
              style: {
                background: "#1c1917",
                color: "#fafaf9",
                borderRadius: "0.875rem",
                fontSize: "1rem",
                fontWeight: "600",
                fontFamily: "var(--font-inter)",
                padding: "1rem 1.5rem",
                boxShadow: "0 8px 32px rgba(0,0,0,0.28), 0 2px 8px rgba(0,0,0,0.16)",
                minWidth: "300px",
                maxWidth: "480px",
                gap: "0.75rem",
              },
              success: {
                iconTheme: { primary: "#f97316", secondary: "#1c1917" },
              },
              error: {
                iconTheme: { primary: "#ef4444", secondary: "#1c1917" },
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
