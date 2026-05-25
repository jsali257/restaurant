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
            position="bottom-right"
            toastOptions={{
              duration: 3500,
              style: {
                background: "rgb(28 25 23)",
                color: "rgb(250 250 249)",
                border: "1px solid rgb(41 37 36)",
                borderRadius: "0.75rem",
                fontSize: "0.875rem",
                fontFamily: "var(--font-inter)",
              },
              success: {
                iconTheme: { primary: "#f97316", secondary: "#fff" },
              },
              error: {
                iconTheme: { primary: "#ef4444", secondary: "#fff" },
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
