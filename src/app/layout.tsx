import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const DESCRIPTION =
  "Decipher OS turns a Google Sheet into a personalized email campaign sent from your own Gmail, with scheduling, follow-ups, and reply tracking built in.";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.decipheros.com"),
  title: {
    default: "Decipher OS",
    template: "%s | Decipher OS",
  },
  description: DESCRIPTION,
  applicationName: "Decipher OS",
  keywords: [
    "Decipher OS",
    "cold email",
    "email outreach",
    "Gmail outreach",
    "Google Sheets email",
    "drip campaigns",
    "follow-up sequences",
  ],
  authors: [{ name: "Cloudsheer Consulting" }],
  creator: "Cloudsheer Consulting",
  openGraph: {
    type: "website",
    url: "https://www.decipheros.com",
    siteName: "Decipher OS",
    title: "Decipher OS",
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "Decipher OS",
    description: DESCRIPTION,
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
