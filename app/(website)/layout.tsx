import type { Metadata } from "next";
import "../globals.css";

// NOTE: next/font/google requires network access to fonts.googleapis.com at build time.
// If your environment can reach Google Fonts, swap this back to:
//   import { Poppins, Inter } from "next/font/google";
//   const poppins = Poppins({ variable: "--font-poppins", subsets: ["latin"], weight: ["500","600","700"] });
//   const inter = Inter({ variable: "--font-inter", subsets: ["latin"], weight: ["400","500","600"] });
// and add `${poppins.variable} ${inter.variable}` back to the body className below.

// TODO: replace with production domain
const siteUrl = "https://www.thelearnexacademy.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "The Learnex Academy — School, College, University & Professional Courses",
  description:
    "The Learnex Academy offers expert coaching from Class PG–Matric, O Level, Intermediate (FSc, ICom, ICS), Bachelor Degrees, CA (PRC), plus Canva and MS Office courses.",
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: "The Learnex Academy — School, College, University & Professional Courses",
    description:
      "Premier coaching for PG–Matric, O Level, Intermediate (FSc, ICom, ICS), Bachelors, CA (PRC), Canva Graphic Design & MS Office.",
    url: siteUrl,
    siteName: "The Learnex Academy",
    images: [{ url: "/logo.png", width: 1080, height: 1080 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Learnex Academy — School, College, University & Professional Courses",
    description:
      "Premier coaching for PG–Matric, O Level, Intermediate (FSc, ICom, ICS), Bachelors, CA (PRC), Canva & MS Office.",
    images: ["/logo.png"],
  },
};

export default function WebsiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="min-h-screen flex flex-col">{children}</div>;
}
