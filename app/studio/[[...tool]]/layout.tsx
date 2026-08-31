import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Sanity Studio | The Learnex Academy",
  description: "Content Management Studio for The Learnex Academy",
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ height: "100vh", width: "100vw", overflow: "hidden", margin: 0, padding: 0 }}>
      {children}
    </div>
  );
}
