"use client";

import dynamic from "next/dynamic";

const Studio = dynamic(() => import("./Studio").then((m) => m.Studio), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, sans-serif",
        color: "#1e5fa8",
        backgroundColor: "#fafcff",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "8px" }}>
          Loading Sanity Studio...
        </h2>
        <p style={{ color: "#64748b", fontSize: "14px" }}>The Learnex Academy CMS</p>
      </div>
    </div>
  ),
});

export default function StudioPage() {
  return <Studio />;
}
