import type { Metadata } from "next";
import "../globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.thelearnexacademy.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "The Learnex Academy Multan — Learn, Evolve, Excel",
    template: "%s | The Learnex Academy Multan",
  },
  description:
    "The Learnex Academy Multan offers Morning Early Foundation Classes (PG to Intermediate), O Level, FSc, ICS, I.Com, CA Subjects, Canva Designing, MS Office, AI Presentation & English Classes. Call/WhatsApp 0316-6581934.",
  keywords: [
    "The Learnex Academy",
    "Learnex Academy Multan",
    "best academy in Multan",
    "coaching academy Model Town Multan",
    "Morning Early Foundation Classes Multan",
    "O Level academy Multan",
    "FSc coaching Multan",
    "ICS institute Multan",
    "ICom classes Multan",
    "CA PRC coaching Multan",
    "Canva designing course Multan",
    "MS Office course Multan",
    "AI Presentation course",
    "Spoken English classes Multan",
    "daily weekly monthly tests academy",
    "Bloomfield Hall Model Town Multan academy",
  ],
  authors: [{ name: "The Learnex Academy Multan", url: siteUrl }],
  creator: "The Learnex Academy",
  publisher: "The Learnex Academy",
  formatDetection: {
    email: true,
    address: true,
    telephone: true,
  },
  alternates: {
    canonical: siteUrl,
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
  openGraph: {
    title: "The Learnex Academy Multan — Learn, Evolve, Excel",
    description:
      "Admission Open in Multan: Morning Early Foundation (PG–10th), O Level, FSc, ICS, I.Com, CA Subjects, Canva, MS Office, AI Presentation & English. Call 0316-6581934.",
    url: siteUrl,
    siteName: "The Learnex Academy",
    locale: "en_PK",
    type: "website",
    images: [
      {
        url: "https://res.cloudinary.com/dggey8rb6/image/upload/v1787375492/logo.png",
        width: 800,
        height: 800,
        alt: "The Learnex Academy Multan Logo - Learn Evolve Excel",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Learnex Academy Multan — Learn, Evolve, Excel",
    description:
      "Admission Open in Multan: PG to Intermediate, O Level, FSc, CA Subjects, Canva, MS Office, AI Presentation & English Classes.",
    images: ["https://res.cloudinary.com/dggey8rb6/image/upload/v1787375492/logo.png"],
  },
  category: "Education",
};

export default function WebsiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="min-h-screen flex flex-col">{children}</div>;
}
